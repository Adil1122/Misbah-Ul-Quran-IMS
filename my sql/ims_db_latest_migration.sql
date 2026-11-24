-- ==============================================================================
-- MISBAH-UL-QURAN IMS — MYSQL / HOSTINGER PRODUCTION MIGRATION SCRIPT
-- ==============================================================================
-- Compatible with MySQL 8.0+ and MariaDB 10.4+ (Hostinger phpMyAdmin / MySQL)
-- Upgrades existing `ims_db.sql` with multi-campus architecture, strict teacher
-- attendance time rules, student arrival times, and administrative audit logging.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- 1. CAMPUSES TABLE (UK & KTS Pakistan)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `campuses` (
  `id` varchar(36) NOT NULL,
  `code` varchar(30) NOT NULL,
  `name` varchar(150) NOT NULL,
  `country` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `timezone` varchar(50) NOT NULL DEFAULT 'Asia/Karachi',
  `currency_code` varchar(10) NOT NULL DEFAULT 'PKR',
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_campus_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Base Campuses
INSERT IGNORE INTO `campuses` (`id`, `code`, `name`, `country`, `city`, `address`, `timezone`, `currency_code`, `phone`, `email`) VALUES
('c1111111-1111-1111-1111-111111111111', 'UK-01', 'UK Campus', 'United Kingdom', 'London', '124 High Road, Ilford, London IG1 1BY', 'Europe/London', 'GBP', '+44 20 7946 0991', 'info.uk@misbahulquran.org'),
('c2222222-2222-2222-2222-222222222222', 'KTS-01', 'KTS Pakistan Campus', 'Pakistan', 'Haripur', 'Main KTS Road, Sector 3, Haripur, KPK', 'Asia/Karachi', 'PKR', '+92 995 611234', 'info.kts@misbahulquran.org');

-- --------------------------------------------------------
-- 2. CLASS TEACHERS JUNCTION TABLE (Assigned classes for Teacher Portal)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `class_teachers` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `is_lead` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_class_teacher` (`class_id`, `teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. UPGRADE STUDENT ATTENDANCES TABLE
-- --------------------------------------------------------
-- Add new fields safely if not already present
SET @dbname = DATABASE();
SET @tablename = "student_attendances";

-- Add arrival_time
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "arrival_time") > 0,
  "SELECT 1",
  "ALTER TABLE `student_attendances` ADD COLUMN `arrival_time` varchar(20) NULL DEFAULT NULL AFTER `status`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add campus_id
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "campus_id") > 0,
  "SELECT 1",
  "ALTER TABLE `student_attendances` ADD COLUMN `campus_id` varchar(36) NULL DEFAULT 'c2222222-2222-2222-2222-222222222222' AFTER `student_id`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add recorded_by
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "recorded_by") > 0,
  "SELECT 1",
  "ALTER TABLE `student_attendances` ADD COLUMN `recorded_by` varchar(100) NULL DEFAULT 'Teacher' AFTER `remarks`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add rule_applied
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "rule_applied") > 0,
  "SELECT 1",
  "ALTER TABLE `student_attendances` ADD COLUMN `rule_applied` varchar(100) NULL DEFAULT NULL AFTER `recorded_by`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- --------------------------------------------------------
-- 4. UPGRADE TEACHER ATTENDANCES TABLE
-- --------------------------------------------------------
SET @tablename = "teacher_attendances";

-- Add check_in_time
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "check_in_time") > 0,
  "SELECT 1",
  "ALTER TABLE `teacher_attendances` ADD COLUMN `check_in_time` datetime NULL DEFAULT NULL AFTER `status`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add check_out_time
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "check_out_time") > 0,
  "SELECT 1",
  "ALTER TABLE `teacher_attendances` ADD COLUMN `check_out_time` datetime NULL DEFAULT NULL AFTER `check_in_time`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add rule_applied
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "rule_applied") > 0,
  "SELECT 1",
  "ALTER TABLE `teacher_attendances` ADD COLUMN `rule_applied` varchar(100) NULL DEFAULT NULL AFTER `check_out_time`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add is_system_generated
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "is_system_generated") > 0,
  "SELECT 1",
  "ALTER TABLE `teacher_attendances` ADD COLUMN `is_system_generated` tinyint(1) NOT NULL DEFAULT 0 AFTER `rule_applied`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add campus_id
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "campus_id") > 0,
  "SELECT 1",
  "ALTER TABLE `teacher_attendances` ADD COLUMN `campus_id` varchar(36) NULL DEFAULT 'c2222222-2222-2222-2222-222222222222' AFTER `teacher_id`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add recorded_by
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "recorded_by") > 0,
  "SELECT 1",
  "ALTER TABLE `teacher_attendances` ADD COLUMN `recorded_by` varchar(100) NULL DEFAULT 'Admin' AFTER `is_system_generated`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- --------------------------------------------------------
-- 5. AUDIT LOGS TABLE (For attendance & record change tracking)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `campus_id` varchar(36) DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` varchar(100) NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_campus` (`campus_id`),
  KEY `idx_audit_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
