-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: 4seasons
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `action` varchar(150) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `fk_log_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (19,8,'Registration',NULL,'::1','2026-01-12 05:55:32'),(20,8,'Login',NULL,'::1','2026-01-12 05:56:07'),(21,9,'Registration',NULL,'::1','2026-01-12 06:03:32'),(22,10,'Registration',NULL,'::1','2026-01-12 06:03:34'),(23,10,'Login',NULL,'::1','2026-01-12 06:03:35'),(24,9,'Login',NULL,'::1','2026-01-12 06:04:27'),(25,11,'Registration',NULL,'::1','2026-01-12 06:04:54'),(26,11,'Login',NULL,'::1','2026-01-12 06:05:10'),(27,12,'Registration',NULL,'::1','2026-01-12 06:07:16'),(28,12,'Login',NULL,'::1','2026-01-12 06:07:18'),(29,13,'Registration',NULL,'::1','2026-01-12 06:07:43'),(30,13,'Login',NULL,'::1','2026-01-12 06:07:43'),(31,14,'Registration',NULL,'::1','2026-01-12 06:22:29'),(32,14,'Login',NULL,'::1','2026-01-12 06:22:29'),(33,15,'Registration',NULL,'::1','2026-01-12 06:22:30'),(34,16,'Registration',NULL,'::1','2026-01-12 06:25:17'),(35,16,'Login',NULL,'::1','2026-01-12 06:25:18'),(36,17,'Registration',NULL,'::1','2026-01-12 06:25:19'),(37,18,'Registration',NULL,'::1','2026-01-12 06:25:20'),(38,19,'Registration',NULL,'::1','2026-01-12 06:30:14'),(39,19,'Login',NULL,'::1','2026-01-12 06:30:20'),(40,20,'Registration',NULL,'::1','2026-01-12 06:32:45'),(41,20,'Login',NULL,'::1','2026-01-12 06:32:47'),(42,21,'Registration',NULL,'::1','2026-01-12 06:42:48'),(43,21,'Login',NULL,'::1','2026-01-12 06:42:49'),(44,19,'Login',NULL,'::1','2026-01-12 06:48:36'),(45,22,'Registration',NULL,'::1','2026-01-12 06:50:10'),(46,22,'Login',NULL,'::1','2026-01-12 06:50:11'),(47,25,'Registration',NULL,'::1','2026-01-12 07:00:10'),(48,25,'Login',NULL,'::1','2026-01-12 07:00:16'),(49,25,'Login',NULL,'::1','2026-01-12 07:09:32'),(50,26,'Registration',NULL,'::1','2026-01-12 07:51:26'),(51,26,'Login',NULL,'::1','2026-01-12 07:51:35'),(52,26,'Login',NULL,'::1','2026-01-12 08:10:21'),(53,30,'Registration',NULL,'::1','2026-01-12 08:26:17'),(54,30,'Login',NULL,'::1','2026-01-12 08:26:25'),(55,31,'Registration',NULL,'::1','2026-01-12 08:27:05'),(56,31,'Login',NULL,'::1','2026-01-12 08:27:12'),(57,30,'Login',NULL,'::1','2026-01-12 08:27:31'),(58,31,'Login',NULL,'::1','2026-01-12 08:30:53'),(59,32,'Registration',NULL,'::1','2026-01-12 08:40:55'),(60,32,'Login',NULL,'::1','2026-01-12 08:41:02'),(61,32,'Login',NULL,'::1','2026-01-12 08:43:01'),(62,32,'Login',NULL,'::1','2026-01-12 08:54:32'),(63,30,'Login',NULL,'::1','2026-01-12 09:03:24'),(64,32,'Login',NULL,'::1','2026-01-12 09:06:59'),(65,30,'Login',NULL,'::1','2026-01-12 10:13:53'),(66,30,'Login',NULL,'::1','2026-01-12 10:46:58'),(67,31,'Login',NULL,'::1','2026-01-12 12:21:35'),(68,32,'Login',NULL,'::1','2026-01-12 12:22:13'),(69,30,'Login',NULL,'::1','2026-01-12 12:34:20'),(70,30,'Login',NULL,'::1','2026-01-12 12:35:27'),(71,32,'Login',NULL,'::1','2026-01-12 12:35:43'),(72,31,'Login',NULL,'::1','2026-01-12 12:54:48'),(73,32,'Login',NULL,'::1','2026-01-12 12:55:13'),(74,30,'Login',NULL,'::1','2026-01-12 14:07:36'),(75,30,'Login',NULL,'::1','2026-01-12 14:08:09'),(76,32,'Login',NULL,'::1','2026-01-12 14:08:33'),(77,30,'Login',NULL,'::1','2026-01-12 15:17:20'),(78,32,'Login',NULL,'::1','2026-01-12 15:19:55'),(79,32,'Login',NULL,'::1','2026-01-12 15:48:50'),(80,32,'Login',NULL,'::1','2026-01-12 16:07:03'),(81,32,'Login',NULL,'::1','2026-01-12 16:13:25'),(82,32,'Login',NULL,'::1','2026-01-12 16:24:39'),(83,30,'Login',NULL,'::1','2026-01-12 16:41:37'),(84,31,'Login',NULL,'::1','2026-01-12 16:42:40'),(85,32,'Login',NULL,'::1','2026-01-12 16:51:19'),(86,31,'Login',NULL,'::1','2026-01-12 16:54:19'),(87,32,'Login',NULL,'::1','2026-01-12 17:14:40'),(88,30,'Login',NULL,'::1','2026-01-12 17:46:51'),(89,31,'Login',NULL,'::1','2026-01-12 17:47:47'),(90,32,'Login',NULL,'::1','2026-01-12 17:48:19'),(91,33,'Admin Account Created',NULL,'127.0.0.1','2026-01-12 18:42:10'),(92,33,'Login',NULL,'::1','2026-01-12 18:44:22'),(93,33,'Login',NULL,'::1','2026-01-12 18:49:05'),(94,33,'Database Backup','Created backup: db_backup_2026-01-12_195746.sql (0.02 MB)',NULL,'2026-01-12 18:57:48'),(95,33,'Database Backup','Created backup: db_backup_2026-01-12_195756.sql (0.02 MB)',NULL,'2026-01-12 18:57:57'),(96,33,'Database Backup','Created backup: db_backup_2026-01-12_200418.sql (0.02 MB)',NULL,'2026-01-12 19:04:19'),(97,33,'Database Backup','Created backup: db_backup_2026-01-12_200431.sql (0.02 MB)',NULL,'2026-01-12 19:04:32'),(98,33,'Database Backup','Created backup: db_backup_2026-01-12_202214.sql (0.02 MB)',NULL,'2026-01-12 19:22:15'),(99,33,'Backup Download','Downloaded backup: db_backup_2026-01-12_202214.sql',NULL,'2026-01-12 19:22:25'),(100,33,'Backup Download','Downloaded backup: db_backup_2026-01-12_200418.sql',NULL,'2026-01-12 19:37:42'),(101,33,'Database Backup','Created backup: db_backup_2026-01-12_204227.sql (0.02 MB)',NULL,'2026-01-12 19:42:29'),(102,33,'Database Backup','Created backup: db_backup_2026-01-12_205218.sql (0.02 MB)',NULL,'2026-01-12 19:52:20'),(103,33,'Backup Download','Downloaded backup: db_backup_2026-01-12_205218.sql',NULL,'2026-01-12 19:52:29'),(104,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_205218.sql',NULL,'2026-01-12 19:53:31'),(105,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_204227.sql',NULL,'2026-01-12 19:53:34'),(106,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_195746.sql',NULL,'2026-01-12 19:53:38'),(107,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_202214.sql',NULL,'2026-01-12 19:53:40'),(108,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_195756.sql',NULL,'2026-01-12 19:53:43'),(109,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_200418.sql',NULL,'2026-01-12 19:53:46'),(110,33,'Database Backup','Created backup: db_backup_2026-01-12_205348.sql (0.03 MB)',NULL,'2026-01-12 19:53:49'),(111,33,'Backup Download','Downloaded backup: db_backup_2026-01-12_205348.sql',NULL,'2026-01-12 19:53:52'),(112,33,'Database Backup','Created backup: db_backup_2026-01-12_205413.sql (0.03 MB)',NULL,'2026-01-12 19:54:14'),(113,33,'Database Backup','Created backup: db_backup_2026-01-12_205805.sql (0.03 MB)',NULL,'2026-01-12 19:58:08'),(114,33,'Backup Download','Downloaded backup: db_backup_2026-01-12_205805.sql',NULL,'2026-01-12 19:58:11'),(115,33,'Database Backup','Created backup: db_backup_2026-01-12_205859.sql (0.03 MB)',NULL,'2026-01-12 19:59:06'),(116,33,'Backup Download','Downloaded backup: db_backup_2026-01-12_205859.sql',NULL,'2026-01-12 19:59:09'),(117,33,'Database Backup','Created backup: db_backup_2026-01-12_210009.sql (0.03 MB)',NULL,'2026-01-12 20:00:14'),(118,33,'Backup Download','Downloaded backup: db_backup_2026-01-12_210009.sql',NULL,'2026-01-12 20:00:21'),(119,33,'Database Backup','Created backup: db_backup_2026-01-12_211826.sql (0.03 MB)',NULL,'2026-01-12 20:18:27'),(120,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_211826.sql',NULL,'2026-01-12 20:18:35'),(121,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_210009.sql',NULL,'2026-01-12 20:18:37'),(122,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_205859.sql',NULL,'2026-01-12 20:18:39'),(123,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_205805.sql',NULL,'2026-01-12 20:18:41'),(124,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_205413.sql',NULL,'2026-01-12 20:18:44'),(125,33,'Backup Deleted','Deleted backup: db_backup_2026-01-12_205348.sql',NULL,'2026-01-12 20:18:46'),(126,33,'Database Backup','Created backup: db_backup_2026-01-12_211848.sql (0.03 MB)',NULL,'2026-01-12 20:18:48'),(127,33,'Backup Download','Downloaded backup: db_backup_2026-01-12_211848.sql',NULL,'2026-01-12 20:18:50'),(128,33,'Database Backup','Created backup: db_backup_2026-01-12_211921.sql (0.03 MB)',NULL,'2026-01-12 20:19:22'),(129,33,'Backup Download','Downloaded backup: db_backup_2026-01-12_211921.sql',NULL,'2026-01-12 20:19:25');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `advisers`
--

DROP TABLE IF EXISTS `advisers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `advisers` (
  `adviser_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `first_name` varchar(80) DEFAULT NULL,
  `last_name` varchar(80) DEFAULT NULL,
  `employee_number` varchar(50) DEFAULT NULL,
  `contact_phone` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL,
  `grade_level` varchar(10) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`adviser_id`),
  UNIQUE KEY `employee_number` (`employee_number`),
  KEY `fk_advisers_user` (`user_id`),
  CONSTRAINT `fk_advisers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `advisers`
--

LOCK TABLES `advisers` WRITE;
/*!40000 ALTER TABLE `advisers` DISABLE KEYS */;
INSERT INTO `advisers` VALUES (6,31,'Irene','Del Monte',NULL,'09471837592','2026-01-12 08:27:05',1,NULL,'12','STEM-2');
/*!40000 ALTER TABLE `advisers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `allergies`
--

DROP TABLE IF EXISTS `allergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `allergies` (
  `allergy_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(10) unsigned NOT NULL,
  `allergy_text` varchar(255) DEFAULT NULL,
  `severity` enum('Mild','Moderate','Severe') DEFAULT 'Moderate',
  `recorded_at` date DEFAULT NULL,
  PRIMARY KEY (`allergy_id`),
  KEY `fk_allergy_student` (`student_id`)
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clinic_staff` (
  `clinic_staff_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `staff_code` varchar(50) DEFAULT NULL,
  `position` varchar(80) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`clinic_staff_id`),
  UNIQUE KEY `staff_code` (`staff_code`),
  KEY `fk_clinic_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinic_staff`
--

LOCK TABLES `clinic_staff` WRITE;
/*!40000 ALTER TABLE `clinic_staff` DISABLE KEYS */;
INSERT INTO `clinic_staff` VALUES (2,10,NULL,'Nurse','2026-01-12 06:03:34',1,NULL),(3,18,NULL,'Nurse','2026-01-12 06:25:20',1,NULL),(4,32,NULL,'Staff','2026-01-12 08:40:55',1,NULL);
/*!40000 ALTER TABLE `clinic_staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diagnoses`
--

DROP TABLE IF EXISTS `diagnoses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `diagnoses` (
  `diagnosis_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint(20) unsigned NOT NULL,
  `icd_code` varchar(20) DEFAULT NULL,
  `diagnosis_text` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`diagnosis_id`),
  KEY `fk_diag_visit` (`visit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diagnoses`
--

LOCK TABLES `diagnoses` WRITE;
/*!40000 ALTER TABLE `diagnoses` DISABLE KEYS */;
INSERT INTO `diagnoses` VALUES (1,1,NULL,'FEVER');
/*!40000 ALTER TABLE `diagnoses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_visits`
--

DROP TABLE IF EXISTS `medical_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medical_visits` (
  `visit_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(10) unsigned NOT NULL,
  `clinic_staff_id` int(10) unsigned DEFAULT NULL,
  `visit_datetime` datetime NOT NULL,
  `visit_type` enum('Routine','Emergency','Follow-up','Referral') DEFAULT 'Routine',
  `chief_complaint` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('Open','Closed','Referred') DEFAULT 'Open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`visit_id`),
  KEY `fk_visit_staff` (`clinic_staff_id`),
  KEY `idx_visit_student_datetime` (`student_id`,`visit_datetime`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_visits`
--

LOCK TABLES `medical_visits` WRITE;
/*!40000 ALTER TABLE `medical_visits` DISABLE KEYS */;
INSERT INTO `medical_visits` VALUES (1,21,NULL,'2026-01-12 09:01:00','Routine','aaaaa','Diagnosis: FEVER\n\nTreatment: REST\n\nMedications: HAPLAS','Closed','2026-01-12 09:02:35');
/*!40000 ALTER TABLE `medical_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medications`
--

DROP TABLE IF EXISTS `medications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medications` (
  `med_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint(20) unsigned NOT NULL,
  `medication_name` varchar(150) DEFAULT NULL,
  `dosage` varchar(80) DEFAULT NULL,
  `route` varchar(50) DEFAULT NULL,
  `frequency` varchar(80) DEFAULT NULL,
  `duration` varchar(80) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`med_id`),
  KEY `fk_med_visit` (`visit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medications`
--

LOCK TABLES `medications` WRITE;
/*!40000 ALTER TABLE `medications` DISABLE KEYS */;
INSERT INTO `medications` VALUES (1,1,'HAPLAS',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `medications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `notification_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int(10) unsigned DEFAULT NULL,
  `student_id` int(10) unsigned DEFAULT NULL,
  `visit_id` bigint(20) unsigned DEFAULT NULL,
  `channel` enum('SMS','Email') DEFAULT 'SMS',
  `message` text DEFAULT NULL,
  `status` enum('Pending','Sent','Failed') DEFAULT 'Pending',
  `provider_id` varchar(100) DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`),
  KEY `fk_notif_parent` (`parent_id`),
  KEY `fk_notif_student` (`student_id`),
  KEY `fk_notif_visit` (`visit_id`),
  KEY `idx_notifications_status_sentat` (`status`,`sent_at`)
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `parents` (
  `parent_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_name` varchar(80) NOT NULL,
  `relation` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`parent_id`),
  KEY `fk_parents_user` (`user_id`)
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qr_codes` (
  `qr_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(10) unsigned NOT NULL,
  `qr_token` varchar(255) NOT NULL,
  `qr_generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `qr_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`qr_id`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `qr_token` (`qr_token`)
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `role_id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `role_name` varchar(30) NOT NULL,
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_adviser` (
  `student_id` int(10) unsigned NOT NULL,
  `adviser_id` int(10) unsigned NOT NULL,
  `assigned_date` date DEFAULT NULL,
  PRIMARY KEY (`student_id`,`adviser_id`),
  KEY `fk_sa_adviser` (`adviser_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_adviser`
--

LOCK TABLES `student_adviser` WRITE;
/*!40000 ALTER TABLE `student_adviser` DISABLE KEYS */;
INSERT INTO `student_adviser` VALUES (6,4,'2026-01-12'),(7,4,'2026-01-12'),(8,4,'2026-01-12'),(9,4,'2026-01-12'),(10,4,'2026-01-12'),(18,4,'2026-01-12'),(19,4,'2026-01-12'),(20,4,'2026-01-12'),(21,6,'2026-01-12');
/*!40000 ALTER TABLE `student_adviser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_parent`
--

DROP TABLE IF EXISTS `student_parent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_parent` (
  `student_id` int(10) unsigned NOT NULL,
  `parent_id` int(10) unsigned NOT NULL,
  `relationship_note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`student_id`,`parent_id`),
  KEY `fk_sp_parent` (`parent_id`)
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `student_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `student_number` varchar(30) NOT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
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
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `student_number` (`student_number`),
  KEY `fk_students_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (21,'10000',30,'HANNAH LORAINNE','MANLIQUES','GENANDOY','2005-04-03','F','12','STEM-2','GK Laura\n','A','Mother: Airen - 09260023267','2026-01-12 08:26:17',1,NULL);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `treatments`
--

DROP TABLE IF EXISTS `treatments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `treatments` (
  `treatment_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint(20) unsigned NOT NULL,
  `treatment_text` varchar(255) DEFAULT NULL,
  `performed_by` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`treatment_id`),
  KEY `fk_treat_visit` (`visit_id`),
  KEY `fk_treat_staff` (`performed_by`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treatments`
--

LOCK TABLES `treatments` WRITE;
/*!40000 ALTER TABLE `treatments` DISABLE KEYS */;
INSERT INTO `treatments` VALUES (1,1,'REST',NULL);
/*!40000 ALTER TABLE `treatments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `role_id` tinyint(3) unsigned NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_users_role` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (30,2,'10000','$2y$10$3kuL80sysV.O5XpstVwfFunUXc8kwL6GHlx.yR5VGJUWCxAYrD7na','HANNAHLORAINNEGENANDOY@GMAIL.COM','09260023267','HANNAH LORAINNE MANLIQUES GENANDOY','2026-01-12 08:26:17',1,NULL),(31,3,'irene.del monte','$2y$10$zrqmkj/.hR167l7pGwzC4.3SAlDg1JIwjQQxMKghdwydjCT6jz5vy','irened@gmail.com','09471837592','Irene  Del Monte','2026-01-12 08:27:05',1,NULL),(32,4,'lulubelle.gabasa','$2y$10$EYdNQ/tkwTONfrnjnXV8heivgrjjVHm8klKLfgSTG8StnsjEB/jsu','lulubelleg@gmail.com','09746271567','Lulubelle  Gabasa','2026-01-12 08:40:55',1,NULL),(33,1,'admin','$2y$10$bdse/L9txQjcljCp.FWez.oU.Oy3VQW65JIqCr.Iw8B3OSPi6V8ji','admin@4seasons.local',NULL,'System Administrator','2026-01-12 18:42:10',1,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vitals`
--

DROP TABLE IF EXISTS `vitals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vitals` (
  `vitals_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint(20) unsigned NOT NULL,
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
  `bmi_category` varchar(20) GENERATED ALWAYS AS (case when `height_cm` > 0 and `weight_kg` > 0 then case when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) < 18.5 then _utf8mb4'Underweight' when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) between 18.5 and 24.9 then _utf8mb4'Normal' when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) between 25.0 and 29.9 then _utf8mb4'Overweight' when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) >= 30.0 then _utf8mb4'Obese' else NULL end else NULL end) STORED,
  PRIMARY KEY (`vitals_id`),
  KEY `fk_vitals_visit` (`visit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vitals`
--

LOCK TABLES `vitals` WRITE;
/*!40000 ALTER TABLE `vitals` DISABLE KEYS */;
INSERT INTO `vitals` VALUES (1,1,'2026-01-12 09:01:00',NULL,NULL,38.00,110,80,80,15,NULL,NULL,NULL);
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

-- Dump completed on 2026-01-13  4:20:22
