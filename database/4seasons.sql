-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: 4seasons
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `log_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `action` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_general_ci,
  `ip_address` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_log_user` (`user_id`),
  CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `advisers`
--

DROP TABLE IF EXISTS `advisers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `advisers` (
  `adviser_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `first_name` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `employee_number` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `contact_phone` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`adviser_id`),
  UNIQUE KEY `employee_number` (`employee_number`),
  KEY `fk_advisers_user` (`user_id`),
  CONSTRAINT `fk_advisers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `advisers`
--

LOCK TABLES `advisers` WRITE;
/*!40000 ALTER TABLE `advisers` DISABLE KEYS */;
/*!40000 ALTER TABLE `advisers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `allergies`
--

DROP TABLE IF EXISTS `allergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allergies` (
  `allergy_id` int unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int unsigned NOT NULL,
  `allergy_text` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `severity` enum('Mild','Moderate','Severe') COLLATE utf8mb4_general_ci DEFAULT 'Moderate',
  `recorded_at` date DEFAULT NULL,
  PRIMARY KEY (`allergy_id`),
  KEY `fk_allergy_student` (`student_id`),
  CONSTRAINT `fk_allergy_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allergies`
--

LOCK TABLES `allergies` WRITE;
/*!40000 ALTER TABLE `allergies` DISABLE KEYS */;
/*!40000 ALTER TABLE `allergies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinic_staff`
--

DROP TABLE IF EXISTS `clinic_staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clinic_staff` (
  `clinic_staff_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `staff_code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `position` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`clinic_staff_id`),
  UNIQUE KEY `staff_code` (`staff_code`),
  KEY `fk_clinic_user` (`user_id`),
  CONSTRAINT `fk_clinic_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinic_staff`
--

LOCK TABLES `clinic_staff` WRITE;
/*!40000 ALTER TABLE `clinic_staff` DISABLE KEYS */;
/*!40000 ALTER TABLE `clinic_staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diagnoses`
--

DROP TABLE IF EXISTS `diagnoses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diagnoses` (
  `diagnosis_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint unsigned NOT NULL,
  `icd_code` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `diagnosis_text` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`diagnosis_id`),
  KEY `fk_diag_visit` (`visit_id`),
  CONSTRAINT `fk_diag_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diagnoses`
--

LOCK TABLES `diagnoses` WRITE;
/*!40000 ALTER TABLE `diagnoses` DISABLE KEYS */;
/*!40000 ALTER TABLE `diagnoses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `immunizations`
--

DROP TABLE IF EXISTS `immunizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `immunizations` (
  `immunization_id` int unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int unsigned NOT NULL,
  `vaccine_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_administered` date DEFAULT NULL,
  `administered_by` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`immunization_id`),
  KEY `fk_immun_student` (`student_id`),
  CONSTRAINT `fk_immun_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `immunizations`
--

LOCK TABLES `immunizations` WRITE;
/*!40000 ALTER TABLE `immunizations` DISABLE KEYS */;
/*!40000 ALTER TABLE `immunizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_visits`
--

DROP TABLE IF EXISTS `medical_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_visits` (
  `visit_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int unsigned NOT NULL,
  `clinic_staff_id` int unsigned DEFAULT NULL,
  `visit_datetime` datetime NOT NULL,
  `visit_type` enum('Routine','Emergency','Follow-up','Referral') COLLATE utf8mb4_general_ci DEFAULT 'Routine',
  `chief_complaint` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `status` enum('Open','Closed','Referred') COLLATE utf8mb4_general_ci DEFAULT 'Open',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`visit_id`),
  KEY `fk_visit_staff` (`clinic_staff_id`),
  KEY `idx_visit_student_datetime` (`student_id`,`visit_datetime`),
  CONSTRAINT `fk_visit_staff` FOREIGN KEY (`clinic_staff_id`) REFERENCES `clinic_staff` (`clinic_staff_id`),
  CONSTRAINT `fk_visit_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_visits`
--

LOCK TABLES `medical_visits` WRITE;
/*!40000 ALTER TABLE `medical_visits` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medications`
--

DROP TABLE IF EXISTS `medications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medications` (
  `med_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint unsigned NOT NULL,
  `medication_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `dosage` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `route` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `frequency` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `duration` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`med_id`),
  KEY `fk_med_visit` (`visit_id`),
  CONSTRAINT `fk_med_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medications`
--

LOCK TABLES `medications` WRITE;
/*!40000 ALTER TABLE `medications` DISABLE KEYS */;
/*!40000 ALTER TABLE `medications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int unsigned DEFAULT NULL,
  `student_id` int unsigned DEFAULT NULL,
  `visit_id` bigint unsigned DEFAULT NULL,
  `channel` enum('SMS','Email') COLLATE utf8mb4_general_ci DEFAULT 'SMS',
  `message` text COLLATE utf8mb4_general_ci,
  `status` enum('Pending','Sent','Failed') COLLATE utf8mb4_general_ci DEFAULT 'Pending',
  `provider_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `fk_notif_parent` (`parent_id`),
  KEY `fk_notif_student` (`student_id`),
  KEY `fk_notif_visit` (`visit_id`),
  KEY `idx_notifications_status_sentat` (`status`,`sent_at`),
  CONSTRAINT `fk_notif_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`),
  CONSTRAINT `fk_notif_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  CONSTRAINT `fk_notif_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parents`
--

DROP TABLE IF EXISTS `parents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parents` (
  `parent_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `first_name` varchar(80) COLLATE utf8mb4_general_ci NOT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_general_ci NOT NULL,
  `relation` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`parent_id`),
  KEY `fk_parents_user` (`user_id`),
  CONSTRAINT `fk_parents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parents`
--

LOCK TABLES `parents` WRITE;
/*!40000 ALTER TABLE `parents` DISABLE KEYS */;
/*!40000 ALTER TABLE `parents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qr_codes`
--

DROP TABLE IF EXISTS `qr_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qr_codes` (
  `qr_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int unsigned NOT NULL,
  `qr_token` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `qr_generated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `qr_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`qr_id`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `qr_token` (`qr_token`),
  CONSTRAINT `fk_qr_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qr_codes`
--

LOCK TABLES `qr_codes` WRITE;
/*!40000 ALTER TABLE `qr_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `qr_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `role_name` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin'),(3,'Adviser'),(4,'Clinic Staff'),(5,'Parent'),(2,'Student');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_adviser`
--

DROP TABLE IF EXISTS `student_adviser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_adviser` (
  `student_id` int unsigned NOT NULL,
  `adviser_id` int unsigned NOT NULL,
  `assigned_date` date DEFAULT NULL,
  PRIMARY KEY (`student_id`,`adviser_id`),
  KEY `fk_sa_adviser` (`adviser_id`),
  CONSTRAINT `fk_sa_adviser` FOREIGN KEY (`adviser_id`) REFERENCES `advisers` (`adviser_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sa_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_adviser`
--

LOCK TABLES `student_adviser` WRITE;
/*!40000 ALTER TABLE `student_adviser` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_adviser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_parent`
--

DROP TABLE IF EXISTS `student_parent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_parent` (
  `student_id` int unsigned NOT NULL,
  `parent_id` int unsigned NOT NULL,
  `relationship_note` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`student_id`,`parent_id`),
  KEY `fk_sp_parent` (`parent_id`),
  CONSTRAINT `fk_sp_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sp_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_parent`
--

LOCK TABLES `student_parent` WRITE;
/*!40000 ALTER TABLE `student_parent` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_parent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` int unsigned NOT NULL AUTO_INCREMENT,
  `student_number` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `first_name` varchar(80) COLLATE utf8mb4_general_ci NOT NULL,
  `middle_name` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_general_ci NOT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('M','F','Other') COLLATE utf8mb4_general_ci DEFAULT 'Other',
  `grade_level` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `section` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `blood_type` varchar(5) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `emergency_contact` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `student_number` (`student_number`),
  KEY `fk_students_user` (`user_id`),
  CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `treatments`
--

DROP TABLE IF EXISTS `treatments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `treatments` (
  `treatment_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint unsigned NOT NULL,
  `treatment_text` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `performed_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`treatment_id`),
  KEY `fk_treat_visit` (`visit_id`),
  KEY `fk_treat_staff` (`performed_by`),
  CONSTRAINT `fk_treat_staff` FOREIGN KEY (`performed_by`) REFERENCES `clinic_staff` (`clinic_staff_id`),
  CONSTRAINT `fk_treat_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treatments`
--

LOCK TABLES `treatments` WRITE;
/*!40000 ALTER TABLE `treatments` DISABLE KEYS */;
/*!40000 ALTER TABLE `treatments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `role_id` tinyint unsigned NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_users_role` (`role_id`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vitals`
--

DROP TABLE IF EXISTS `vitals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vitals` (
  `vitals_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint unsigned NOT NULL,
  `recorded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `temperature_c` decimal(4,2) DEFAULT NULL,
  `bp_systolic` smallint DEFAULT NULL,
  `bp_diastolic` smallint DEFAULT NULL,
  `pulse_rate` smallint DEFAULT NULL,
  `respiration_rate` smallint DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bmi` decimal(5,2) GENERATED ALWAYS AS ((case when ((`height_cm` > 0) and (`weight_kg` > 0)) then round((`weight_kg` / ((`height_cm` / 100) * (`height_cm` / 100))),2) else NULL end)) STORED,
  `bmi_category` varchar(20) COLLATE utf8mb4_general_ci GENERATED ALWAYS AS ((case when ((`height_cm` > 0) and (`weight_kg` > 0)) then (case when (round((`weight_kg` / ((`height_cm` / 100) * (`height_cm` / 100))),2) < 18.5) then _utf8mb4'Underweight' when (round((`weight_kg` / ((`height_cm` / 100) * (`height_cm` / 100))),2) between 18.5 and 24.9) then _utf8mb4'Normal' when (round((`weight_kg` / ((`height_cm` / 100) * (`height_cm` / 100))),2) between 25.0 and 29.9) then _utf8mb4'Overweight' when (round((`weight_kg` / ((`height_cm` / 100) * (`height_cm` / 100))),2) >= 30.0) then _utf8mb4'Obese' else NULL end) else NULL end)) STORED,
  PRIMARY KEY (`vitals_id`),
  KEY `fk_vitals_visit` (`visit_id`),
  CONSTRAINT `fk_vitals_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vitals`
--

LOCK TABLES `vitals` WRITE;
/*!40000 ALTER TABLE `vitals` DISABLE KEYS */;
/*!40000 ALTER TABLE `vitals` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-08  7:40:13
