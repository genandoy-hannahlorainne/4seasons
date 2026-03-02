-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 01, 2026 at 04:16 PM
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

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `FixAllStudentAssignments` ()   BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE student_id INT;
    DECLARE student_grade INT;
    DECLARE section_id INT;
    DECLARE adviser_id INT;
    
    -- Cursor for unassigned students
    DECLARE student_cursor CURSOR FOR
        SELECT s.student_id, s.grade_level
        FROM students s
        WHERE s.is_active = 1 
        AND (s.current_adviser_id IS NULL OR s.current_adviser_id = 0);
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    START TRANSACTION;
    
    OPEN student_cursor;
    
    student_loop: LOOP
        FETCH student_cursor INTO student_id, student_grade;
        IF done THEN
            LEAVE student_loop;
        END IF;
        
        -- Convert grade level if needed (1-6 to 7-12)
        IF student_grade >= 1 AND student_grade <= 6 THEN
            SET student_grade = student_grade + 6;
        END IF;
        
        -- Find best available section for this grade
        SELECT s.id, s.adviser_id INTO section_id, adviser_id
        FROM sections s
        INNER JOIN grade_levels gl ON s.grade_level_id = gl.id
        WHERE gl.level_number = student_grade
        AND s.is_active = 1
        AND s.adviser_id IS NOT NULL
        AND s.current_enrollment < s.capacity
        ORDER BY s.current_enrollment ASC
        LIMIT 1;
        
        -- If suitable section found, assign student
        IF section_id IS NOT NULL AND adviser_id IS NOT NULL THEN
            UPDATE students 
            SET current_section_id = section_id,
                current_adviser_id = adviser_id,
                grade_level = student_grade,
                section = (SELECT section_name FROM sections WHERE id = section_id)
            WHERE students.student_id = student_id;
            
            -- Update section enrollment
            UPDATE sections 
            SET current_enrollment = current_enrollment + 1
            WHERE id = section_id;
        END IF;
        
        -- Reset variables
        SET section_id = NULL;
        SET adviser_id = NULL;
    END LOOP;
    
    CLOSE student_cursor;
    COMMIT;
END$$

--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `GetAssignmentHealthScore` () RETURNS DECIMAL(5,2) DETERMINISTIC READS SQL DATA BEGIN
    DECLARE total_students INT DEFAULT 0;
    DECLARE assigned_students INT DEFAULT 0;
    DECLARE health_score DECIMAL(5,2) DEFAULT 0.00;
    
    SELECT COUNT(*) INTO total_students
    FROM students 
    WHERE is_active = 1;
    
    SELECT COUNT(*) INTO assigned_students
    FROM students 
    WHERE is_active = 1 
    AND current_adviser_id IS NOT NULL 
    AND current_adviser_id > 0;
    
    IF total_students > 0 THEN
        SET health_score = (assigned_students / total_students) * 100;
    END IF;
    
    RETURN health_score;
END$$

DELIMITER ;

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
(2618, 32, 'Login', NULL, '::1', '2026-03-01 10:51:15'),
(2619, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:51:16'),
(2620, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:51:16'),
(2621, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:51:46'),
(2622, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:52:16'),
(2623, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:52:46'),
(2624, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:53:16'),
(2625, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:53:46'),
(2626, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:54:16'),
(2627, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:55:43'),
(2628, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:56:36'),
(2629, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:57:36'),
(2630, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:58:36'),
(2631, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 10:59:36'),
(2632, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:00:36'),
(2633, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:01:36'),
(2634, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:02:22'),
(2635, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:02:25'),
(2636, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:02:25'),
(2637, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:02:30'),
(2638, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:02:31'),
(2639, 32, 'Login', NULL, '::1', '2026-03-01 11:02:52'),
(2640, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:02:52'),
(2641, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:02:53'),
(2642, 32, 'Login', NULL, '::1', '2026-03-01 11:07:43'),
(2643, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:07:44'),
(2644, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:07:44'),
(2645, 32, 'School Year Created', 'Created school year: 2026-2027 (ID: 13)', '::1', '2026-03-01 11:08:21'),
(2646, 32, 'Section Created', 'Created section: Mapagmahal for Grade Level ID: 1, School Year ID: 13', '::1', '2026-03-01 11:17:41'),
(2647, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:17:46'),
(2648, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:17:46'),
(2649, 32, 'Login', NULL, '::1', '2026-03-01 11:18:26'),
(2650, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:18:26'),
(2651, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:18:27'),
(2652, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:18:32'),
(2653, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:18:32'),
(2654, 32, 'Login', NULL, '::1', '2026-03-01 11:31:59'),
(2655, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:31:59'),
(2656, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:32:00'),
(2657, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:32:17'),
(2658, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:32:17'),
(2659, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:32:21'),
(2660, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:32:21'),
(2661, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:32:51'),
(2662, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:46:30'),
(2663, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:46:30'),
(2664, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:47:00'),
(2665, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:47:30'),
(2666, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:48:00'),
(2667, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:48:30'),
(2668, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:49:00'),
(2669, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:49:30'),
(2670, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:50:00'),
(2671, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:50:30'),
(2672, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-03-01 11:51:00'),
(2673, 32, 'Created User Account', 'Created adviser account: 2026-01 (Gale  Gregory)', '::1', '2026-03-01 11:51:16'),
(2674, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 11:51:21'),
(2675, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 11:51:30'),
(2676, 247, 'Login', NULL, '::1', '2026-03-01 11:52:03'),
(2677, 32, 'Login', NULL, '::1', '2026-03-01 12:04:23'),
(2678, 32, 'Created User Account', 'Created adviser account: API2026001 (API Test User)', '::1', '2026-03-01 12:04:24'),
(2680, 32, 'Login', NULL, '::1', '2026-03-01 12:06:53'),
(2681, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 12:06:54'),
(2682, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 12:06:54'),
(2683, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 12:07:14'),
(2684, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 12:07:14'),
(2685, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 12:07:44'),
(2686, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:08:14'),
(2687, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:08:44'),
(2688, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:09:14'),
(2689, 32, 'Deactivate User', 'Deactivated user ID: 247', '::1', '2026-03-01 12:09:40'),
(2690, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:09:44'),
(2691, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:10:01'),
(2692, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:10:01'),
(2693, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:10:02'),
(2694, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:10:02'),
(2695, 32, 'Activate User', 'Activated user ID: 247', '::1', '2026-03-01 12:10:04'),
(2696, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:10:33'),
(2697, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:11:03'),
(2698, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:11:33'),
(2699, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:11:41'),
(2700, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:12:10'),
(2701, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:12:33'),
(2702, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:13:03'),
(2703, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:13:36'),
(2704, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:14:05'),
(2705, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:14:16'),
(2706, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:14:32'),
(2707, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:15:02'),
(2708, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:15:32'),
(2709, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:15:41'),
(2710, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:16:03'),
(2711, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:27:38'),
(2712, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:27:38'),
(2713, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:28:08'),
(2714, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:28:38'),
(2715, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-03-01 12:29:08'),
(2716, 32, 'Created User Account', 'Created student account: 136883100330 (Rithemay  Surilla)', '::1', '2026-03-01 12:29:26'),
(2717, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:29:38'),
(2718, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:30:09'),
(2719, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:30:39'),
(2720, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:31:01'),
(2721, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:31:01'),
(2722, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:31:22'),
(2723, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:31:22'),
(2724, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:31:53'),
(2725, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-03-01 12:32:22'),
(2726, 32, 'Created User Account', 'Created clinic_staff account: STAFF-01 (Lulubelle Gabasa)', '::1', '2026-03-01 12:32:31'),
(2727, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-03-01 12:32:35'),
(2728, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-03-01 12:32:53'),
(2729, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-03-01 12:33:22'),
(2730, 251, 'Login', NULL, '::1', '2026-03-01 12:33:47'),
(2731, 250, 'Login', NULL, '::1', '2026-03-01 12:35:02'),
(2732, 250, 'Login', NULL, '::1', '2026-03-01 12:50:46'),
(2733, 250, 'Password Changed', 'User changed password (forced change)', '::1', '2026-03-01 12:50:56'),
(2734, 32, 'Login', NULL, '::1', '2026-03-01 12:52:18'),
(2735, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-03-01 12:52:19'),
(2736, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-03-01 12:52:19'),
(2737, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-03-01 12:52:28'),
(2738, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-03-01 12:52:28'),
(2739, 250, 'Login', NULL, '::1', '2026-03-01 13:01:00'),
(2740, 250, 'Login', NULL, '::1', '2026-03-01 13:17:13'),
(2741, 32, 'Created User Account', 'Created student account: TEST2026001 (Test Middle Student)', '::1', '2026-03-01 13:27:23'),
(2742, 32, 'Created User Account', 'Created student account: TEST2026001 (Test Middle Student)', '::1', '2026-03-01 13:28:21'),
(2743, 32, 'Created User Account', 'Created student account: FINAL2026001 (Final Test Student)', '::1', '2026-03-01 13:32:41'),
(2744, 32, 'Created User Account', 'Created student account: ASSIGN2026001 (Assignment Test Student)', '::1', '2026-03-01 13:41:03'),
(2745, 32, 'Login', NULL, '::1', '2026-03-01 13:43:45'),
(2746, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:43:46'),
(2747, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:43:46'),
(2748, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:43:49'),
(2749, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:43:50'),
(2750, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:44:06'),
(2751, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:44:06'),
(2752, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:44:37'),
(2753, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:45:07'),
(2754, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:45:37'),
(2755, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:46:07'),
(2756, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:46:37'),
(2757, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-03-01 13:47:07'),
(2758, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-03-01 13:48:13'),
(2759, 250, 'Login', NULL, '::1', '2026-03-01 13:48:56'),
(2760, 250, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-03-01 14:07:51'),
(2761, 250, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-03-01 14:08:35'),
(2762, 250, 'Update Allergies', 'Updated allergies list - 1 allergies saved', '::1', '2026-03-01 14:08:48'),
(2763, 250, 'Update Medical History', 'Updated medical history for student ID: 204', '::1', '2026-03-01 14:09:05'),
(2764, 247, 'Login', NULL, '::1', '2026-03-01 14:12:51'),
(2765, 247, 'Password Changed', 'User changed password (forced change)', '::1', '2026-03-01 14:13:01'),
(2766, 247, 'Login', NULL, '::1', '2026-03-01 14:13:22'),
(2767, 32, 'Login', NULL, '127.0.0.1', '2026-03-01 06:32:19'),
(2768, 247, 'Login', NULL, '127.0.0.1', '2026-03-01 06:34:57'),
(2769, 247, 'Login', NULL, '127.0.0.1', '2026-03-01 06:35:19'),
(2770, 247, 'Login', NULL, '127.0.0.1', '2026-03-01 06:47:32'),
(2771, 247, 'Login', NULL, '127.0.0.1', '2026-03-01 06:50:00'),
(2772, 250, 'Login', NULL, '127.0.0.1', '2026-03-01 07:02:25'),
(2773, 251, 'Login', NULL, '127.0.0.1', '2026-03-01 07:03:07'),
(2774, 251, 'Password Changed', 'User changed password (forced change)', '::1', '2026-03-01 15:03:19');

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
  `employee_id` varchar(50) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `grade_level` varchar(10) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `advisers`
--

INSERT INTO `advisers` (`adviser_id`, `user_id`, `first_name`, `last_name`, `employee_number`, `employee_id`, `department`, `contact_phone`, `hire_date`, `is_active`, `created_at`, `updated_at`, `deleted_at`, `grade_level`, `section`) VALUES
(1, 247, 'Gale', '', '2026-01', '2026-01', NULL, '09990312848', NULL, 1, '2026-03-01 11:58:34', '2026-03-01 11:58:34', NULL, NULL, NULL);

--
-- Triggers `advisers`
--
DELIMITER $$
CREATE TRIGGER `after_adviser_deactivate` AFTER UPDATE ON `advisers` FOR EACH ROW BEGIN
    -- If adviser was deactivated, clear their assignments
    IF OLD.is_active = 1 AND NEW.is_active = 0 THEN
        -- Clear students assigned to this adviser
        UPDATE students 
        SET current_adviser_id = NULL
        WHERE current_adviser_id = NEW.user_id 
        AND is_active = 1;
        
        -- Clear sections assigned to this adviser
        UPDATE sections 
        SET adviser_id = NULL
        WHERE adviser_id = NEW.user_id 
        AND is_active = 1;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `adviser_assignments`
--

CREATE TABLE `adviser_assignments` (
  `id` int(11) NOT NULL,
  `adviser_id` int(10) UNSIGNED NOT NULL,
  `section_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `assigned_date` datetime DEFAULT current_timestamp(),
  `unassigned_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `assigned_by_admin_id` int(10) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

--
-- Dumping data for table `allergies`
--

INSERT INTO `allergies` (`allergy_id`, `student_id`, `allergy_text`, `severity`, `recorded_at`) VALUES
(18, 204, 'Peanuts', 'Moderate', '2026-03-01');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
-- Table structure for table `clearance_requests`
--

CREATE TABLE `clearance_requests` (
  `request_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL COMMENT 'Student requesting clearance',
  `requested_by` int(10) UNSIGNED NOT NULL COMMENT 'User who made the request',
  `clearance_type` enum('off_campus','sports','field_trip','swimming','general') DEFAULT 'general',
  `activity_name` varchar(200) DEFAULT NULL COMMENT 'Name of specific activity',
  `activity_date` date DEFAULT NULL COMMENT 'Date of activity',
  `reason` text DEFAULT NULL COMMENT 'Reason clearance is needed',
  `status` enum('pending','approved','denied','cancelled') DEFAULT 'pending',
  `processed_by` int(10) UNSIGNED DEFAULT NULL COMMENT 'Staff who processed request',
  `processed_at` datetime DEFAULT NULL COMMENT 'When request was processed',
  `response_notes` text DEFAULT NULL COMMENT 'Notes from processing staff',
  `parent_notified` tinyint(1) DEFAULT 0 COMMENT 'Parent has been notified',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks clearance requests from teachers/staff';

-- --------------------------------------------------------

--
-- Table structure for table `clearance_violations`
--

CREATE TABLE `clearance_violations` (
  `violation_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL COMMENT 'Student who was flagged',
  `scanned_by` int(10) UNSIGNED NOT NULL COMMENT 'Staff who scanned QR',
  `activity_type` varchar(100) DEFAULT NULL COMMENT 'Activity they were trying to join',
  `violation_reason` text DEFAULT NULL COMMENT 'Why they were flagged',
  `clearance_status` varchar(50) DEFAULT NULL COMMENT 'Their clearance status at time of scan',
  `action_taken` text DEFAULT NULL COMMENT 'What action was taken',
  `parent_notified` tinyint(1) DEFAULT 0 COMMENT 'Parent was notified of violation',
  `resolved` tinyint(1) DEFAULT 0 COMMENT 'Issue has been resolved',
  `resolved_at` datetime DEFAULT NULL COMMENT 'When issue was resolved',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks when students are flagged for clearance issues';

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
(6, 251, 'STAFF-01', 'School Nurse', '2026-03-01 12:32:31', 1, NULL);

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

-- --------------------------------------------------------

--
-- Table structure for table `drill_participants`
--

CREATE TABLE `drill_participants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `drill_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `role` enum('injured','rescuer','observer','evacuee') NOT NULL DEFAULT 'evacuee',
  `status` enum('assigned','scanned','rescued','safe') NOT NULL DEFAULT 'assigned',
  `injury_simulation` text DEFAULT NULL,
  `severity` enum('minor','moderate','severe','critical') DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `first_scan_at` timestamp NULL DEFAULT NULL,
  `rescued_at` timestamp NULL DEFAULT NULL,
  `response_time_seconds` int(11) DEFAULT NULL,
  `rescuer_id` int(10) UNSIGNED DEFAULT NULL,
  `scan_history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`scan_history`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `drill_scans`
--

CREATE TABLE `drill_scans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `drill_id` bigint(20) UNSIGNED NOT NULL,
  `participant_id` bigint(20) UNSIGNED NOT NULL,
  `scanned_by` int(10) UNSIGNED NOT NULL,
  `scan_type` varchar(255) NOT NULL DEFAULT 'qr',
  `scanned_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `seconds_from_start` int(11) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `log_id` bigint(20) UNSIGNED NOT NULL,
  `recipient` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `priority` enum('high','normal','low') DEFAULT 'normal',
  `status` enum('sending','sent','failed') DEFAULT 'sending',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sent_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `email_logs`
--

INSERT INTO `email_logs` (`log_id`, `recipient`, `subject`, `priority`, `status`, `error_message`, `created_at`, `sent_at`) VALUES
(41, 'galegg@gmail.com', 'Your PDMHS Medical System Account', 'normal', 'sent', NULL, '2026-03-01 11:51:16', '2026-03-01 11:51:21'),
(42, 'api.test@example.com', 'Your PDMHS Medical System Account', 'normal', 'sent', NULL, '2026-03-01 12:04:24', '2026-03-01 12:04:28'),
(43, 'rithemay@gmail.com', 'Your PDMHS Medical System Account', 'normal', 'sent', NULL, '2026-03-01 12:29:26', '2026-03-01 12:29:33'),
(44, 'lulubelle@gmail.com', 'Your PDMHS Medical System Account', 'normal', 'sent', NULL, '2026-03-01 12:32:31', '2026-03-01 12:32:35'),
(45, 'test.student@test.com', 'Your PDMHS Medical System Account', 'normal', 'sent', NULL, '2026-03-01 13:27:23', '2026-03-01 13:27:29'),
(46, 'test.student@test.com', 'Your PDMHS Medical System Account', 'normal', 'sent', NULL, '2026-03-01 13:28:21', '2026-03-01 13:28:27'),
(47, 'final.test@test.com', 'Your PDMHS Medical System Account', 'normal', 'sent', NULL, '2026-03-01 13:32:41', '2026-03-01 13:32:46'),
(48, 'test.assignment@test.com', 'Your PDMHS Medical System Account', 'normal', 'sent', NULL, '2026-03-01 13:41:03', '2026-03-01 13:41:08');

-- --------------------------------------------------------

--
-- Table structure for table `emergency_drills`
--

CREATE TABLE `emergency_drills` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `drill_name` varchar(255) NOT NULL,
  `drill_type` enum('earthquake','fire','lockdown','medical','evacuation') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('planned','active','completed','cancelled') NOT NULL DEFAULT 'planned',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `duration_seconds` int(11) DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `statistics` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`statistics`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grade_levels`
--

CREATE TABLE `grade_levels` (
  `id` int(11) NOT NULL,
  `level_number` int(11) NOT NULL COMMENT '7, 8, 9, 10, 11, 12',
  `level_name` varchar(50) NOT NULL COMMENT 'Grade 7, Grade 8, etc.',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grade_levels`
--

INSERT INTO `grade_levels` (`id`, `level_number`, `level_name`, `description`, `created_at`, `is_active`) VALUES
(1, 7, 'Grade 7', 'First Year - Junior High School', '2026-01-15 08:03:58', 1),
(2, 8, 'Grade 8', 'Second Year - Junior High School', '2026-01-15 08:03:58', 1),
(3, 9, 'Grade 9', 'Third Year - Junior High School', '2026-01-15 08:03:58', 1),
(4, 10, 'Grade 10', 'Fourth Year - Junior High School', '2026-01-15 08:03:58', 1),
(5, 11, 'Grade 11', 'First Year - Senior High School', '2026-01-15 08:03:58', 1),
(6, 12, 'Grade 12', 'Second Year - Senior High School', '2026-01-15 08:03:58', 1);

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medical_clearances`
--

CREATE TABLE `medical_clearances` (
  `clearance_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL COMMENT 'Student requiring clearance',
  `clearance_type` enum('off_campus','sports','field_trip','swimming','general') DEFAULT 'general' COMMENT 'Type of activity clearance',
  `status` enum('approved','pending','denied','expired') DEFAULT 'pending' COMMENT 'Clearance status',
  `required_for` text DEFAULT NULL COMMENT 'Specific medical conditions requiring clearance',
  `issued_date` date DEFAULT NULL COMMENT 'Date clearance was approved',
  `expiry_date` date DEFAULT NULL COMMENT 'Date clearance expires',
  `issued_by` varchar(150) DEFAULT NULL COMMENT 'Staff member who approved',
  `parent_consent` tinyint(1) DEFAULT 0 COMMENT 'Parent has given consent',
  `doctor_approval` tinyint(1) DEFAULT 0 COMMENT 'Doctor has approved',
  `doctor_name` varchar(150) DEFAULT NULL COMMENT 'Approving doctor name',
  `medical_notes` text DEFAULT NULL COMMENT 'Medical notes or restrictions',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks medical clearances for various activities';

-- --------------------------------------------------------

--
-- Table structure for table `medical_history`
--

CREATE TABLE `medical_history` (
  `history_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `allergy_medicine` tinyint(1) DEFAULT 0,
  `allergy_pollens` tinyint(1) DEFAULT 0,
  `allergy_food` tinyint(1) DEFAULT 0,
  `allergy_stinging_insects` tinyint(1) DEFAULT 0,
  `condition_error_refraction` tinyint(1) DEFAULT 0,
  `condition_heart_problem` tinyint(1) DEFAULT 0,
  `condition_bleeding_disorder` tinyint(1) DEFAULT 0,
  `condition_hernia` tinyint(1) DEFAULT 0,
  `condition_asthma` tinyint(1) DEFAULT 0,
  `condition_anemia` tinyint(1) DEFAULT 0,
  `condition_anxiety_depression` tinyint(1) DEFAULT 0,
  `condition_seizure` tinyint(1) DEFAULT 0,
  `surgery_hospitalization` tinyint(1) DEFAULT 0,
  `surgery_details` text DEFAULT NULL,
  `family_tuberculosis` tinyint(1) DEFAULT 0,
  `family_cancer` tinyint(1) DEFAULT 0,
  `family_stroke_cardiac` tinyint(1) DEFAULT 0,
  `family_diabetes` tinyint(1) DEFAULT 0,
  `family_hypertension` tinyint(1) DEFAULT 0,
  `family_depression` tinyint(1) DEFAULT 0,
  `family_thyroid` tinyint(1) DEFAULT 0,
  `family_phobia` tinyint(1) DEFAULT 0,
  `smoke_exposure` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_history`
--

INSERT INTO `medical_history` (`history_id`, `student_id`, `recorded_at`, `allergy_medicine`, `allergy_pollens`, `allergy_food`, `allergy_stinging_insects`, `condition_error_refraction`, `condition_heart_problem`, `condition_bleeding_disorder`, `condition_hernia`, `condition_asthma`, `condition_anemia`, `condition_anxiety_depression`, `condition_seizure`, `surgery_hospitalization`, `surgery_details`, `family_tuberculosis`, `family_cancer`, `family_stroke_cardiac`, `family_diabetes`, `family_hypertension`, `family_depression`, `family_thyroid`, `family_phobia`, `smoke_exposure`, `notes`, `updated_at`) VALUES
(9, 204, '2026-03-01 14:09:05', 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, NULL, 0, 1, 0, 0, 0, 0, 0, 0, 1, NULL, NULL);

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
  `notify_parent` tinyint(1) DEFAULT 0 COMMENT 'Whether to notify parent/guardian',
  `parent_notified_at` datetime DEFAULT NULL COMMENT 'When parent was notified',
  `notification_method` enum('sms','email','call','none') DEFAULT 'none' COMMENT 'Method used to notify parent',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0000_01_01_000000_create_roles_table', 1),
(2, '0001_01_01_000000_create_users_table', 1),
(3, '0001_01_01_000001_create_cache_table', 1),
(4, '0001_01_01_000002_create_jobs_table', 1),
(5, '2026_02_25_113255_create_personal_access_tokens_table', 1),
(6, '2026_02_25_115005_create_students_table', 1),
(7, '2026_02_25_115032_create_medical_visits_table', 1),
(8, '2026_02_25_115049_create_medical_history_table', 1),
(9, '2026_02_25_115323_create_allergies_table', 1),
(10, '2026_02_25_115338_create_vitals_table', 1),
(11, '2026_02_25_115403_create_clinic_staff_table', 1),
(13, '0001_01_01_000001_create_cache_table', 1),
(14, '0001_01_01_000002_create_jobs_table', 1),
(15, '2026_02_25_115436_create_advisers_table', 2),
(16, '2026_02_28_125930_create_emergency_drills_table', 2),
(17, '2026_02_28_125957_create_drill_participants_table', 2),
(18, '2026_02_28_130023_create_drill_scans_table', 3),
(19, '2026_02_28_140000_update_drill_participants_for_all_users', 4);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `student_id` int(10) UNSIGNED DEFAULT NULL,
  `visit_id` bigint(20) UNSIGNED DEFAULT NULL,
  `channel` enum('SMS','Email','System') DEFAULT 'SMS',
  `message` text DEFAULT NULL,
  `status` enum('Pending','Sent','Failed') DEFAULT 'Pending',
  `priority` enum('normal','urgent') DEFAULT 'normal',
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

--
-- Dumping data for table `parents`
--

INSERT INTO `parents` (`parent_id`, `user_id`, `first_name`, `last_name`, `relation`, `phone`, `email`, `address`, `created_at`, `is_active`, `deleted_at`) VALUES
(5, NULL, 'Anne', 'Surilla', 'Mother', '09988939124', NULL, 'Pinagsama, Taguig City', '2026-03-01 14:08:20', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
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
(97, 'App\\Models\\User', 32, 'auth-token', 'baa4550d31a0e32e55cb522ed9731f8a401b4b7acd128aad49066dc088793636', '[\"*\"]', NULL, '2026-03-02 06:32:19', '2026-03-01 06:32:19', '2026-03-01 06:32:19'),
(98, 'App\\Models\\User', 247, 'auth-token', '2887365b465268295bdbdbb71a72d24967ccef3d0021b4466aa1de3f5d1c06fa', '[\"*\"]', NULL, '2026-03-02 06:34:57', '2026-03-01 06:34:57', '2026-03-01 06:34:57'),
(99, 'App\\Models\\User', 247, 'auth-token', '036bff4fa025b7439e17584641c4a0290e8e18a0c4fd8449329de30cd0b7d529', '[\"*\"]', NULL, '2026-03-02 06:35:19', '2026-03-01 06:35:19', '2026-03-01 06:35:19'),
(100, 'App\\Models\\User', 247, 'auth-token', 'b041a89b008b6761552860a6bc2773f960f6708e132adf77bc48068a4a1b3431', '[\"*\"]', '2026-03-01 07:01:46', '2026-03-02 06:47:32', '2026-03-01 06:47:32', '2026-03-01 07:01:46'),
(101, 'App\\Models\\User', 247, 'auth-token', '4499e8548e24b24be187fd499896a060b4c3a8458b7fbd694b1ec32b2549f285', '[\"*\"]', '2026-03-01 06:50:01', '2026-03-02 06:50:00', '2026-03-01 06:50:00', '2026-03-01 06:50:01'),
(102, 'App\\Models\\User', 250, 'auth-token', 'bed4cade00e9945f27c406793b35b4c4d45270ef57b41ecaf4e8030036f49231', '[\"*\"]', NULL, '2026-03-02 07:02:25', '2026-03-01 07:02:25', '2026-03-01 07:02:25'),
(103, 'App\\Models\\User', 251, 'auth-token', '03922067422df5fe9790901dfb7746a766e07b335f19e993d431ae1f49b786de', '[\"*\"]', '2026-03-01 07:06:32', '2026-03-02 07:03:07', '2026-03-01 07:03:07', '2026-03-01 07:06:32');

-- --------------------------------------------------------

--
-- Table structure for table `promotion_batch_logs`
--

CREATE TABLE `promotion_batch_logs` (
  `id` int(11) NOT NULL,
  `batch_name` varchar(100) NOT NULL,
  `current_school_year_id` int(11) NOT NULL,
  `target_school_year_id` int(11) NOT NULL,
  `total_students` int(11) DEFAULT 0,
  `promoted_count` int(11) DEFAULT 0,
  `graduated_count` int(11) DEFAULT 0,
  `repeated_count` int(11) DEFAULT 0,
  `transferred_count` int(11) DEFAULT 0,
  `dropped_count` int(11) DEFAULT 0,
  `failed_count` int(11) DEFAULT 0,
  `status` enum('pending','in_progress','completed','failed','rolled_back') DEFAULT 'pending',
  `executed_by_admin_id` int(10) UNSIGNED NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promotion_rules`
--

CREATE TABLE `promotion_rules` (
  `id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `from_grade_level_id` int(11) NOT NULL,
  `to_grade_level_id` int(11) DEFAULT NULL,
  `promotion_action` enum('promote','graduate','repeat','transfer') DEFAULT 'promote',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

--
-- Dumping data for table `qr_codes`
--

INSERT INTO `qr_codes` (`qr_id`, `student_id`, `qr_token`, `qr_generated_at`, `qr_expires_at`) VALUES
(24, 204, 'f33a148020153a6a52fc749e2002519a', '2026-03-01 12:29:26', NULL);

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
-- Table structure for table `school_years`
--

CREATE TABLE `school_years` (
  `id` int(11) NOT NULL,
  `year_name` varchar(20) NOT NULL COMMENT 'e.g., 2024-2025',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `is_current` tinyint(1) DEFAULT 0 COMMENT '1 = Current school year, 0 = Not current',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `school_years`
--

INSERT INTO `school_years` (`id`, `year_name`, `start_date`, `end_date`, `is_active`, `is_current`, `created_at`, `updated_at`, `created_by`) VALUES
(13, '2026-2027', '2026-06-03', '2027-03-31', 1, 1, '2026-03-01 11:08:21', '2026-03-01 13:32:08', 32);

-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

CREATE TABLE `sections` (
  `id` int(11) NOT NULL,
  `section_name` varchar(50) NOT NULL COMMENT 'A, B, C, etc.',
  `grade_level_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `adviser_id` int(10) UNSIGNED DEFAULT NULL,
  `capacity` int(11) DEFAULT 50,
  `current_enrollment` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sections`
--

INSERT INTO `sections` (`id`, `section_name`, `grade_level_id`, `school_year_id`, `adviser_id`, `capacity`, `current_enrollment`, `is_active`, `created_at`, `updated_at`, `created_by`) VALUES
(39, 'Mapagmahal', 1, 13, 247, 50, 3, 1, '2026-03-01 11:17:41', '2026-03-01 13:46:20', 32),
(40, 'Matatag', 1, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(41, 'Masipag', 1, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(42, 'Sampaguita', 2, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(43, 'Daffodils', 2, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(44, 'Carnation', 2, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(45, 'Rizal', 3, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(46, 'Bonifacio', 3, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(47, 'Mabini', 3, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(48, 'Shakespeare', 4, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(49, 'Tennyson', 4, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(50, 'Blake', 4, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(51, 'STEM 1', 5, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(52, 'STEM 2', 5, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(53, 'ABM 1', 5, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(54, 'ABM 2', 5, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(55, 'HUMSS 1', 5, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(56, 'HUMSS 2', 5, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(57, 'TVL-HE 1', 5, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(58, 'TVL-HE 2', 5, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(59, 'TVL-EIM 1', 5, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(60, 'TVL-EIM 2', 5, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(61, 'STEM 1', 6, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(62, 'STEM 2', 6, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(63, 'ABM 1', 6, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(64, 'ABM 2', 6, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(65, 'HUMSS 1', 6, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(66, 'HUMSS 2', 6, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(67, 'TVL-HE 1', 6, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(68, 'TVL-HE 2', 6, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(69, 'TVL-EIM 1', 6, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL),
(70, 'TVL-EIM 2', 6, 13, NULL, 50, 0, 1, '2026-03-01 11:41:56', '2026-03-01 11:41:56', NULL);

--
-- Triggers `sections`
--
DELIMITER $$
CREATE TRIGGER `after_section_adviser_update` AFTER UPDATE ON `sections` FOR EACH ROW BEGIN
    -- If section's adviser changed, update all students in that section
    IF OLD.adviser_id != NEW.adviser_id THEN
        UPDATE students 
        SET current_adviser_id = NEW.adviser_id
        WHERE current_section_id = NEW.id 
        AND is_active = 1;
    END IF;
END
$$
DELIMITER ;

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

-- --------------------------------------------------------

--
-- Table structure for table `sms_logs`
--

CREATE TABLE `sms_logs` (
  `sms_id` bigint(20) UNSIGNED NOT NULL,
  `visit_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Related medical visit',
  `student_id` int(10) UNSIGNED NOT NULL COMMENT 'Student being notified about',
  `recipient_name` varchar(150) DEFAULT NULL COMMENT 'Parent/Guardian name',
  `phone_number` varchar(20) NOT NULL COMMENT 'Recipient phone number',
  `message_type` enum('emergency','routine','general') DEFAULT 'general' COMMENT 'Type of notification',
  `message_content` text NOT NULL COMMENT 'SMS message content',
  `status` enum('pending','sent','delivered','failed') DEFAULT 'pending' COMMENT 'Delivery status',
  `sent_at` datetime DEFAULT NULL COMMENT 'When SMS was sent',
  `delivered_at` datetime DEFAULT NULL COMMENT 'When SMS was delivered',
  `error_message` text DEFAULT NULL COMMENT 'Error details if failed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks SMS notifications sent to parents/guardians';

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
  `emergency_contact_relation` varchar(50) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL COMMENT 'Height in centimeters',
  `weight_kg` decimal(5,2) DEFAULT NULL COMMENT 'Weight in kilograms',
  `bmi` decimal(4,2) DEFAULT NULL COMMENT 'Body Mass Index',
  `bmi_category` varchar(20) DEFAULT NULL COMMENT 'BMI Category (Underweight, Normal, Overweight, Obese)',
  `general_clearance_status` enum('approved','pending','denied','not_required') DEFAULT 'not_required' COMMENT 'General clearance status',
  `clearance_expiry_date` date DEFAULT NULL COMMENT 'When general clearance expires',
  `requires_special_clearance` tinyint(1) DEFAULT 0 COMMENT 'Student needs special medical clearance',
  `clearance_notes` text DEFAULT NULL COMMENT 'Special clearance requirements or notes',
  `last_physical_update` timestamp NULL DEFAULT NULL COMMENT 'Last time physical info was updated'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `current_grade_level_id`, `current_section_id`, `current_adviser_id`, `current_school_year_id`, `enrollment_status`, `promotion_date`, `last_promotion_date`, `student_number`, `user_id`, `first_name`, `middle_name`, `last_name`, `birth_date`, `gender`, `grade_level`, `section`, `address`, `blood_type`, `emergency_contact`, `emergency_contact_relation`, `emergency_contact_phone`, `created_at`, `is_active`, `deleted_at`, `height_cm`, `weight_kg`, `bmi`, `bmi_category`, `general_clearance_status`, `clearance_expiry_date`, `requires_special_clearance`, `clearance_notes`, `last_physical_update`) VALUES
(204, NULL, 39, 247, NULL, 'active', NULL, NULL, '136883100330', 250, 'Rithemay', NULL, 'Surilla', '2006-03-29', 'F', '7', 'Mapagmahal', 'Pinagsama, Taguig City', 'B+', 'Anne Surilla', 'Mother', '09988939124', '2026-03-01 12:29:26', 1, NULL, 160.00, 50.00, 19.53, 'Normal weight', 'not_required', NULL, 0, NULL, '2026-03-01 14:08:35');

--
-- Triggers `students`
--
DELIMITER $$
CREATE TRIGGER `after_student_deactivate` AFTER UPDATE ON `students` FOR EACH ROW BEGIN
    -- If student was deactivated, decrease section enrollment
    IF OLD.is_active = 1 AND NEW.is_active = 0 THEN
        IF NEW.current_section_id IS NOT NULL AND NEW.current_section_id > 0 THEN
            UPDATE sections 
            SET current_enrollment = GREATEST(0, current_enrollment - 1)
            WHERE id = NEW.current_section_id;
        END IF;
    END IF;
    
    -- If student was reactivated, increase section enrollment
    IF OLD.is_active = 0 AND NEW.is_active = 1 THEN
        IF NEW.current_section_id IS NOT NULL AND NEW.current_section_id > 0 THEN
            UPDATE sections 
            SET current_enrollment = current_enrollment + 1
            WHERE id = NEW.current_section_id;
        END IF;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_student_section_assign` AFTER UPDATE ON `students` FOR EACH ROW BEGIN
    -- If student was moved from one section to another
    IF OLD.current_section_id != NEW.current_section_id THEN
        
        -- Decrease enrollment in old section
        IF OLD.current_section_id IS NOT NULL AND OLD.current_section_id > 0 THEN
            UPDATE sections 
            SET current_enrollment = GREATEST(0, current_enrollment - 1)
            WHERE id = OLD.current_section_id;
        END IF;
        
        -- Increase enrollment in new section
        IF NEW.current_section_id IS NOT NULL AND NEW.current_section_id > 0 THEN
            UPDATE sections 
            SET current_enrollment = current_enrollment + 1
            WHERE id = NEW.current_section_id;
        END IF;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_student_section_update` AFTER UPDATE ON `students` FOR EACH ROW BEGIN
    -- If section was updated but adviser is not set, try to auto-assign
    IF NEW.current_section_id != OLD.current_section_id 
       AND NEW.current_section_id IS NOT NULL 
       AND (NEW.current_adviser_id IS NULL OR NEW.current_adviser_id = 0) THEN
        
        -- Get the adviser for the new section
        SET @section_adviser_id = (
            SELECT adviser_id 
            FROM sections 
            WHERE id = NEW.current_section_id 
            AND is_active = 1 
            AND adviser_id IS NOT NULL
        );
        
        -- Update student's adviser if section has one
        IF @section_adviser_id IS NOT NULL THEN
            UPDATE students 
            SET current_adviser_id = @section_adviser_id 
            WHERE student_id = NEW.student_id;
        END IF;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `student_adviser`
--

CREATE TABLE `student_adviser` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `adviser_id` int(10) UNSIGNED NOT NULL,
  `assigned_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_parent`
--

CREATE TABLE `student_parent` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `parent_id` int(10) UNSIGNED NOT NULL,
  `relationship_note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_parent`
--

INSERT INTO `student_parent` (`student_id`, `parent_id`, `relationship_note`) VALUES
(204, 5, 'Emergency Contact');

-- --------------------------------------------------------

--
-- Table structure for table `student_promotions`
--

CREATE TABLE `student_promotions` (
  `id` int(11) NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `previous_grade_level_id` int(11) DEFAULT NULL,
  `previous_section_id` int(11) DEFAULT NULL,
  `previous_adviser_id` int(10) UNSIGNED DEFAULT NULL,
  `new_grade_level_id` int(11) DEFAULT NULL,
  `new_section_id` int(11) DEFAULT NULL,
  `new_adviser_id` int(10) UNSIGNED DEFAULT NULL,
  `school_year_id` int(11) NOT NULL,
  `promoted_by_admin_id` int(10) UNSIGNED NOT NULL,
  `promotion_date` datetime DEFAULT current_timestamp(),
  `promotion_type` enum('promotion','repeat_grade','transfer','dropout','graduation','manual_adjustment') DEFAULT 'promotion',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `role_id` tinyint(3) UNSIGNED NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `password_must_change` tinyint(1) DEFAULT 0 COMMENT 'Force password change on next login',
  `password_changed_at` datetime DEFAULT NULL COMMENT 'Last password change timestamp',
  `created_by_admin_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'Admin who created this account',
  `temp_password` varchar(50) DEFAULT NULL COMMENT 'Temporary password for email (cleared after first login)',
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

INSERT INTO `users` (`user_id`, `role_id`, `username`, `password_hash`, `password_must_change`, `password_changed_at`, `created_by_admin_id`, `temp_password`, `email`, `phone`, `full_name`, `created_at`, `is_active`, `deleted_at`) VALUES
(32, 1, 'admin', '$2y$10$sazkAihoww8U0TElhFKuMuNzhbdOL9tL80KeUAA1JSk4NtfW14ILq', 0, NULL, NULL, NULL, 'admin@pdmhs.edu.ph', '09171234567', 'System Administrator', '2026-02-01 11:46:49', 1, NULL),
(247, 3, '2026-01', '$2y$10$/VWK2JWp/p8xzOx.JzPjVOvL37p6MFwZT3KWxsGFzDRjPk6bdkiLC', 0, '2026-03-01 22:13:01', 32, NULL, 'galegg@gmail.com', '09990312848', 'Gale  Gregory', '2026-03-01 11:51:16', 1, NULL),
(250, 2, '136883100330', '$2y$10$IyxkgMkitO.GTGzqL4L4Peb.9KSyPXM.KIrJnqmcahlfNgxeEqnC.', 0, '2026-03-01 20:50:56', 32, NULL, 'rithemay@gmail.com', '', 'Rithemay Surilla', '2026-03-01 12:29:26', 1, NULL),
(251, 4, 'STAFF-01', '$2y$10$V3VFotWWrN/eXOXhFKlwJ.5NU3vNnH0CZ6I07ikZAN5spfkhp4K82', 0, '2026-03-01 23:03:19', 32, NULL, 'lulubelle@gmail.com', '09905893921', 'Lulubelle Gabasa', '2026-03-01 12:32:31', 1, NULL);

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

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_expired_clearances`
-- (See below for the actual view)
--
CREATE TABLE `vw_expired_clearances` (
`student_id` int(10) unsigned
,`student_number` varchar(30)
,`full_name` varchar(161)
,`clearance_type` enum('off_campus','sports','field_trip','swimming','general')
,`expiry_date` date
,`days_expired` int(7)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_students_requiring_clearance`
-- (See below for the actual view)
--
CREATE TABLE `vw_students_requiring_clearance` (
`student_id` int(10) unsigned
,`student_number` varchar(30)
,`full_name` varchar(161)
,`grade_level` varchar(20)
,`section` varchar(50)
,`general_clearance_status` enum('approved','pending','denied','not_required')
,`clearance_expiry_date` date
,`requires_special_clearance` tinyint(1)
,`clearance_notes` text
,`clearance_type` enum('off_campus','sports','field_trip','swimming','general')
,`clearance_status` enum('approved','pending','denied','expired')
,`specific_expiry` date
,`medical_notes` text
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_student_medical_profile`
-- (See below for the actual view)
--
CREATE TABLE `vw_student_medical_profile` (
`student_id` int(10) unsigned
,`student_number` varchar(30)
,`full_name` varchar(242)
,`first_name` varchar(80)
,`middle_name` varchar(80)
,`last_name` varchar(80)
,`birth_date` date
,`gender` enum('M','F','Other')
,`grade_level` varchar(20)
,`section` varchar(50)
,`height_cm` decimal(5,2)
,`weight_kg` decimal(5,2)
,`bmi` decimal(4,2)
,`bmi_category` varchar(20)
,`address` text
,`blood_type` varchar(5)
,`emergency_contact` varchar(150)
,`emergency_contact_relation` varchar(50)
,`adviser_name` varchar(161)
,`email` varchar(150)
,`phone` varchar(30)
,`total_visits` bigint(21)
,`allergy_count` bigint(21)
,`last_visit_date` datetime
);

-- --------------------------------------------------------

--
-- Structure for view `vw_expired_clearances`
--
DROP TABLE IF EXISTS `vw_expired_clearances`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_expired_clearances`  AS SELECT `s`.`student_id` AS `student_id`, `s`.`student_number` AS `student_number`, concat(`s`.`first_name`,' ',`s`.`last_name`) AS `full_name`, `mc`.`clearance_type` AS `clearance_type`, `mc`.`expiry_date` AS `expiry_date`, to_days(curdate()) - to_days(`mc`.`expiry_date`) AS `days_expired` FROM (`students` `s` join `medical_clearances` `mc` on(`s`.`student_id` = `mc`.`student_id`)) WHERE `mc`.`expiry_date` < curdate() AND `mc`.`status` = 'approved' ORDER BY `mc`.`expiry_date` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `vw_students_requiring_clearance`
--
DROP TABLE IF EXISTS `vw_students_requiring_clearance`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_students_requiring_clearance`  AS SELECT `s`.`student_id` AS `student_id`, `s`.`student_number` AS `student_number`, concat(`s`.`first_name`,' ',`s`.`last_name`) AS `full_name`, `s`.`grade_level` AS `grade_level`, `s`.`section` AS `section`, `s`.`general_clearance_status` AS `general_clearance_status`, `s`.`clearance_expiry_date` AS `clearance_expiry_date`, `s`.`requires_special_clearance` AS `requires_special_clearance`, `s`.`clearance_notes` AS `clearance_notes`, `mc`.`clearance_type` AS `clearance_type`, `mc`.`status` AS `clearance_status`, `mc`.`expiry_date` AS `specific_expiry`, `mc`.`medical_notes` AS `medical_notes` FROM (`students` `s` left join `medical_clearances` `mc` on(`s`.`student_id` = `mc`.`student_id` and `mc`.`clearance_type` = 'off_campus' and `mc`.`status` in ('approved','pending'))) WHERE `s`.`requires_special_clearance` = 1 OR `s`.`general_clearance_status` in ('pending','denied') ORDER BY `s`.`grade_level` ASC, `s`.`section` ASC, `s`.`last_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `vw_student_medical_profile`
--
DROP TABLE IF EXISTS `vw_student_medical_profile`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_student_medical_profile`  AS SELECT `s`.`student_id` AS `student_id`, `s`.`student_number` AS `student_number`, concat(`s`.`first_name`,' ',ifnull(concat(`s`.`middle_name`,' '),''),`s`.`last_name`) AS `full_name`, `s`.`first_name` AS `first_name`, `s`.`middle_name` AS `middle_name`, `s`.`last_name` AS `last_name`, `s`.`birth_date` AS `birth_date`, `s`.`gender` AS `gender`, `s`.`grade_level` AS `grade_level`, `s`.`section` AS `section`, `s`.`height_cm` AS `height_cm`, `s`.`weight_kg` AS `weight_kg`, `s`.`bmi` AS `bmi`, `s`.`bmi_category` AS `bmi_category`, `s`.`address` AS `address`, `s`.`blood_type` AS `blood_type`, `s`.`emergency_contact` AS `emergency_contact`, `s`.`emergency_contact_relation` AS `emergency_contact_relation`, concat(`a`.`first_name`,' ',`a`.`last_name`) AS `adviser_name`, `u`.`email` AS `email`, `u`.`phone` AS `phone`, count(distinct `mv`.`visit_id`) AS `total_visits`, count(distinct `al`.`allergy_id`) AS `allergy_count`, max(`mv`.`visit_datetime`) AS `last_visit_date` FROM ((((`students` `s` left join `users` `u` on(`s`.`user_id` = `u`.`user_id`)) left join `advisers` `a` on(`s`.`current_adviser_id` = `a`.`adviser_id`)) left join `medical_visits` `mv` on(`s`.`student_id` = `mv`.`student_id`)) left join `allergies` `al` on(`s`.`student_id` = `al`.`student_id`)) WHERE `s`.`is_active` = 1 GROUP BY `s`.`student_id`, `s`.`student_number`, `s`.`first_name`, `s`.`middle_name`, `s`.`last_name`, `s`.`birth_date`, `s`.`gender`, `s`.`grade_level`, `s`.`section`, `s`.`height_cm`, `s`.`weight_kg`, `s`.`bmi`, `s`.`bmi_category`, `s`.`address`, `s`.`blood_type`, `s`.`emergency_contact`, `s`.`emergency_contact_relation`, `a`.`first_name`, `a`.`last_name`, `u`.`email`, `u`.`phone` ;

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
  ADD UNIQUE KEY `advisers_employee_id_unique` (`employee_id`),
  ADD KEY `advisers_user_id_index` (`user_id`),
  ADD KEY `advisers_employee_id_index` (`employee_id`),
  ADD KEY `advisers_is_active_index` (`is_active`);

--
-- Indexes for table `adviser_assignments`
--
ALTER TABLE `adviser_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_adviser_section_year` (`adviser_id`,`section_id`,`school_year_id`),
  ADD KEY `idx_adviser` (`adviser_id`),
  ADD KEY `idx_section` (`section_id`),
  ADD KEY `idx_school_year` (`school_year_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_assigned_date` (`assigned_date`),
  ADD KEY `assigned_by_admin_id` (`assigned_by_admin_id`);

--
-- Indexes for table `allergies`
--
ALTER TABLE `allergies`
  ADD PRIMARY KEY (`allergy_id`),
  ADD KEY `fk_allergy_student` (`student_id`);

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
-- Indexes for table `clearance_requests`
--
ALTER TABLE `clearance_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_requested_by` (`requested_by`),
  ADD KEY `idx_activity_date` (`activity_date`);

--
-- Indexes for table `clearance_violations`
--
ALTER TABLE `clearance_violations`
  ADD PRIMARY KEY (`violation_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_scanned_by` (`scanned_by`),
  ADD KEY `idx_resolved` (`resolved`);

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
-- Indexes for table `drill_participants`
--
ALTER TABLE `drill_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `drill_participants_drill_id_user_id_unique` (`drill_id`,`user_id`),
  ADD KEY `drill_participants_rescuer_id_foreign` (`rescuer_id`),
  ADD KEY `drill_participants_drill_id_role_status_index` (`drill_id`,`role`,`status`),
  ADD KEY `drill_participants_user_id_foreign` (`user_id`);

--
-- Indexes for table `drill_scans`
--
ALTER TABLE `drill_scans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `drill_scans_scanned_by_foreign` (`scanned_by`),
  ADD KEY `drill_scans_drill_id_scanned_at_index` (`drill_id`,`scanned_at`),
  ADD KEY `drill_scans_participant_id_scanned_at_index` (`participant_id`,`scanned_at`);

--
-- Indexes for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_recipient` (`recipient`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `emergency_drills`
--
ALTER TABLE `emergency_drills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `emergency_drills_created_by_foreign` (`created_by`),
  ADD KEY `emergency_drills_status_drill_type_index` (`status`,`drill_type`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `grade_levels`
--
ALTER TABLE `grade_levels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `level_number` (`level_number`),
  ADD KEY `idx_level_number` (`level_number`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `medical_clearances`
--
ALTER TABLE `medical_clearances`
  ADD PRIMARY KEY (`clearance_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_type` (`clearance_type`),
  ADD KEY `idx_expiry` (`expiry_date`);

--
-- Indexes for table `medical_history`
--
ALTER TABLE `medical_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `idx_student_id` (`student_id`);

--
-- Indexes for table `medical_visits`
--
ALTER TABLE `medical_visits`
  ADD PRIMARY KEY (`visit_id`),
  ADD KEY `fk_visit_staff` (`clinic_staff_id`),
  ADD KEY `idx_visit_student_datetime` (`student_id`,`visit_datetime`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `fk_notif_parent` (`parent_id`),
  ADD KEY `fk_notif_student` (`student_id`),
  ADD KEY `fk_notif_visit` (`visit_id`),
  ADD KEY `idx_notifications_status_sentat` (`status`,`sent_at`),
  ADD KEY `fk_notif_user` (`user_id`);

--
-- Indexes for table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`parent_id`),
  ADD KEY `fk_parents_user` (`user_id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `promotion_batch_logs`
--
ALTER TABLE `promotion_batch_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `current_school_year_id` (`current_school_year_id`),
  ADD KEY `target_school_year_id` (`target_school_year_id`),
  ADD KEY `executed_by_admin_id` (`executed_by_admin_id`);

--
-- Indexes for table `promotion_rules`
--
ALTER TABLE `promotion_rules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_rule` (`school_year_id`,`from_grade_level_id`),
  ADD KEY `idx_school_year` (`school_year_id`),
  ADD KEY `idx_from_grade` (`from_grade_level_id`),
  ADD KEY `to_grade_level_id` (`to_grade_level_id`),
  ADD KEY `created_by` (`created_by`);

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
-- Indexes for table `school_years`
--
ALTER TABLE `school_years`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `year_name` (`year_name`),
  ADD KEY `idx_year_name` (`year_name`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_section_per_year` (`section_name`,`grade_level_id`,`school_year_id`),
  ADD KEY `idx_grade_level` (`grade_level_id`),
  ADD KEY `idx_school_year` (`school_year_id`),
  ADD KEY `idx_adviser` (`adviser_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD PRIMARY KEY (`sms_id`),
  ADD KEY `idx_visit` (`visit_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_sent_at` (`sent_at`);

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
-- Indexes for table `student_promotions`
--
ALTER TABLE `student_promotions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_school_year` (`school_year_id`),
  ADD KEY `idx_promotion_date` (`promotion_date`),
  ADD KEY `idx_promotion_type` (`promotion_type`),
  ADD KEY `previous_grade_level_id` (`previous_grade_level_id`),
  ADD KEY `previous_section_id` (`previous_section_id`),
  ADD KEY `previous_adviser_id` (`previous_adviser_id`),
  ADD KEY `new_grade_level_id` (`new_grade_level_id`),
  ADD KEY `new_section_id` (`new_section_id`),
  ADD KEY `new_adviser_id` (`new_adviser_id`),
  ADD KEY `promoted_by_admin_id` (`promoted_by_admin_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_users_role` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `log_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2775;

--
-- AUTO_INCREMENT for table `advisers`
--
ALTER TABLE `advisers`
  MODIFY `adviser_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `adviser_assignments`
--
ALTER TABLE `adviser_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `allergies`
--
ALTER TABLE `allergies`
  MODIFY `allergy_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `clearance_requests`
--
ALTER TABLE `clearance_requests`
  MODIFY `request_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clearance_violations`
--
ALTER TABLE `clearance_violations`
  MODIFY `violation_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clinic_staff`
--
ALTER TABLE `clinic_staff`
  MODIFY `clinic_staff_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `diagnoses`
--
ALTER TABLE `diagnoses`
  MODIFY `diagnosis_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `drill_participants`
--
ALTER TABLE `drill_participants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `drill_scans`
--
ALTER TABLE `drill_scans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `email_logs`
--
ALTER TABLE `email_logs`
  MODIFY `log_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `emergency_drills`
--
ALTER TABLE `emergency_drills`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `grade_levels`
--
ALTER TABLE `grade_levels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medical_clearances`
--
ALTER TABLE `medical_clearances`
  MODIFY `clearance_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `medical_history`
--
ALTER TABLE `medical_history`
  MODIFY `history_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `medical_visits`
--
ALTER TABLE `medical_visits`
  MODIFY `visit_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `parents`
--
ALTER TABLE `parents`
  MODIFY `parent_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT for table `promotion_batch_logs`
--
ALTER TABLE `promotion_batch_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `promotion_rules`
--
ALTER TABLE `promotion_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qr_codes`
--
ALTER TABLE `qr_codes`
  MODIFY `qr_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `school_years`
--
ALTER TABLE `school_years`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `sections`
--
ALTER TABLE `sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `sms_logs`
--
ALTER TABLE `sms_logs`
  MODIFY `sms_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=209;

--
-- AUTO_INCREMENT for table `student_promotions`
--
ALTER TABLE `student_promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=263;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `advisers`
--
ALTER TABLE `advisers`
  ADD CONSTRAINT `advisers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `adviser_assignments`
--
ALTER TABLE `adviser_assignments`
  ADD CONSTRAINT `adviser_assignments_ibfk_1` FOREIGN KEY (`adviser_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `adviser_assignments_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `adviser_assignments_ibfk_3` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `adviser_assignments_ibfk_4` FOREIGN KEY (`assigned_by_admin_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `allergies`
--
ALTER TABLE `allergies`
  ADD CONSTRAINT `fk_allergy_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `clearance_requests`
--
ALTER TABLE `clearance_requests`
  ADD CONSTRAINT `fk_request_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_request_user` FOREIGN KEY (`requested_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `clearance_violations`
--
ALTER TABLE `clearance_violations`
  ADD CONSTRAINT `fk_violation_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_violation_user` FOREIGN KEY (`scanned_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

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
-- Constraints for table `drill_participants`
--
ALTER TABLE `drill_participants`
  ADD CONSTRAINT `drill_participants_drill_id_foreign` FOREIGN KEY (`drill_id`) REFERENCES `emergency_drills` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `drill_participants_rescuer_id_foreign` FOREIGN KEY (`rescuer_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `drill_participants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `drill_scans`
--
ALTER TABLE `drill_scans`
  ADD CONSTRAINT `drill_scans_drill_id_foreign` FOREIGN KEY (`drill_id`) REFERENCES `emergency_drills` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `drill_scans_participant_id_foreign` FOREIGN KEY (`participant_id`) REFERENCES `drill_participants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `drill_scans_scanned_by_foreign` FOREIGN KEY (`scanned_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `emergency_drills`
--
ALTER TABLE `emergency_drills`
  ADD CONSTRAINT `emergency_drills_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `medical_visits`
--
ALTER TABLE `medical_visits`
  ADD CONSTRAINT `fk_visit_staff` FOREIGN KEY (`clinic_staff_id`) REFERENCES `clinic_staff` (`clinic_staff_id`),
  ADD CONSTRAINT `fk_visit_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`),
  ADD CONSTRAINT `fk_notif_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_notif_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`);

--
-- Constraints for table `parents`
--
ALTER TABLE `parents`
  ADD CONSTRAINT `fk_parents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `promotion_batch_logs`
--
ALTER TABLE `promotion_batch_logs`
  ADD CONSTRAINT `promotion_batch_logs_ibfk_1` FOREIGN KEY (`current_school_year_id`) REFERENCES `school_years` (`id`),
  ADD CONSTRAINT `promotion_batch_logs_ibfk_2` FOREIGN KEY (`target_school_year_id`) REFERENCES `school_years` (`id`),
  ADD CONSTRAINT `promotion_batch_logs_ibfk_3` FOREIGN KEY (`executed_by_admin_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `promotion_rules`
--
ALTER TABLE `promotion_rules`
  ADD CONSTRAINT `promotion_rules_ibfk_1` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `promotion_rules_ibfk_2` FOREIGN KEY (`from_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `promotion_rules_ibfk_3` FOREIGN KEY (`to_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `promotion_rules_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD CONSTRAINT `fk_qr_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `school_years`
--
ALTER TABLE `school_years`
  ADD CONSTRAINT `school_years_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD CONSTRAINT `fk_sms_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sms_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE SET NULL;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_students_adviser` FOREIGN KEY (`current_adviser_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_grade_level` FOREIGN KEY (`current_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_school_year` FOREIGN KEY (`current_school_year_id`) REFERENCES `school_years` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_section` FOREIGN KEY (`current_section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `student_promotions`
--
ALTER TABLE `student_promotions`
  ADD CONSTRAINT `student_promotions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_promotions_ibfk_2` FOREIGN KEY (`previous_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_3` FOREIGN KEY (`previous_section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_4` FOREIGN KEY (`previous_adviser_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_5` FOREIGN KEY (`new_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_6` FOREIGN KEY (`new_section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_7` FOREIGN KEY (`new_adviser_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_8` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`),
  ADD CONSTRAINT `student_promotions_ibfk_9` FOREIGN KEY (`promoted_by_admin_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
