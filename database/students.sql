-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 01, 2026 at 11:27 AM
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
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `current_grade_level_id` int(11) DEFAULT NULL,
  `current_section_id` int(11) DEFAULT NULL,
  `current_adviser_id` int(10) UNSIGNED DEFAULT NULL,
  `current_school_year_id` int(11) DEFAULT NULL,
  `enrollment_status` enum('active','promoted','graduated','transferred','dropped','inactive') DEFAULT 'active',
  `promotion_date` datetime DEFAULT NULL,
  `last_promotion_date` datetime DEFAULT NULL,
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
  `deleted_at` datetime DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL COMMENT 'Height in centimeters',
  `weight_kg` decimal(5,2) DEFAULT NULL COMMENT 'Weight in kilograms',
  `bmi` decimal(4,2) DEFAULT NULL COMMENT 'Body Mass Index',
  `bmi_category` varchar(20) DEFAULT NULL COMMENT 'BMI Category (Underweight, Normal, Overweight, Obese)',
  `last_physical_update` timestamp NULL DEFAULT NULL COMMENT 'Last time physical info was updated'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `current_grade_level_id`, `current_section_id`, `current_adviser_id`, `current_school_year_id`, `enrollment_status`, `promotion_date`, `last_promotion_date`, `student_number`, `user_id`, `first_name`, `middle_name`, `last_name`, `birth_date`, `gender`, `grade_level`, `section`, `address`, `blood_type`, `emergency_contact`, `created_at`, `is_active`, `deleted_at`, `height_cm`, `weight_kg`, `bmi`, `bmi_category`, `last_physical_update`) VALUES
(5, NULL, NULL, NULL, NULL, 'active', NULL, NULL, '136883100330', 28, '', NULL, '', NULL, 'Other', NULL, 'STEM-2', 'GK Laura Drive Taguig City', 'A+', NULL, '2026-02-01 10:17:20', 1, NULL, 157.00, 55.00, 22.31, 'Normal weight', '2026-02-01 10:26:36');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `student_number` (`student_number`),
  ADD KEY `fk_students_user` (`user_id`),
  ADD KEY `idx_current_grade_level` (`current_grade_level_id`),
  ADD KEY `idx_current_section` (`current_section_id`),
  ADD KEY `idx_current_adviser` (`current_adviser_id`),
  ADD KEY `idx_current_school_year` (`current_school_year_id`),
  ADD KEY `idx_enrollment_status` (`enrollment_status`),
  ADD KEY `idx_students_physical` (`height_cm`,`weight_kg`,`bmi`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_students_adviser` FOREIGN KEY (`current_adviser_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_grade_level` FOREIGN KEY (`current_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_school_year` FOREIGN KEY (`current_school_year_id`) REFERENCES `school_years` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_section` FOREIGN KEY (`current_section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
