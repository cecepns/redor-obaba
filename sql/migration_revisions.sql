-- ==========================================================
-- SQL Migration Script for REDOR OBABA Revisions & Features
-- Target Database: redor_obaba
-- ==========================================================
-- PANDUAN:
-- Anda bisa copy semua baris di file ini dan langsung paste di:
-- 1. phpMyAdmin (tab SQL)
-- 2. DBeaver / Navicat / TablePlus / HeidiSQL
-- 3. Terminal MySQL CLI
-- ==========================================================

USE `redor_obaba`;

-- ----------------------------------------------------------
-- 1. Buat Tabel `galleries` (Jika belum ada)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `galleries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` ENUM('relawan', 'kegiatan', 'penghargaan', 'lainnya') NOT NULL DEFAULT 'kegiatan',
  `date` VARCHAR(100) DEFAULT NULL,
  `location` VARCHAR(200) DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `donor_name` VARCHAR(150) DEFAULT NULL,
  `blood_type` VARCHAR(10) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 2. Buat Tabel `password_resets` (Untuk Reset Password Nodemailer)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL,
  `otp` VARCHAR(10) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pwd_resets_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 3. Buat Tabel `banners` (Untuk Promo & Informasi Carousel Beranda)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tag` VARCHAR(100) NOT NULL DEFAULT 'Info OBABA',
  `title` VARCHAR(255) NOT NULL,
  `subtitle` TEXT DEFAULT NULL,
  `location` VARCHAR(150) DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `gradient` VARCHAR(150) DEFAULT 'from-blood-950/95 via-blood-900/80 to-slate-950/85',
  `link_text` VARCHAR(100) DEFAULT 'Lihat Detail',
  `link_url` VARCHAR(255) DEFAULT '/schedules',
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 4. Data Awal Contoh untuk Galeri Kegiatan & Banner Promo
-- ----------------------------------------------------------
INSERT IGNORE INTO `banners` (`id`, `tag`, `title`, `subtitle`, `location`, `image`, `gradient`, `link_text`, `link_url`, `is_active`, `sort_order`) VALUES
(1, 'HUT & Semangat Kemanusiaan', 'Dirgahayu Republik Indonesia Ke-81', 'Indonesia Berdaulat, Adil dan Makmur Bersama Aksi Donor Darah Relawan Redor OBABA', 'Kab. Tangerang', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', 'from-blood-950/95 via-blood-900/80 to-slate-950/85', 'Jadwal Donor', '/schedules', 1, 1),
(2, 'Layanan Cepat Relawan', 'Layanan Pengantaran & Respons Darah JEKDON', 'Jejaring respon cepat butuh darah darurat berbasis komunitas siaga 24 jam gratis.', 'Unit OBABA', 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80', 'from-slate-950/95 via-blood-950/80 to-slate-900/85', 'Butuh Darah', '/requests', 1, 2),
(3, 'Galeri Pahlawan Donor', 'Setetes Darah Kita, Sejuta Harapan Sesama', 'Terima kasih atas ketulusan hati para pendonor sukarela yang telah menyelamatkan ribuan pasien.', 'UDD PMI', 'https://images.unsplash.com/photo-1579152276508-410a56249be5?auto=format&fit=crop&w=1200&q=80', 'from-amber-950/95 via-slate-950/80 to-blood-950/85', 'Galeri Foto', '/gallery', 1, 3),
(4, 'Edukasi Kesehatan', 'Ayo Donor Darah Rutin Setiap 3 Bulan', 'Tubuh lebih sehat, regenerasi sel darah baru, dan pahala kebaikan yang terus mengalir.', 'Sentra Tangerang', 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80', 'from-sky-950/95 via-slate-950/80 to-slate-900/85', 'Edukasi Donor', '/activities', 1, 4);
INSERT IGNORE INTO `galleries` (`id`, `title`, `category`, `date`, `location`, `image`, `description`, `donor_name`, `blood_type`) VALUES
(1, 'Aksi Donor Darah Relawan OBABA Balaraja', 'kegiatan', '15 Agustus 2026', 'Balaraja, Kab. Tangerang', 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80', 'Pendonor sukarela antusias mendonorkan darah demi menolong pasien darurat di RSUD Balaraja.', 'Relawan Redor OBABA', 'O+'),
(2, 'Aksi Tanggap Darurat PRC untuk Pasien Anak', 'relawan', '28 Juli 2026', 'Tigaraksa, Kab. Tangerang', 'https://images.unsplash.com/photo-1579152276508-410a56249be5?auto=format&fit=crop&w=800&q=80', 'Respons cepat relawan golongan darah A+ langsung mendonorkan darah di Unit Transfusi Darah.', 'Ahmad Fauzi & Tim', 'A+'),
(3, 'Sosialisasi & Donor Darah Bersama Pemuda Desa', 'kegiatan', '10 Juli 2026', 'Cikupa, Kab. Tangerang', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', 'Edukasi pentingnya donor darah rutin dan pendaftaran 50 pendonor darah pemula baru.', 'Komunitas Pemuda Cikupa', 'B+'),
(4, 'Pemberian Apresiasi Pendonor Rutin Ke-10', 'penghargaan', '01 Juni 2026', 'Sekretariat Redor OBABA', 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80', 'Penyerahan piagam terima kasih kepada pejuang kemanusiaan yang konsisten donor darah setiap 3 bulan.', 'Budi Santoso', 'AB+'),
(5, 'Mobil Unit Donor Darah Keliling', 'kegiatan', '20 Mei 2026', 'Pasar Kemis, Kab. Tangerang', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', 'Layanan jemput bola mobil donor darah bekerja sama dengan PMI untuk menjangkau masyarakat pelosok.', 'Tim Medis & Relawan', 'O-'),
(6, 'Relawan Donor Trombosit Apheresis', 'relawan', '05 Mei 2026', 'RSUD Kabupaten Tangerang', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', 'Dedikasi luar biasa relawan pendonor TC khusus untuk pasien demam berdarah kondisi kritis.', 'Siti Rahmawati', 'B+');

-- ----------------------------------------------------------
-- 4. Tambah Kolom ke Tabel `users` (Aman jika kolom sudah ada)
-- ----------------------------------------------------------
DROP PROCEDURE IF EXISTS `AddColumnIfNotExists`;

DELIMITER $$
CREATE PROCEDURE `AddColumnIfNotExists`()
BEGIN
    -- Tambah total_donations jika belum ada
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'total_donations'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `total_donations` INT DEFAULT 0 AFTER `last_donation_date`;
    END IF;

    -- Tambah donor_card_no jika belum ada
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'donor_card_no'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `donor_card_no` VARCHAR(50) DEFAULT NULL AFTER `avatar`;
    END IF;

    -- Tambah is_verified jika belum ada (default 1 untuk user eksisting)
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_verified'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `is_verified` TINYINT(1) DEFAULT 1 AFTER `donor_card_no`;
    END IF;
END$$
DELIMITER ;

CALL `AddColumnIfNotExists`();
DROP PROCEDURE IF EXISTS `AddColumnIfNotExists`;

-- ----------------------------------------------------------
-- 5. Rapikan Nomor Anggota Lama Menjadi Sekuensial obaba-1, obaba-2, dst
-- ----------------------------------------------------------
SET @num := 0;
UPDATE `users` 
SET `donor_card_no` = CONCAT('obaba-', (@num := @num + 1))
WHERE `role` != 'admin' AND (`donor_card_no` IS NULL OR `donor_card_no` LIKE 'OBABA-%' OR `donor_card_no` REGEXP '^obaba-[0-9]{5,}$')
ORDER BY `id` ASC;

-- Selesai
SELECT 'Migration completed successfully for REDOR OBABA' AS status;
