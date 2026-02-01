-- Add emergency_contact_relation field to students table
-- This field stores the relationship of the emergency contact (Mother, Father, Guardian, etc.)

ALTER TABLE `students` 
ADD COLUMN `emergency_contact_relation` VARCHAR(50) DEFAULT NULL 
AFTER `emergency_contact`;

-- Update the view to include the new field
DROP VIEW IF EXISTS `vw_student_medical_profile`;

CREATE VIEW `vw_student_medical_profile` AS
SELECT 
    s.student_id,
    s.student_number,
    CONCAT(s.first_name, ' ', IFNULL(CONCAT(s.middle_name, ' '), ''), s.last_name) AS full_name,
    s.first_name,
    s.middle_name,
    s.last_name,
    s.birth_date,
    s.gender,
    s.grade_level,
    s.section,
    s.height_cm,
    s.weight_kg,
    s.bmi,
    s.bmi_category,
    s.address,
    s.blood_type,
    s.emergency_contact,
    s.emergency_contact_relation,
    CONCAT(a.first_name, ' ', a.last_name) AS adviser_name,
    u.email,
    u.phone,
    COUNT(DISTINCT mv.visit_id) AS total_visits,
    COUNT(DISTINCT al.allergy_id) AS allergy_count,
    MAX(mv.visit_datetime) AS last_visit_date
FROM students s
LEFT JOIN users u ON s.user_id = u.user_id
LEFT JOIN advisers a ON s.current_adviser_id = a.adviser_id
LEFT JOIN medical_visits mv ON s.student_id = mv.student_id
LEFT JOIN allergies al ON s.student_id = al.student_id
WHERE s.is_active = 1
GROUP BY 
    s.student_id,
    s.student_number,
    s.first_name,
    s.middle_name,
    s.last_name,
    s.birth_date,
    s.gender,
    s.grade_level,
    s.section,
    s.height_cm,
    s.weight_kg,
    s.bmi,
    s.bmi_category,
    s.address,
    s.blood_type,
    s.emergency_contact,
    s.emergency_contact_relation,
    a.first_name,
    a.last_name,
    u.email,
    u.phone;
