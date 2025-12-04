-- Sample medical data for testing
-- Run this after importing 4seasons.sql

-- Add some allergies for student_id 2 (Hannah)
INSERT INTO `allergies` (`student_id`, `allergy_text`, `severity`, `recorded_at`) VALUES
(2, 'Peanut Allergy', 'Severe', '2024-01-15'),
(2, 'Dust Allergy', 'Mild', '2024-01-15');

-- Add some immunizations for student_id 2
INSERT INTO `immunizations` (`student_id`, `vaccine_name`, `date_administered`, `administered_by`, `notes`) VALUES
(2, 'COVID-19', '2022-08-15', 'School Nurse', 'Booster dose'),
(2, 'Tetanus', '2024-01-20', 'Dr. Smith', 'Routine vaccination'),
(2, 'Anti-Rabies', '2020-11-10', 'City Health Center', 'Post-exposure');

-- Add a medical visit for student_id 2
INSERT INTO `medical_visits` (`student_id`, `clinic_staff_id`, `visit_datetime`, `visit_type`, `chief_complaint`, `notes`, `status`) VALUES
(2, 1, '2025-09-04 10:30:00', 'Routine', 'Annual checkup', 'Student is healthy', 'Closed');

-- Get the visit_id (assuming it's 1, adjust if needed)
SET @visit_id = LAST_INSERT_ID();

-- Add vitals for that visit
INSERT INTO `vitals` (`visit_id`, `weight_kg`, `height_cm`, `temperature_c`, `bp_systolic`, `bp_diastolic`, `pulse_rate`, `respiration_rate`) VALUES
(@visit_id, 52.0, 160.0, 36.5, 110, 70, 72, 16);
