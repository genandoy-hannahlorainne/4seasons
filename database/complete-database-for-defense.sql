-- ============================================
-- Complete Database Structure for Defense
-- ============================================
-- This script adds the missing tables and columns
-- to make the database 100% complete and aligned
-- with the proposed process flow
-- ============================================

-- 1. CREATE SMS LOGS TABLE
-- Purpose: Track SMS notifications sent to parents
-- Aligns with: Step 4 (Final Notification) of process flow
-- ============================================

CREATE TABLE IF NOT EXISTS `sms_logs` (
  `sms_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `visit_id` BIGINT UNSIGNED NULL COMMENT 'Related medical visit',
  `student_id` INT UNSIGNED NOT NULL COMMENT 'Student being notified about',
  `recipient_name` VARCHAR(150) NULL COMMENT 'Parent/Guardian name',
  `phone_number` VARCHAR(20) NOT NULL COMMENT 'Recipient phone number',
  `message_type` ENUM('emergency', 'routine', 'general') DEFAULT 'general' COMMENT 'Type of notification',
  `message_content` TEXT NOT NULL COMMENT 'SMS message content',
  `status` ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending' COMMENT 'Delivery status',
  `sent_at` DATETIME NULL COMMENT 'When SMS was sent',
  `delivered_at` DATETIME NULL COMMENT 'When SMS was delivered',
  `error_message` TEXT NULL COMMENT 'Error details if failed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sms_id`),
  KEY `idx_visit` (`visit_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_sent_at` (`sent_at`),
  CONSTRAINT `fk_sms_visit` FOREIGN KEY (`visit_id`) 
    REFERENCES `medical_visits` (`visit_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sms_student` FOREIGN KEY (`student_id`) 
    REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Tracks SMS notifications sent to parents/guardians';

-- ============================================
-- 2. ADD NOTIFICATION COLUMNS TO MEDICAL VISITS
-- Purpose: Track parent notification decisions
-- Aligns with: Step 4 decision point in process flow
-- ============================================

-- Check if columns exist before adding
SET @dbname = DATABASE();
SET @tablename = 'medical_visits';
SET @columnname = 'notify_parent';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN notify_parent BOOLEAN DEFAULT FALSE COMMENT ''Whether to notify parent/guardian'' AFTER status')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'parent_notified_at';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN parent_notified_at DATETIME NULL COMMENT ''When parent was notified'' AFTER notify_parent')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'notification_method';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN notification_method ENUM(''sms'', ''email'', ''call'', ''none'') DEFAULT ''none'' COMMENT ''Method used to notify parent'' AFTER parent_notified_at')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 3. CREATE IMMUNIZATIONS TABLE (OPTIONAL BUT RECOMMENDED)
-- Purpose: Track student vaccinations/immunizations
-- Aligns with: Complete medical records requirement
-- ============================================

CREATE TABLE IF NOT EXISTS `immunizations` (
  `immunization_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` INT UNSIGNED NOT NULL COMMENT 'Student receiving immunization',
  `vaccine_name` VARCHAR(100) NOT NULL COMMENT 'Name of vaccine',
  `date_administered` DATE NOT NULL COMMENT 'Date vaccine was given',
  `administered_by` VARCHAR(150) NULL COMMENT 'Healthcare provider name',
  `dose_number` VARCHAR(20) NULL COMMENT 'Dose number (e.g., 1st, 2nd, booster)',
  `next_dose_date` DATE NULL COMMENT 'When next dose is due',
  `batch_number` VARCHAR(50) NULL COMMENT 'Vaccine batch/lot number',
  `notes` TEXT NULL COMMENT 'Additional notes',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`immunization_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_vaccine` (`vaccine_name`),
  KEY `idx_date` (`date_administered`),
  KEY `idx_next_dose` (`next_dose_date`),
  CONSTRAINT `fk_immunization_student` FOREIGN KEY (`student_id`) 
    REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Tracks student immunization/vaccination records';

-- ============================================
-- 4. CREATE USEFUL VIEWS FOR REPORTING
-- ============================================

-- View: Complete Student Medical Profile
CREATE OR REPLACE VIEW vw_student_medical_profile AS
SELECT 
    s.student_id,
    s.student_number,
    CONCAT(s.first_name, ' ', IFNULL(s.middle_name, ''), ' ', s.last_name) AS full_name,
    s.gender,
    s.birth_date,
    TIMESTAMPDIFF(YEAR, s.birth_date, CURDATE()) AS age,
    s.grade_level,
    s.section,
    s.blood_type,
    s.height_cm,
    s.weight_kg,
    s.bmi,
    s.bmi_category,
    s.address,
    s.emergency_contact,
    CONCAT(a.first_name, ' ', a.last_name) AS adviser_name,
    u.email,
    u.phone,
    COUNT(DISTINCT mv.visit_id) AS total_visits,
    COUNT(DISTINCT al.allergy_id) AS allergy_count,
    MAX(mv.visit_datetime) AS last_visit_date
FROM students s
LEFT JOIN users u ON s.user_id = u.user_id
LEFT JOIN advisers a ON s.current_adviser_id = a.user_id
LEFT JOIN medical_visits mv ON s.student_id = mv.student_id
LEFT JOIN allergies al ON s.student_id = al.student_id
WHERE s.is_active = 1
GROUP BY s.student_id;

-- View: Recent Medical Visits with Notifications
CREATE OR REPLACE VIEW vw_recent_visits_with_notifications AS
SELECT 
    mv.visit_id,
    mv.visit_datetime,
    mv.visit_type,
    mv.chief_complaint,
    mv.status,
    mv.notify_parent,
    mv.parent_notified_at,
    mv.notification_method,
    s.student_number,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.grade_level,
    s.section,
    CONCAT(cs.first_name, ' ', cs.last_name) AS staff_name,
    sms.status AS sms_status,
    sms.sent_at AS sms_sent_at
FROM medical_visits mv
INNER JOIN students s ON mv.student_id = s.student_id
LEFT JOIN clinic_staff cs ON mv.staff_id = cs.staff_id
LEFT JOIN sms_logs sms ON mv.visit_id = sms.visit_id
WHERE mv.visit_datetime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY mv.visit_datetime DESC;

-- View: Pending Parent Notifications
CREATE OR REPLACE VIEW vw_pending_parent_notifications AS
SELECT 
    mv.visit_id,
    mv.visit_datetime,
    mv.visit_type,
    mv.chief_complaint,
    s.student_id,
    s.student_number,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.emergency_contact,
    u.phone AS parent_phone,
    CONCAT(a.first_name, ' ', a.last_name) AS adviser_name
FROM medical_visits mv
INNER JOIN students s ON mv.student_id = s.student_id
LEFT JOIN users u ON s.user_id = u.user_id
LEFT JOIN advisers a ON s.current_adviser_id = a.user_id
WHERE mv.notify_parent = TRUE 
  AND mv.parent_notified_at IS NULL
  AND mv.status = 'completed'
ORDER BY mv.visit_datetime DESC;

-- ============================================
-- 5. INSERT SAMPLE DATA FOR DEMONSTRATION
-- ============================================

-- Sample SMS log entry (for demonstration)
INSERT INTO sms_logs (student_id, recipient_name, phone_number, message_type, message_content, status)
SELECT 
    s.student_id,
    'Sample Parent',
    '09171234567',
    'routine',
    CONCAT('Your child ', s.first_name, ' ', s.last_name, ' visited the clinic today. Reason: General checkup. Contact clinic for details.'),
    'pending'
FROM students s
WHERE s.student_id = 1
LIMIT 1
ON DUPLICATE KEY UPDATE sms_id = sms_id;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Show all tables
SELECT 'Database Tables:' AS info;
SHOW TABLES;

-- Show SMS logs structure
SELECT 'SMS Logs Table Structure:' AS info;
DESCRIBE sms_logs;

-- Show medical visits new columns
SELECT 'Medical Visits New Columns:' AS info;
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'medical_visits'
  AND COLUMN_NAME IN ('notify_parent', 'parent_notified_at', 'notification_method');

-- Show immunizations structure
SELECT 'Immunizations Table Structure:' AS info;
DESCRIBE immunizations;

-- Show table count
SELECT 'Total Tables:' AS info, COUNT(*) AS table_count
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE();

SELECT '✅ Database is now 100% complete and defense-ready!' AS status;
