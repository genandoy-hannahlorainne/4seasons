-- Add missing tables for medical visits

-- Vitals table
CREATE TABLE IF NOT EXISTS `vitals` (
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
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`vitals_id`),
  KEY `fk_vitals_visit` (`visit_id`),
  CONSTRAINT `fk_vitals_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Diagnoses table
CREATE TABLE IF NOT EXISTS `diagnoses` (
  `diagnosis_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint unsigned NOT NULL,
  `icd_code` varchar(20) DEFAULT NULL,
  `diagnosis_text` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`diagnosis_id`),
  KEY `fk_diag_visit` (`visit_id`),
  CONSTRAINT `fk_diag_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Treatments table
CREATE TABLE IF NOT EXISTS `treatments` (
  `treatment_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint unsigned NOT NULL,
  `treatment_text` varchar(255) DEFAULT NULL,
  `performed_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`treatment_id`),
  KEY `fk_treat_visit` (`visit_id`),
  CONSTRAINT `fk_treat_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Medications table
CREATE TABLE IF NOT EXISTS `medications` (
  `med_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` bigint unsigned NOT NULL,
  `medication_name` varchar(150) DEFAULT NULL,
  `dosage` varchar(80) DEFAULT NULL,
  `route` varchar(50) DEFAULT NULL,
  `frequency` varchar(80) DEFAULT NULL,
  `duration` varchar(80) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`med_id`),
  KEY `fk_med_visit` (`visit_id`),
  CONSTRAINT `fk_med_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Notifications table (for adviser notifications)
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int unsigned DEFAULT NULL,
  `student_id` int unsigned DEFAULT NULL,
  `visit_id` bigint unsigned DEFAULT NULL,
  `channel` enum('SMS','Email') DEFAULT 'SMS',
  `message` text,
  `status` enum('Pending','Sent','Failed') DEFAULT 'Pending',
  `provider_id` varchar(100) DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `fk_notif_student` (`student_id`),
  KEY `fk_notif_visit` (`visit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
