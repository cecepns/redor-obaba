-- ==========================================================
-- Database Schema for REDOR OBABA - Komunitas Donor Darah
-- Tech Stack: Express.js + MySQL
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `redor_obaba` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `redor_obaba`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `feedbacks`;
DROP TABLE IF EXISTS `donation_histories`;
DROP TABLE IF EXISTS `blood_request_responses`;
DROP TABLE IF EXISTS `blood_requests`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `activities`;
DROP TABLE IF EXISTS `hospitals`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table (Anggota, Donor & Admin)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(25) NOT NULL UNIQUE,
  `email` VARCHAR(150) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `blood_type` ENUM('A', 'B', 'AB', 'O') NOT NULL,
  `rhesus` ENUM('+', '-') NOT NULL DEFAULT '+',
  `birth_date` DATE DEFAULT NULL,
  `gender` ENUM('L', 'P') DEFAULT 'L',
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT 'Kab. Tangerang',
  `last_donation_date` DATE DEFAULT NULL,
  `total_donations` INT DEFAULT 0,
  `status` ENUM('siap', 'belum_bisa', 'tidak_tersedia') NOT NULL DEFAULT 'siap',
  `role` ENUM('member', 'admin') NOT NULL DEFAULT 'member',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `donor_card_no` VARCHAR(50) DEFAULT NULL UNIQUE,
  `is_verified` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Blood Requests Table (Permintaan Darah)
CREATE TABLE `blood_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `patient_name` VARCHAR(150) NOT NULL,
  `patient_age` INT NOT NULL,
  `hospital_name` VARCHAR(180) NOT NULL,
  `hospital_room` VARCHAR(100) DEFAULT NULL,
  `patient_address` TEXT DEFAULT NULL,
  `blood_type` ENUM('A', 'B', 'AB', 'O') NOT NULL,
  `rhesus` ENUM('+', '-') NOT NULL DEFAULT '+',
  `blood_component` ENUM('WB', 'PRC', 'TC', 'FFP', 'CRYO', 'LAINNYA') NOT NULL DEFAULT 'PRC',
  `bags_needed` INT NOT NULL DEFAULT 1,
  `bags_fulfilled` INT NOT NULL DEFAULT 0,
  `diagnosis` VARCHAR(255) NOT NULL,
  `cp_name` VARCHAR(150) NOT NULL,
  `cp_phone` VARCHAR(25) NOT NULL,
  `cp_relation` VARCHAR(100) NOT NULL,
  `emergency_note` TEXT DEFAULT NULL,
  `status` ENUM('mendesak', 'berjalan', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'mendesak',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Blood Request Responses Table (Konfirmasi Respons Donor)
CREATE TABLE `blood_request_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_id` INT NOT NULL,
  `donor_id` INT NOT NULL,
  `response_status` ENUM('bisa', 'tidak_bisa', 'sudah_donor') NOT NULL,
  `note` VARCHAR(255) DEFAULT NULL,
  `responded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`request_id`) REFERENCES `blood_requests` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_request_donor` (`request_id`, `donor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Donation Histories Table (Riwayat Donor Anggota)
CREATE TABLE `donation_histories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `request_id` INT DEFAULT NULL,
  `donation_date` DATE NOT NULL,
  `location` VARCHAR(180) NOT NULL,
  `bags` INT DEFAULT 1,
  `blood_component` ENUM('WB', 'PRC', 'TC', 'FFP', 'CRYO') DEFAULT 'WB',
  `certificate_number` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`request_id`) REFERENCES `blood_requests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Activities / Berita & Edukasi Table
CREATE TABLE `activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `category` ENUM('berita', 'kegiatan', 'edukasi', 'pengumuman') NOT NULL DEFAULT 'kegiatan',
  `summary` TEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `event_date` DATE DEFAULT NULL,
  `location` VARCHAR(180) DEFAULT NULL,
  `author_id` INT DEFAULT NULL,
  `is_published` TINYINT(1) DEFAULT 1,
  `views_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Schedules Table (Jadwal Mobil Unit & Agenda Donor Darah)
CREATE TABLE `schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `organizer` VARCHAR(150) NOT NULL,
  `location` VARCHAR(200) NOT NULL,
  `address` TEXT DEFAULT NULL,
  `date` DATE NOT NULL,
  `start_time` VARCHAR(10) NOT NULL,
  `end_time` VARCHAR(10) NOT NULL,
  `target_bags` INT DEFAULT 50,
  `contact_person` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('akan_datang', 'berlangsung', 'selesai', 'dibatalkan') DEFAULT 'akan_datang',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Hospitals & Ambulance Directory
CREATE TABLE `hospitals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(180) NOT NULL,
  `type` ENUM('rs_umum', 'rsud', 'rs_khusus', 'klinik', 'pmi', 'ambulance') NOT NULL DEFAULT 'rs_umum',
  `address` TEXT NOT NULL,
  `city` VARCHAR(100) DEFAULT 'Tangerang',
  `phone` VARCHAR(50) NOT NULL,
  `emergency_phone` VARCHAR(50) DEFAULT NULL,
  `ambulance_phone` VARCHAR(50) DEFAULT NULL,
  `maps_url` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Feedbacks / Kritik & Saran
CREATE TABLE `feedbacks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `category` ENUM('kritik', 'saran', 'pertanyaan', 'apresiasi') NOT NULL DEFAULT 'saran',
  `message` TEXT NOT NULL,
  `rating` INT DEFAULT 5,
  `reply` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'dibalas', 'arsip') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- SAMPLE SEED DATA
-- Default Password for users: "password123"
-- (bcrypt hash: $2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa)
-- ==========================================================

INSERT INTO `users` (`id`, `name`, `phone`, `email`, `password`, `blood_type`, `rhesus`, `birth_date`, `gender`, `address`, `city`, `last_donation_date`, `total_donations`, `status`, `role`, `donor_card_no`, `is_verified`) VALUES
(1, 'Administrator Redor OBABA', '081234567890', 'admin@redorobaba.org', '$2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa', 'O', '+', '1990-05-15', 'L', 'Sekretariat OBABA, Banten', 'Kab. Tangerang', '2026-05-10', 18, 'siap', 'admin', 'OBABA-ADM-001', 1),
(2, 'Cecep Supriatna', '081298765432', 'cecep@example.com', '$2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa', 'A', '+', '1995-08-20', 'L', 'Jl. Raya Cisauk No. 12', 'Kab. Tangerang', '2026-05-01', 8, 'siap', 'member', 'OBABA-DNR-002', 1),
(3, 'Ahmad Fauzi', '081311223344', 'ahmad.fauzi@example.com', '$2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa', 'B', '+', '1992-03-10', 'L', 'Perumahan Suradita Indah', 'Kab. Tangerang', '2026-08-15', 5, 'belum_bisa', 'member', 'OBABA-DNR-003', 1),
(4, 'Siti Rahmawati', '081355667788', 'siti.rahma@example.com', '$2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa', 'AB', '+', '1998-11-25', 'P', 'Jl. Raya Serpong BSD', 'Tangerang Selatan', '2026-04-12', 4, 'siap', 'member', 'OBABA-DNR-004', 1),
(5, 'Budi Santoso', '081299887766', 'budi.santoso@example.com', '$2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa', 'O', '+', '1988-02-14', 'L', 'Kel. Cikupa Makmur', 'Kab. Tangerang', '2026-05-18', 12, 'siap', 'member', 'OBABA-DNR-005', 1),
(6, 'Dewi Lestari', '081233445566', 'dewi.lestari@example.com', '$2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa', 'A', '-', '1994-07-08', 'P', 'Kec. Balaraja Barat', 'Kab. Tangerang', '2026-05-20', 3, 'siap', 'member', 'OBABA-DNR-006', 1),
(7, 'Rian Pratama', '081277665544', 'rian.pratama@example.com', '$2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa', 'O', '-', '1996-09-30', 'L', 'Tigaraksa Residence', 'Kab. Tangerang', '2026-05-25', 6, 'siap', 'member', 'OBABA-DNR-007', 1),
(8, 'dr. Hendra Kusuma', '081266554433', 'hendra@example.com', '$2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa', 'B', '-', '1987-12-05', 'L', 'Perumahan Gading Serpong', 'Tangerang', '2026-08-01', 9, 'belum_bisa', 'member', 'OBABA-DNR-008', 1),
(9, 'Nurul Hidayah', '081399881122', 'nurul.h@example.com', '$2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa', 'AB', '-', '2000-01-19', 'P', 'Curug Kulon', 'Kab. Tangerang', '2026-04-05', 2, 'siap', 'member', 'OBABA-DNR-009', 1),
(10, 'Fajar Nugraha', '081344556677', 'fajar@example.com', '$2a$10$QDZuShw2TA2H41Vrf2FkIeKodSFy4PUSMio6u.tBnRghsFNkzJwQa', 'A', '+', '1991-06-17', 'L', 'Pasar Kemis Indah', 'Kab. Tangerang', '2026-05-15', 7, 'siap', 'member', 'OBABA-DNR-010', 1);

-- Sample Blood Requests
INSERT INTO `blood_requests` (`id`, `user_id`, `patient_name`, `patient_age`, `hospital_name`, `hospital_room`, `patient_address`, `blood_type`, `rhesus`, `blood_component`, `bags_needed`, `bags_fulfilled`, `diagnosis`, `cp_name`, `cp_phone`, `cp_relation`, `emergency_note`, `status`) VALUES
(1, 2, 'Ibu Hj. Aminah', 58, 'RSUD Balaraja Tangerang', 'Ruang ICU Lt. 2 Bed 04', 'Jl. Raya Kresek, Ds. Saga, Balaraja', 'A', '+', 'PRC', 3, 1, 'Pendarahan Lambung Akut & Anemia Berat', 'H. Sulaeman', '081288990011', 'Suami', 'Memerlukan transfusi cepat sebelum tindakan endoskopi darurat malam ini.', 'mendesak'),
(2, 3, 'Ananda Rizky Saputra', 9, 'RS Permata Hati Cikupa', 'Ruang Melati Anak 102', 'Cikupa Asri Blok C4 No. 12', 'O', '+', 'WB', 2, 2, 'Thalassemia Mayor Rutin Transfusi', 'Ibu Maya', '081377889900', 'Ibu Kandung', 'Alhamdulillah donor dari OBABA sudah mendampingi di lab PMI.', 'selesai'),
(3, 4, 'Bpk. Herman Wijaya', 45, 'RS Siloam Lippo Village Karawaci', 'Ruang Perawatan 508', 'Kelapa Dua, Kab. Tangerang', 'B', '+', 'TC', 4, 0, 'Demam Berdarah Dengue (Trombosit Kritis)', 'Rina Wijaya', '081233221100', 'Anak', 'Trombosit turun ke 18.000, butuh pendonor trombosit konsentrat segera.', 'mendesak');

-- Sample Responses
INSERT INTO `blood_request_responses` (`request_id`, `donor_id`, `response_status`, `note`, `responded_at`) VALUES
(1, 2, 'bisa', 'Siap merapat ke UDD PMI Tangerang jam 14:00', NOW()),
(1, 10, 'tidak_bisa', 'Sedang dinas luar kota sampai lusa', NOW()),
(2, 5, 'sudah_donor', 'Donasi sukses di RS Permata Hati 350cc', NOW());

-- Sample Donation History
INSERT INTO `donation_histories` (`user_id`, `request_id`, `donation_date`, `location`, `bags`, `blood_component`, `certificate_number`, `notes`) VALUES
(2, 1, '2026-05-01', 'UDD PMI Kab. Tangerang', 1, 'WB', 'OBB-DNR-20260501-01', 'Donor darah rutin di event PMI'),
(3, NULL, '2026-08-15', 'Mall Ciputra Tangerang (Bakti Sosial)', 1, 'WB', 'OBB-DNR-20260815-04', 'Donor darah kegiatan komunitas OBABA'),
(5, 2, '2026-05-18', 'RS Permata Hati Cikupa', 1, 'WB', 'OBB-DNR-20260518-09', 'Donor pengganti untuk pasien anak Thalassemia');

-- Sample Activities / Berita & Edukasi
INSERT INTO `activities` (`id`, `title`, `slug`, `category`, `summary`, `content`, `image`, `event_date`, `location`, `author_id`, `is_published`, `views_count`) VALUES
(1, 'Layanan Pengantaran Darah Berbasis Aplikasi JEKDON & Redor OBABA', 'layanan-pengantaran-darah-jekdon', 'berita', 'Kolaborasi strategis penyediaan armada motor siaga pengantar kantong darah aman dan cepat ke seluruh RS wilayah Tangerang.', '<p>Komunitas Donor Darah Redor OBABA bersama jejaring relawan meluncurkan inisiatif percepatan distribusi darah berpendingin standar medis. Armada siaga ini siap menjemput calon donor atau mengantar sampel darah ke laboratorium PMI terdekat demi menyelamatkan nyawa pasien kritis tepat waktu.</p><p>Program ini gratis 100% dan didukung sepenuhnya oleh sumbangsih relawan kemanusiaan.</p>', '/uploads-redor-obaba/jekdon-news.jpg', '2026-08-25', 'Kabupaten Tangerang', 1, 1, 342),
(2, 'PMI Provinsi Banten Perkuat Jejaring Layanan Darah Bersama Komunitas', 'pmi-banten-perkuat-jejaring-layanan-darah', 'kegiatan', 'Rapat koordinasi jejaring donor darah sukarela dan sinkronisasi sistem respon cepat darurat komunitas.', '<p>Palang Merah Indonesia bersama perwakilan koordinator donor darah Redor OBABA membahas optimalisasi ketersediaan stok darah langka (Rhesus Negatif) dan percepatan notifikasi darurat berbasis digital dan pesan instan.</p><p>Ketua UDD mengapresiasi dedikasi komunitas yang selalu sigap merespon pasien darurat di rumah sakit daerah.</p>', '/uploads-redor-obaba/pmi-banten.jpg', '2026-08-28', 'Aula PMI Provinsi Banten', 1, 1, 518),
(3, 'Panduan Lengkap: Syarat & Tips Sebelum Melakukan Donor Darah', 'panduan-lengkap-syarat-donor-darah', 'edukasi', 'Ketahui persiapan penting seperti istirahat cukup, konsumsi air, dan pantangan obat sebelum berdonor.', '<p>Menjadi pendonor darah adalah aksi mulia. Sebelum berdonor, pastikan berat badan minimal 45kg, tekanan darah stabil (sistole 100-160, diastole 70-100), kadar Hb minimal 12.5 g/dl, dan jeda minimal 3 bulan sejak donor terakhir.</p><p>Hindari makanan berlemak tinggi 3 jam sebelum donor dan minumlah banyak air putih!</p>', '/uploads-redor-obaba/edukasi-donor.jpg', '2026-09-01', 'Online Edukasi', 1, 1, 210);

-- Sample Schedules
INSERT INTO `schedules` (`id`, `title`, `organizer`, `location`, `address`, `date`, `start_time`, `end_time`, `target_bags`, `contact_person`, `status`, `notes`) VALUES
(1, 'Aksi Donor Darah Peduli Sesama OBABA & RSUD', 'Komunitas Redor OBABA x RSUD Balaraja', 'Atrium Mall Ciputra CitraRaya', 'Jl. Citra Raya Utama, Cikupa, Tangerang', '2026-09-12', '09:00', '14:00', 100, 'Kang Hendra (081234567890)', 'akan_datang', 'Disediakan souvenir eksklusif, snack bergizi, dan pemeriksaan kesehatan gratis (gula darah & tensi).'),
(2, 'Mobil Unit Donor Darah PMI Kantor Kecamatan Cisauk', 'UDD PMI Tangerang x Komunitas', 'Halaman Kantor Camat Cisauk', 'Jl. Raya Cisauk Lapan No. 1', '2026-09-20', '08:30', '13:00', 60, 'Sekretariat OBABA (081298765432)', 'akan_datang', 'Terbuka untuk umum. Membawa KTP / Kartu Donor OBABA.');

-- Sample Hospitals & Emergency Contacts
INSERT INTO `hospitals` (`id`, `name`, `type`, `address`, `city`, `phone`, `emergency_phone`, `ambulance_phone`, `maps_url`) VALUES
(1, 'UDD Palang Merah Indonesia (PMI) Kab. Tangerang', 'pmi', 'Jl. Raya Pemda Tigaraksa, Sukamulya', 'Kab. Tangerang', '021-5991234', '021-5991235', '118 / 021-5991236', 'https://maps.google.com'),
(2, 'RSUD Balaraja Tangerang', 'rsud', 'Jl. Raya Serang Km 25, Tobat, Balaraja', 'Kab. Tangerang', '021-5951851', '021-5951852', '0812-1111-2222', 'https://maps.google.com'),
(3, 'RS Permata Hati Cikupa', 'rs_umum', 'Jl. Raya Serang Km 14.5 No. 9, Cikupa', 'Kab. Tangerang', '021-5960000', '021-5960001', '0813-2222-3333', 'https://maps.google.com'),
(4, 'RS Siloam Hospitals Lippo Village', 'rs_umum', 'Jl. Siloam No. 6, Lippo Karawaci', 'Tangerang', '021-80646900', '021-5460055', '1-500-911', 'https://maps.google.com'),
(5, 'Layanan Ambulans Siaga & Mobil Jenazah OBABA', 'ambulance', 'Posko Relawan OBABA Tangerang', 'Kab. Tangerang', '0812-3456-7890', '0812-3456-7890', '0812-3456-7890', 'https://maps.google.com');

-- Sample Feedbacks
INSERT INTO `feedbacks` (`user_id`, `name`, `phone`, `category`, `message`, `rating`, `reply`, `status`) VALUES
(2, 'Cecep Supriatna', '081298765432', 'apresiasi', 'Aplikasi Redor OBABA sangat membantu! Permintaan darah keluarga saya langsung direspon cepat oleh pendonor.', 5, 'Terima kasih atas dukungannya! Semoga lekas pulih untuk keluarga.', 'dibalas'),
(3, 'Ahmad Fauzi', '081311223344', 'saran', 'Mohon ditambahkan fitur notifikasi alarm pengingat saat masa jeda 3 bulan selesai.', 5, NULL, 'pending');
