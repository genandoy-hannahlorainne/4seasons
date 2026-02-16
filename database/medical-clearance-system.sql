-- ============================================
-- Medical Clearance System for Off-Campus Activities
-- ============================================

-- 1. CREATE MEDICAL CLEARANCES TABLE
CREATE TABLE IF NOT EXISTS `medical_clearances` (
  `clearance_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` INT UNSIGNED NOT NULL COMMENT 'Student requiring clearance',
  `clearance_type` ENUM('off_campus', 'sports', 'field_trip', 'swimming', 'general') DEFAULT 'general' COMMENT 'Type of activity clearance',
  `status` ENUM('approved', 'pending', 'denied', 'expired') DEFAULT 'pending' COMMENT 'Clearance status',
  `required_for` TEXT NULL COMMENT 'Specific medical conditions requiring clearance',
  `issued_date` DATE NULL COMMENT 'Date clearance was approved',
  `expiry_date` DATE NULL COMMENT 'Date clearance expires',
  `issued_by` VARCHAR(150) NULL COMMENT 'Staff member who approved',
  `parent_consent` BOOLEAN DEFAULT FALSE COMMENT 'Parent has given consent',
  `doctor_approval` BOOLEAN DEFAULT FALSE COMMENT 'Doctor has approved',
  `doctor_name` VARCHAR(150) NULL COMMENT 'Approving doctor name',
  `medical_notes` TEXT NULL COMMENT 'Medical notes or restrictions',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`clearance_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`clearance_type`),
  KEY `idx_expiry` (`expiry_date`),
  CONSTRAINT `fk_clearance_student` FOREIGN KEY (`student_id`) 
    REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Tracks medical clearances for various activities';

-- 2. ADD CLEARANCE COLUMNS TO STUDENTS TABLE
ALTER TABLE `students` 
ADD COLUMN IF NOT EXISTS `general_clearance_status` ENUM('approved', 'pending', 'denied', 'not_required') DEFAULT 'not_required' COMMENT 'General clearance status' AFTER `bmi_category`,
ADD COLUMN IF NOT EXISTS `clearance_expiry_date` DATE NULL COMMENT 'When general clearance expires' AFTER `general_clearance_status`,
ADD COLUMN IF NOT EXISTS `requires_special_clearance` BOOLEAN DEFAULT FALSE COMMENT 'Student needs special medical clearance' AFTER `clearance_expiry_date`,
ADD COLUMN IF NOT EXISTS `clearance_notes` TEXT NULL COMMENT 'Special clearance requirements or notes' AFTER `requires_special_clearance`;

-- 3. CREATE CLEARANCE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS `clearance_requests` (
  `request_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` INT UNSIGNED NOT NULL COMMENT 'Student requesting clearance',
  `requested_by` INT UNSIGNED NOT NULL COMMENT 'User who made the request',
  `clearance_type` ENUM('off_campus', 'sports', 'field_trip', 'swimming', 'general') DEFAULT 'general',
  `activity_name` VARCHAR(200) NULL COMMENT 'Name of specific activity',
  `activity_date` DATE NULL COMMENT 'Date of activity',
  `reason` TEXT NULL COMMENT 'Reason clearance is needed',
  `status` ENUM('pending', 'approved', 'denied', 'cancelled') DEFAULT 'pending',
  `processed_by` INT UNSIGNED NULL COMMENT 'Staff who processed request',
  `processed_at` DATETIME NULL COMMENT 'When request was processed',
  `response_notes` TEXT NULL COMMENT 'Notes from processing staff',
  `parent_notified` BOOLEAN DEFAULT FALSE COMMENT 'Parent has been notified',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_requested_by` (`requested_by`),
  KEY `idx_activity_date` (`activity_date`),
  CONSTRAINT `fk_request_student` FOREIGN KEY (`student_id`) 
    REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_request_user` FOREIGN KEY (`requested_by`) 
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Tracks clearance requests from teachers/staff';

-- 4. CREATE CLEARANCE VIOLATIONS TABLE (for tracking when students are flagged)
CREATE TABLE IF NOT EXISTS `clearance_violations` (
  `violation_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` INT UNSIGNED NOT NULL COMMENT 'Student who was flagged',
  `scanned_by` INT UNSIGNED NOT NULL COMMENT 'Staff who scanned QR',
  `activity_type` VARCHAR(100) NULL COMMENT 'Activity they were trying to join',
  `violation_reason` TEXT NULL COMMENT 'Why they were flagged',
  `clearance_status` VARCHAR(50) NULL COMMENT 'Their clearance status at time of scan',
  `action_taken` TEXT NULL COMMENT 'What action was taken',
  `parent_notified` BOOLEAN DEFAULT FALSE COMMENT 'Parent was notified of violation',
  `resolved` BOOLEAN DEFAULT FALSE COMMENT 'Issue has been resolved',
  `resolved_at` DATETIME NULL COMMENT 'When issue was resolved',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`violation_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_scanned_by` (`scanned_by`),
  KEY `idx_resolved` (`resolved`),
  CONSTRAINT `fk_violation_student` FOREIGN KEY (`student_id`) 
    REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_violation_user` FOREIGN KEY (`scanned_by`) 
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Tracks when students are flagged for clearance issues';

-- 5. INSERT SAMPLE DATA FOR TESTING

-- Mark students with heart conditions as requiring special clearance
UPDATE students s
INNER JOIN medical_history mh ON s.student_id = mh.student_id
SET s.requires_special_clearance = TRUE,
    s.general_clearance_status = 'pending',
    s.clearance_notes = 'Heart condition requires medical clearance for off-campus activities'
WHERE mh.condition_heart_problem = TRUE;

-- Create sample clearance for approved students
INSERT INTO medical_clearances (student_id, clearance_type, status, required_for, issued_date, expiry_date, parent_consent, doctor_approval, medical_notes)
SELECT 
    s.student_id,
    'off_campus',
    'approved',
    'General off-campus activities',
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 6 MONTH),
    TRUE,
    TRUE,
    'Student cleared for normal off-campus activities'
FROM students s
WHERE s.requires_special_clearance = FALSE
LIMIT 5;

-- Create pending clearance for students with heart conditions
INSERT INTO medical_clearances (student_id, clearance_type, status, required_for, parent_consent, doctor_approval, medical_notes)
SELECT 
    s.student_id,
    'off_campus',
    'pending',
    'Heart condition - requires doctor approval',
    FALSE,
    FALSE,
    'Student has heart condition. Requires parent consent and doctor approval before off-campus activities.'
FROM students s
INNER JOIN medical_history mh ON s.student_id = mh.student_id
WHERE mh.condition_heart_problem = TRUE;

-- 6. CREATE VIEWS FOR EASY QUERYING

-- View: Students requiring clearance
CREATE OR REPLACE VIEW vw_students_requiring_clearance AS
SELECT 
    s.student_id,
    s.student_number,
    CONCAT(s.first_name, ' ', s.last_name) as full_name,
    s.grade_level,
    s.section,
    s.general_clearance_status,
    s.clearance_expiry_date,
    s.requires_special_clearance,
    s.clearance_notes,
    mc.clearance_type,
    mc.status as clearance_status,
    mc.expiry_date as specific_expiry,
    mc.medical_notes
FROM students s
LEFT JOIN medical_clearances mc ON s.student_id = mc.student_id 
    AND mc.clearance_type = 'off_campus'
    AND mc.status IN ('approved', 'pending')
WHERE s.requires_special_clearance = TRUE 
   OR s.general_clearance_status IN ('pending', 'denied')
ORDER BY s.grade_level, s.section, s.last_name;

-- View: Expired clearances
CREATE OR REPLACE VIEW vw_expired_clearances AS
SELECT 
    s.student_id,
    s.student_number,
    CONCAT(s.first_name, ' ', s.last_name) as full_name,
    mc.clearance_type,
    mc.expiry_date,
    DATEDIFF(CURDATE(), mc.expiry_date) as days_expired
FROM students s
INNER JOIN medical_clearances mc ON s.student_id = mc.student_id
WHERE mc.expiry_date < CURDATE()
  AND mc.status = 'approved'
ORDER BY mc.expiry_date DESC;

-- Update expired clearances
UPDATE medical_clearances 
SET status = 'expired' 
WHERE expiry_date < CURDATE() AND status = 'approved';

-- Update student clearance status for expired clearances
UPDATE students s
INNER JOIN medical_clearances mc ON s.student_id = mc.student_id
SET s.general_clearance_status = 'expired'
WHERE mc.status = 'expired' AND mc.clearance_type = 'off_campus';

-- 7. CREATE CLEARANCE CHECKS LOG TABLE
CREATE TABLE IF NOT EXISTS `clearance_checks` (
  `check_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` INT UNSIGNED NOT NULL COMMENT 'Student who was checked',
  `scanned_by` INT UNSIGNED NOT NULL COMMENT 'Staff who performed the check',
  `activity_type` VARCHAR(100) NULL COMMENT 'Type of activity being checked for',
  `clearance_status` VARCHAR(50) NULL COMMENT 'Result of clearance check',
  `result_level` ENUM('green', 'yellow', 'red') DEFAULT 'green' COMMENT 'Risk level',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`check_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_scanned_by` (`scanned_by`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_check_student` FOREIGN KEY (`student_id`) 
    REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_check_user` FOREIGN KEY (`scanned_by`) 
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Logs all clearance checks performed via QR scanning';