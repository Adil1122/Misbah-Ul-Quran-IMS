-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 08, 2026 at 08:18 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ims_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance_batches`
--

CREATE TABLE `attendance_batches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `class_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` enum('student-attendance','teacher-attendance') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('94d92f976fd06fd3e8cf53ec4e03d646', 'i:1;', 1779085302),
('94d92f976fd06fd3e8cf53ec4e03d646:timer', 'i:1779085302;', 1779085302);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(50) NOT NULL,
  `admission_fee` decimal(10,2) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `teacher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `title`, `admission_fee`, `description`, `teacher_id`, `created_at`, `updated_at`) VALUES
(1, 'B-1', 100.00, 'Junior Boys Section', NULL, '2026-01-20 03:24:26', '2026-01-20 03:24:26'),
(2, 'B-2', 100.00, 'Senior Boys Section', NULL, '2026-01-20 03:24:26', '2026-01-20 03:24:26'),
(3, 'G-1', 200.00, 'Junior Girls Section', NULL, '2026-01-20 03:24:26', '2026-01-20 03:24:26'),
(4, 'G-2', 200.00, 'Senior Girls Section', NULL, '2026-01-20 03:24:26', '2026-01-20 03:24:26'),
(5, 'Hifz', 500.00, 'Boys Only', NULL, '2026-01-20 03:24:26', '2026-01-20 03:24:26'),
(6, 'B-1', 100.00, 'Junior Boys Section', NULL, '2026-04-08 08:01:28', '2026-04-08 08:01:28'),
(7, 'B-2', 100.00, 'Senior Boys Section', NULL, '2026-04-08 08:01:28', '2026-04-08 08:01:28'),
(8, 'G-1', 200.00, 'Junior Girls Section', NULL, '2026-04-08 08:01:28', '2026-04-08 08:01:28'),
(9, 'G-2', 200.00, 'Senior Girls Section', NULL, '2026-04-08 08:01:28', '2026-04-08 08:01:28'),
(10, 'Hifz', 500.00, 'Boys Only', NULL, '2026-04-08 08:01:28', '2026-04-08 08:01:28'),
(11, 'B-1', 100.00, 'Junior Boys Section', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(12, 'B-2', 100.00, 'Senior Boys Section', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(13, 'G-1', 200.00, 'Junior Girls Section', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(14, 'G-2', 200.00, 'Senior Girls Section', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(15, 'Hifz', 500.00, 'Boys Only', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55');

-- --------------------------------------------------------

--
-- Table structure for table `document_uplouds`
--

CREATE TABLE `document_uplouds` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('student','teacher','incident') NOT NULL,
  `reference_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `document_uplouds`
--

INSERT INTO `document_uplouds` (`id`, `type`, `reference_id`, `name`, `file_name`, `created_at`, `updated_at`) VALUES
(6, 'teacher', 14, 'INDEPENDENT_CONTRACTOR_AGREEMENT.docx', 'files/LsUf5ZbgYImxdOzcXLXgOPneaykDFKvW0nreOYcK.docx', '2026-06-23 02:43:22', '2026-06-23 02:43:22'),
(8, 'incident', 1, 'INDEPENDENT_CONTRACTOR_AGREEMENT.docx', 'files/YlWcgmRmIDDYY9vUDKW0rtedxSW3OY8VM4bWtkU9.docx', '2026-06-23 03:04:33', '2026-06-23 03:04:33'),
(10, 'incident', 2, 'INDEPENDENT_CONTRACTOR_AGREEMENT.docx', 'files/hvRabFHv3oIAfFssAHXofJcWXKWVA0NNYN4g7dS7.docx', '2026-06-23 03:05:39', '2026-06-23 03:05:39');

-- --------------------------------------------------------

--
-- Table structure for table `event_announcements`
--

CREATE TABLE `event_announcements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('exam','parent_meeting','teacher_meeting','competition','past_event','announcement') NOT NULL,
  `type_details` text DEFAULT NULL,
  `title` varchar(50) NOT NULL,
  `name` bigint(20) UNSIGNED DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `date_time` datetime NOT NULL,
  `attachments` varchar(1000) DEFAULT NULL COMMENT '(DC2Type: Array)',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_logs`
--

CREATE TABLE `expense_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('utility_bill','maintainance_repair','event_festival','charity','tour','office_supplies','miscellaneous') NOT NULL,
  `title` varchar(255) NOT NULL,
  `details` longtext DEFAULT NULL,
  `attachments` varchar(1000) DEFAULT NULL COMMENT '(DC2Type: Array)',
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `payment_method` enum('cash','bank_transfer') NOT NULL DEFAULT 'cash',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `incident_logs`
--

CREATE TABLE `incident_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date` date NOT NULL,
  `title` varchar(50) NOT NULL,
  `description` longtext NOT NULL,
  `action_taken` varchar(255) DEFAULT NULL,
  `attachments` varchar(1000) DEFAULT NULL COMMENT '(DC2Type: Array)',
  `status` enum('active','pending-approval') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incident_logs`
--

INSERT INTO `incident_logs` (`id`, `student_id`, `date`, `title`, `description`, `action_taken`, `attachments`, `status`, `created_at`, `updated_at`) VALUES
(1, 120, '2026-06-23', 'test incident', 'test desc', 'null', NULL, 'active', '2026-06-23 02:54:17', '2026-06-23 03:04:32'),
(2, 119, '2026-06-23', 'jhsagdj', 'sajhdgsa', 'null', NULL, 'active', '2026-06-23 03:05:38', '2026-06-23 03:06:09');

-- --------------------------------------------------------

--
-- Table structure for table `medical_logs`
--

CREATE TABLE `medical_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED DEFAULT NULL,
  `issue` varchar(100) NOT NULL,
  `issue_date` date NOT NULL,
  `issue_details` varchar(500) DEFAULT NULL,
  `resolution_details` longtext DEFAULT NULL COMMENT '(DC2Type: Array)',
  `status` enum('active','pending-approval') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2025_08_26_115357_create_cache_table', 1),
(2, '2025_08_26_115400_create_users_table', 1),
(3, '2025_08_26_115928_create_personal_access_tokens_table', 1),
(4, '2025_08_27_111440_create_payment_methods_table', 1),
(5, '2025_08_27_111513_create_classes_table', 1),
(6, '2025_08_27_111557_create_students_table', 1),
(7, '2025_08_29_134202_create_payment_invoices_table', 1),
(8, '2025_09_02_105217_create_incident_logs_table', 1),
(9, '2025_09_02_105418_create_medical_logs_table', 1),
(10, '2025_09_02_111011_add_status_to_students_table', 1),
(11, '2025_09_02_111300_create_teacher_profiles_table', 1),
(12, '2025_09_04_104939_create_attendance_batches_table', 1),
(13, '2025_09_04_105308_create_student_attendances_table', 1),
(14, '2025_09_04_113717_add_unique_index_to_attendance_batches_table', 1),
(15, '2025_09_24_083143_create_event_announcements_table', 1),
(16, '2025_10_16_111259_add_teacher_id_to_classes', 1),
(17, '2025_10_17_115355_change_payment_day_into_salary_day_in_teacher_profiles', 1),
(18, '2025_10_17_150446_make_type_details_nullable_in_event_announcements', 1),
(19, '2025_10_20_115341_create_teacher_attendances_table', 1),
(20, '2025_11_04_103010_create_student_report_cards_table', 1),
(21, '2025_11_05_102326_create_expense_logs_table', 1),
(22, '2025_11_10_090133_create_document_uplouds_table', 1),
(23, '2025_12_09_065410_add_status_to_incident_and_medical_logs', 1),
(24, '2025_12_09_143211_update_payment_methods_type_enum', 1),
(25, '2026_01_20_144500_create_prayer_timings_table', 2),
(26, '2026_01_20_144501_create_slider_images_table', 2),
(27, '2026_01_20_144502_create_news_table', 2),
(28, '2026_03_05_073534_add_month_day_to_prayer_timings_table', 3),
(29, '2026_03_05_084024_add_year_to_prayer_timings_table', 4),
(30, '2026_04_08_125208_add_jummah_to_prayer_timings_table', 5),
(31, '2026_03_30_145058_update_payment_method_columns', 6),
(32, '2026_05_18_064415_make_admission_fee_details_nullable_in_students_table', 7),
(33, '2026_05_18_064914_make_email_nullable_in_users_table', 7),
(34, '2026_06_23_075907_add_incident_to_type_enum_in_document_uplouds_table', 8);

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

CREATE TABLE `news` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `news`
--

INSERT INTO `news` (`id`, `content`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Listen Quran', 1, '2026-01-21 06:12:32', '2026-01-21 06:12:32'),
(2, 'Read Quran.', 1, '2026-01-21 06:12:32', '2026-01-21 06:12:32'),
(3, 'Memorise Quran', 1, '2026-01-21 06:12:32', '2026-01-21 06:12:32'),
(4, 'Welcome to Musbah Ul Quran Institute. Admissions are open for new academic year.', 1, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(5, 'Reminder: Parent-Teacher meeting will be held on coming Friday.', 1, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(6, 'New Quran memorization classes starting soon. Register now!', 1, '2026-04-08 08:02:56', '2026-04-08 08:02:56');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_invoices`
--

CREATE TABLE `payment_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('fee_invoice','salary_invoice') NOT NULL,
  `reference_id` bigint(20) UNSIGNED NOT NULL,
  `due_date` date DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','online','direct-debit') DEFAULT NULL,
  `payment_status` enum('paid','unpaid','overdue','unprocessable') NOT NULL,
  `payment_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_invoices`
--

INSERT INTO `payment_invoices` (`id`, `type`, `reference_id`, `due_date`, `amount`, `payment_method`, `payment_status`, `payment_date`, `created_at`, `updated_at`) VALUES
(1, 'fee_invoice', 2, '2026-05-08', 980.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(2, 'fee_invoice', 2, '2026-06-08', 980.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(3, 'fee_invoice', 3, '2026-05-08', 1634.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(4, 'fee_invoice', 3, '2026-06-08', 1634.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(5, 'fee_invoice', 4, '2026-05-08', 1589.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(6, 'fee_invoice', 4, '2026-06-08', 1589.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(7, 'fee_invoice', 5, '2026-05-08', 1655.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(8, 'fee_invoice', 5, '2026-06-08', 1655.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(9, 'fee_invoice', 6, '2026-05-08', 1476.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(10, 'fee_invoice', 6, '2026-06-08', 1476.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(11, 'fee_invoice', 7, '2026-05-08', 1257.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(12, 'fee_invoice', 7, '2026-06-08', 1257.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(13, 'fee_invoice', 8, '2026-05-08', 911.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(14, 'fee_invoice', 8, '2026-06-08', 911.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(15, 'fee_invoice', 9, '2026-05-08', 1196.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(16, 'fee_invoice', 9, '2026-06-08', 1196.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(17, 'fee_invoice', 10, '2026-05-08', 1027.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(18, 'fee_invoice', 10, '2026-06-08', 1027.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(19, 'fee_invoice', 11, '2026-05-08', 1277.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(20, 'fee_invoice', 11, '2026-06-08', 1277.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(21, 'fee_invoice', 12, '2026-05-08', 1808.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(22, 'fee_invoice', 12, '2026-06-08', 1808.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(23, 'fee_invoice', 13, '2026-05-08', 1110.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(24, 'fee_invoice', 13, '2026-06-08', 1110.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(25, 'fee_invoice', 14, '2026-05-08', 1514.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(26, 'fee_invoice', 14, '2026-06-08', 1514.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(27, 'fee_invoice', 15, '2026-05-08', 1531.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(28, 'fee_invoice', 15, '2026-06-08', 1531.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(29, 'fee_invoice', 16, '2026-05-08', 1185.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(30, 'fee_invoice', 16, '2026-06-08', 1185.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(31, 'fee_invoice', 17, '2026-05-08', 1132.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(32, 'fee_invoice', 17, '2026-06-08', 1132.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(33, 'fee_invoice', 18, '2026-05-08', 1057.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(34, 'fee_invoice', 18, '2026-06-08', 1057.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(35, 'fee_invoice', 19, '2026-05-08', 1520.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(36, 'fee_invoice', 19, '2026-06-08', 1520.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(37, 'fee_invoice', 20, '2026-05-08', 1266.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(38, 'fee_invoice', 20, '2026-06-08', 1266.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(39, 'fee_invoice', 21, '2026-05-08', 1486.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(40, 'fee_invoice', 21, '2026-06-08', 1486.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(41, 'fee_invoice', 22, '2026-05-08', 1690.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(42, 'fee_invoice', 22, '2026-06-08', 1690.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(43, 'fee_invoice', 23, '2026-05-08', 962.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(44, 'fee_invoice', 23, '2026-06-08', 962.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(45, 'fee_invoice', 24, '2026-05-08', 1043.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(46, 'fee_invoice', 24, '2026-06-08', 1043.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(47, 'fee_invoice', 25, '2026-05-08', 1898.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(48, 'fee_invoice', 25, '2026-06-08', 1898.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(49, 'fee_invoice', 26, '2026-05-08', 1715.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(50, 'fee_invoice', 26, '2026-06-08', 1715.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(51, 'fee_invoice', 27, '2026-05-08', 1876.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(52, 'fee_invoice', 27, '2026-06-08', 1876.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(53, 'fee_invoice', 28, '2026-05-08', 994.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(54, 'fee_invoice', 28, '2026-06-08', 994.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(55, 'fee_invoice', 29, '2026-05-08', 827.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(56, 'fee_invoice', 29, '2026-06-08', 827.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(57, 'fee_invoice', 30, '2026-05-08', 1546.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(58, 'fee_invoice', 30, '2026-06-08', 1546.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(59, 'fee_invoice', 31, '2026-05-08', 845.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(60, 'fee_invoice', 31, '2026-06-08', 845.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(61, 'fee_invoice', 32, '2026-05-08', 1552.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(62, 'fee_invoice', 32, '2026-06-08', 1552.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(63, 'fee_invoice', 33, '2026-05-08', 1439.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(64, 'fee_invoice', 33, '2026-06-08', 1439.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(65, 'fee_invoice', 34, '2026-05-08', 1984.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(66, 'fee_invoice', 34, '2026-06-08', 1984.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(67, 'fee_invoice', 35, '2026-05-08', 990.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(68, 'fee_invoice', 35, '2026-06-08', 990.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(69, 'fee_invoice', 36, '2026-05-08', 1584.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(70, 'fee_invoice', 36, '2026-06-08', 1584.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(71, 'fee_invoice', 37, '2026-05-08', 811.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(72, 'fee_invoice', 37, '2026-06-08', 811.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(73, 'fee_invoice', 38, '2026-05-08', 1881.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(74, 'fee_invoice', 38, '2026-06-08', 1881.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(75, 'fee_invoice', 39, '2026-05-08', 1088.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(76, 'fee_invoice', 39, '2026-06-08', 1088.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(77, 'fee_invoice', 40, '2026-05-08', 1785.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(78, 'fee_invoice', 40, '2026-06-08', 1785.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(79, 'fee_invoice', 41, '2026-05-08', 1406.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(80, 'fee_invoice', 41, '2026-06-08', 1406.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(81, 'fee_invoice', 42, '2026-05-08', 1207.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(82, 'fee_invoice', 42, '2026-06-08', 1207.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(83, 'fee_invoice', 43, '2026-05-08', 1081.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(84, 'fee_invoice', 43, '2026-06-08', 1081.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(85, 'fee_invoice', 44, '2026-05-08', 1977.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(86, 'fee_invoice', 44, '2026-06-08', 1977.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(87, 'fee_invoice', 45, '2026-05-08', 939.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(88, 'fee_invoice', 45, '2026-06-08', 939.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(89, 'fee_invoice', 46, '2026-05-08', 1799.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(90, 'fee_invoice', 46, '2026-06-08', 1799.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(91, 'fee_invoice', 47, '2026-05-08', 957.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(92, 'fee_invoice', 47, '2026-06-08', 957.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(93, 'fee_invoice', 48, '2026-05-08', 1675.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(94, 'fee_invoice', 48, '2026-06-08', 1675.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(95, 'fee_invoice', 49, '2026-05-08', 1666.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(96, 'fee_invoice', 49, '2026-06-08', 1666.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(97, 'fee_invoice', 50, '2026-05-08', 1271.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(98, 'fee_invoice', 50, '2026-06-08', 1271.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(99, 'fee_invoice', 51, '2026-05-08', 1876.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(100, 'fee_invoice', 51, '2026-06-08', 1876.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(101, 'fee_invoice', 52, '2026-05-08', 872.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(102, 'fee_invoice', 52, '2026-06-08', 872.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(103, 'fee_invoice', 53, '2026-05-08', 1288.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(104, 'fee_invoice', 53, '2026-06-08', 1288.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(105, 'fee_invoice', 54, '2026-05-08', 1230.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(106, 'fee_invoice', 54, '2026-06-08', 1230.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(107, 'fee_invoice', 55, '2026-05-08', 1144.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(108, 'fee_invoice', 55, '2026-06-08', 1144.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(109, 'fee_invoice', 56, '2026-05-08', 1049.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(110, 'fee_invoice', 56, '2026-06-08', 1049.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(111, 'fee_invoice', 57, '2026-05-08', 1760.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(112, 'fee_invoice', 57, '2026-06-08', 1760.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(113, 'fee_invoice', 58, '2026-05-08', 1412.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(114, 'fee_invoice', 58, '2026-06-08', 1412.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(115, 'fee_invoice', 59, '2026-05-08', 1493.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(116, 'fee_invoice', 59, '2026-06-08', 1493.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(117, 'fee_invoice', 60, '2026-05-08', 1709.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(118, 'fee_invoice', 60, '2026-06-08', 1709.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(119, 'fee_invoice', 61, '2026-05-08', 1872.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(120, 'fee_invoice', 61, '2026-06-08', 1872.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(121, 'fee_invoice', 62, '2026-05-08', 832.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(122, 'fee_invoice', 62, '2026-06-08', 832.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(123, 'fee_invoice', 63, '2026-05-08', 1335.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(124, 'fee_invoice', 63, '2026-06-08', 1335.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(125, 'fee_invoice', 64, '2026-05-08', 1545.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(126, 'fee_invoice', 64, '2026-06-08', 1545.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(127, 'fee_invoice', 65, '2026-05-08', 1903.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(128, 'fee_invoice', 65, '2026-06-08', 1903.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(129, 'fee_invoice', 66, '2026-05-08', 1020.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(130, 'fee_invoice', 66, '2026-06-08', 1020.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(131, 'fee_invoice', 67, '2026-05-08', 981.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(132, 'fee_invoice', 67, '2026-06-08', 981.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(133, 'fee_invoice', 68, '2026-05-08', 1751.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(134, 'fee_invoice', 68, '2026-06-08', 1751.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(135, 'fee_invoice', 69, '2026-05-08', 1759.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(136, 'fee_invoice', 69, '2026-06-08', 1759.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(137, 'fee_invoice', 70, '2026-05-08', 1116.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(138, 'fee_invoice', 70, '2026-06-08', 1116.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(139, 'fee_invoice', 71, '2026-05-08', 977.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(140, 'fee_invoice', 71, '2026-06-08', 977.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(141, 'fee_invoice', 72, '2026-05-08', 1864.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(142, 'fee_invoice', 72, '2026-06-08', 1864.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(143, 'fee_invoice', 73, '2026-05-08', 1422.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(144, 'fee_invoice', 73, '2026-06-08', 1422.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(145, 'fee_invoice', 74, '2026-05-08', 1807.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(146, 'fee_invoice', 74, '2026-06-08', 1807.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(147, 'fee_invoice', 75, '2026-05-08', 1748.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(148, 'fee_invoice', 75, '2026-06-08', 1748.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(149, 'fee_invoice', 76, '2026-05-08', 1720.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(150, 'fee_invoice', 76, '2026-06-08', 1720.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(151, 'fee_invoice', 77, '2026-05-08', 1896.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(152, 'fee_invoice', 77, '2026-06-08', 1896.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(153, 'fee_invoice', 78, '2026-05-08', 1063.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(154, 'fee_invoice', 78, '2026-06-08', 1063.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(155, 'fee_invoice', 79, '2026-05-08', 1391.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(156, 'fee_invoice', 79, '2026-06-08', 1391.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(157, 'fee_invoice', 80, '2026-05-08', 1864.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(158, 'fee_invoice', 80, '2026-06-08', 1864.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(159, 'fee_invoice', 81, '2026-05-08', 1729.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(160, 'fee_invoice', 81, '2026-06-08', 1729.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(161, 'fee_invoice', 82, '2026-05-08', 1094.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(162, 'fee_invoice', 82, '2026-06-08', 1094.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(163, 'fee_invoice', 83, '2026-05-08', 804.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(164, 'fee_invoice', 83, '2026-06-08', 804.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(165, 'fee_invoice', 84, '2026-05-08', 1290.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(166, 'fee_invoice', 84, '2026-06-08', 1290.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(167, 'fee_invoice', 85, '2026-05-08', 1442.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(168, 'fee_invoice', 85, '2026-06-08', 1442.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(169, 'fee_invoice', 86, '2026-05-08', 1305.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(170, 'fee_invoice', 86, '2026-06-08', 1305.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(171, 'fee_invoice', 87, '2026-05-08', 1950.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(172, 'fee_invoice', 87, '2026-06-08', 1950.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(173, 'fee_invoice', 88, '2026-05-08', 1494.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(174, 'fee_invoice', 88, '2026-06-08', 1494.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(175, 'fee_invoice', 89, '2026-05-08', 1117.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(176, 'fee_invoice', 89, '2026-06-08', 1117.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(177, 'fee_invoice', 90, '2026-05-08', 954.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(178, 'fee_invoice', 90, '2026-06-08', 954.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(179, 'fee_invoice', 91, '2026-05-08', 996.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(180, 'fee_invoice', 91, '2026-06-08', 996.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(181, 'fee_invoice', 92, '2026-05-08', 807.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(182, 'fee_invoice', 92, '2026-06-08', 807.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(183, 'fee_invoice', 93, '2026-05-08', 1945.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(184, 'fee_invoice', 93, '2026-06-08', 1945.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(185, 'fee_invoice', 94, '2026-05-08', 1791.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(186, 'fee_invoice', 94, '2026-06-08', 1791.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(187, 'fee_invoice', 95, '2026-05-08', 848.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(188, 'fee_invoice', 95, '2026-06-08', 848.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(189, 'fee_invoice', 96, '2026-05-08', 1162.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(190, 'fee_invoice', 96, '2026-06-08', 1162.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(191, 'fee_invoice', 97, '2026-05-08', 1341.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(192, 'fee_invoice', 97, '2026-06-08', 1341.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(193, 'fee_invoice', 98, '2026-05-08', 892.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(194, 'fee_invoice', 98, '2026-06-08', 892.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(195, 'fee_invoice', 99, '2026-05-08', 1130.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(196, 'fee_invoice', 99, '2026-06-08', 1130.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(197, 'fee_invoice', 100, '2026-05-08', 1002.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(198, 'fee_invoice', 100, '2026-06-08', 1002.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(199, 'fee_invoice', 101, '2026-05-08', 1147.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(200, 'fee_invoice', 101, '2026-06-08', 1147.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(201, 'fee_invoice', 102, '2026-05-08', 1360.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(202, 'fee_invoice', 102, '2026-06-08', 1360.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(203, 'fee_invoice', 103, '2026-05-08', 1500.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(204, 'fee_invoice', 103, '2026-06-08', 1500.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(205, 'fee_invoice', 104, '2026-05-08', 1410.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(206, 'fee_invoice', 104, '2026-06-08', 1410.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(207, 'fee_invoice', 105, '2026-05-08', 923.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(208, 'fee_invoice', 105, '2026-06-08', 923.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(209, 'fee_invoice', 106, '2026-05-08', 1921.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(210, 'fee_invoice', 106, '2026-06-08', 1921.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(211, 'fee_invoice', 107, '2026-05-08', 1628.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(212, 'fee_invoice', 107, '2026-06-08', 1628.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(213, 'fee_invoice', 108, '2026-05-08', 1951.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(214, 'fee_invoice', 108, '2026-06-08', 1951.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(215, 'fee_invoice', 109, '2026-05-08', 1641.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(216, 'fee_invoice', 109, '2026-06-08', 1641.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(217, 'fee_invoice', 110, '2026-05-08', 1670.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(218, 'fee_invoice', 110, '2026-06-08', 1670.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(219, 'fee_invoice', 111, '2026-05-08', 824.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(220, 'fee_invoice', 111, '2026-06-08', 824.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(221, 'fee_invoice', 112, '2026-05-08', 895.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(222, 'fee_invoice', 112, '2026-06-08', 895.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(223, 'fee_invoice', 113, '2026-05-08', 1546.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(224, 'fee_invoice', 113, '2026-06-08', 1546.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(225, 'fee_invoice', 114, '2026-05-08', 854.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(226, 'fee_invoice', 114, '2026-06-08', 854.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(227, 'fee_invoice', 115, '2026-05-08', 1368.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(228, 'fee_invoice', 115, '2026-06-08', 1368.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(229, 'fee_invoice', 116, '2026-05-08', 949.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(230, 'fee_invoice', 116, '2026-06-08', 949.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(231, 'fee_invoice', 117, '2026-05-08', 1658.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(232, 'fee_invoice', 117, '2026-06-08', 1658.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(233, 'fee_invoice', 118, '2026-05-08', 1526.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(234, 'fee_invoice', 118, '2026-06-08', 1526.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(235, 'fee_invoice', 119, '2026-05-08', 1603.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(236, 'fee_invoice', 119, '2026-06-08', 1603.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(237, 'fee_invoice', 120, '2026-05-08', 1153.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(238, 'fee_invoice', 120, '2026-06-08', 1153.00, 'cash', 'unpaid', NULL, '2026-04-08 08:02:56', '2026-04-08 08:02:56');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `type` enum('cash','online','direct_debit') NOT NULL DEFAULT 'cash',
  `details` varchar(500) NOT NULL COMMENT '(DC2Type: Array)',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'auth_token', '500303b58973049472df74ed177ff9feea8f90544d09b86ad79d63dc7e8923c4', '[\"*\"]', NULL, NULL, '2026-01-20 03:37:53', '2026-01-20 03:37:53'),
(2, 'App\\Models\\User', 1, 'auth_token', 'c903576940987e4affa93b1151dc3cff79a53d812573143857a1775171bee2df', '[\"*\"]', NULL, NULL, '2026-03-11 02:33:33', '2026-03-11 02:33:33'),
(3, 'App\\Models\\User', 1, 'auth_token', '9600c92860c41498492519c38abc70a09e7f3bd76977e7fef7c4b61bb42e3a1a', '[\"*\"]', '2026-06-23 03:23:29', NULL, '2026-05-18 01:20:46', '2026-06-23 03:23:29');

-- --------------------------------------------------------

--
-- Table structure for table `prayer_timings`
--

CREATE TABLE `prayer_timings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `english_name` varchar(255) NOT NULL,
  `arabic_name` varchar(255) DEFAULT NULL,
  `month` int(11) NOT NULL DEFAULT 1,
  `day` int(11) NOT NULL DEFAULT 1,
  `year` int(11) NOT NULL DEFAULT 2026,
  `begin_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_jummah` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `prayer_timings`
--

INSERT INTO `prayer_timings` (`id`, `english_name`, `arabic_name`, `month`, `day`, `year`, `begin_time`, `end_time`, `is_jummah`, `created_at`, `updated_at`) VALUES
(1, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, '2026-01-20 23:09:44', '2026-01-20 23:09:44'),
(2, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, '2026-01-20 23:09:44', '2026-01-20 23:09:44'),
(3, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, '2026-01-20 23:09:44', '2026-01-20 23:09:44'),
(4, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, '2026-01-20 23:09:44', '2026-01-20 23:09:44'),
(5, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, '2026-01-20 23:09:44', '2026-01-20 23:09:44'),
(6, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, '2026-01-20 23:09:44', '2026-01-20 23:09:44'),
(7, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-05 04:14:04'),
(8, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-05 04:14:04'),
(9, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-05 04:14:04'),
(10, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-05 04:14:04'),
(11, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-05 04:14:04'),
(12, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-05 04:14:04'),
(13, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-06 03:08:22'),
(14, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-06 03:08:23'),
(15, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-06 03:08:23'),
(16, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-06 03:08:23'),
(17, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-06 03:08:23'),
(18, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-06 03:08:23'),
(19, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-11 09:01:17'),
(20, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-11 09:01:17'),
(21, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-11 09:01:17'),
(22, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-11 09:01:17'),
(23, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-11 09:01:17'),
(24, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-11 09:01:17'),
(25, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-11 06:25:08'),
(26, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-11 06:25:08'),
(27, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-11 06:25:08'),
(28, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-11 06:25:08'),
(29, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-11 06:25:08'),
(30, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-11 06:25:08'),
(31, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-12 06:16:40'),
(32, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-12 06:16:40'),
(33, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-12 06:16:40'),
(34, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-12 06:16:40'),
(35, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-12 06:16:40'),
(36, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-12 06:16:40'),
(37, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-11 12:39:13'),
(38, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-11 12:39:13'),
(39, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-11 12:39:13'),
(40, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-11 12:39:13'),
(41, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-11 12:39:13'),
(42, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-11 12:39:13'),
(43, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-12 06:17:07'),
(44, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-12 06:17:07'),
(45, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-12 06:17:07'),
(46, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-12 06:17:07'),
(47, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-12 06:17:07'),
(48, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-12 06:17:07'),
(49, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-12 06:17:26'),
(50, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-12 06:17:26'),
(51, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-12 06:17:26'),
(52, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-12 06:17:26'),
(53, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-12 06:17:26'),
(54, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-12 06:17:26'),
(55, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-12 06:18:36'),
(56, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-12 06:18:36'),
(57, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-12 06:18:36'),
(58, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-12 06:18:36'),
(59, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-12 06:18:36'),
(60, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-12 06:18:36'),
(61, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-11 12:42:01'),
(62, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-11 12:42:01'),
(63, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-11 12:42:01'),
(64, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-11 12:42:01'),
(65, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-11 12:42:01'),
(66, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-11 12:42:01'),
(67, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-12 06:20:42'),
(68, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-12 06:20:42'),
(69, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-12 06:20:42'),
(70, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-12 06:20:42'),
(71, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-12 06:20:42'),
(72, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-12 06:20:42'),
(73, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-12 06:19:17'),
(74, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-12 06:19:17'),
(75, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-12 06:19:17'),
(76, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-12 06:19:17'),
(77, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-12 06:19:17'),
(78, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-12 06:19:17'),
(79, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-12 06:21:35'),
(80, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-12 06:21:35'),
(81, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-12 06:21:35'),
(82, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-12 06:21:35'),
(83, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-12 06:21:35'),
(84, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-12 06:21:35'),
(85, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-22 12:44:01'),
(86, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-22 12:44:01'),
(87, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-22 12:44:01'),
(88, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-22 12:44:01'),
(89, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-22 12:44:01'),
(90, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-22 12:44:01'),
(91, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-22 12:46:55'),
(92, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-22 12:46:55'),
(93, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-22 12:46:55'),
(94, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-22 12:46:55'),
(95, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-22 12:46:55'),
(96, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-22 12:46:55'),
(97, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-22 12:49:02'),
(98, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-22 12:49:02'),
(99, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-22 12:49:02'),
(100, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-22 12:49:02'),
(101, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-22 12:49:02'),
(102, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-22 12:49:02'),
(103, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '06:00:00', 0, NULL, '2026-03-22 12:55:25'),
(104, 'Sunrise', 'الشروق', 1, 1, 2026, '06:43:00', '06:43:00', 0, NULL, '2026-03-22 12:55:25'),
(105, 'Dhuhr', 'الظهر', 1, 1, 2026, '01:14:00', '01:30:00', 0, NULL, '2026-03-22 12:55:25'),
(106, 'Asr', 'العصر', 1, 1, 2026, '05:36:00', '06:00:00', 0, NULL, '2026-03-22 12:55:25'),
(107, 'Maghrib', 'المغرب', 1, 1, 2026, '07:43:00', '07:43:00', 0, NULL, '2026-03-22 12:55:25'),
(108, 'Isha', 'العشاء', 1, 1, 2026, '08:56:00', '09:15:00', 0, NULL, '2026-03-22 12:55:25'),
(109, 'Fajr', 'الفجر', 1, 1, 2026, '05:21:00', '06:00:00', 0, NULL, '2026-04-01 13:02:33'),
(110, 'Sunrise', 'الشروق', 1, 1, 2026, '06:41:00', '06:41:00', 0, NULL, '2026-04-01 13:02:33'),
(111, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:14:00', '13:30:00', 0, NULL, '2026-04-01 13:02:33'),
(112, 'Asr', 'العصر', 1, 1, 2026, '17:37:00', '18:00:00', 0, NULL, '2026-04-01 13:02:33'),
(113, 'Maghrib', 'المغرب', 1, 1, 2026, '19:44:00', '19:44:00', 0, NULL, '2026-04-01 13:02:33'),
(114, 'Isha', 'العشاء', 1, 1, 2026, '20:58:00', '21:15:00', 0, NULL, '2026-04-01 13:02:33'),
(115, 'Fajr', 'الفجر', 1, 1, 2026, '05:19:00', '06:00:00', 0, NULL, '2026-04-01 13:14:17'),
(116, 'Sunrise', 'الشروق', 1, 1, 2026, '06:39:00', '06:39:00', 0, NULL, '2026-04-01 13:14:17'),
(117, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:13:00', '13:30:00', 0, NULL, '2026-04-01 13:14:17'),
(118, 'Asr', 'العصر', 1, 1, 2026, '17:38:00', '18:00:00', 0, NULL, '2026-04-01 13:14:17'),
(119, 'Maghrib', 'المغرب', 1, 1, 2026, '19:45:00', '19:45:00', 0, NULL, '2026-04-01 13:14:17'),
(120, 'Isha', 'العشاء', 1, 1, 2026, '21:00:00', '21:15:00', 0, NULL, '2026-04-01 13:14:17'),
(121, 'Fajr', 'الفجر', 1, 1, 2026, '05:17:00', '06:00:00', 0, NULL, '2026-04-03 03:27:03'),
(122, 'Sunrise', 'الشروق', 1, 1, 2026, '06:37:00', '06:37:00', 0, NULL, '2026-04-03 03:27:03'),
(123, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:13:00', '13:30:00', 0, NULL, '2026-04-03 03:27:03'),
(124, 'Asr', 'العصر', 1, 1, 2026, '17:39:00', '18:00:00', 0, NULL, '2026-04-03 03:27:03'),
(125, 'Maghrib', 'المغرب', 1, 1, 2026, '19:47:00', '19:47:00', 0, NULL, '2026-04-03 03:27:03'),
(126, 'Isha', 'العشاء', 1, 1, 2026, '21:01:00', '21:30:00', 0, NULL, '2026-04-03 03:27:03'),
(127, 'Fajr', 'الفجر', 1, 1, 2026, '05:15:00', '06:00:00', 0, NULL, '2026-04-03 02:15:29'),
(128, 'Sunrise', 'الشروق', 1, 1, 2026, '06:35:00', '06:35:00', 0, NULL, '2026-04-03 02:15:29'),
(129, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:12:00', '13:30:00', 0, NULL, '2026-04-03 02:15:29'),
(130, 'Asr', 'العصر', 1, 1, 2026, '17:40:00', '18:00:00', 0, NULL, '2026-04-03 02:15:29'),
(131, 'Maghrib', 'المغرب', 1, 1, 2026, '19:49:00', '19:49:00', 0, NULL, '2026-04-03 02:15:29'),
(132, 'Isha', 'العشاء', 1, 1, 2026, '21:03:00', '21:30:00', 0, NULL, '2026-04-03 02:15:29'),
(133, 'Fajr', 'الفجر', 1, 1, 2026, '05:13:00', '06:00:00', 0, NULL, '2026-04-03 02:16:05'),
(134, 'Sunrise', 'الشروق', 1, 1, 2026, '06:33:00', '06:33:00', 0, NULL, '2026-04-03 02:16:05'),
(135, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:11:00', '13:30:00', 0, NULL, '2026-04-03 02:16:05'),
(136, 'Asr', 'العصر', 1, 1, 2026, '17:42:00', '18:00:00', 0, NULL, '2026-04-03 02:16:05'),
(137, 'Maghrib', 'المغرب', 1, 1, 2026, '19:51:00', '19:51:00', 0, NULL, '2026-04-03 02:16:05'),
(138, 'Isha', 'العشاء', 1, 1, 2026, '21:05:00', '21:30:00', 0, NULL, '2026-04-03 02:16:05'),
(139, 'Fajr', 'الفجر', 1, 1, 2026, '05:11:00', '06:00:00', 0, NULL, '2026-04-03 02:16:32'),
(140, 'Sunrise', 'الشروق', 1, 1, 2026, '06:31:00', '06:31:00', 0, NULL, '2026-04-03 02:16:32'),
(141, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:11:00', '13:30:00', 0, NULL, '2026-04-03 02:16:32'),
(142, 'Asr', 'العصر', 1, 1, 2026, '17:43:00', '18:00:00', 0, NULL, '2026-04-03 02:16:32'),
(143, 'Maghrib', 'المغرب', 1, 1, 2026, '19:53:00', '19:53:00', 0, NULL, '2026-04-03 02:16:32'),
(144, 'Isha', 'العشاء', 1, 1, 2026, '21:06:00', '21:30:00', 0, NULL, '2026-04-03 02:16:32'),
(145, 'Fajr', 'الفجر', 1, 1, 2026, '05:09:00', '06:00:00', 0, NULL, '2026-04-03 02:17:06'),
(146, 'Sunrise', 'الشروق', 1, 1, 2026, '06:28:00', '06:28:00', 0, NULL, '2026-04-03 02:17:06'),
(147, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:10:00', '13:30:00', 0, NULL, '2026-04-03 02:17:06'),
(148, 'Asr', 'العصر', 1, 1, 2026, '17:44:00', '18:00:00', 0, NULL, '2026-04-03 02:17:06'),
(149, 'Maghrib', 'المغرب', 1, 1, 2026, '19:55:00', '19:55:00', 0, NULL, '2026-04-03 02:17:06'),
(150, 'Isha', 'العشاء', 1, 1, 2026, '21:08:00', '21:30:00', 0, NULL, '2026-04-03 02:17:06'),
(151, 'Fajr', 'الفجر', 1, 1, 2026, '05:06:00', '06:00:00', 0, NULL, '2026-04-03 02:17:40'),
(152, 'Sunrise', 'الشروق', 1, 1, 2026, '06:25:00', '06:25:00', 0, NULL, '2026-04-03 02:17:40'),
(153, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:10:00', '13:30:00', 0, NULL, '2026-04-03 02:17:40'),
(154, 'Asr', 'العصر', 1, 1, 2026, '17:45:00', '18:00:00', 0, NULL, '2026-04-03 02:17:40'),
(155, 'Maghrib', 'المغرب', 1, 1, 2026, '19:57:00', '19:57:00', 0, NULL, '2026-04-03 02:17:40'),
(156, 'Isha', 'العشاء', 1, 1, 2026, '21:09:00', '21:30:00', 0, NULL, '2026-04-03 02:17:40'),
(157, 'Fajr', 'الفجر', 1, 1, 2026, '05:03:00', '06:00:00', 0, NULL, '2026-04-03 02:18:11'),
(158, 'Sunrise', 'الشروق', 1, 1, 2026, '06:22:00', '06:22:00', 0, NULL, '2026-04-03 02:18:11'),
(159, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:09:00', '13:30:00', 0, NULL, '2026-04-03 02:18:11'),
(160, 'Asr', 'العصر', 1, 1, 2026, '17:47:00', '18:00:00', 0, NULL, '2026-04-03 02:18:11'),
(161, 'Maghrib', 'المغرب', 1, 1, 2026, '19:59:00', '19:59:00', 0, NULL, '2026-04-03 02:18:11'),
(162, 'Isha', 'العشاء', 1, 1, 2026, '21:10:00', '21:30:00', 0, NULL, '2026-04-03 02:18:11'),
(163, 'Fajr', 'الفجر', 1, 1, 2026, '05:01:00', '05:45:00', 0, NULL, '2026-04-03 02:18:38'),
(164, 'Sunrise', 'الشروق', 1, 1, 2026, '06:20:00', '06:20:00', 0, NULL, '2026-04-03 02:18:38'),
(165, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:09:00', '13:30:00', 0, NULL, '2026-04-03 02:18:38'),
(166, 'Asr', 'العصر', 1, 1, 2026, '17:49:00', '18:30:00', 0, NULL, '2026-04-03 02:18:38'),
(167, 'Maghrib', 'المغرب', 1, 1, 2026, '20:01:00', '20:01:00', 0, NULL, '2026-04-03 02:18:38'),
(168, 'Isha', 'العشاء', 1, 1, 2026, '21:12:00', '21:30:00', 0, NULL, '2026-04-03 02:18:38'),
(169, 'Fajr', 'الفجر', 1, 1, 2026, '04:58:00', '05:25:00', 0, NULL, '2026-04-03 02:19:02'),
(170, 'Sunrise', 'الشروق', 1, 1, 2026, '06:18:00', '06:18:00', 0, NULL, '2026-04-03 02:19:02'),
(171, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:09:00', '13:30:00', 0, NULL, '2026-04-03 02:19:02'),
(172, 'Asr', 'العصر', 1, 1, 2026, '17:50:00', '18:00:00', 0, NULL, '2026-04-03 02:19:02'),
(173, 'Maghrib', 'المغرب', 1, 1, 2026, '20:02:00', '20:02:00', 0, NULL, '2026-04-03 02:19:02'),
(174, 'Isha', 'العشاء', 1, 1, 2026, '21:14:00', '21:30:00', 0, NULL, '2026-04-03 02:19:02'),
(175, 'Fajr', 'الفجر', 1, 1, 2026, '04:55:00', '05:25:00', 0, NULL, '2026-04-03 02:19:28'),
(176, 'Sunrise', 'الشروق', 1, 1, 2026, '06:16:00', '06:16:00', 0, NULL, '2026-04-03 02:19:28'),
(177, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00', '13:30:00', 0, NULL, '2026-04-03 02:19:28'),
(178, 'Asr', 'العصر', 1, 1, 2026, '17:51:00', '18:30:00', 0, NULL, '2026-04-03 02:19:28'),
(179, 'Maghrib', 'المغرب', 1, 1, 2026, '20:04:00', '20:04:00', 0, NULL, '2026-04-03 02:19:28'),
(180, 'Isha', 'العشاء', 1, 1, 2026, '21:16:00', '21:30:00', 0, NULL, '2026-04-03 02:19:28'),
(181, 'Fajr', 'الفجر', 1, 1, 2026, '04:53:00', '05:45:00', 0, NULL, '2026-04-03 02:19:59'),
(182, 'Sunrise', 'الشروق', 1, 1, 2026, '06:14:00', '06:14:00', 0, NULL, '2026-04-03 02:19:59'),
(183, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00', '13:30:00', 0, NULL, '2026-04-03 02:19:59'),
(184, 'Asr', 'العصر', 1, 1, 2026, '17:52:00', '06:30:00', 0, NULL, '2026-04-03 02:19:59'),
(185, 'Maghrib', 'المغرب', 1, 1, 2026, '20:06:00', '20:06:00', 0, NULL, '2026-04-03 02:19:59'),
(186, 'Isha', 'العشاء', 1, 1, 2026, '21:18:00', '21:30:00', 0, NULL, '2026-04-03 02:19:59'),
(187, 'Fajr', 'الفجر', 1, 1, 2026, '04:49:00', '05:30:00', 0, NULL, '2026-04-03 02:20:26'),
(188, 'Sunrise', 'الشروق', 1, 1, 2026, '06:11:00', '06:11:00', 0, NULL, '2026-04-03 02:20:26'),
(189, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00', '13:30:00', 0, NULL, '2026-04-03 02:20:26'),
(190, 'Asr', 'العصر', 1, 1, 2026, '17:53:00', '18:30:00', 0, NULL, '2026-04-03 02:20:26'),
(191, 'Maghrib', 'المغرب', 1, 1, 2026, '20:07:00', '20:07:00', 0, NULL, '2026-04-03 02:20:26'),
(192, 'Isha', 'العشاء', 1, 1, 2026, '21:20:00', '21:30:00', 0, NULL, '2026-04-03 02:20:26'),
(193, 'Fajr', 'الفجر', 1, 1, 2026, '04:46:00', '05:45:00', 0, NULL, '2026-04-03 02:20:58'),
(194, 'Sunrise', 'الشروق', 1, 1, 2026, '06:09:00', '06:09:00', 0, NULL, '2026-04-03 02:20:58'),
(195, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:08:00', '13:30:00', 0, NULL, '2026-04-03 02:20:58'),
(196, 'Asr', 'العصر', 1, 1, 2026, '17:54:00', '18:30:00', 0, NULL, '2026-04-03 02:20:58'),
(197, 'Maghrib', 'المغرب', 1, 1, 2026, '20:09:00', '20:09:00', 0, NULL, '2026-04-03 02:20:58'),
(198, 'Isha', 'العشاء', 1, 1, 2026, '21:22:00', '21:30:00', 0, NULL, '2026-04-03 02:20:58'),
(199, 'Fajr', 'الفجر', 1, 1, 2026, '04:53:00', '05:45:00', 0, NULL, '2026-04-03 02:21:25'),
(200, 'Sunrise', 'الشروق', 1, 1, 2026, '06:07:00', '06:07:00', 0, NULL, '2026-04-03 02:21:25'),
(201, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00', '13:30:00', 0, NULL, '2026-04-03 02:21:25'),
(202, 'Asr', 'العصر', 1, 1, 2026, '17:55:00', '18:30:00', 0, NULL, '2026-04-03 02:21:25'),
(203, 'Maghrib', 'المغرب', 1, 1, 2026, '20:11:00', '20:11:00', 0, NULL, '2026-04-03 02:21:25'),
(204, 'Isha', 'العشاء', 1, 1, 2026, '21:24:00', '21:30:00', 0, NULL, '2026-04-03 02:21:25'),
(205, 'Fajr', 'الفجر', 1, 1, 2026, '04:41:00', '05:30:00', 0, NULL, '2026-04-03 02:22:05'),
(206, 'Sunrise', 'الشروق', 1, 1, 2026, '06:05:00', '06:05:00', 0, NULL, '2026-04-03 02:22:05'),
(207, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00', '13:30:00', 0, NULL, '2026-04-03 02:22:05'),
(208, 'Asr', 'العصر', 1, 1, 2026, '17:56:00', '18:30:00', 0, NULL, '2026-04-03 02:22:05'),
(209, 'Maghrib', 'المغرب', 1, 1, 2026, '20:13:00', '20:13:00', 0, NULL, '2026-04-03 02:22:05'),
(210, 'Isha', 'العشاء', 1, 1, 2026, '21:26:00', '22:00:00', 0, NULL, '2026-04-03 02:22:05'),
(211, 'Fajr', 'الفجر', 1, 1, 2026, '04:38:00', '05:30:00', 0, NULL, '2026-04-03 02:22:33'),
(212, 'Sunrise', 'الشروق', 1, 1, 2026, '06:02:00', '06:02:00', 0, NULL, '2026-04-03 02:22:33'),
(213, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00', '13:30:00', 0, NULL, '2026-04-03 02:22:33'),
(214, 'Asr', 'العصر', 1, 1, 2026, '17:57:00', '18:30:00', 0, NULL, '2026-04-03 02:22:33'),
(215, 'Maghrib', 'المغرب', 1, 1, 2026, '20:14:00', '20:14:00', 0, NULL, '2026-04-03 02:22:33'),
(216, 'Isha', 'العشاء', 1, 1, 2026, '21:28:00', '22:00:00', 0, NULL, '2026-04-03 02:22:33'),
(217, 'Fajr', 'الفجر', 1, 1, 2026, '04:35:00', '05:30:00', 0, NULL, '2026-04-03 02:23:01'),
(218, 'Sunrise', 'الشروق', 1, 1, 2026, '06:00:00', '06:00:00', 0, NULL, '2026-04-03 02:23:01'),
(219, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:07:00', '13:30:00', 0, NULL, '2026-04-03 02:23:01'),
(220, 'Asr', 'العصر', 1, 1, 2026, '17:58:00', '18:30:00', 0, NULL, '2026-04-03 02:23:01'),
(221, 'Maghrib', 'المغرب', 1, 1, 2026, '20:16:00', '20:16:00', 0, NULL, '2026-04-03 02:23:01'),
(222, 'Isha', 'العشاء', 1, 1, 2026, '21:30:00', '22:00:00', 0, NULL, '2026-04-03 02:23:01'),
(223, 'Fajr', 'الفجر', 1, 1, 2026, '04:32:00', '05:32:00', 0, NULL, '2026-04-03 02:23:31'),
(224, 'Sunrise', 'الشروق', 1, 1, 2026, '05:58:00', '05:58:00', 0, NULL, '2026-04-03 02:23:31'),
(225, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00', '13:30:00', 0, NULL, '2026-04-03 02:23:31'),
(226, 'Asr', 'العصر', 1, 1, 2026, '17:59:00', '18:30:00', 0, NULL, '2026-04-03 02:23:31'),
(227, 'Maghrib', 'المغرب', 1, 1, 2026, '20:18:00', '20:18:00', 0, NULL, '2026-04-03 02:23:31'),
(228, 'Isha', 'العشاء', 1, 1, 2026, '21:32:00', '22:00:00', 0, NULL, '2026-04-03 02:23:31'),
(229, 'Fajr', 'الفجر', 1, 1, 2026, '04:29:00', '05:30:00', 0, NULL, '2026-04-03 02:24:01'),
(230, 'Sunrise', 'الشروق', 1, 1, 2026, '05:56:00', '05:56:00', 0, NULL, '2026-04-03 02:24:01'),
(231, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00', '13:30:00', 0, NULL, '2026-04-03 02:24:01'),
(232, 'Asr', 'العصر', 1, 1, 2026, '18:00:00', '18:30:00', 0, NULL, '2026-04-03 02:24:01'),
(233, 'Maghrib', 'المغرب', 1, 1, 2026, '20:20:00', '20:20:00', 0, NULL, '2026-04-03 02:24:01'),
(234, 'Isha', 'العشاء', 1, 1, 2026, '21:34:00', '22:00:00', 0, NULL, '2026-04-03 02:24:01'),
(235, 'Fajr', 'الفجر', 1, 1, 2026, '04:26:00', '05:30:00', 0, NULL, '2026-04-03 02:24:27'),
(236, 'Sunrise', 'الشروق', 1, 1, 2026, '05:54:00', '05:54:00', 0, NULL, '2026-04-03 02:24:27'),
(237, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00', '13:30:00', 0, NULL, '2026-04-03 02:24:27'),
(238, 'Asr', 'العصر', 1, 1, 2026, '18:01:00', '18:30:00', 0, NULL, '2026-04-03 02:24:27'),
(239, 'Maghrib', 'المغرب', 1, 1, 2026, '20:21:00', '20:21:00', 0, NULL, '2026-04-03 02:24:27'),
(240, 'Isha', 'العشاء', 1, 1, 2026, '21:36:00', '22:00:00', 0, NULL, '2026-04-03 02:24:27'),
(241, 'Fajr', 'الفجر', 1, 1, 2026, '04:23:00', '05:30:00', 0, NULL, '2026-04-03 02:24:57'),
(242, 'Sunrise', 'الشروق', 1, 1, 2026, '05:52:00', '05:52:00', 0, NULL, '2026-04-03 02:24:57'),
(243, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00', '13:30:00', 0, NULL, '2026-04-03 02:24:57'),
(244, 'Asr', 'العصر', 1, 1, 2026, '18:02:00', '18:30:00', 0, NULL, '2026-04-03 02:24:57'),
(245, 'Maghrib', 'المغرب', 1, 1, 2026, '20:23:00', '20:23:00', 0, NULL, '2026-04-03 02:24:57'),
(246, 'Isha', 'العشاء', 1, 1, 2026, '21:38:00', '22:00:00', 0, NULL, '2026-04-03 02:24:57'),
(247, 'Fajr', 'الفجر', 1, 1, 2026, '04:20:00', '05:15:00', 0, NULL, '2026-04-03 02:27:39'),
(248, 'Sunrise', 'الشروق', 1, 1, 2026, '05:50:00', '05:50:00', 0, NULL, '2026-04-03 02:27:39'),
(249, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00', '13:30:00', 0, NULL, '2026-04-03 02:27:39'),
(250, 'Asr', 'العصر', 1, 1, 2026, '18:03:00', '19:00:00', 0, NULL, '2026-04-03 02:27:39'),
(251, 'Maghrib', 'المغرب', 1, 1, 2026, '20:25:00', '20:25:00', 0, NULL, '2026-04-03 02:27:39'),
(252, 'Isha', 'العشاء', 1, 1, 2026, '21:40:00', '22:00:00', 0, NULL, '2026-04-03 02:27:39'),
(253, 'Fajr', 'الفجر', 1, 1, 2026, '04:17:00', '05:15:00', 0, NULL, '2026-04-03 02:28:31'),
(254, 'Sunrise', 'الشروق', 1, 1, 2026, '05:50:00', '05:50:00', 0, NULL, '2026-04-03 02:28:31'),
(255, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:06:00', '13:30:00', 0, NULL, '2026-04-03 02:28:31'),
(256, 'Asr', 'العصر', 1, 1, 2026, '18:04:00', '19:00:00', 0, NULL, '2026-04-03 02:28:31'),
(257, 'Maghrib', 'المغرب', 1, 1, 2026, '20:26:00', '20:26:00', 0, NULL, '2026-04-03 02:28:31'),
(258, 'Isha', 'العشاء', 1, 1, 2026, '21:42:00', '22:00:00', 0, NULL, '2026-04-03 02:28:31'),
(259, 'Fajr', 'الفجر', 1, 1, 2026, '04:14:00', '05:15:00', 0, NULL, '2026-04-03 02:28:59'),
(260, 'Sunrise', 'الشروق', 1, 1, 2026, '05:46:00', '05:46:00', 0, NULL, '2026-04-03 02:28:59'),
(261, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00', '13:30:00', 0, NULL, '2026-04-03 02:28:59'),
(262, 'Asr', 'العصر', 1, 1, 2026, '18:05:00', '19:00:00', 0, NULL, '2026-04-03 02:28:59'),
(263, 'Maghrib', 'المغرب', 1, 1, 2026, '20:28:00', '20:28:00', 0, NULL, '2026-04-03 02:28:59'),
(264, 'Isha', 'العشاء', 1, 1, 2026, '21:44:00', '22:00:00', 0, NULL, '2026-04-03 02:28:59'),
(265, 'Fajr', 'الفجر', 1, 1, 2026, '04:11:00', '05:15:00', 0, NULL, '2026-04-03 02:29:27'),
(266, 'Sunrise', 'الشروق', 1, 1, 2026, '05:44:00', '05:44:00', 0, NULL, '2026-04-03 02:29:27'),
(267, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00', '13:30:00', 0, NULL, '2026-04-03 02:29:27'),
(268, 'Asr', 'العصر', 1, 1, 2026, '18:06:00', '19:00:00', 0, NULL, '2026-04-03 02:29:27'),
(269, 'Maghrib', 'المغرب', 1, 1, 2026, '20:30:00', '20:30:00', 0, NULL, '2026-04-03 02:29:27'),
(270, 'Isha', 'العشاء', 1, 1, 2026, '21:46:00', '22:00:00', 0, NULL, '2026-04-03 02:29:27'),
(271, 'Fajr', 'الفجر', 1, 1, 2026, '04:07:00', '05:15:00', 0, NULL, '2026-04-03 02:29:54'),
(272, 'Sunrise', 'الشروق', 1, 1, 2026, '05:41:00', '05:41:00', 0, NULL, '2026-04-03 02:29:54'),
(273, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00', '13:30:00', 0, NULL, '2026-04-03 02:29:54'),
(274, 'Asr', 'العصر', 1, 1, 2026, '18:07:00', '19:00:00', 0, NULL, '2026-04-03 02:29:54'),
(275, 'Maghrib', 'المغرب', 1, 1, 2026, '20:32:00', '20:32:00', 0, NULL, '2026-04-03 02:29:54'),
(276, 'Isha', 'العشاء', 1, 1, 2026, '21:48:00', '22:00:00', 0, NULL, '2026-04-03 02:29:54'),
(277, 'Fajr', 'الفجر', 1, 1, 2026, '04:03:00', '05:15:00', 0, NULL, '2026-04-03 02:30:21'),
(278, 'Sunrise', 'الشروق', 1, 1, 2026, '05:40:00', '05:40:00', 0, NULL, '2026-04-03 02:30:21'),
(279, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00', '13:30:00', 0, NULL, '2026-04-03 02:30:21'),
(280, 'Asr', 'العصر', 1, 1, 2026, '18:08:00', '19:00:00', 0, NULL, '2026-04-03 02:30:21'),
(281, 'Maghrib', 'المغرب', 1, 1, 2026, '20:33:00', '21:49:00', 0, NULL, '2026-04-03 02:30:21'),
(282, 'Isha', 'العشاء', 1, 1, 2026, '21:49:00', '22:00:00', 0, NULL, '2026-04-03 02:30:21'),
(283, 'Fajr', 'الفجر', 1, 1, 2026, '04:00:00', '05:15:00', 0, NULL, '2026-04-03 02:30:47'),
(284, 'Sunrise', 'الشروق', 1, 1, 2026, '05:38:00', '05:38:00', 0, NULL, '2026-04-03 02:30:47'),
(285, 'Dhuhr', 'الظهر', 1, 1, 2026, '13:05:00', '13:30:00', 0, NULL, '2026-04-03 02:30:47'),
(286, 'Asr', 'العصر', 1, 1, 2026, '18:09:00', '19:00:00', 0, NULL, '2026-04-03 02:30:47'),
(287, 'Maghrib', 'المغرب', 1, 1, 2026, '20:35:00', '20:35:00', 0, NULL, '2026-04-03 02:30:47'),
(288, 'Isha', 'العشاء', 1, 1, 2026, '21:50:00', '22:00:00', 0, NULL, '2026-04-03 02:30:47');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('0CSlchXk8r6CMnTJbCRfnfXIiTFYWwClMGerk58m', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiREpMTjN0Q2w1MkxnNWhldXp5TnViSHk3ZENjREFxVGwxcHpsMGs0QiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1768897648);

-- --------------------------------------------------------

--
-- Table structure for table `slider_images`
--

CREATE TABLE `slider_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `image_name` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `slider_images`
--

INSERT INTO `slider_images` (`id`, `image_name`, `is_active`, `created_at`, `updated_at`) VALUES
(7, 'storage/slider/1769153865_1.jpg', 1, '2026-01-23 02:37:46', '2026-01-23 02:37:46'),
(8, 'storage/slider/1769608329_1769528657_Untitled design.webp', 1, '2026-01-28 08:52:10', '2026-01-28 08:52:10'),
(9, 'storage/slider/1772782636_2.jpg', 1, '2026-03-06 02:37:17', '2026-03-06 02:37:17'),
(10, 'images/slider/1.jpg', 1, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(11, 'images/slider/2.jpg', 1, '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(12, 'images/slider/3.jpg', 1, '2026-04-08 08:02:56', '2026-04-08 08:02:56');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `roll_number` varchar(50) NOT NULL,
  `status` enum('active','inactive','suspended','graduated','discontinued') NOT NULL DEFAULT 'active',
  `date_of_birth` date NOT NULL,
  `gender` enum('male','female') NOT NULL,
  `address` varchar(150) DEFAULT NULL,
  `primary_contact_details` varchar(500) NOT NULL COMMENT '(DC2Type: Array)',
  `secondary_contact_details` varchar(500) DEFAULT NULL COMMENT '(DC2Type: Array)',
  `medical_history` longtext DEFAULT NULL,
  `allowed_medicines` varchar(500) DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  `admission_fee_amount` decimal(10,2) DEFAULT NULL,
  `monthly_fee_amount` decimal(10,2) DEFAULT NULL,
  `fee_due_day` tinyint(4) DEFAULT NULL,
  `default_payment_method` enum('cash','online','direct-debit') NOT NULL DEFAULT 'cash',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `parent_id`, `class_id`, `first_name`, `last_name`, `roll_number`, `status`, `date_of_birth`, `gender`, `address`, `primary_contact_details`, `secondary_contact_details`, `medical_history`, `allowed_medicines`, `admission_date`, `admission_fee_amount`, `monthly_fee_amount`, `fee_due_day`, `default_payment_method`, `created_at`, `updated_at`) VALUES
(1, 7, 1, 'Student1', 'Lastname1', 'REG-1000', 'active', '2014-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 912.00, 10, 'cash', '2026-04-08 08:01:29', '2026-04-08 08:01:29'),
(2, 7, 1, 'Student2', 'Lastname2', 'REG-1001', 'active', '2015-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 980.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(3, 7, 2, 'Student3', 'Lastname3', 'REG-1002', 'active', '2020-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1634.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(4, 7, 2, 'Student4', 'Lastname4', 'REG-1003', 'active', '2018-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1589.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(5, 7, 3, 'Student5', 'Lastname5', 'REG-1004', 'active', '2017-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1655.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(6, 7, 3, 'Student6', 'Lastname6', 'REG-1005', 'active', '2018-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1476.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(7, 7, 4, 'Student7', 'Lastname7', 'REG-1006', 'active', '2016-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1257.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(8, 7, 4, 'Student8', 'Lastname8', 'REG-1007', 'active', '2017-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 911.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(9, 7, 5, 'Student9', 'Lastname9', 'REG-1008', 'active', '2018-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1196.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(10, 7, 5, 'Student10', 'Lastname10', 'REG-1009', 'active', '2018-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1027.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(11, 7, 6, 'Student11', 'Lastname11', 'REG-1010', 'active', '2020-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1277.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(12, 7, 6, 'Student12', 'Lastname12', 'REG-1011', 'active', '2019-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1808.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(13, 7, 7, 'Student13', 'Lastname13', 'REG-1012', 'active', '2014-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1110.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(14, 7, 7, 'Student14', 'Lastname14', 'REG-1013', 'active', '2017-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1514.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(15, 7, 8, 'Student15', 'Lastname15', 'REG-1014', 'active', '2018-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1531.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(16, 7, 8, 'Student16', 'Lastname16', 'REG-1015', 'active', '2020-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1185.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(17, 7, 9, 'Student17', 'Lastname17', 'REG-1016', 'active', '2015-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1132.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(18, 7, 9, 'Student18', 'Lastname18', 'REG-1017', 'active', '2014-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1057.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(19, 7, 10, 'Student19', 'Lastname19', 'REG-1018', 'active', '2019-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1520.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(20, 7, 10, 'Student20', 'Lastname20', 'REG-1019', 'active', '2016-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1266.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(21, 7, 11, 'Student21', 'Lastname21', 'REG-1020', 'active', '2020-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1486.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(22, 7, 11, 'Student22', 'Lastname22', 'REG-1021', 'active', '2014-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1690.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(23, 7, 12, 'Student23', 'Lastname23', 'REG-1022', 'active', '2018-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 962.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(24, 7, 12, 'Student24', 'Lastname24', 'REG-1023', 'active', '2014-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1043.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(25, 7, 13, 'Student25', 'Lastname25', 'REG-1024', 'active', '2016-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1898.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(26, 7, 13, 'Student26', 'Lastname26', 'REG-1025', 'active', '2020-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1715.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(27, 7, 14, 'Student27', 'Lastname27', 'REG-1026', 'active', '2016-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1876.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(28, 7, 14, 'Student28', 'Lastname28', 'REG-1027', 'active', '2016-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 994.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(29, 7, 15, 'Student29', 'Lastname29', 'REG-1028', 'active', '2014-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 827.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(30, 7, 15, 'Student30', 'Lastname30', 'REG-1029', 'active', '2020-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent1\";s:9:\"last_name\";s:9:\"Lastname1\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000001\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1546.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(31, 8, 1, 'Student31', 'Lastname31', 'REG-1030', 'active', '2019-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 845.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(32, 8, 1, 'Student32', 'Lastname32', 'REG-1031', 'active', '2014-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1552.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(33, 8, 2, 'Student33', 'Lastname33', 'REG-1032', 'active', '2017-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1439.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(34, 8, 2, 'Student34', 'Lastname34', 'REG-1033', 'active', '2020-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1984.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(35, 8, 3, 'Student35', 'Lastname35', 'REG-1034', 'active', '2015-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 990.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(36, 8, 3, 'Student36', 'Lastname36', 'REG-1035', 'active', '2019-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1584.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(37, 8, 4, 'Student37', 'Lastname37', 'REG-1036', 'active', '2016-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 811.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(38, 8, 4, 'Student38', 'Lastname38', 'REG-1037', 'active', '2018-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1881.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(39, 8, 5, 'Student39', 'Lastname39', 'REG-1038', 'active', '2015-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1088.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(40, 8, 5, 'Student40', 'Lastname40', 'REG-1039', 'active', '2019-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1785.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(41, 8, 6, 'Student41', 'Lastname41', 'REG-1040', 'active', '2018-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1406.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(42, 8, 6, 'Student42', 'Lastname42', 'REG-1041', 'active', '2014-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1207.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(43, 8, 7, 'Student43', 'Lastname43', 'REG-1042', 'active', '2016-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1081.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(44, 8, 7, 'Student44', 'Lastname44', 'REG-1043', 'active', '2018-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1977.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(45, 8, 8, 'Student45', 'Lastname45', 'REG-1044', 'active', '2020-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 939.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(46, 8, 8, 'Student46', 'Lastname46', 'REG-1045', 'active', '2018-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1799.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(47, 8, 9, 'Student47', 'Lastname47', 'REG-1046', 'active', '2016-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 957.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(48, 8, 9, 'Student48', 'Lastname48', 'REG-1047', 'active', '2015-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1675.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(49, 8, 10, 'Student49', 'Lastname49', 'REG-1048', 'active', '2018-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1666.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(50, 8, 10, 'Student50', 'Lastname50', 'REG-1049', 'active', '2018-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1271.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(51, 8, 11, 'Student51', 'Lastname51', 'REG-1050', 'active', '2014-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1876.00, 10, 'cash', '2026-04-08 08:02:55', '2026-04-08 08:02:55'),
(52, 8, 11, 'Student52', 'Lastname52', 'REG-1051', 'active', '2020-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 872.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(53, 8, 12, 'Student53', 'Lastname53', 'REG-1052', 'active', '2019-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1288.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(54, 8, 12, 'Student54', 'Lastname54', 'REG-1053', 'active', '2020-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1230.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(55, 8, 13, 'Student55', 'Lastname55', 'REG-1054', 'active', '2019-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1144.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(56, 8, 13, 'Student56', 'Lastname56', 'REG-1055', 'active', '2015-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1049.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(57, 8, 14, 'Student57', 'Lastname57', 'REG-1056', 'active', '2017-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1760.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(58, 8, 14, 'Student58', 'Lastname58', 'REG-1057', 'active', '2016-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1412.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(59, 8, 15, 'Student59', 'Lastname59', 'REG-1058', 'active', '2018-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1493.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(60, 8, 15, 'Student60', 'Lastname60', 'REG-1059', 'active', '2020-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent2\";s:9:\"last_name\";s:9:\"Lastname2\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000002\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1709.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(61, 9, 1, 'Student61', 'Lastname61', 'REG-1060', 'active', '2015-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1872.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(62, 9, 1, 'Student62', 'Lastname62', 'REG-1061', 'active', '2019-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 832.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(63, 9, 2, 'Student63', 'Lastname63', 'REG-1062', 'active', '2020-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1335.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(64, 9, 2, 'Student64', 'Lastname64', 'REG-1063', 'active', '2019-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1545.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(65, 9, 3, 'Student65', 'Lastname65', 'REG-1064', 'active', '2017-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1903.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(66, 9, 3, 'Student66', 'Lastname66', 'REG-1065', 'active', '2020-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1020.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(67, 9, 4, 'Student67', 'Lastname67', 'REG-1066', 'active', '2016-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 981.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(68, 9, 4, 'Student68', 'Lastname68', 'REG-1067', 'active', '2020-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1751.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(69, 9, 5, 'Student69', 'Lastname69', 'REG-1068', 'active', '2019-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1759.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(70, 9, 5, 'Student70', 'Lastname70', 'REG-1069', 'active', '2017-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1116.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(71, 9, 6, 'Student71', 'Lastname71', 'REG-1070', 'active', '2016-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 977.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(72, 9, 6, 'Student72', 'Lastname72', 'REG-1071', 'active', '2020-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1864.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(73, 9, 7, 'Student73', 'Lastname73', 'REG-1072', 'active', '2018-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1422.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(74, 9, 7, 'Student74', 'Lastname74', 'REG-1073', 'active', '2019-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1807.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(75, 9, 8, 'Student75', 'Lastname75', 'REG-1074', 'active', '2019-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1748.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(76, 9, 8, 'Student76', 'Lastname76', 'REG-1075', 'active', '2018-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1720.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(77, 9, 9, 'Student77', 'Lastname77', 'REG-1076', 'active', '2020-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1896.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(78, 9, 9, 'Student78', 'Lastname78', 'REG-1077', 'active', '2020-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1063.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(79, 9, 10, 'Student79', 'Lastname79', 'REG-1078', 'active', '2014-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1391.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(80, 9, 10, 'Student80', 'Lastname80', 'REG-1079', 'active', '2015-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1864.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(81, 9, 11, 'Student81', 'Lastname81', 'REG-1080', 'active', '2018-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1729.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(82, 9, 11, 'Student82', 'Lastname82', 'REG-1081', 'active', '2016-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1094.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(83, 9, 12, 'Student83', 'Lastname83', 'REG-1082', 'active', '2017-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 804.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(84, 9, 12, 'Student84', 'Lastname84', 'REG-1083', 'active', '2016-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1290.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(85, 9, 13, 'Student85', 'Lastname85', 'REG-1084', 'active', '2018-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1442.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(86, 9, 13, 'Student86', 'Lastname86', 'REG-1085', 'active', '2016-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1305.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(87, 9, 14, 'Student87', 'Lastname87', 'REG-1086', 'active', '2019-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1950.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(88, 9, 14, 'Student88', 'Lastname88', 'REG-1087', 'active', '2017-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1494.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(89, 9, 15, 'Student89', 'Lastname89', 'REG-1088', 'active', '2018-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1117.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(90, 9, 15, 'Student90', 'Lastname90', 'REG-1089', 'active', '2017-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent3\";s:9:\"last_name\";s:9:\"Lastname3\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000003\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 954.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(91, 10, 1, 'Student91', 'Lastname91', 'REG-1090', 'active', '2017-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 996.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(92, 10, 1, 'Student92', 'Lastname92', 'REG-1091', 'active', '2016-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 807.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(93, 10, 2, 'Student93', 'Lastname93', 'REG-1092', 'active', '2020-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1945.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(94, 10, 2, 'Student94', 'Lastname94', 'REG-1093', 'active', '2014-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1791.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(95, 10, 3, 'Student95', 'Lastname95', 'REG-1094', 'active', '2017-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 848.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(96, 10, 3, 'Student96', 'Lastname96', 'REG-1095', 'active', '2017-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1162.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(97, 10, 4, 'Student97', 'Lastname97', 'REG-1096', 'active', '2014-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1341.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(98, 10, 4, 'Student98', 'Lastname98', 'REG-1097', 'active', '2016-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 892.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(99, 10, 5, 'Student99', 'Lastname99', 'REG-1098', 'active', '2020-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1130.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(100, 10, 5, 'Student100', 'Lastname100', 'REG-1099', 'active', '2020-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1002.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(101, 10, 6, 'Student101', 'Lastname101', 'REG-1100', 'active', '2016-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1147.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(102, 10, 6, 'Student102', 'Lastname102', 'REG-1101', 'active', '2020-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1360.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(103, 10, 7, 'Student103', 'Lastname103', 'REG-1102', 'active', '2020-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1500.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(104, 10, 7, 'Student104', 'Lastname104', 'REG-1103', 'active', '2016-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1410.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(105, 10, 8, 'Student105', 'Lastname105', 'REG-1104', 'active', '2018-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 923.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(106, 10, 8, 'Student106', 'Lastname106', 'REG-1105', 'active', '2020-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1921.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(107, 10, 9, 'Student107', 'Lastname107', 'REG-1106', 'active', '2016-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1628.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(108, 10, 9, 'Student108', 'Lastname108', 'REG-1107', 'active', '2014-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1951.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(109, 10, 10, 'Student109', 'Lastname109', 'REG-1108', 'active', '2019-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1641.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(110, 10, 10, 'Student110', 'Lastname110', 'REG-1109', 'active', '2014-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1670.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(111, 10, 11, 'Student111', 'Lastname111', 'REG-1110', 'active', '2020-04-08', 'female', 'Block B-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 824.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(112, 10, 11, 'Student112', 'Lastname112', 'REG-1111', 'active', '2015-04-08', 'male', 'Block B-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 895.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(113, 10, 12, 'Student113', 'Lastname113', 'REG-1112', 'active', '2020-04-08', 'female', 'Block B-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 1546.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(114, 10, 12, 'Student114', 'Lastname114', 'REG-1113', 'active', '2019-04-08', 'male', 'Block B-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 854.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(115, 10, 13, 'Student115', 'Lastname115', 'REG-1114', 'active', '2016-04-08', 'female', 'Block G-1, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1368.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(116, 10, 13, 'Student116', 'Lastname116', 'REG-1115', 'active', '2018-04-08', 'male', 'Block G-1, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2024-04-08', 100.00, 949.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(117, 10, 14, 'Student117', 'Lastname117', 'REG-1116', 'active', '2020-04-08', 'female', 'Block G-2, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1658.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(118, 10, 14, 'Student118', 'Lastname118', 'REG-1117', 'active', '2020-04-08', 'male', 'Block G-2, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1526.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(119, 10, 15, 'Student119', 'Lastname119', 'REG-1118', 'active', '2016-04-08', 'female', 'Block Hifz, Street 1', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2025-04-08', 100.00, 1603.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56'),
(120, 10, 15, 'Student120', 'Lastname120', 'REG-1119', 'active', '2018-04-08', 'male', 'Block Hifz, Street 2', 'a:4:{s:10:\"first_name\";s:7:\"Parent4\";s:9:\"last_name\";s:9:\"Lastname4\";s:8:\"relation\";s:6:\"Parent\";s:14:\"contact_number\";s:12:\"923310000004\";}', NULL, NULL, NULL, '2023-04-08', 100.00, 1153.00, 10, 'cash', '2026-04-08 08:02:56', '2026-04-08 08:02:56');

-- --------------------------------------------------------

--
-- Table structure for table `student_attendances`
--

CREATE TABLE `student_attendances` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_report_cards`
--

CREATE TABLE `student_report_cards` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED DEFAULT NULL,
  `teacher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `achievements` varchar(191) NOT NULL COMMENT '(DC2Type: Array)',
  `behavior` longtext NOT NULL COMMENT '(DC2Type: Array)',
  `class_attendance` longtext NOT NULL COMMENT '(DC2Type: Array)',
  `parent_comments` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_attendances`
--

CREATE TABLE `teacher_attendances` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_profiles`
--

CREATE TABLE `teacher_profiles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `joining_date` date NOT NULL,
  `salary` decimal(10,2) NOT NULL,
  `salary_day` enum('Monday','Tuesday','Wednesday','Thursday','Friday') NOT NULL DEFAULT 'Friday',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teacher_profiles`
--

INSERT INTO `teacher_profiles` (`id`, `teacher_id`, `joining_date`, `salary`, `salary_day`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, '2024-01-20', 55000.00, 'Friday', 'active', '2026-01-20 03:24:23', '2026-01-20 03:24:23'),
(2, 3, '2024-01-20', 60000.00, 'Friday', 'active', '2026-01-20 03:24:24', '2026-01-20 03:24:24'),
(3, 4, '2024-01-20', 65000.00, 'Friday', 'active', '2026-01-20 03:24:24', '2026-01-20 03:24:24'),
(4, 5, '2024-01-20', 70000.00, 'Friday', 'active', '2026-01-20 03:24:24', '2026-01-20 03:24:24'),
(5, 6, '2024-01-20', 75000.00, 'Friday', 'active', '2026-01-20 03:24:24', '2026-01-20 03:24:24'),
(6, 12, '2026-05-18', 445.00, 'Friday', 'active', '2026-05-18 01:52:56', '2026-05-18 01:52:56'),
(7, 13, '2026-05-18', 44.00, 'Friday', 'active', '2026-05-18 01:57:13', '2026-05-18 01:57:13'),
(8, 14, '2026-06-23', 566.00, 'Friday', 'active', '2026-06-23 02:33:07', '2026-06-23 02:33:07');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('parent','teacher','admin') NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(50) DEFAULT NULL,
  `password` varchar(100) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `image` varchar(255) DEFAULT NULL,
  `contact_number` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `type`, `first_name`, `last_name`, `email`, `password`, `status`, `image`, `contact_number`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'Ahsan', 'Hanif', 'ahsanhanif99@gmail.com', '$2y$12$UvTqc59Eh6/i5MyJ8HR5AufdrseM8G0HkoW8XKe/B3bM6qYu31d36', 1, NULL, '923300000001', '2026-01-20 03:24:23', '2026-01-20 03:24:23'),
(2, 'teacher', 'Teacher1', 'Lastname1', 'teacher1@gmail.com', '$2y$12$UQ17Fpjhc/JVVJpuODlWSu2.F2va3CXgdsHyw4aHbcNa6vfUuRH76', 1, NULL, '923300000001', '2026-01-20 03:24:23', '2026-01-20 03:24:23'),
(3, 'teacher', 'Teacher2', 'Lastname2', 'teacher2@gmail.com', '$2y$12$WmRaCVwgJIZTRnsAqHvqqufXggegghE3.oe5yfwx24HjU6ASuwkU6', 1, NULL, '923300000002', '2026-01-20 03:24:24', '2026-01-20 03:24:24'),
(4, 'teacher', 'Teacher3', 'Lastname3', 'teacher3@gmail.com', '$2y$12$2DEkuN1/sT5fsOAF1vd73OVDjjUDhivtz84TJCPtaVNowsHVf265W', 1, NULL, '923300000003', '2026-01-20 03:24:24', '2026-01-20 03:24:24'),
(5, 'teacher', 'Teacher4', 'Lastname4', 'teacher4@gmail.com', '$2y$12$vDRkxwTJWTfLXhlaJI5F2u6krdOEWOH6XjpIlXC5SdT319HOOSJKW', 1, NULL, '923300000004', '2026-01-20 03:24:24', '2026-01-20 03:24:24'),
(6, 'teacher', 'Teacher5', 'Lastname5', 'teacher5@gmail.com', '$2y$12$.NpDsAxK.yXzG8/4QeQ1WO6Jv12pqcMGJKrC8t/jVY79yiZWtF0IO', 1, NULL, '923300000005', '2026-01-20 03:24:24', '2026-01-20 03:24:24'),
(7, 'parent', 'Parent1', 'Lastname1', 'parent1@gmail.com', '$2y$12$TKZ6f5hDNuU/ocsFMjVlV./hkv9HMOJrgCnDX6k3jCtNgLxgdQa7y', 1, NULL, '923310000001', '2026-01-20 03:24:25', '2026-01-20 03:24:25'),
(8, 'parent', 'Parent2', 'Lastname2', 'parent2@gmail.com', '$2y$12$H4HX/lpcz9Imt75QTC4dROTdn.DWUBs/MZsO2zEp..bl6ww7VLgS6', 1, NULL, '923310000002', '2026-01-20 03:24:25', '2026-01-20 03:24:25'),
(9, 'parent', 'Parent3', 'Lastname3', 'parent3@gmail.com', '$2y$12$GIKT958Jzfk5BSnfOgw/HeSGsiH5qZnJ5kQxoXhJZRuXR1wAsHJxq', 1, NULL, '923310000003', '2026-01-20 03:24:25', '2026-01-20 03:24:25'),
(10, 'parent', 'Parent4', 'Lastname4', 'parent4@gmail.com', '$2y$12$gwF.K.AXHJulwPOeYQ52j.kE94JU.R5azZAfg2bbpgLqI/Jdc1HYi', 1, NULL, '923310000004', '2026-01-20 03:24:26', '2026-01-20 03:24:26'),
(12, 'teacher', 'test', 'teacher', NULL, '$2y$12$gVmxie.gcDz8S3he251RBO3T3VwKNcGWNivTEic/s0vND6UrLaDTO', 1, NULL, '326527836', '2026-05-18 01:52:56', '2026-05-18 01:52:56'),
(13, 'teacher', 'test', 'teacher 2', NULL, '$2y$12$Sn6Lj3p.OpSPq/SpcGrJWuK3BLbb2x6kc1EI9/UjC.F9koyCYVD1O', 1, NULL, '495728', '2026-05-18 01:57:13', '2026-05-18 01:57:13'),
(14, 'teacher', 'new', '7090', 'new@email.com', '$2y$12$5OWsAqjESDpfbRNZFSdroe.JxugblHEnVOmKyT1gp8N3tdCXKe.ey', 1, NULL, '37463824632', '2026-06-23 02:33:07', '2026-06-23 02:33:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance_batches`
--
ALTER TABLE `attendance_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attendance_batches_date_class_type_unique` (`date`,`type`,`class_id`),
  ADD KEY `attendance_batches_class_id_foreign` (`class_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `classes_teacher_id_foreign` (`teacher_id`);

--
-- Indexes for table `document_uplouds`
--
ALTER TABLE `document_uplouds`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `event_announcements`
--
ALTER TABLE `event_announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_announcements_name_foreign` (`name`);

--
-- Indexes for table `expense_logs`
--
ALTER TABLE `expense_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `incident_logs`
--
ALTER TABLE `incident_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `incident_logs_student_id_foreign` (`student_id`);

--
-- Indexes for table `medical_logs`
--
ALTER TABLE `medical_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `medical_logs_student_id_foreign` (`student_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `payment_invoices`
--
ALTER TABLE `payment_invoices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_methods_user_id_foreign` (`user_id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `prayer_timings`
--
ALTER TABLE `prayer_timings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `slider_images`
--
ALTER TABLE `slider_images`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `students_roll_number_unique` (`roll_number`),
  ADD KEY `students_parent_id_foreign` (`parent_id`),
  ADD KEY `students_class_id_foreign` (`class_id`);

--
-- Indexes for table `student_attendances`
--
ALTER TABLE `student_attendances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_attendances_student_id_batch_id_unique` (`student_id`,`batch_id`),
  ADD KEY `student_attendances_batch_id_foreign` (`batch_id`);

--
-- Indexes for table `student_report_cards`
--
ALTER TABLE `student_report_cards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_report_cards_student_id_foreign` (`student_id`),
  ADD KEY `student_report_cards_class_id_foreign` (`class_id`),
  ADD KEY `student_report_cards_teacher_id_foreign` (`teacher_id`);

--
-- Indexes for table `teacher_attendances`
--
ALTER TABLE `teacher_attendances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teacher_attendances_teacher_id_batch_id_unique` (`teacher_id`,`batch_id`),
  ADD KEY `teacher_attendances_batch_id_foreign` (`batch_id`);

--
-- Indexes for table `teacher_profiles`
--
ALTER TABLE `teacher_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `teacher_profiles_teacher_id_foreign` (`teacher_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance_batches`
--
ALTER TABLE `attendance_batches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `document_uplouds`
--
ALTER TABLE `document_uplouds`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `event_announcements`
--
ALTER TABLE `event_announcements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expense_logs`
--
ALTER TABLE `expense_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `incident_logs`
--
ALTER TABLE `incident_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `medical_logs`
--
ALTER TABLE `medical_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `news`
--
ALTER TABLE `news`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `payment_invoices`
--
ALTER TABLE `payment_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=239;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `prayer_timings`
--
ALTER TABLE `prayer_timings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=289;

--
-- AUTO_INCREMENT for table `slider_images`
--
ALTER TABLE `slider_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=122;

--
-- AUTO_INCREMENT for table `student_attendances`
--
ALTER TABLE `student_attendances`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_report_cards`
--
ALTER TABLE `student_report_cards`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teacher_attendances`
--
ALTER TABLE `teacher_attendances`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teacher_profiles`
--
ALTER TABLE `teacher_profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance_batches`
--
ALTER TABLE `attendance_batches`
  ADD CONSTRAINT `attendance_batches_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `event_announcements`
--
ALTER TABLE `event_announcements`
  ADD CONSTRAINT `event_announcements_name_foreign` FOREIGN KEY (`name`) REFERENCES `classes` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `incident_logs`
--
ALTER TABLE `incident_logs`
  ADD CONSTRAINT `incident_logs_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `medical_logs`
--
ALTER TABLE `medical_logs`
  ADD CONSTRAINT `medical_logs_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD CONSTRAINT `payment_methods_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `students_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `student_attendances`
--
ALTER TABLE `student_attendances`
  ADD CONSTRAINT `student_attendances_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `attendance_batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_attendances_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_report_cards`
--
ALTER TABLE `student_report_cards`
  ADD CONSTRAINT `student_report_cards_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_report_cards_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_report_cards_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `teacher_attendances`
--
ALTER TABLE `teacher_attendances`
  ADD CONSTRAINT `teacher_attendances_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `attendance_batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teacher_attendances_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teacher_profiles`
--
ALTER TABLE `teacher_profiles`
  ADD CONSTRAINT `teacher_profiles_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
