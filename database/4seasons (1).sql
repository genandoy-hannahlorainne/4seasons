-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 13, 2026 at 12:19 AM
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
-- Database: `4seasons`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `log_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(150) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`log_id`, `user_id`, `action`, `details`, `ip_address`, `created_at`) VALUES
(19, 8, 'Registration', NULL, '::1', '2026-01-12 05:55:32'),
(20, 8, 'Login', NULL, '::1', '2026-01-12 05:56:07'),
(21, 9, 'Registration', NULL, '::1', '2026-01-12 06:03:32'),
(22, 10, 'Registration', NULL, '::1', '2026-01-12 06:03:34'),
(23, 10, 'Login', NULL, '::1', '2026-01-12 06:03:35'),
(24, 9, 'Login', NULL, '::1', '2026-01-12 06:04:27'),
(25, 11, 'Registration', NULL, '::1', '2026-01-12 06:04:54'),
(26, 11, 'Login', NULL, '::1', '2026-01-12 06:05:10'),
(27, 12, 'Registration', NULL, '::1', '2026-01-12 06:07:16'),
(28, 12, 'Login', NULL, '::1', '2026-01-12 06:07:18'),
(29, 13, 'Registration', NULL, '::1', '2026-01-12 06:07:43'),
(30, 13, 'Login', NULL, '::1', '2026-01-12 06:07:43'),
(31, 14, 'Registration', NULL, '::1', '2026-01-12 06:22:29'),
(32, 14, 'Login', NULL, '::1', '2026-01-12 06:22:29'),
(33, 15, 'Registration', NULL, '::1', '2026-01-12 06:22:30'),
(34, 16, 'Registration', NULL, '::1', '2026-01-12 06:25:17'),
(35, 16, 'Login', NULL, '::1', '2026-01-12 06:25:18'),
(36, 17, 'Registration', NULL, '::1', '2026-01-12 06:25:19'),
(37, 18, 'Registration', NULL, '::1', '2026-01-12 06:25:20'),
(38, 19, 'Registration', NULL, '::1', '2026-01-12 06:30:14'),
(39, 19, 'Login', NULL, '::1', '2026-01-12 06:30:20'),
(40, 20, 'Registration', NULL, '::1', '2026-01-12 06:32:45'),
(41, 20, 'Login', NULL, '::1', '2026-01-12 06:32:47'),
(42, 21, 'Registration', NULL, '::1', '2026-01-12 06:42:48'),
(43, 21, 'Login', NULL, '::1', '2026-01-12 06:42:49'),
(44, 19, 'Login', NULL, '::1', '2026-01-12 06:48:36'),
(45, 22, 'Registration', NULL, '::1', '2026-01-12 06:50:10'),
(46, 22, 'Login', NULL, '::1', '2026-01-12 06:50:11'),
(47, 25, 'Registration', NULL, '::1', '2026-01-12 07:00:10'),
(48, 25, 'Login', NULL, '::1', '2026-01-12 07:00:16'),
(49, 25, 'Login', NULL, '::1', '2026-01-12 07:09:32'),
(50, 26, 'Registration', NULL, '::1', '2026-01-12 07:51:26'),
(51, 26, 'Login', NULL, '::1', '2026-01-12 07:51:35'),
(52, 26, 'Login', NULL, '::1', '2026-01-12 08:10:21'),
(53, 30, 'Registration', NULL, '::1', '2026-01-12 08:26:17'),
(54, 30, 'Login', NULL, '::1', '2026-01-12 08:26:25'),
(55, 31, 'Registration', NULL, '::1', '2026-01-12 08:27:05'),
(56, 31, 'Login', NULL, '::1', '2026-01-12 08:27:12'),
(57, 30, 'Login', NULL, '::1', '2026-01-12 08:27:31'),
(58, 31, 'Login', NULL, '::1', '2026-01-12 08:30:53'),
(59, 32, 'Registration', NULL, '::1', '2026-01-12 08:40:55'),
(60, 32, 'Login', NULL, '::1', '2026-01-12 08:41:02'),
(61, 32, 'Login', NULL, '::1', '2026-01-12 08:43:01'),
(62, 32, 'Login', NULL, '::1', '2026-01-12 08:54:32'),
(63, 30, 'Login', NULL, '::1', '2026-01-12 09:03:24'),
(64, 32, 'Login', NULL, '::1', '2026-01-12 09:06:59'),
(65, 30, 'Login', NULL, '::1', '2026-01-12 10:13:53'),
(66, 30, 'Login', NULL, '::1', '2026-01-12 10:46:58'),
(67, 31, 'Login', NULL, '::1', '2026-01-12 12:21:35'),
(68, 32, 'Login', NULL, '::1', '2026-01-12 12:22:13'),
(69, 30, 'Login', NULL, '::1', '2026-01-12 12:34:20'),
(70, 30, 'Login', NULL, '::1', '2026-01-12 12:35:27'),
(71, 32, 'Login', NULL, '::1', '2026-01-12 12:35:43'),
(72, 31, 'Login', NULL, '::1', '2026-01-12 12:54:48'),
(73, 32, 'Login', NULL, '::1', '2026-01-12 12:55:13'),
(74, 30, 'Login', NULL, '::1', '2026-01-12 14:07:36'),
(75, 30, 'Login', NULL, '::1', '2026-01-12 14:08:09'),
(76, 32, 'Login', NULL, '::1', '2026-01-12 14:08:33'),
(77, 30, 'Login', NULL, '::1', '2026-01-12 15:16:19'),
(78, 32, 'Login', NULL, '::1', '2026-01-12 15:18:10'),
(79, 31, 'Login', NULL, '::1', '2026-01-12 15:18:38'),
(80, 30, 'Login', NULL, '::1', '2026-01-12 15:19:46'),
(81, 30, 'Login', NULL, '::1', '2026-01-12 15:22:29'),
(82, 33, 'Admin Account Created', NULL, '127.0.0.1', '2026-01-12 15:34:33'),
(83, 33, 'Login', NULL, '::1', '2026-01-12 15:34:48'),
(84, 33, 'Login', NULL, '::1', '2026-01-12 16:03:08'),
(85, 30, 'Login', NULL, '::1', '2026-01-12 16:27:00'),
(86, 33, 'Login', NULL, '::1', '2026-01-12 16:27:24'),
(87, 33, 'Login', NULL, '::1', '2026-01-12 16:28:00'),
(88, 33, 'Login', NULL, '::1', '2026-01-12 16:28:16'),
(89, 30, 'Login', NULL, '::1', '2026-01-12 16:44:57'),
(90, 33, 'Login', NULL, '::1', '2026-01-12 16:50:43'),
(91, 33, 'Login', NULL, '::1', '2026-01-12 16:51:02'),
(92, 33, 'Login', NULL, '::1', '2026-01-12 16:51:25'),
(93, 31, 'Login', NULL, '::1', '2026-01-12 17:03:12'),
(94, 33, 'Login', NULL, '::1', '2026-01-12 17:03:44'),
(95, 33, 'Password Changed', NULL, '::1', '2026-01-12 17:05:37'),
(96, 33, 'Login', NULL, '::1', '2026-01-12 17:05:57'),
(97, 33, 'Login', NULL, '::1', '2026-01-12 17:06:16'),
(98, 33, 'Login', NULL, '::1', '2026-01-12 17:07:26'),
(99, 30, 'Login', NULL, '::1', '2026-01-12 17:46:09'),
(100, 33, 'Login', NULL, '::1', '2026-01-12 18:37:01'),
(101, 33, 'Login', NULL, '::1', '2026-01-12 19:01:14'),
(102, 31, 'Login', NULL, '::1', '2026-01-12 19:10:26'),
(103, 32, 'Login', NULL, '::1', '2026-01-12 19:12:50'),
(104, 34, 'Registration', NULL, '::1', '2026-01-12 19:14:21'),
(105, 34, 'Login', NULL, '::1', '2026-01-12 19:14:31'),
(106, 31, 'Login', NULL, '::1', '2026-01-12 19:26:15'),
(107, 34, 'Login', NULL, '::1', '2026-01-12 19:26:29'),
(108, 34, 'Medical Info Updated', NULL, '::1', '2026-01-12 19:33:56'),
(109, 34, 'Login', NULL, '::1', '2026-01-12 19:34:23'),
(110, 32, 'Login', NULL, '::1', '2026-01-12 19:34:40'),
(111, 32, 'Medical Visit Created', 'Created medical visit for student 22', '::1', '2026-01-12 19:38:58'),
(112, 32, 'Medical Visit Created', 'Created medical visit for student 22', '::1', '2026-01-12 19:42:11'),
(113, 33, 'Login', NULL, '::1', '2026-01-12 20:09:47'),
(114, 32, 'Login', NULL, '::1', '2026-01-12 20:18:02'),
(115, 33, 'Login', NULL, '::1', '2026-01-12 20:38:01'),
(116, 33, 'Login', NULL, '::1', '2026-01-12 20:38:40'),
(117, 33, 'Login', NULL, '::1', '2026-01-12 21:05:11'),
(118, 30, 'Login', NULL, '::1', '2026-01-12 21:06:12'),
(119, 32, 'Login', NULL, '::1', '2026-01-12 21:06:47'),
(120, 31, 'Login', NULL, '::1', '2026-01-12 21:07:42'),
(121, 33, 'Login', NULL, '::1', '2026-01-12 21:23:44'),
(122, 33, 'Login', NULL, '::1', '2026-01-12 21:24:24'),
(123, 33, 'Login', NULL, '::1', '2026-01-12 21:39:39'),
(124, 30, 'Login', NULL, '::1', '2026-01-12 21:43:33'),
(125, 33, 'Login', NULL, '::1', '2026-01-12 21:44:02'),
(126, 33, 'Login', NULL, '::1', '2026-01-12 21:55:43'),
(127, 31, 'Login', NULL, '::1', '2026-01-12 22:01:11'),
(128, 33, 'Login', NULL, '::1', '2026-01-12 22:01:53'),
(129, 32, 'Login', NULL, '::1', '2026-01-12 22:05:49'),
(130, 31, 'Login', NULL, '::1', '2026-01-12 22:06:29'),
(131, 32, 'Login', NULL, '::1', '2026-01-12 22:06:49'),
(132, 33, 'Login', NULL, '::1', '2026-01-12 22:07:05'),
(133, 32, 'Login', NULL, '::1', '2026-01-12 22:15:26'),
(134, 33, 'Login', NULL, '::1', '2026-01-12 22:15:56'),
(135, 32, 'Login', NULL, '::1', '2026-01-12 22:17:10'),
(136, 30, 'Login', NULL, '::1', '2026-01-12 22:17:24'),
(137, 32, 'Login', NULL, '::1', '2026-01-12 22:19:34'),
(138, 32, 'Login', NULL, '::1', '2026-01-12 22:19:55'),
(139, 33, 'Login', NULL, '::1', '2026-01-12 22:21:03'),
(140, 32, 'Login', NULL, '::1', '2026-01-12 22:22:30'),
(141, 32, 'Login', NULL, '::1', '2026-01-12 22:29:34'),
(142, 30, 'Login', NULL, '::1', '2026-01-12 22:29:51'),
(143, 30, 'Login', NULL, '::1', '2026-01-12 22:30:12'),
(144, 33, 'Login', NULL, '::1', '2026-01-12 22:30:25'),
(145, 30, 'Login', NULL, '::1', '2026-01-12 22:37:40'),
(146, 33, 'Login', NULL, '::1', '2026-01-12 22:37:58'),
(147, 33, 'Login', NULL, '::1', '2026-01-12 23:00:45'),
(148, 32, 'Login', NULL, '::1', '2026-01-12 23:13:24'),
(149, 30, 'Login', NULL, '::1', '2026-01-12 23:13:34'),
(150, 32, 'Login', NULL, '::1', '2026-01-12 23:13:59');

-- --------------------------------------------------------

--
-- Table structure for table `advisers`
--

CREATE TABLE `advisers` (
  `adviser_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `first_name` varchar(80) DEFAULT NULL,
  `last_name` varchar(80) DEFAULT NULL,
  `employee_number` varchar(50) DEFAULT NULL,
  `contact_phone` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL,
  `grade_level` varchar(10) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `advisers`
--

INSERT INTO `advisers` (`adviser_id`, `user_id`, `first_name`, `last_name`, `employee_number`, `contact_phone`, `created_at`, `is_active`, `deleted_at`, `grade_level`, `section`) VALUES
(6, 31, 'Irene', 'Del Monte', NULL, '09471837592', '2026-01-12 08:27:05', 1, NULL, '12', 'STEM-2');

-- --------------------------------------------------------

--
-- Table structure for table `allergies`
--

CREATE TABLE `allergies` (
  `allergy_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `allergy_text` varchar(255) DEFAULT NULL,
  `severity` enum('Mild','Moderate','Severe') DEFAULT 'Moderate',
  `recorded_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clinic_staff`
--

CREATE TABLE `clinic_staff` (
  `clinic_staff_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `staff_code` varchar(50) DEFAULT NULL,
  `position` varchar(80) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clinic_staff`
--

INSERT INTO `clinic_staff` (`clinic_staff_id`, `user_id`, `staff_code`, `position`, `created_at`, `is_active`, `deleted_at`) VALUES
(2, 10, NULL, 'Nurse', '2026-01-12 06:03:34', 1, NULL),
(3, 18, NULL, 'Nurse', '2026-01-12 06:25:20', 1, NULL),
(4, 32, NULL, 'Staff', '2026-01-12 08:40:55', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `diagnoses`
--

CREATE TABLE `diagnoses` (
  `diagnosis_id` bigint(20) UNSIGNED NOT NULL,
  `visit_id` bigint(20) UNSIGNED NOT NULL,
  `icd_code` varchar(20) DEFAULT NULL,
  `diagnosis_text` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `diagnoses`
--

INSERT INTO `diagnoses` (`diagnosis_id`, `visit_id`, `icd_code`, `diagnosis_text`) VALUES
(1, 1, NULL, 'FEVER'),
(2, 2, NULL, 'Sore Throat'),
(3, 3, NULL, 'Sore Throat');

-- --------------------------------------------------------

--
-- Table structure for table `medical_visits`
--

CREATE TABLE `medical_visits` (
  `visit_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `clinic_staff_id` int(10) UNSIGNED DEFAULT NULL,
  `visit_datetime` datetime NOT NULL,
  `visit_type` enum('Routine','Emergency','Follow-up','Referral') DEFAULT 'Routine',
  `chief_complaint` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('Open','Closed','Referred') DEFAULT 'Open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_visits`
--

INSERT INTO `medical_visits` (`visit_id`, `student_id`, `clinic_staff_id`, `visit_datetime`, `visit_type`, `chief_complaint`, `notes`, `status`, `created_at`) VALUES
(1, 21, NULL, '2026-01-12 09:01:00', 'Routine', 'aaaaa', 'Diagnosis: FEVER\n\nTreatment: REST\n\nMedications: HAPLAS', 'Closed', '2026-01-12 09:02:35'),
(2, 22, 4, '2026-01-13 19:34:00', 'Emergency', 'Sore Throat', NULL, 'Closed', '2026-01-12 19:38:58'),
(3, 22, 4, '2026-01-12 19:41:00', 'Routine', 'Sore Throat', NULL, 'Closed', '2026-01-12 19:42:11');

-- --------------------------------------------------------

--
-- Table structure for table `medications`
--

CREATE TABLE `medications` (
  `med_id` bigint(20) UNSIGNED NOT NULL,
  `visit_id` bigint(20) UNSIGNED NOT NULL,
  `medication_name` varchar(150) DEFAULT NULL,
  `dosage` varchar(80) DEFAULT NULL,
  `route` varchar(50) DEFAULT NULL,
  `frequency` varchar(80) DEFAULT NULL,
  `duration` varchar(80) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medications`
--

INSERT INTO `medications` (`med_id`, `visit_id`, `medication_name`, `dosage`, `route`, `frequency`, `duration`, `notes`) VALUES
(1, 1, 'HAPLAS', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `student_id` int(10) UNSIGNED DEFAULT NULL,
  `visit_id` bigint(20) UNSIGNED DEFAULT NULL,
  `channel` enum('SMS','Email') DEFAULT 'SMS',
  `message` text DEFAULT NULL,
  `status` enum('Pending','Sent','Failed') DEFAULT 'Pending',
  `provider_id` varchar(100) DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parents`
--

CREATE TABLE `parents` (
  `parent_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_name` varchar(80) NOT NULL,
  `relation` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `qr_codes`
--

CREATE TABLE `qr_codes` (
  `qr_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `qr_token` varchar(255) NOT NULL,
  `qr_generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `qr_expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` tinyint(3) UNSIGNED NOT NULL,
  `role_name` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'Admin'),
(3, 'Adviser'),
(4, 'Clinic Staff'),
(5, 'Parent'),
(2, 'Student');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `student_number` varchar(30) NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `first_name` varchar(80) NOT NULL,
  `middle_name` varchar(80) DEFAULT NULL,
  `last_name` varchar(80) NOT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('M','F','Other') DEFAULT 'Other',
  `grade_level` varchar(20) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `blood_type` varchar(5) DEFAULT NULL,
  `emergency_contact` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `student_number`, `user_id`, `first_name`, `middle_name`, `last_name`, `birth_date`, `gender`, `grade_level`, `section`, `address`, `blood_type`, `emergency_contact`, `created_at`, `is_active`, `deleted_at`) VALUES
(21, '10000', 30, 'HANNAH LORAINNE', 'MANLIQUES', 'GENANDOY', '2005-04-03', 'F', '12', 'STEM-2', 'GK Laura\n', 'A', 'Mother: Airen - 09260023267', '2026-01-12 08:26:17', 1, NULL),
(22, '20000', 34, 'Clarence ', '', 'Villas', '2004-10-04', 'F', '12', 'STEM-2', 'BAGUMBAYAN\n\nDISTRICT 4', 'A', NULL, '2026-01-12 19:14:21', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_adviser`
--

CREATE TABLE `student_adviser` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `adviser_id` int(10) UNSIGNED NOT NULL,
  `assigned_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_adviser`
--

INSERT INTO `student_adviser` (`student_id`, `adviser_id`, `assigned_date`) VALUES
(6, 4, '2026-01-12'),
(7, 4, '2026-01-12'),
(8, 4, '2026-01-12'),
(9, 4, '2026-01-12'),
(10, 4, '2026-01-12'),
(18, 4, '2026-01-12'),
(19, 4, '2026-01-12'),
(20, 4, '2026-01-12'),
(21, 6, '2026-01-12'),
(22, 6, '2026-01-13');

-- --------------------------------------------------------

--
-- Table structure for table `student_parent`
--

CREATE TABLE `student_parent` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `parent_id` int(10) UNSIGNED NOT NULL,
  `relationship_note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `treatments`
--

CREATE TABLE `treatments` (
  `treatment_id` bigint(20) UNSIGNED NOT NULL,
  `visit_id` bigint(20) UNSIGNED NOT NULL,
  `treatment_text` varchar(255) DEFAULT NULL,
  `performed_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `treatments`
--

INSERT INTO `treatments` (`treatment_id`, `visit_id`, `treatment_text`, `performed_by`) VALUES
(1, 1, 'REST', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `role_id` tinyint(3) UNSIGNED NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `role_id`, `username`, `password_hash`, `email`, `phone`, `full_name`, `created_at`, `is_active`, `deleted_at`) VALUES
(30, 2, '10000', '$2y$10$3kuL80sysV.O5XpstVwfFunUXc8kwL6GHlx.yR5VGJUWCxAYrD7na', 'HANNAHLORAINNEGENANDOY@GMAIL.COM', '09260023267', 'HANNAH LORAINNE MANLIQUES GENANDOY', '2026-01-12 08:26:17', 1, NULL),
(31, 3, 'irene.del monte', '$2y$10$zrqmkj/.hR167l7pGwzC4.3SAlDg1JIwjQQxMKghdwydjCT6jz5vy', 'irened@gmail.com', '09471837592', 'Irene  Del Monte', '2026-01-12 08:27:05', 1, NULL),
(32, 4, 'lulubelle.gabasa', '$2y$10$EYdNQ/tkwTONfrnjnXV8heivgrjjVHm8klKLfgSTG8StnsjEB/jsu', 'lulubelleg@gmail.com', '09746271567', 'Lulubelle  Gabasa', '2026-01-12 08:40:55', 1, NULL),
(33, 1, 'admin', '$2y$10$WyjKh5/OSrTJTC/WRNW4U.1mIfUgbvINjyTZsWa9IJqAF99kSEVkW', 'admin@4seasons.local', NULL, 'System Administrator', '2026-01-12 15:34:33', 1, NULL),
(34, 2, '20000', '$2y$10$FJVYZcI4QAHg9ovh/DkgFeDo5SPhDYxUrcqRbadeQC2shcYwAa01W', 'cla@gmail.com', '09260023267', 'Clarence   Villas', '2026-01-12 19:14:21', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vitals`
--

CREATE TABLE `vitals` (
  `vitals_id` bigint(20) UNSIGNED NOT NULL,
  `visit_id` bigint(20) UNSIGNED NOT NULL,
  `recorded_at` datetime DEFAULT current_timestamp(),
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `temperature_c` decimal(4,2) DEFAULT NULL,
  `bp_systolic` smallint(6) DEFAULT NULL,
  `bp_diastolic` smallint(6) DEFAULT NULL,
  `pulse_rate` smallint(6) DEFAULT NULL,
  `respiration_rate` smallint(6) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `bmi` decimal(5,2) GENERATED ALWAYS AS (case when `height_cm` > 0 and `weight_kg` > 0 then round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) else NULL end) STORED,
  `bmi_category` varchar(20) GENERATED ALWAYS AS (case when `height_cm` > 0 and `weight_kg` > 0 then case when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) < 18.5 then _utf8mb4'Underweight' when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) between 18.5 and 24.9 then _utf8mb4'Normal' when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) between 25.0 and 29.9 then _utf8mb4'Overweight' when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) >= 30.0 then _utf8mb4'Obese' else NULL end else NULL end) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vitals`
--

INSERT INTO `vitals` (`vitals_id`, `visit_id`, `recorded_at`, `weight_kg`, `height_cm`, `temperature_c`, `bp_systolic`, `bp_diastolic`, `pulse_rate`, `respiration_rate`, `notes`) VALUES
(1, 1, '2026-01-12 09:01:00', NULL, NULL, 38.00, 110, 80, 80, 15, NULL),
(2, 2, '2026-01-13 19:34:00', NULL, NULL, 40.00, 112, 90, 73, NULL, NULL),
(3, 3, '2026-01-12 19:41:00', NULL, NULL, 40.00, 112, 90, 76, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `fk_log_user` (`user_id`);

--
-- Indexes for table `advisers`
--
ALTER TABLE `advisers`
  ADD PRIMARY KEY (`adviser_id`),
  ADD UNIQUE KEY `employee_number` (`employee_number`),
  ADD KEY `fk_advisers_user` (`user_id`);

--
-- Indexes for table `allergies`
--
ALTER TABLE `allergies`
  ADD PRIMARY KEY (`allergy_id`),
  ADD KEY `fk_allergy_student` (`student_id`);

--
-- Indexes for table `clinic_staff`
--
ALTER TABLE `clinic_staff`
  ADD PRIMARY KEY (`clinic_staff_id`),
  ADD UNIQUE KEY `staff_code` (`staff_code`),
  ADD KEY `fk_clinic_user` (`user_id`);

--
-- Indexes for table `diagnoses`
--
ALTER TABLE `diagnoses`
  ADD PRIMARY KEY (`diagnosis_id`),
  ADD KEY `fk_diag_visit` (`visit_id`);

--
-- Indexes for table `medical_visits`
--
ALTER TABLE `medical_visits`
  ADD PRIMARY KEY (`visit_id`),
  ADD KEY `fk_visit_staff` (`clinic_staff_id`),
  ADD KEY `idx_visit_student_datetime` (`student_id`,`visit_datetime`);

--
-- Indexes for table `medications`
--
ALTER TABLE `medications`
  ADD PRIMARY KEY (`med_id`),
  ADD KEY `fk_med_visit` (`visit_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `fk_notif_parent` (`parent_id`),
  ADD KEY `fk_notif_student` (`student_id`),
  ADD KEY `fk_notif_visit` (`visit_id`),
  ADD KEY `idx_notifications_status_sentat` (`status`,`sent_at`);

--
-- Indexes for table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`parent_id`),
  ADD KEY `fk_parents_user` (`user_id`);

--
-- Indexes for table `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD PRIMARY KEY (`qr_id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD UNIQUE KEY `qr_token` (`qr_token`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `student_number` (`student_number`),
  ADD KEY `fk_students_user` (`user_id`);

--
-- Indexes for table `student_adviser`
--
ALTER TABLE `student_adviser`
  ADD PRIMARY KEY (`student_id`,`adviser_id`),
  ADD KEY `fk_sa_adviser` (`adviser_id`);

--
-- Indexes for table `student_parent`
--
ALTER TABLE `student_parent`
  ADD PRIMARY KEY (`student_id`,`parent_id`),
  ADD KEY `fk_sp_parent` (`parent_id`);

--
-- Indexes for table `treatments`
--
ALTER TABLE `treatments`
  ADD PRIMARY KEY (`treatment_id`),
  ADD KEY `fk_treat_visit` (`visit_id`),
  ADD KEY `fk_treat_staff` (`performed_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_users_role` (`role_id`);

--
-- Indexes for table `vitals`
--
ALTER TABLE `vitals`
  ADD PRIMARY KEY (`vitals_id`),
  ADD KEY `fk_vitals_visit` (`visit_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `log_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=151;

--
-- AUTO_INCREMENT for table `advisers`
--
ALTER TABLE `advisers`
  MODIFY `adviser_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `allergies`
--
ALTER TABLE `allergies`
  MODIFY `allergy_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clinic_staff`
--
ALTER TABLE `clinic_staff`
  MODIFY `clinic_staff_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `diagnoses`
--
ALTER TABLE `diagnoses`
  MODIFY `diagnosis_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `medical_visits`
--
ALTER TABLE `medical_visits`
  MODIFY `visit_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `medications`
--
ALTER TABLE `medications`
  MODIFY `med_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parents`
--
ALTER TABLE `parents`
  MODIFY `parent_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qr_codes`
--
ALTER TABLE `qr_codes`
  MODIFY `qr_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `treatments`
--
ALTER TABLE `treatments`
  MODIFY `treatment_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `vitals`
--
ALTER TABLE `vitals`
  MODIFY `vitals_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `advisers`
--
ALTER TABLE `advisers`
  ADD CONSTRAINT `fk_advisers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `allergies`
--
ALTER TABLE `allergies`
  ADD CONSTRAINT `fk_allergy_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `clinic_staff`
--
ALTER TABLE `clinic_staff`
  ADD CONSTRAINT `fk_clinic_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `diagnoses`
--
ALTER TABLE `diagnoses`
  ADD CONSTRAINT `fk_diag_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE;

--
-- Constraints for table `medical_visits`
--
ALTER TABLE `medical_visits`
  ADD CONSTRAINT `fk_visit_staff` FOREIGN KEY (`clinic_staff_id`) REFERENCES `clinic_staff` (`clinic_staff_id`),
  ADD CONSTRAINT `fk_visit_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`);

--
-- Constraints for table `medications`
--
ALTER TABLE `medications`
  ADD CONSTRAINT `fk_med_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`),
  ADD CONSTRAINT `fk_notif_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  ADD CONSTRAINT `fk_notif_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`);

--
-- Constraints for table `parents`
--
ALTER TABLE `parents`
  ADD CONSTRAINT `fk_parents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD CONSTRAINT `fk_qr_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `student_adviser`
--
ALTER TABLE `student_adviser`
  ADD CONSTRAINT `fk_sa_adviser` FOREIGN KEY (`adviser_id`) REFERENCES `advisers` (`adviser_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sa_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_parent`
--
ALTER TABLE `student_parent`
  ADD CONSTRAINT `fk_sp_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sp_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `treatments`
--
ALTER TABLE `treatments`
  ADD CONSTRAINT `fk_treat_staff` FOREIGN KEY (`performed_by`) REFERENCES `clinic_staff` (`clinic_staff_id`),
  ADD CONSTRAINT `fk_treat_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);

--
-- Constraints for table `vitals`
--
ALTER TABLE `vitals`
  ADD CONSTRAINT `fk_vitals_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
