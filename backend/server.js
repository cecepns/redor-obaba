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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'redor_obaba_secret_key_2026';

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const donorCardNo = 'OBABA-' + Math.floor(100000 + Math.random() * 900000);

    // Initial status based on last donation date
    let status = 'siap';
    if (last_donation_date) {
      const eligibility = calculateDonorEligibility(last_donation_date);
      if (!eligibility.isEligible) status = 'belum_bisa';
    }

    const [result] = await pool.query(
      `INSERT INTO users (name, phone, email, password, blood_type, rhesus, birth_date, gender, address, city, last_donation_date, status, donor_card_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, email || null, hashedPassword, blood_type, rhesus || '+', birth_date || null, gender || 'L', address || null, city || 'Kab. Tangerang', last_donation_date || null, status, donorCardNo]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, phone, role: 'member', name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Pendaftaran anggota berhasil! Selamat bergabung di Komunitas Redor OBABA.',
      token,
      user: {
        id: userId,
        name,
        phone,
        email,
        blood_type,
        rhesus: rhesus || '+',
        role: 'member',
        status,
        donor_card_no: donorCardNo,
      },
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
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Akun tidak ditemukan. Silakan periksa kembali no WhatsApp atau daftar.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Kata sandi tidak sesuai.' });
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

// PUT /api/auth/profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, blood_type, rhesus, birth_date, gender, address, city, last_donation_date, status } = req.body;

    let newStatus = status;
    if (last_donation_date && status !== 'tidak_tersedia') {
      const eligibility = calculateDonorEligibility(last_donation_date);
      newStatus = eligibility.isEligible ? 'siap' : 'belum_bisa';
    }

    await pool.query(
      `UPDATE users SET
        name = COALESCE(?, name),
        email = ?,
        blood_type = COALESCE(?, blood_type),
        rhesus = COALESCE(?, rhesus),
        birth_date = ?,
        gender = COALESCE(?, gender),
        address = ?,
        city = COALESCE(?, city),
        last_donation_date = ?,
        status = COALESCE(?, status)
       WHERE id = ?`,
      [name, email || null, blood_type, rhesus, birth_date || null, gender, address || null, city, last_donation_date || null, newStatus, req.user.id]
    );

    const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = updated[0];
    delete user.password;
    const eligibility = calculateDonorEligibility(user.last_donation_date);

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
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
${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm-request/${request.id}`;

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
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Redor OBABA Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
  console.log(`📁 Uploads dir: ${uploadDir}`);
  console.log(`=========================================`);
});
