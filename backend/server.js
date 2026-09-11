/**
 * Redor OBABA - Backend API Server
 * Tech Stack: Express.js + MySQL
 * Rule: Single main server file, clean architecture, REST API with pagination & search
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');
const nodemailer = require('nodemailer');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'redor_obaba_secret_key_2026';

// -------------------------------------------------------------
// WhatsApp Gateway State & Service (Baileys Unofficial Multi-Device)
// -------------------------------------------------------------
const AUTH_DIR = path.join(__dirname, 'auth_baileys');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let waSocket = null;
let waStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
let waQrCode = null; // data:image/png;base64,...
let waConnectedPhone = null;
let waReconnectTimer = null;

async function initWhatsApp(force = false) {
  try {
    if (waSocket && !force && (waStatus === 'connected' || waStatus === 'connecting')) {
      return;
    }

    if (waSocket) {
      try {
        waSocket.ev.removeAllListeners();
        waSocket.end();
      } catch (e) { }
      waSocket = null;
    }

    if (force) {
      waQrCode = null;
      waConnectedPhone = null;
    }

    waStatus = 'connecting';
    console.log('[WA Gateway] Initializing WhatsApp multi-device socket...');

    // If forcing a new connection and not already linked, clean stale auth files
    if (force) {
      try {
        const files = fs.readdirSync(AUTH_DIR);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(AUTH_DIR, file));
          } catch (err) { }
        }
      } catch (e) { }
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Fast version fetch with fallback
    let version = [2, 3000, 1017531287];
    try {
      const vPromise = fetchLatestBaileysVersion();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
      const v = await Promise.race([vPromise, timeoutPromise]);
      if (v?.version) version = v.version;
    } catch (e) { }

    const logger = pino({ level: 'silent' });
    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: Browsers ? Browsers.ubuntu('Chrome') : ['Ubuntu', 'Chrome', '22.04.4'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });

    waSocket = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          waQrCode = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
          waStatus = 'qr_ready';
          console.log('[WA Gateway] ✅ New QR Code generated successfully.');
        } catch (qrErr) {
          console.error('[WA Gateway] QR conversion error:', qrErr);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WA Gateway] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);

        waStatus = 'disconnected';
        waConnectedPhone = null;

        if (statusCode === DisconnectReason.loggedOut) {
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            fs.mkdirSync(AUTH_DIR, { recursive: true });
          } catch (rmErr) { }
          waQrCode = null;
        } else if (shouldReconnect) {
          clearTimeout(waReconnectTimer);
          waReconnectTimer = setTimeout(() => {
            initWhatsApp(false);
          }, 8000);
        }
      } else if (connection === 'open') {
        waStatus = 'connected';
        waQrCode = null;
        const phoneJid = sock.user?.id || '';
        waConnectedPhone = phoneJid.split(':')[0] || phoneJid.split('@')[0];
        console.log(`[WA Gateway] ✅ Connected successfully as ${waConnectedPhone}!`);
      }
    });

  } catch (error) {
    console.error('[WA Gateway] Initialization error details:', error.stack || error);
    waStatus = 'disconnected';
  }
}

// Graceful notification send function (never throws or blocks caller)
async function sendWhatsAppNotification(phoneNumber, messageText) {
  try {
    if (!waSocket || waStatus !== 'connected') {
      return { success: false, reason: 'not_connected', message: 'WhatsApp Gateway belum terhubung.' };
    }

    if (!phoneNumber || !messageText) {
      return { success: false, reason: 'invalid_params', message: 'Nomor HP atau pesan kosong.' };
    }

    let cleanPhone = phoneNumber.toString().replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    if (!cleanPhone.endsWith('@s.whatsapp.net')) {
      cleanPhone = `${cleanPhone}@s.whatsapp.net`;
    }

    await waSocket.sendMessage(cleanPhone, { text: messageText });
    return { success: true, jid: cleanPhone };
  } catch (err) {
    console.error(`[WA Gateway] Error sending to ${phoneNumber}:`, err.message);
    return { success: false, error: err.message };
  }
}

// Initialize WA on startup in background (non-blocking)
setTimeout(() => {
  initWhatsApp(false);
}, 2000);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload directory setup
const uploadDir = path.join(__dirname, 'uploads-redor-obaba');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads-redor-obaba', express.static(uploadDir));
app.use('/redor-obaba/uploads-redor-obaba', express.static(uploadDir));

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Hanya file gambar (jpg, jpeg, png, webp) yang diperbolehkan!'));
  },
});

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'redor_obaba',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Nodemailer Transporter (Hardcoded Gmail Sesuai Request Klien)
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'miftahudinkonselor@gmail.com',
    pass: 'zefkwzksvcfhasrb',
  },
});

// Helper: Inisialisasi Tabel Tambahan Jika Belum Ada
async function initDatabaseTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS galleries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category ENUM('relawan', 'kegiatan', 'penghargaan', 'lainnya') NOT NULL DEFAULT 'kegiatan',
        date VARCHAR(100) DEFAULT NULL,
        location VARCHAR(200) DEFAULT NULL,
        image VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        donor_name VARCHAR(150) DEFAULT NULL,
        blood_type VARCHAR(10) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pwd_resets_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Pastikan ada sample gallery jika tabel baru dibuat
    const [galleryCount] = await pool.query('SELECT COUNT(*) as count FROM galleries');
    if (galleryCount[0].count === 0) {
      await pool.query(`
        INSERT INTO galleries (id, title, category, date, location, image, description, donor_name, blood_type) VALUES
        (1, 'Aksi Donor Darah Relawan OBABA Balaraja', 'kegiatan', '15 Agustus 2026', 'Balaraja, Kab. Tangerang', 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80', 'Pendonor sukarela antusias mendonorkan darah demi menolong pasien darurat di RSUD Balaraja.', 'Relawan Redor OBABA', 'O+'),
        (2, 'Aksi Tanggap Darurat PRC untuk Pasien Anak', 'relawan', '28 Juli 2026', 'Tigaraksa, Kab. Tangerang', 'https://images.unsplash.com/photo-1579152276508-410a56249be5?auto=format&fit=crop&w=800&q=80', 'Respons cepat relawan golongan darah A+ langsung mendonorkan darah di Unit Transfusi Darah.', 'Ahmad Fauzi & Tim', 'A+'),
        (3, 'Sosialisasi & Donor Darah Bersama Pemuda Desa', 'kegiatan', '10 Juli 2026', 'Cikupa, Kab. Tangerang', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', 'Edukasi pentingnya donor darah rutin dan pendaftaran 50 pendonor darah pemula baru.', 'Komunitas Pemuda Cikupa', 'B+'),
        (4, 'Pemberian Apresiasi Pendonor Rutin Ke-10', 'penghargaan', '01 Juni 2026', 'Sekretariat Redor OBABA', 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80', 'Penyerahan piagam terima kasih kepada pejuang kemanusiaan yang konsisten donor darah setiap 3 bulan.', 'Budi Santoso', 'AB+'),
        (5, 'Mobil Unit Donor Darah Keliling', 'kegiatan', '20 Mei 2026', 'Pasar Kemis, Kab. Tangerang', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', 'Layanan jemput bola mobil donor darah bekerja sama dengan PMI untuk menjangkau masyarakat pelosok.', 'Tim Medis & Relawan', 'O-'),
        (6, 'Relawan Donor Trombosit Apheresis', 'relawan', '05 Mei 2026', 'RSUD Kabupaten Tangerang', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', 'Dedikasi luar biasa relawan pendonor TC khusus untuk pasien demam berdarah kondisi kritis.', 'Siti Rahmawati', 'B+');
      `);
    }

    // Inisialisasi Tabel Banners (Promo & Informasi Beranda)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tag VARCHAR(100) NOT NULL DEFAULT 'Info OBABA',
        title VARCHAR(255) NOT NULL,
        subtitle TEXT DEFAULT NULL,
        location VARCHAR(150) DEFAULT NULL,
        image VARCHAR(255) DEFAULT NULL,
        gradient VARCHAR(150) DEFAULT 'from-blood-950/95 via-blood-900/80 to-slate-950/85',
        link_text VARCHAR(100) DEFAULT 'Lihat Detail',
        link_url VARCHAR(255) DEFAULT '/schedules',
        is_active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [bannerCount] = await pool.query('SELECT COUNT(*) as count FROM banners');
    if (bannerCount[0].count === 0) {
      await pool.query(`
        INSERT INTO banners (id, tag, title, subtitle, location, image, gradient, link_text, link_url, is_active, sort_order) VALUES
        (1, 'HUT & Semangat Kemanusiaan', 'Dirgahayu Republik Indonesia Ke-81', 'Indonesia Berdaulat, Adil dan Makmur Bersama Aksi Donor Darah Relawan Redor OBABA', 'Kab. Tangerang', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', 'from-blood-950/95 via-blood-900/80 to-slate-950/85', 'Jadwal Donor', '/schedules', 1, 1),
        (2, 'Layanan Cepat Relawan', 'Layanan Pengantaran & Respons Darah JEKDON', 'Jejaring respon cepat butuh darah darurat berbasis komunitas siaga 24 jam gratis.', 'Unit OBABA', 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80', 'from-slate-950/95 via-blood-950/80 to-slate-900/85', 'Butuh Darah', '/requests', 1, 2),
        (3, 'Galeri Pahlawan Donor', 'Setetes Darah Kita, Sejuta Harapan Sesama', 'Terima kasih atas ketulusan hati para pendonor sukarela yang telah menyelamatkan ribuan pasien.', 'UDD PMI', 'https://images.unsplash.com/photo-1579152276508-410a56249be5?auto=format&fit=crop&w=1200&q=80', 'from-amber-950/95 via-slate-950/80 to-blood-950/85', 'Galeri Foto', '/gallery', 1, 3),
        (4, 'Edukasi Kesehatan', 'Ayo Donor Darah Rutin Setiap 3 Bulan', 'Tubuh lebih sehat, regenerasi sel darah baru, dan pahala kebaikan yang terus mengalir.', 'Sentra Tangerang', 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80', 'from-sky-950/95 via-slate-950/80 to-slate-900/85', 'Edukasi Donor', '/activities', 1, 4);
      `);
    }

    // Auto-Migrasi & Perapihan: Konversi nomor anggota lama (6 digit random seperti OBABA-660269, obaba-660270) menjadi urut sekuensial obaba-1, obaba-2, ...
    const [allMembers] = await pool.query(
      "SELECT id, donor_card_no FROM users WHERE role != 'admin' ORDER BY id ASC"
    );
    let seq = 1;
    for (const member of allMembers) {
      const match = member.donor_card_no ? member.donor_card_no.match(/^obaba-(\d+)$/i) : null;
      const num = match ? parseInt(match[1], 10) : null;
      // Jika belum punya nomor, atau bukan 'obaba-X', atau merupakan 5-6 digit acak (>= 10000)
      if (!num || num >= 10000 || !member.donor_card_no.startsWith('obaba-')) {
        await pool.query('UPDATE users SET donor_card_no = ? WHERE id = ?', [`obaba-${seq}`, member.id]);
      }
      seq++;
    }
  } catch (err) {
    console.error('[DB Init] Error checking database tables:', err.message);
  }
}

// Helper: Nomor Anggota Sekuensial Dimulai dari 1 (obaba-1, obaba-2, ...)
async function generateNextMemberNumber() {
  try {
    const [rows] = await pool.query(
      "SELECT donor_card_no FROM users WHERE role != 'admin' AND donor_card_no IS NOT NULL"
    );
    let maxNum = 0;
    for (const r of rows) {
      if (r.donor_card_no) {
        const match = r.donor_card_no.match(/^obaba-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          // Abaikan jika angka 5-6 digit peninggalan generator acak lama (>= 10000)
          if (num < 10000 && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
    const nextNum = maxNum + 1;
    return `obaba-${nextNum}`;
  } catch (err) {
    console.error('Error generating member number:', err);
    return `obaba-1`;
  }
}

// Helper: Response Pagination Formatter
const formatPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages,
    },
  };
};

// Helper: Calculate Next Eligible Date & Auto-Update Status
const calculateDonorEligibility = (lastDonationDate) => {
  if (!lastDonationDate) {
    return { isEligible: true, nextEligibleDate: null, daysLeft: 0, formattedNextDate: '-' };
  }
  const lastDate = new Date(lastDonationDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 90); // 90 days interval (3 months)
  const today = new Date();

  const diffTime = nextDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isEligible = diffDays <= 0;

  return {
    isEligible,
    nextEligibleDate: nextDate.toISOString().split('T')[0],
    daysLeft: isEligible ? 0 : diffDays,
    formattedNextDate: nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  };
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa.' });
    }
    req.user = user;
    next();
  });
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses khusus administrator komunitas.' });
  }
  next();
};

// Optional Auth Middleware (for public requests that can identify user if logged in)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
};

// ==========================================
// ROUTES: AUTH
// ==========================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, email, password, blood_type, rhesus, birth_date, gender, address, city, last_donation_date } = req.body;

    if (!name || !phone || !password || !blood_type) {
      return res.status(400).json({ success: false, message: 'Nama, No WhatsApp, Kata Sandi, dan Golongan Darah wajib diisi.' });
    }

    // Check existing phone
    const [existing] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp sudah terdaftar.' });
    }

    // Check existing email if provided
    if (email && email.trim()) {
      const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Nomor anggota dimulai dari obaba-1 (sekuensial sesuai request)
    const donorCardNo = await generateNextMemberNumber();

    // Initial status based on last donation date
    let status = 'siap';
    if (last_donation_date) {
      const eligibility = calculateDonorEligibility(last_donation_date);
      if (!eligibility.isEligible) status = 'belum_bisa';
    }

    // Pendaftaran anggota baru wajib ACC Admin (is_verified = 0)
    const is_verified = 0;

    const [result] = await pool.query(
      `INSERT INTO users (name, phone, email, password, blood_type, rhesus, birth_date, gender, address, city, last_donation_date, status, donor_card_no, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        phone,
        email ? email.trim() : null,
        hashedPassword,
        blood_type,
        rhesus || '+',
        birth_date || null,
        gender || 'L',
        address ? address.trim() : null,
        city ? city.trim() : null,
        last_donation_date || null,
        status,
        donorCardNo,
        is_verified,
      ]
    );

    const userId = result.insertId;

    const [freshUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = freshUsers[0];
    delete user.password;

    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan (ACC) dari Admin Redor OBABA sebelum dapat login.',
      user,
    });
  } catch (error) {
    console.error('Error register:', error);
    res.status(500).json({ success: false, message: 'Gagal melakukan pendaftaran: ' + error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // phone or email
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'No WhatsApp / Email dan kata sandi wajib diisi.' });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE phone = ? OR email = ? LIMIT 1',
      [identifier.trim(), identifier.trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Akun tidak ditemukan. Silakan periksa kembali no WhatsApp/email atau daftar.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Kata sandi tidak sesuai.' });
    }

    // Keanggotaan harus ACC Admin: cek is_verified jika role member
    if (user.role === 'member' && (!user.is_verified || user.is_verified === 0)) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda masih menunggu persetujuan (ACC) dari Admin Redor OBABA. Silakan tunggu verifikasi admin atau hubungi sekretariat.',
      });
    }

    // Recalculate status dynamically if last_donation_date exists
    const eligibility = calculateDonorEligibility(user.last_donation_date);
    if (user.status !== 'tidak_tersedia') {
      const calculatedStatus = eligibility.isEligible ? 'siap' : 'belum_bisa';
      if (user.status !== calculatedStatus) {
        await pool.query('UPDATE users SET status = ? WHERE id = ?', [calculatedStatus, user.id]);
        user.status = calculatedStatus;
      }
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password;
    res.json({
      success: true,
      message: 'Login berhasil. Selamat datang kembali, ' + user.name,
      token,
      user: {
        ...user,
        eligibility,
      },
    });
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login.' });
  }
});

// POST /api/auth/forgot-password (Kirim OTP reset password via Gmail Nodemailer)
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email akun anggota wajib diisi.' });
    }

    const [users] = await pool.query('SELECT id, name, email FROM users WHERE email = ? LIMIT 1', [email.trim()]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Email tidak ditemukan dalam sistem Redor OBABA.' });
    }

    const user = users[0];
    // Generate 6 digit angka OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = jwt.sign({ email: user.email, otp }, JWT_SECRET, { expiresIn: '15m' });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    // Simpan ke tabel password_resets
    await pool.query(
      'INSERT INTO password_resets (email, otp, token, expires_at) VALUES (?, ?, ?, ?)',
      [user.email, otp, token, expiresAt]
    );

    // Kirim email via Nodemailer
    const mailOptions = {
      from: '"Komunitas Redor OBABA" <miftahudinkonselor@gmail.com>',
      to: user.email,
      subject: '🔐 Kode Verifikasi Reset Kata Sandi - Redor OBABA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #b91c1c; margin: 0; font-size: 24px; font-weight: 800;">REDOR OBABA</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Komunitas Relawan Donor Darah Sukarela</p>
          </div>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 16px 0;" />
          <p style="font-size: 15px; color: #1e293b; line-height: 1.5;">Halo <strong>${user.name}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Kami menerima permintaan untuk mereset kata sandi akun anggota Redor OBABA Anda. Masukkan kode verifikasi 6 digit berikut pada halaman reset kata sandi:</p>
          <div style="text-align: center; margin: 26px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #dc2626; background: #fef2f2; padding: 14px 28px; border-radius: 12px; border: 2px dashed #f87171;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.4; text-align: center;">
            Kode OTP ini berlaku selama <strong>15 menit</strong>. Jangan berikan kode ini kepada siapapun untuk menjaga keamanan akun Anda.
          </p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            Jika Anda tidak meminta perubahan kata sandi, abaikan email ini. Akun Anda tetap terlindungi.<br/>
            &copy; 2026 Komunitas Redor OBABA. Hak Cipta Dilindungi.
          </p>
        </div>
      `,
    };

    try {
      await mailTransporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('[Nodemailer Send Error]:', mailErr);
      return res.status(500).json({ success: false, message: 'Gagal mengirim email: ' + mailErr.message });
    }

    res.json({
      success: true,
      message: 'Kode verifikasi OTP telah dikirim ke email ' + user.email + '. Silakan periksa inbox/spam.',
    });
  } catch (error) {
    console.error('Error forgot-password:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses permintaan reset password: ' + error.message });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!email || !otp || !new_password) {
      return res.status(400).json({ success: false, message: 'Email, kode OTP, dan kata sandi baru wajib diisi.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
    }

    const [resets] = await pool.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [email.trim(), otp.trim()]
    );

    if (resets.length === 0) {
      return res.status(400).json({ success: false, message: 'Kode OTP salah atau telah kedaluwarsa. Silakan minta kode baru.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email.trim()]);
    await pool.query('DELETE FROM password_resets WHERE email = ?', [email.trim()]);

    res.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.',
    });
  } catch (error) {
    console.error('Error reset-password:', error);
    res.status(500).json({ success: false, message: 'Gagal mereset kata sandi: ' + error.message });
  }
});

// GET /api/auth/profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const user = users[0];
    delete user.password;
    const eligibility = calculateDonorEligibility(user.last_donation_date);

    res.json({
      success: true,
      data: {
        ...user,
        eligibility,
      },
    });
  } catch (error) {
    console.error('Error get profile:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data profil.' });
  }
});

// PUT /api/auth/profile (Fitur Edit Profile Anggota Lengkap)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, blood_type, rhesus, birth_date, gender, address, city, last_donation_date, status } = req.body;

    // Check phone duplicate if updated
    if (phone) {
      const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ? AND id != ?', [phone.trim(), req.user.id]);
      if (existingPhone.length > 0) {
        return res.status(400).json({ success: false, message: 'Nomor WhatsApp sudah digunakan oleh akun lain.' });
      }
    }

    // Check email duplicate if updated
    if (email && email.trim()) {
      const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim(), req.user.id]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ success: false, message: 'Email sudah digunakan oleh akun lain.' });
      }
    }

    let newStatus = status;
    if (last_donation_date && status !== 'tidak_tersedia') {
      const eligibility = calculateDonorEligibility(last_donation_date);
      newStatus = eligibility.isEligible ? 'siap' : 'belum_bisa';
    }

    await pool.query(
      `UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        email = ?,
        blood_type = COALESCE(?, blood_type),
        rhesus = COALESCE(?, rhesus),
        birth_date = ?,
        gender = COALESCE(?, gender),
        address = ?,
        city = ?,
        last_donation_date = ?,
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name || null,
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        blood_type || null,
        rhesus || null,
        birth_date || null,
        gender || null,
        address !== undefined ? (address ? address.trim() : null) : null,
        city !== undefined ? (city ? city.trim() : null) : null,
        last_donation_date || null,
        newStatus || null,
        req.user.id,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = updated[0];
    delete user.password;
    const eligibility = calculateDonorEligibility(user.last_donation_date);

    res.json({
      success: true,
      message: 'Profil anggota berhasil diperbarui!',
      data: {
        ...user,
        eligibility,
      },
    });
  } catch (error) {
    console.error('Error update profile:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui profil: ' + error.message });
  }
});

// PUT /api/auth/password
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' });
    }

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const isMatch = await bcrypt.compare(current_password, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Kata sandi saat ini salah.' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ success: true, message: 'Kata sandi berhasil diubah.' });
  } catch (error) {
    console.error('Error change password:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah kata sandi.' });
  }
});

// ==========================================
// ROUTES: BLOOD STOCK & DONORS
// ==========================================

// GET /api/donors/stock-summary (Realtime Donor Stock per Blood Type & Rhesus)
app.get('/api/donors/stock-summary', async (req, res) => {
  try {
    const bloodTypes = [
      { blood_type: 'A', rhesus: '+' },
      { blood_type: 'A', rhesus: '-' },
      { blood_type: 'B', rhesus: '+' },
      { blood_type: 'B', rhesus: '-' },
      { blood_type: 'AB', rhesus: '+' },
      { blood_type: 'AB', rhesus: '-' },
      { blood_type: 'O', rhesus: '+' },
      { blood_type: 'O', rhesus: '-' },
    ];

    const [rows] = await pool.query(`
      SELECT 
        blood_type, 
        rhesus,
        COUNT(id) AS total_registered,
        SUM(CASE WHEN status = 'siap' THEN 1 ELSE 0 END) AS ready_count,
        SUM(CASE WHEN status = 'belum_bisa' THEN 1 ELSE 0 END) AS resting_count,
        SUM(CASE WHEN status = 'tidak_tersedia' THEN 1 ELSE 0 END) AS unavailable_count
      FROM users
      WHERE role = 'member'
      GROUP BY blood_type, rhesus
    `);

    const summaryMap = {};
    rows.forEach((r) => {
      summaryMap[`${r.blood_type}${r.rhesus}`] = {
        total_registered: parseInt(r.total_registered),
        ready_count: parseInt(r.ready_count || 0),
        resting_count: parseInt(r.resting_count || 0),
        unavailable_count: parseInt(r.unavailable_count || 0),
      };
    });

    const stockData = bloodTypes.map((bt) => {
      const key = `${bt.blood_type}${bt.rhesus}`;
      const counts = summaryMap[key] || { total_registered: 0, ready_count: 0, resting_count: 0, unavailable_count: 0 };

      let stockStatus = 'habis'; // 🔴
      if (counts.ready_count >= 5) {
        stockStatus = 'tersedia'; // 🟢
      } else if (counts.ready_count > 0) {
        stockStatus = 'sedikit'; // 🟡
      }

      return {
        blood_type: bt.blood_type,
        rhesus: bt.rhesus,
        label: `${bt.blood_type}${bt.rhesus}`,
        ...counts,
        stock_status: stockStatus,
      };
    });

    res.json({
      success: true,
      data: stockData,
      total_ready_donors: stockData.reduce((acc, curr) => acc + curr.ready_count, 0),
    });
  } catch (error) {
    console.error('Error stock summary:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat ringkasan stok darah.' });
  }
});

// GET /api/donors (List of Donors with Pagination, Search, Filtering)
app.get('/api/donors', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      blood_type = '',
      rhesus = '',
      status = '',
      city = '',
      sortBy = 'name',
      sortOrder = 'ASC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = ["role = 'member'"];
    let params = [];

    if (search) {
      conditions.push('(name LIKE ? OR phone LIKE ? OR city LIKE ? OR address LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (blood_type) {
      conditions.push('blood_type = ?');
      params.push(blood_type);
    }

    if (rhesus) {
      conditions.push('rhesus = ?');
      params.push(rhesus);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (city) {
      conditions.push('city LIKE ?');
      params.push(`%${city}%`);
    }

    if (req.query.is_verified !== undefined && req.query.is_verified !== '') {
      conditions.push('is_verified = ?');
      params.push(parseInt(req.query.is_verified));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Allowed sort columns
    const allowedSortColumns = ['name', 'total_donations', 'last_donation_date', 'created_at', 'status'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
    const validSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Count Total
    const [countResult] = await pool.query(
      `SELECT COUNT(id) as total FROM users ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Fetch Data
    const [donors] = await pool.query(
      `SELECT id, name, phone, email, blood_type, rhesus, birth_date, gender, address, city, 
              last_donation_date, total_donations, status, donor_card_no, is_verified, created_at
       FROM users 
       ${whereClause} 
       ORDER BY ${validSortBy} ${validSortOrder} 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Add eligibility calculation
    const enrichedDonors = donors.map((d) => ({
      ...d,
      eligibility: calculateDonorEligibility(d.last_donation_date),
    }));

    res.json(formatPaginationResponse(enrichedDonors, total, page, limit));
  } catch (error) {
    console.error('Error get donors:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data donor.' });
  }
});

// GET /api/donors/:id
app.get('/api/donors/:id', async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, name, phone, email, blood_type, rhesus, birth_date, gender, address, city, 
              last_donation_date, total_donations, status, donor_card_no, is_verified, created_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Donor tidak ditemukan.' });
    }

    const donor = users[0];
    const eligibility = calculateDonorEligibility(donor.last_donation_date);

    // Get donation histories
    const [histories] = await pool.query(
      'SELECT * FROM donation_histories WHERE user_id = ? ORDER BY donation_date DESC',
      [donor.id]
    );

    res.json({
      success: true,
      data: {
        ...donor,
        eligibility,
        histories,
      },
    });
  } catch (error) {
    console.error('Error get donor detail:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat detail donor.' });
  }
});

// PUT /api/donors/:id/status (Admin change status, verification, or total donations)
app.put('/api/donors/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, is_verified, total_donations } = req.body;
    await pool.query(
      `UPDATE users SET 
        status = COALESCE(?, status), 
        is_verified = COALESCE(?, is_verified),
        total_donations = COALESCE(?, total_donations) 
       WHERE id = ?`,
      [status, is_verified, total_donations !== undefined ? total_donations : null, req.params.id]
    );
    res.json({ success: true, message: 'Status dan data donor berhasil diperbarui.' });
  } catch (error) {
    console.error('Error update donor status:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status donor.' });
  }
});

// PUT /api/donors/:id/verify (Admin ACC Keanggotaan Anggota / Donor)
app.put('/api/donors/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const donorId = req.params.id;
    const [donors] = await pool.query('SELECT * FROM users WHERE id = ?', [donorId]);
    if (donors.length === 0) {
      return res.status(404).json({ success: false, message: 'Data anggota tidak ditemukan.' });
    }

    const donor = donors[0];
    let donorCardNo = donor.donor_card_no;
    // Jika belum punya nomor obaba-X atau masih random lama, assign nomor sekuensial
    if (!donorCardNo || !donorCardNo.toLowerCase().startsWith('obaba-')) {
      donorCardNo = await generateNextMemberNumber();
    }

    await pool.query(
      'UPDATE users SET is_verified = 1, donor_card_no = ? WHERE id = ?',
      [donorCardNo, donorId]
    );

    res.json({
      success: true,
      message: `Keanggotaan ${donor.name} berhasil di-ACC dan diaktifkan dengan No. Anggota ${donorCardNo}!`,
      donor_card_no: donorCardNo,
    });
  } catch (error) {
    console.error('Error verify donor:', error);
    res.status(500).json({ success: false, message: 'Gagal menyetujui keanggotaan: ' + error.message });
  }
});

// DELETE /api/donors/:id (Admin delete donor)
app.delete('/api/donors/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Data anggota/donor berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete donor:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus data donor.' });
  }
});

// ==========================================
// ROUTES: BLOOD REQUESTS (FITUR UTAMA)
// ==========================================

// Helper: Matchmaking logic for blood compatibility
const getCompatibleBloodTypes = (neededType, neededRhesus) => {
  // Red Blood Cell / Whole Blood Compatibility Rules
  // A- -> A-, O-
  // A+ -> A+, A-, O+, O-
  // B- -> B-, O-
  // B+ -> B+, B-, O+, O-
  // AB- -> AB-, A-, B-, O-
  // AB+ -> All (Universal Receiver)
  // O- -> O- only
  // O+ -> O+, O-
  const map = {
    'A+': [{ type: 'A', rhesus: '+' }, { type: 'A', rhesus: '-' }, { type: 'O', rhesus: '+' }, { type: 'O', rhesus: '-' }],
    'A-': [{ type: 'A', rhesus: '-' }, { type: 'O', rhesus: '-' }],
    'B+': [{ type: 'B', rhesus: '+' }, { type: 'B', rhesus: '-' }, { type: 'O', rhesus: '+' }, { type: 'O', rhesus: '-' }],
    'B-': [{ type: 'B', rhesus: '-' }, { type: 'O', rhesus: '-' }],
    'AB+': [
      { type: 'AB', rhesus: '+' }, { type: 'AB', rhesus: '-' },
      { type: 'A', rhesus: '+' }, { type: 'A', rhesus: '-' },
      { type: 'B', rhesus: '+' }, { type: 'B', rhesus: '-' },
      { type: 'O', rhesus: '+' }, { type: 'O', rhesus: '-' }
    ],
    'AB-': [{ type: 'AB', rhesus: '-' }, { type: 'A', rhesus: '-' }, { type: 'B', rhesus: '-' }, { type: 'O', rhesus: '-' }],
    'O+': [{ type: 'O', rhesus: '+' }, { type: 'O', rhesus: '-' }],
    'O-': [{ type: 'O', rhesus: '-' }],
  };
  const key = `${neededType}${neededRhesus}`;
  return map[key] || [{ type: neededType, rhesus: neededRhesus }];
};

// GET /api/blood-requests (List Requests with Pagination, Search & Filter)
app.get('/api/blood-requests', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      blood_type = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = [];
    let params = [];

    if (search) {
      conditions.push('(r.patient_name LIKE ? OR r.hospital_name LIKE ? OR r.diagnosis LIKE ? OR r.cp_name LIKE ?)');
      const sp = `%${search}%`;
      params.push(sp, sp, sp, sp);
    }

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (blood_type) {
      conditions.push('r.blood_type = ?');
      params.push(blood_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowedSort = ['created_at', 'patient_name', 'bags_needed', 'status'];
    const validSort = allowedSort.includes(sortBy) ? `r.${sortBy}` : 'r.created_at';
    const validOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [countResult] = await pool.query(
      `SELECT COUNT(r.id) as total FROM blood_requests r ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [requests] = await pool.query(
      `SELECT r.*, u.name as requester_name, u.phone as requester_phone,
        (SELECT COUNT(id) FROM blood_request_responses WHERE request_id = r.id AND response_status = 'bisa') as ready_helpers_count
       FROM blood_requests r
       LEFT JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY ${validSort} ${validOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json(formatPaginationResponse(requests, total, page, limit));
  } catch (error) {
    console.error('Error get requests:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data permintaan darah.' });
  }
});

// GET /api/blood-requests/:id (Detail Request + Compatible Donors + Responses)
app.get('/api/blood-requests/:id', async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT r.*, u.name as requester_name, u.phone as requester_phone
       FROM blood_requests r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Permintaan darah tidak ditemukan.' });
    }

    const request = requests[0];

    // Find compatible ready donors
    const compatibleTypes = getCompatibleBloodTypes(request.blood_type, request.rhesus);

    // Construct query for compatible donors
    let typeConditions = compatibleTypes.map(() => '(blood_type = ? AND rhesus = ?)').join(' OR ');
    let typeParams = [];
    compatibleTypes.forEach((t) => {
      typeParams.push(t.type, t.rhesus);
    });

    const [matchingDonors] = await pool.query(
      `SELECT id, name, phone, blood_type, rhesus, city, status, last_donation_date, total_donations
       FROM users
       WHERE role = 'member' AND status = 'siap' AND (${typeConditions})
       ORDER BY (blood_type = '${request.blood_type}' AND rhesus = '${request.rhesus}') DESC, last_donation_date ASC`,
      typeParams
    );

    // Get responses from donors
    const [responses] = await pool.query(
      `SELECT resp.*, u.name as donor_name, u.phone as donor_phone, u.blood_type, u.rhesus
       FROM blood_request_responses resp
       JOIN users u ON resp.donor_id = u.id
       WHERE resp.request_id = ?
       ORDER BY resp.responded_at DESC`,
      [request.id]
    );

    res.json({
      success: true,
      data: {
        ...request,
        matchingDonors,
        matchingDonorsCount: matchingDonors.length,
        responses,
      },
    });
  } catch (error) {
    console.error('Error get request detail:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat detail permintaan darah.' });
  }
});

// POST /api/blood-requests (Create Request)
app.post('/api/blood-requests', optionalAuth, async (req, res) => {
  try {
    const {
      patient_name,
      patient_age,
      hospital_name,
      hospital_room,
      patient_address,
      blood_type,
      rhesus,
      blood_component,
      bags_needed,
      diagnosis,
      cp_name,
      cp_phone,
      cp_relation,
      emergency_note,
    } = req.body;

    if (!patient_name || !patient_age || !hospital_name || !blood_type || !bags_needed || !diagnosis || !cp_name || !cp_phone || !cp_relation) {
      return res.status(400).json({ success: false, message: 'Mohon lengkapi seluruh formulir data pasien, kebutuhan darah, dan kontak penanggung jawab.' });
    }

    const userId = req.user ? req.user.id : null;

    const [result] = await pool.query(
      `INSERT INTO blood_requests 
        (user_id, patient_name, patient_age, hospital_name, hospital_room, patient_address, 
         blood_type, rhesus, blood_component, bags_needed, diagnosis, cp_name, cp_phone, cp_relation, emergency_note, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mendesak')`,
      [
        userId,
        patient_name,
        parseInt(patient_age),
        hospital_name,
        hospital_room || null,
        patient_address || null,
        blood_type,
        rhesus || '+',
        blood_component || 'PRC',
        parseInt(bags_needed),
        diagnosis,
        cp_name,
        cp_phone,
        cp_relation,
        emergency_note || null,
      ]
    );

    const requestId = result.insertId;

    // Get count of matching ready donors
    const compatible = getCompatibleBloodTypes(blood_type, rhesus || '+');
    let typeConditions = compatible.map(() => '(blood_type = ? AND rhesus = ?)').join(' OR ');
    let typeParams = [];
    compatible.forEach((t) => typeParams.push(t.type, t.rhesus));

    const [matchCount] = await pool.query(
      `SELECT COUNT(id) as count FROM users WHERE role = 'member' AND status = 'siap' AND (${typeConditions})`,
      typeParams
    );

    res.status(201).json({
      success: true,
      message: 'Permintaan darah berhasil diajukan! Sistem menemukan ' + matchCount[0].count + ' calon donor siap.',
      data: {
        id: requestId,
        matchingDonorsCount: matchCount[0].count,
      },
    });
  } catch (error) {
    console.error('Error create request:', error);
    res.status(500).json({ success: false, message: 'Gagal mengajukan permintaan darah: ' + error.message });
  }
});

// PUT /api/blood-requests/:id (Update Request)
app.put('/api/blood-requests/:id', authenticateToken, async (req, res) => {
  try {
    const {
      patient_name,
      patient_age,
      hospital_name,
      hospital_room,
      patient_address,
      blood_type,
      rhesus,
      blood_component,
      bags_needed,
      bags_fulfilled,
      diagnosis,
      cp_name,
      cp_phone,
      cp_relation,
      emergency_note,
      status,
    } = req.body;

    await pool.query(
      `UPDATE blood_requests SET
        patient_name = COALESCE(?, patient_name),
        patient_age = COALESCE(?, patient_age),
        hospital_name = COALESCE(?, hospital_name),
        hospital_room = ?,
        patient_address = ?,
        blood_type = COALESCE(?, blood_type),
        rhesus = COALESCE(?, rhesus),
        blood_component = COALESCE(?, blood_component),
        bags_needed = COALESCE(?, bags_needed),
        bags_fulfilled = COALESCE(?, bags_fulfilled),
        diagnosis = COALESCE(?, diagnosis),
        cp_name = COALESCE(?, cp_name),
        cp_phone = COALESCE(?, cp_phone),
        cp_relation = COALESCE(?, cp_relation),
        emergency_note = ?,
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        patient_name, patient_age, hospital_name, hospital_room || null, patient_address || null,
        blood_type, rhesus, blood_component, bags_needed, bags_fulfilled, diagnosis,
        cp_name, cp_phone, cp_relation, emergency_note || null, status, req.params.id
      ]
    );

    res.json({ success: true, message: 'Data permintaan darah berhasil diperbarui.' });
  } catch (error) {
    console.error('Error update request:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui permintaan darah.' });
  }
});

// PATCH /api/blood-requests/:id/status (Quick Update Status / Close Request)
app.patch('/api/blood-requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, bags_fulfilled } = req.body;
    await pool.query(
      'UPDATE blood_requests SET status = ?, bags_fulfilled = COALESCE(?, bags_fulfilled) WHERE id = ?',
      [status, bags_fulfilled, req.params.id]
    );
    res.json({ success: true, message: `Status permintaan darah diubah menjadi: ${status}` });
  } catch (error) {
    console.error('Error update request status:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status.' });
  }
});

// DELETE /api/blood-requests/:id
app.delete('/api/blood-requests/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM blood_requests WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Permintaan darah berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete request:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus permintaan darah.' });
  }
});

// POST /api/blood-requests/:id/respond (Donor Response Confirmation: Bisa / Tidak Bisa / Sudah Donor)
app.post('/api/blood-requests/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { response_status, note } = req.body; // 'bisa', 'tidak_bisa', 'sudah_donor'
    const requestId = req.params.id;
    const donorId = req.user.id;

    if (!['bisa', 'tidak_bisa', 'sudah_donor'].includes(response_status)) {
      return res.status(400).json({ success: false, message: 'Status respons tidak valid.' });
    }

    // Upsert response
    await pool.query(
      `INSERT INTO blood_request_responses (request_id, donor_id, response_status, note, responded_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE response_status = VALUES(response_status), note = VALUES(note), responded_at = NOW()`,
      [requestId, donorId, response_status, note || null]
    );

    // If 'sudah_donor', create history record and update donor status & last donation date
    if (response_status === 'sudah_donor') {
      const [reqData] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
      if (reqData.length > 0) {
        const reqRow = reqData[0];
        await pool.query(
          `INSERT INTO donation_histories (user_id, request_id, donation_date, location, bags, blood_component, notes)
           VALUES (?, ?, CURDATE(), ?, 1, ?, 'Donasi via respon permintaan darah OBABA')`,
          [donorId, requestId, reqRow.hospital_name, reqRow.blood_component]
        );
        // Increment user's total donations & update last_donation_date to today
        await pool.query(
          `UPDATE users SET 
            total_donations = total_donations + 1,
            last_donation_date = CURDATE(),
            status = 'belum_bisa'
           WHERE id = ?`,
          [donorId]
        );
        // Increment fulfilled bags
        await pool.query(
          'UPDATE blood_requests SET bags_fulfilled = bags_fulfilled + 1 WHERE id = ?',
          [requestId]
        );
      }
    }

    res.json({
      success: true,
      message: response_status === 'bisa'
        ? 'Terima kasih atas kesediaan Anda membantu! Mohon koordinasi dengan kontak keluarga/pemohon.'
        : 'Respons Anda telah tercatat.',
    });
  } catch (error) {
    console.error('Error respond to request:', error);
    res.status(500).json({ success: false, message: 'Gagal mengirim konfirmasi respons: ' + error.message });
  }
});

// GET /api/blood-requests/:id/matching-donors (Get WhatsApp Broadcast List - Admin Only for Donor Privacy)
app.get('/api/blood-requests/:id/matching-donors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [requests] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [req.params.id]);
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Permintaan darah tidak ditemukan.' });
    }
    const request = requests[0];

    const compatibleTypes = getCompatibleBloodTypes(request.blood_type, request.rhesus);
    let typeConditions = compatibleTypes.map(() => '(blood_type = ? AND rhesus = ?)').join(' OR ');
    let typeParams = [];
    compatibleTypes.forEach((t) => typeParams.push(t.type, t.rhesus));

    const [matchingDonors] = await pool.query(
      `SELECT id, name, phone, blood_type, rhesus, city, address, last_donation_date
       FROM users
       WHERE role = 'member' AND status = 'siap' AND (${typeConditions})
       ORDER BY (blood_type = '${request.blood_type}' AND rhesus = '${request.rhesus}') DESC, last_donation_date ASC`,
      typeParams
    );

    // Format the official Redor OBABA broadcast text
    const updateDate = new Date(request.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const broadcastText = `[BROADCAST KEPERLUAN DARAH]
KOMUNITAS REDOR OBABA
📅 Tgl Update : ${updateDate}
🥷 Nama Pasien : ${request.patient_name}
✍ Umur : ${request.patient_age} Tahun
🏥 Tempat Di Rawat : ${request.hospital_name}${request.hospital_room ? ' (' + request.hospital_room + ')' : ''}
📌 Alamat Rumah : ${request.patient_address || '-'}
🔠 Golongan Darah (Rhesus) : ${request.blood_type} (${request.rhesus})
🎯 Jenis DARAH yg diminta : ${request.blood_component}
🌡 Jumlah Keperluan Darah : ${request.bags_needed} Kantong (Terpenuhi: ${request.bags_fulfilled})
🛡 Digunakan Untuk : ${request.diagnosis}
☎ CP Keluarga Pasien : ${request.cp_phone} (${request.cp_name})
Hubungan dengan pasien sebagai : ${request.cp_relation}
${request.emergency_note ? `\nCatatan Darurat: ${request.emergency_note}\n` : ''}
✅ Klik tautan berikut untuk konfirmasi kesediaan donor:
${process.env.FRONTEND_URL || 'https://redorobaba.id'}/confirm-request/${request.id}`;

    res.json({
      success: true,
      request,
      broadcastText,
      matchingDonors,
    });
  } catch (error) {
    console.error('Error get matching donors for broadcast:', error);
    res.status(500).json({ success: false, message: 'Gagal menyiapkan data broadcast.' });
  }
});

// ==========================================
// ROUTES: DONATION HISTORIES
// ==========================================

// GET /api/donation-histories
app.get('/api/donation-histories', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', user_id = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    // If regular member, only show own histories unless admin
    if (req.user.role !== 'admin' || user_id) {
      const targetUserId = req.user.role === 'admin' && user_id ? user_id : req.user.id;
      conditions.push('dh.user_id = ?');
      params.push(targetUserId);
    }

    if (search) {
      conditions.push('(dh.location LIKE ? OR dh.notes LIKE ? OR u.name LIKE ?)');
      const sp = `%${search}%`;
      params.push(sp, sp, sp);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(dh.id) as total FROM donation_histories dh LEFT JOIN users u ON dh.user_id = u.id ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [histories] = await pool.query(
      `SELECT dh.*, u.name as donor_name, u.phone as donor_phone, u.blood_type, u.rhesus, u.donor_card_no
       FROM donation_histories dh
       JOIN users u ON dh.user_id = u.id
       ${whereClause}
       ORDER BY dh.donation_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json(formatPaginationResponse(histories, total, page, limit));
  } catch (error) {
    console.error('Error get donation histories:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat donor.' });
  }
});

// POST /api/donation-histories (Add donation record)
app.post('/api/donation-histories', authenticateToken, async (req, res) => {
  try {
    const { user_id, donation_date, location, bags, blood_component, notes } = req.body;
    const targetUserId = (req.user.role === 'admin' && user_id) ? user_id : req.user.id;

    if (!donation_date || !location) {
      return res.status(400).json({ success: false, message: 'Tanggal donor dan lokasi wajib diisi.' });
    }

    const certNo = 'OBB-DNR-' + donation_date.replace(/-/g, '') + '-' + Math.floor(10 + Math.random() * 90);

    const [result] = await pool.query(
      `INSERT INTO donation_histories (user_id, donation_date, location, bags, blood_component, certificate_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [targetUserId, donation_date, location, bags || 1, blood_component || 'WB', certNo, notes || null]
    );

    // Update user stats and status
    const eligibility = calculateDonorEligibility(donation_date);
    const newStatus = eligibility.isEligible ? 'siap' : 'belum_bisa';

    await pool.query(
      `UPDATE users SET 
        last_donation_date = ?,
        total_donations = total_donations + ?,
        status = ?
       WHERE id = ?`,
      [donation_date, bags || 1, newStatus, targetUserId]
    );

    res.status(201).json({
      success: true,
      message: 'Riwayat donor berhasil ditambahkan. Status kesiapan donor diperbarui.',
      data: { id: result.insertId, certificate_number: certNo },
    });
  } catch (error) {
    console.error('Error create donation history:', error);
    res.status(500).json({ success: false, message: 'Gagal mencatat riwayat donor.' });
  }
});

// DELETE /api/donation-histories/:id
app.delete('/api/donation-histories/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM donation_histories WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Riwayat donor tidak ditemukan.' });
    }

    if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    await pool.query('DELETE FROM donation_histories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Riwayat donor berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete donation history:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus riwayat donor.' });
  }
});

// ==========================================
// ROUTES: ACTIVITIES / BERITA & EDUKASI
// ==========================================

// GET /api/activities (Pagination, Search, Category)
app.get('/api/activities', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['is_published = 1'];
    let params = [];

    if (search) {
      conditions.push('(title LIKE ? OR summary LIKE ? OR content LIKE ?)');
      const sp = `%${search}%`;
      params.push(sp, sp, sp);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult] = await pool.query(
      `SELECT COUNT(id) as total FROM activities ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [activities] = await pool.query(
      `SELECT id, title, slug, category, summary, image, event_date, location, views_count, created_at
       FROM activities
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json(formatPaginationResponse(activities, total, page, limit));
  } catch (error) {
    console.error('Error get activities:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kegiatan/berita.' });
  }
});

// GET /api/activities/:slug (Detail Activity)
app.get('/api/activities/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM activities WHERE slug = ? OR id = ?', [
      req.params.slug,
      isNaN(req.params.slug) ? -1 : req.params.slug,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Artikel atau kegiatan tidak ditemukan.' });
    }

    const activity = rows[0];
    // Increment view count
    await pool.query('UPDATE activities SET views_count = views_count + 1 WHERE id = ?', [activity.id]);

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Error get activity detail:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat detail kegiatan.' });
  }
});

// POST /api/activities (Admin create activity/news)
app.post('/api/activities', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, category, summary, content, event_date, location, is_published } = req.body;
    if (!title || !summary || !content) {
      return res.status(400).json({ success: false, message: 'Judul, Ringkasan, dan Konten berita wajib diisi.' });
    }

    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    const slug = baseSlug + '-' + Math.floor(100 + Math.random() * 900);
    const imageUrl = req.file ? `/uploads-redor-obaba/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO activities (title, slug, category, summary, content, image, event_date, location, author_id, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        category || 'kegiatan',
        summary,
        content,
        imageUrl,
        event_date || null,
        location || null,
        req.user.id,
        is_published !== undefined ? parseInt(is_published) : 1,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Berita/Kegiatan berhasil dipublikasikan!',
      data: { id: result.insertId, slug },
    });
  } catch (error) {
    console.error('Error create activity:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan kegiatan: ' + error.message });
  }
});

// PUT /api/activities/:id (Admin edit activity)
app.put('/api/activities/:id', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, category, summary, content, event_date, location, is_published } = req.body;
    let imageUpdateSql = '';
    let params = [title, category, summary, content, event_date || null, location || null, parseInt(is_published || 1)];

    if (req.file) {
      imageUpdateSql = ', image = ?';
      params.push(`/uploads-redor-obaba/${req.file.filename}`);
    }

    params.push(req.params.id);

    await pool.query(
      `UPDATE activities SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        summary = COALESCE(?, summary),
        content = COALESCE(?, content),
        event_date = ?,
        location = ?,
        is_published = COALESCE(?, is_published)
        ${imageUpdateSql}
       WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Berita/Kegiatan berhasil diperbarui.' });
  } catch (error) {
    console.error('Error update activity:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui kegiatan.' });
  }
});

// DELETE /api/activities/:id
app.delete('/api/activities/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM activities WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Kegiatan/Berita berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete activity:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus kegiatan.' });
  }
});

// ==========================================
// ROUTES: SCHEDULES (JADWAL DONOR & MOBIL UNIT)
// ==========================================

// GET /api/schedules
app.get('/api/schedules', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    if (search) {
      conditions.push('(title LIKE ? OR organizer LIKE ? OR location LIKE ?)');
      const sp = `%${search}%`;
      params.push(sp, sp, sp);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(id) as total FROM schedules ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [schedules] = await pool.query(
      `SELECT * FROM schedules ${whereClause} ORDER BY date ASC, start_time ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json(formatPaginationResponse(schedules, total, page, limit));
  } catch (error) {
    console.error('Error get schedules:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil jadwal donor.' });
  }
});

// POST /api/schedules (Admin Create Schedule)
app.post('/api/schedules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, organizer, location, address, date, start_time, end_time, target_bags, contact_person, status, notes } = req.body;
    if (!title || !organizer || !location || !date || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Mohon lengkapi judul, penyelenggara, lokasi, tanggal, dan jam pelaksanaan.' });
    }

    const [result] = await pool.query(
      `INSERT INTO schedules (title, organizer, location, address, date, start_time, end_time, target_bags, contact_person, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, organizer, location, address || null, date, start_time, end_time, parseInt(target_bags || 50), contact_person || null, status || 'akan_datang', notes || null]
    );

    res.status(201).json({ success: true, message: 'Jadwal aksi donor darah berhasil dibuat!', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error create schedule:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat jadwal donor.' });
  }
});

// PUT /api/schedules/:id
app.put('/api/schedules/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, organizer, location, address, date, start_time, end_time, target_bags, contact_person, status, notes } = req.body;
    await pool.query(
      `UPDATE schedules SET
        title = COALESCE(?, title),
        organizer = COALESCE(?, organizer),
        location = COALESCE(?, location),
        address = ?,
        date = COALESCE(?, date),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        target_bags = COALESCE(?, target_bags),
        contact_person = ?,
        status = COALESCE(?, status),
        notes = ?
       WHERE id = ?`,
      [title, organizer, location, address || null, date, start_time, end_time, target_bags, contact_person || null, status, notes || null, req.params.id]
    );
    res.json({ success: true, message: 'Jadwal donor berhasil diperbarui.' });
  } catch (error) {
    console.error('Error update schedule:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui jadwal donor.' });
  }
});

// DELETE /api/schedules/:id
app.delete('/api/schedules/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM schedules WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Jadwal donor berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete schedule:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus jadwal donor.' });
  }
});

// ==========================================
// ROUTES: HOSPITALS & AMBULANCE DIRECTORY
// ==========================================

// GET /api/hospitals
app.get('/api/hospitals', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['is_active = 1'];
    let params = [];

    if (search) {
      conditions.push('(name LIKE ? OR address LIKE ? OR city LIKE ?)');
      const sp = `%${search}%`;
      params.push(sp, sp, sp);
    }

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult] = await pool.query(
      `SELECT COUNT(id) as total FROM hospitals ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [hospitals] = await pool.query(
      `SELECT * FROM hospitals ${whereClause} ORDER BY type = 'pmi' DESC, type = 'ambulance' DESC, name ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json(formatPaginationResponse(hospitals, total, page, limit));
  } catch (error) {
    console.error('Error get hospitals:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat kontak rumah sakit/ambulans.' });
  }
});

// POST /api/hospitals (Admin Create Hospital/Ambulance)
app.post('/api/hospitals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, type, address, city, phone, emergency_phone, ambulance_phone, maps_url } = req.body;
    if (!name || !address || !phone) {
      return res.status(400).json({ success: false, message: 'Nama fasilitas, alamat, dan nomor telepon wajib diisi.' });
    }

    const [result] = await pool.query(
      `INSERT INTO hospitals (name, type, address, city, phone, emergency_phone, ambulance_phone, maps_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, type || 'rs_umum', address, city || 'Kab. Tangerang', phone, emergency_phone || null, ambulance_phone || null, maps_url || null]
    );

    res.status(201).json({ success: true, message: 'Kontak faskes/ambulans berhasil ditambahkan.', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error create hospital:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan kontak fasilitas.' });
  }
});

// PUT /api/hospitals/:id
app.put('/api/hospitals/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, type, address, city, phone, emergency_phone, ambulance_phone, maps_url } = req.body;
    await pool.query(
      `UPDATE hospitals SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        phone = COALESCE(?, phone),
        emergency_phone = ?,
        ambulance_phone = ?,
        maps_url = ?
       WHERE id = ?`,
      [name, type, address, city, phone, emergency_phone || null, ambulance_phone || null, maps_url || null, req.params.id]
    );
    res.json({ success: true, message: 'Data fasilitas kesehatan berhasil diperbarui.' });
  } catch (error) {
    console.error('Error update hospital:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data faskes.' });
  }
});

// DELETE /api/hospitals/:id
app.delete('/api/hospitals/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM hospitals WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Data fasilitas berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete hospital:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus data faskes.' });
  }
});

// ==========================================
// ROUTES: FEEDBACK (KRITIK & SARAN)
// ==========================================

// GET /api/feedbacks (Pagination, Search)
app.get('/api/feedbacks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    if (search) {
      conditions.push('(name LIKE ? OR phone LIKE ? OR message LIKE ?)');
      const sp = `%${search}%`;
      params.push(sp, sp, sp);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(id) as total FROM feedbacks ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [feedbacks] = await pool.query(
      `SELECT * FROM feedbacks ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json(formatPaginationResponse(feedbacks, total, page, limit));
  } catch (error) {
    console.error('Error get feedbacks:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kritik & saran.' });
  }
});

// POST /api/feedbacks (Public or Member submit feedback)
app.post('/api/feedbacks', optionalAuth, async (req, res) => {
  try {
    const { name, phone, category, message, rating } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, message: 'Nama, No WhatsApp, dan Pesan kritik/saran wajib diisi.' });
    }

    const userId = req.user ? req.user.id : null;

    const [result] = await pool.query(
      `INSERT INTO feedbacks (user_id, name, phone, category, message, rating)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, phone, category || 'saran', message, rating || 5]
    );

    res.status(201).json({
      success: true,
      message: 'Terima kasih atas kritik dan saran Anda untuk kemajuan Redor OBABA!',
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error('Error submit feedback:', error);
    res.status(500).json({ success: false, message: 'Gagal mengirim kritik dan saran.' });
  }
});

// PATCH /api/feedbacks/:id/reply
app.patch('/api/feedbacks/:id/reply', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reply, status } = req.body;
    await pool.query(
      'UPDATE feedbacks SET reply = ?, status = ? WHERE id = ?',
      [reply, status || 'dibalas', req.params.id]
    );
    res.json({ success: true, message: 'Balasan berhasil disimpan.' });
  } catch (error) {
    console.error('Error reply feedback:', error);
    res.status(500).json({ success: false, message: 'Gagal membalas feedback.' });
  }
});

// DELETE /api/feedbacks/:id
app.delete('/api/feedbacks/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM feedbacks WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Pesan feedback berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete feedback:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus feedback.' });
  }
});

// ==========================================
// ROUTES: GALLERIES (DOKUMENTASI FOTO RELAWAN)
// ==========================================

// GET /api/galleries (Public & Admin with pagination, search, category filter)
app.get('/api/galleries', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    let whereConditions = [];
    let params = [];

    if (search && search.trim()) {
      whereConditions.push('(title LIKE ? OR description LIKE ? OR location LIKE ? OR donor_name LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    if (category && category !== 'semua') {
      whereConditions.push('category = ?');
      params.push(category);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(`SELECT COUNT(id) as total FROM galleries ${whereClause}`, params);
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM galleries ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json(formatPaginationResponse(rows, total, page, limit));
  } catch (error) {
    console.error('Error get galleries:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data galeri: ' + error.message });
  }
});

// GET /api/galleries/:id
app.get('/api/galleries/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM galleries WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Foto dokumentasi galeri tidak ditemukan.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error get gallery detail:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat foto galeri.' });
  }
});

// POST /api/galleries (Admin create gallery with image upload)
app.post('/api/galleries', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, category, date, location, description, donor_name, blood_type, image_url } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Judul dokumentasi galeri wajib diisi.' });
    }

    let finalImage = null;
    if (req.file) {
      finalImage = `/uploads-redor-obaba/${req.file.filename}`;
    } else if (image_url && image_url.trim()) {
      finalImage = image_url.trim();
    }

    const [result] = await pool.query(
      `INSERT INTO galleries (title, category, date, location, image, description, donor_name, blood_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        category || 'kegiatan',
        date ? date.trim() : null,
        location ? location.trim() : null,
        finalImage,
        description ? description.trim() : null,
        donor_name ? donor_name.trim() : null,
        blood_type ? blood_type.trim() : null,
      ]
    );

    const [created] = await pool.query('SELECT * FROM galleries WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Foto dokumentasi berhasil ditambahkan ke galeri!',
      data: created[0],
    });
  } catch (error) {
    console.error('Error create gallery:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan dokumentasi galeri: ' + error.message });
  }
});

// PUT /api/galleries/:id (Admin update gallery)
app.put('/api/galleries/:id', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, category, date, location, description, donor_name, blood_type, image_url } = req.body;
    const [existing] = await pool.query('SELECT * FROM galleries WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Dokumentasi galeri tidak ditemukan.' });
    }

    let finalImage = existing[0].image;
    if (req.file) {
      finalImage = `/uploads-redor-obaba/${req.file.filename}`;
    } else if (image_url !== undefined) {
      finalImage = image_url ? image_url.trim() : null;
    }

    await pool.query(
      `UPDATE galleries SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        date = ?,
        location = ?,
        image = ?,
        description = ?,
        donor_name = ?,
        blood_type = ?
       WHERE id = ?`,
      [
        title ? title.trim() : null,
        category || null,
        date !== undefined ? (date ? date.trim() : null) : null,
        location !== undefined ? (location ? location.trim() : null) : null,
        finalImage,
        description !== undefined ? (description ? description.trim() : null) : null,
        donor_name !== undefined ? (donor_name ? donor_name.trim() : null) : null,
        blood_type !== undefined ? (blood_type ? blood_type.trim() : null) : null,
        req.params.id,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM galleries WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      message: 'Dokumentasi galeri berhasil diperbarui!',
      data: updated[0],
    });
  } catch (error) {
    console.error('Error update gallery:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui galeri: ' + error.message });
  }
});

// DELETE /api/galleries/:id (Admin delete gallery)
app.delete('/api/galleries/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM galleries WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Dokumentasi galeri tidak ditemukan.' });
    }

    await pool.query('DELETE FROM galleries WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Dokumentasi galeri berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete gallery:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus galeri.' });
  }
});

// ==========================================
// ROUTES: BANNERS / PROMO & INFORMASI
// ==========================================

// GET /api/banners (Public for Homepage & Admin with pagination, search, status filter)
app.get('/api/banners', async (req, res) => {
  try {
    const { page, limit, search, is_active } = req.query;

    // Jika tanpa parameter pagination (panggilan publik frontend Homepage)
    if (!page && !limit && !search && is_active === undefined) {
      const [banners] = await pool.query(
        'SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, id DESC'
      );
      return res.json({ success: true, data: banners });
    }

    // Panggilan admin panel dengan pagination & filter
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM banners WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM banners WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      query += ' AND (title LIKE ? OR subtitle LIKE ? OR tag LIKE ? OR location LIKE ?)';
      countQuery += ' AND (title LIKE ? OR subtitle LIKE ? OR tag LIKE ? OR location LIKE ?)';
      params.push(s, s, s, s);
      countParams.push(s, s, s, s);
    }

    if (is_active !== undefined && is_active !== '' && is_active !== 'all') {
      const activeVal = parseInt(is_active) === 1 ? 1 : 0;
      query += ' AND is_active = ?';
      countQuery += ' AND is_active = ?';
      params.push(activeVal);
      countParams.push(activeVal);
    }

    query += ' ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [banners] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return res.json(formatPaginationResponse(banners, total, pageNum, limitNum));
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data banner promo.' });
  }
});

// GET /api/banners/:id
app.get('/api/banners/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner promo tidak ditemukan.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching banner detail:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail banner.' });
  }
});

// POST /api/banners (Admin create banner with image upload)
app.post('/api/banners', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const {
      tag,
      title,
      subtitle,
      location,
      imageUrl,
      gradient,
      link_text,
      link_url,
      is_active,
      sort_order,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Judul banner promo wajib diisi.' });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads-redor-obaba/${req.file.filename}`;
    } else if (imageUrl && imageUrl.trim()) {
      imagePath = imageUrl.trim();
    }

    const bannerTag = tag && tag.trim() ? tag.trim() : 'Info OBABA';
    const bannerGradient = gradient && gradient.trim() ? gradient.trim() : 'from-blood-950/95 via-blood-900/80 to-slate-950/85';
    const linkText = link_text && link_text.trim() ? link_text.trim() : 'Lihat Detail';
    const linkUrl = link_url && link_url.trim() ? link_url.trim() : '/schedules';
    const activeVal = is_active !== undefined ? (parseInt(is_active) === 1 ? 1 : 0) : 1;
    const sortOrderVal = sort_order ? parseInt(sort_order) : 0;

    const [result] = await pool.query(
      `INSERT INTO banners (tag, title, subtitle, location, image, gradient, link_text, link_url, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bannerTag,
        title.trim(),
        subtitle ? subtitle.trim() : null,
        location ? location.trim() : 'Kab. Tangerang',
        imagePath,
        bannerGradient,
        linkText,
        linkUrl,
        activeVal,
        sortOrderVal,
      ]
    );

    const [newBanner] = await pool.query('SELECT * FROM banners WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Banner promo berhasil ditambahkan.',
      data: newBanner[0],
    });
  } catch (error) {
    console.error('Error create banner:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan banner promo: ' + error.message });
  }
});

// PUT /api/banners/:id (Admin update banner)
app.put('/api/banners/:id', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tag,
      title,
      subtitle,
      location,
      imageUrl,
      gradient,
      link_text,
      link_url,
      is_active,
      sort_order,
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner promo tidak ditemukan.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Judul banner promo wajib diisi.' });
    }

    let imagePath = existing[0].image;
    if (req.file) {
      imagePath = `/uploads-redor-obaba/${req.file.filename}`;
    } else if (imageUrl && imageUrl.trim()) {
      imagePath = imageUrl.trim();
    }

    const bannerTag = tag !== undefined ? (tag ? tag.trim() : 'Info OBABA') : existing[0].tag;
    const bannerGradient = gradient !== undefined ? gradient : existing[0].gradient;
    const linkText = link_text !== undefined ? link_text : existing[0].link_text;
    const linkUrl = link_url !== undefined ? link_url : existing[0].link_url;
    const activeVal = is_active !== undefined ? (parseInt(is_active) === 1 ? 1 : 0) : existing[0].is_active;
    const sortOrderVal = sort_order !== undefined ? parseInt(sort_order) : existing[0].sort_order;

    await pool.query(
      `UPDATE banners SET 
        tag = ?,
        title = ?,
        subtitle = ?,
        location = ?,
        image = ?,
        gradient = ?,
        link_text = ?,
        link_url = ?,
        is_active = ?,
        sort_order = ?
       WHERE id = ?`,
      [
        bannerTag,
        title.trim(),
        subtitle !== undefined ? (subtitle ? subtitle.trim() : null) : existing[0].subtitle,
        location !== undefined ? (location ? location.trim() : null) : existing[0].location,
        imagePath,
        bannerGradient,
        linkText,
        linkUrl,
        activeVal,
        sortOrderVal,
        id,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Banner promo berhasil diperbarui.',
      data: updated[0],
    });
  } catch (error) {
    console.error('Error update banner:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui banner promo: ' + error.message });
  }
});

// PATCH /api/banners/:id/toggle (Admin quick toggle active status)
app.patch('/api/banners/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner promo tidak ditemukan.' });
    }

    const newActiveState = existing[0].is_active === 1 ? 0 : 1;
    await pool.query('UPDATE banners SET is_active = ? WHERE id = ?', [newActiveState, id]);

    res.json({
      success: true,
      message: `Banner berhasil ${newActiveState === 1 ? 'diaktifkan di beranda' : 'dinonaktifkan'}.`,
      is_active: newActiveState,
    });
  } catch (error) {
    console.error('Error toggle banner:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status banner.' });
  }
});

// DELETE /api/banners/:id (Admin delete banner)
app.delete('/api/banners/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner promo tidak ditemukan.' });
    }

    await pool.query('DELETE FROM banners WHERE id = ?', [id]);
    res.json({ success: true, message: 'Banner promo berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete banner:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus banner promo.' });
  }
});

// ==========================================
// ROUTES: ANALYTICS & DASHBOARD STATS
// ==========================================

// GET /api/analytics/dashboard
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const [totalDonorsResult] = await pool.query("SELECT COUNT(id) as count FROM users WHERE role = 'member'");
    const [readyDonorsResult] = await pool.query("SELECT COUNT(id) as count FROM users WHERE role = 'member' AND status = 'siap'");
    const [totalRequestsResult] = await pool.query('SELECT COUNT(id) as count FROM blood_requests');
    const [urgentRequestsResult] = await pool.query("SELECT COUNT(id) as count FROM blood_requests WHERE status = 'mendesak'");
    const [totalBagsResult] = await pool.query('SELECT SUM(bags) as count FROM donation_histories');

    // Top Donors Leaderboard
    const [topDonors] = await pool.query(`
      SELECT id, name, blood_type, rhesus, total_donations, city, donor_card_no
      FROM users 
      WHERE role = 'member' AND total_donations > 0 
      ORDER BY total_donations DESC, last_donation_date DESC 
      LIMIT 5
    `);

    // Blood type distribution
    const [distribution] = await pool.query(`
      SELECT CONCAT(blood_type, rhesus) as blood_group, COUNT(id) as count
      FROM users
      WHERE role = 'member'
      GROUP BY blood_type, rhesus
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        stats: {
          total_members: totalDonorsResult[0].count,
          ready_donors: readyDonorsResult[0].count,
          total_requests: totalRequestsResult[0].count,
          urgent_requests: urgentRequestsResult[0].count,
          total_bags_donated: totalBagsResult[0].count || 0,
        },
        topDonors,
        distribution,
      },
    });
  } catch (error) {
    console.error('Error get analytics:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat data statistik.' });
  }
});

// =============================================================
// WhatsApp Gateway Admin Routes (Baileys Multi-Device)
// =============================================================

// GET /api/wa-gateway/status
app.get('/api/wa-gateway/status', authenticateToken, requireAdmin, async (req, res) => {
  res.json({
    success: true,
    data: {
      status: waStatus,
      qr: waQrCode,
      phone: waConnectedPhone,
      connected: waStatus === 'connected',
    },
  });
});

// POST /api/wa-gateway/connect (Trigger fresh QR / reconnect)
app.post('/api/wa-gateway/connect', authenticateToken, requireAdmin, async (req, res) => {
  try {
    initWhatsApp(true);
    res.json({
      success: true,
      message: 'Inisialisasi koneksi WhatsApp dimulai. Silakan tunggu QR Code muncul.',
      data: { status: 'connecting' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghubungkan WhatsApp: ' + err.message });
  }
});

// POST /api/wa-gateway/disconnect
app.post('/api/wa-gateway/disconnect', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (waSocket) {
      try {
        await waSocket.logout();
      } catch (e) { }
      try {
        waSocket.ev.removeAllListeners();
        waSocket.end();
      } catch (e) { }
      waSocket = null;
    }
    waStatus = 'disconnected';
    waConnectedPhone = null;
    waQrCode = null;

    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    } catch (e) { }

    res.json({ success: true, message: 'WhatsApp Gateway berhasil diputuskan dan sesi dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memutuskan sesi: ' + err.message });
  }
});

// POST /api/wa-gateway/test-send
app.post('/api/wa-gateway/test-send', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Nomor telepon dan pesan wajib diisi.' });
    }

    if (waStatus !== 'connected') {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp Gateway belum terhubung. Silakan scan QR Code terlebih dahulu.',
      });
    }

    const result = await sendWhatsAppNotification(phone, message);
    if (result.success) {
      res.json({ success: true, message: 'Pesan tes WhatsApp berhasil terkirim!' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal mengirim pesan: ' + (result.error || result.message) });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Kesalahan pengiriman: ' + err.message });
  }
});

// POST /api/blood-requests/:id/broadcast-wa (Auto broadcast to compatible ready donors)
app.post('/api/blood-requests/:id/broadcast-wa', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [requests] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [req.params.id]);
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Permintaan darah tidak ditemukan.' });
    }
    const request = requests[0];

    const compatibleTypes = getCompatibleBloodTypes(request.blood_type, request.rhesus);
    let typeConditions = compatibleTypes.map(() => '(blood_type = ? AND rhesus = ?)').join(' OR ');
    let typeParams = [];
    compatibleTypes.forEach((t) => typeParams.push(t.type, t.rhesus));

    const [matchingDonors] = await pool.query(
      `SELECT id, name, phone, blood_type, rhesus, city
       FROM users
       WHERE role = 'member' AND status = 'siap' AND (${typeConditions})
       ORDER BY (blood_type = '${request.blood_type}' AND rhesus = '${request.rhesus}') DESC`,
      typeParams
    );

    if (matchingDonors.length === 0) {
      return res.json({
        success: true,
        sentCount: 0,
        message: 'Tidak ada pendonor berstatus siap yang cocok untuk golongan darah ini saat ini.',
      });
    }

    if (waStatus !== 'connected') {
      return res.json({
        success: false,
        isWaOffline: true,
        matchingCount: matchingDonors.length,
        message: 'WhatsApp Gateway belum terhubung di server. Silakan hubungkan WhatsApp di menu Admin WA Gateway untuk mengirim notifikasi otomatis.',
      });
    }

    // Format broadcast text with custom message if provided
    const { customMessage } = req.body;
    const updateDate = new Date(request.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Run async loop in background with 2.5s safe delay
    let sentCount = 0;
    (async () => {
      for (const donor of matchingDonors) {
        if (!donor.phone) continue;
        const personalizedMsg = customMessage
          ? `Halo Kak ${donor.name},\n${customMessage}`
          : `[PANGGILAN DARURAT DONOR DARAH]
Komunitas Redor OBABA

Halo Kak *${donor.name}*, salam kemanusiaan.
Saat ini ada pasien yang sangat membutuhkan bantuan donor darah sukarela:

👤 *Pasien:* ${request.patient_name} (${request.patient_age} Th)
🩸 *Golongan Darah:* ${request.blood_type} (${request.rhesus === '-' ? 'Rh-' : 'Rh+'})
💉 *Komponen:* ${request.blood_component}
📦 *Kebutuhan:* ${request.bags_needed - (request.bags_fulfilled || 0)} Kantong lagi
🏥 *Lokasi RS:* ${request.hospital_name} ${request.hospital_room ? `(${request.hospital_room})` : ''}
⚠️ *Diagnosis:* ${request.diagnosis}

Apakah Kakak bersedia membantu pasien hari ini?
Konfirmasi respon kesediaan Anda langsung melalui tautan berikut:
https://dor-obaba.vercel.app/confirm-request/${request.id}

Atau hubungi Penanggung Jawab (${request.cp_name}): wa.me/${request.cp_phone.replace(/\D/g, '').startsWith('0') ? '62' + request.cp_phone.replace(/\D/g, '').slice(1) : request.cp_phone.replace(/\D/g, '')}

_Pesan otomatis resmi dari Sistem Komunitas Redor OBABA. 100% Gratis & Bebas Biaya._`;

        try {
          await sendWhatsAppNotification(donor.phone, personalizedMsg);
          sentCount++;
          // Safe delay between messages
          await new Promise((r) => setTimeout(r, 2500));
        } catch (e) {
          console.error(`[WA Gateway Broadcast] Failed for ${donor.name}:`, e.message);
        }
      }
      console.log(`[WA Gateway Broadcast] Finished sending to ${sentCount}/${matchingDonors.length} donors for Request #${request.id}`);
    })();

    res.json({
      success: true,
      matchingCount: matchingDonors.length,
      message: `Proses pengiriman notifikasi WhatsApp ke ${matchingDonors.length} relawan donor yang cocok sedang berjalan di latar belakang.`,
    });
  } catch (err) {
    console.error('Error in WA broadcast:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses broadcast: ' + err.message });
  }
});

// Root & Health Check
app.get('/', (req, res) => {
  res.json({
    app: 'REDOR OBABA - Backend API',
    status: 'online',
    version: '1.0.0',
    community: 'Komunitas Donor Darah Redor OBABA',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled API error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`🚀 Redor OBABA Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
  console.log(`📁 Uploads dir: ${uploadDir}`);
  console.log(`=========================================`);
  await initDatabaseTables();
});

