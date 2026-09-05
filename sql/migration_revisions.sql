-- ==========================================================
-- SQL Migration Script for REDOR OBABA Revisions & Features
-- Target Database: redor_obaba
-- ==========================================================

USE `redor_obaba`;

-- 1. Pastikan kolom total_donations, donor_card_no, dan is_verified ada pada tabel users
-- Menggunakan stored procedure aman agar tidak terjadi duplicate column error

DROP PROCEDURE IF EXISTS `MigrateRedorObabaRevisions`;

DELIMITER $$
CREATE PROCEDURE `MigrateRedorObabaRevisions`()
BEGIN
    -- 1. Kolom total_donations pada tabel users
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'total_donations'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `total_donations` INT DEFAULT 0 AFTER `last_donation_date`;
    END IF;

    -- 2. Kolom donor_card_no pada tabel users
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'donor_card_no'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `donor_card_no` VARCHAR(50) DEFAULT NULL AFTER `avatar`;
    END IF;

    -- 3. Kolom is_verified pada tabel users
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_verified'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `is_verified` TINYINT(1) DEFAULT 1 AFTER `donor_card_no`;
    END IF;

    -- 4. Optimasi index untuk query pencarian donor siap & stok
    IF NOT EXISTS (
        SELECT * FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_blood_status'
    ) THEN
        ALTER TABLE `users` ADD INDEX `idx_users_blood_status` (`blood_type`, `rhesus`, `status`, `role`);
    END IF;

    -- 5. Optimasi index untuk permohonan darah mendesak
    IF NOT EXISTS (
        SELECT * FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blood_requests' AND INDEX_NAME = 'idx_requests_status'
    ) THEN
        ALTER TABLE `blood_requests` ADD INDEX `idx_requests_status` (`status`, `blood_type`, `rhesus`);
    END IF;

END$$
DELIMITER ;

-- Jalankan Migration
CALL `MigrateRedorObabaRevisions`();

-- Hapus temporary procedure setelah eksekusi
DROP PROCEDURE IF EXISTS `MigrateRedorObabaRevisions`;

-- Selesai
SELECT 'Migration completed successfully for REDOR OBABA' AS status;
