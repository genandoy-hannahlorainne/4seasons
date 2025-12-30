-- Complete backend fix for student records

-- First, check what users exist
SELECT 'Current users with role_id = 2 (Student):' as info;
SELECT user_id, username, full_name, role_id FROM users WHERE role_id = 2;

-- Check existing students
SELECT 'Current student records:' as info;
SELECT student_id, user_id, student_number, first_name, last_name FROM students;

-- Create student records for users that don't have them
INSERT IGNORE INTO students (
    user_id, 
    student_number, 
    first_name, 
    middle_name, 
    last_name, 
    birth_date, 
    gender, 
    grade_level, 
    section, 
    address, 
    blood_type, 
    emergency_contact, 
    created_at, 
    is_active
) VALUES
-- Create for user_id 1 if it doesn't exist
(1, 'STU000001', 'Hannah Lorainne', '', 'Genandoy', '2005-03-15', 'F', 'Grade 12', 'Section A', '123 Sample Street, Quezon City', 'O+', 'Mother: Maria Genandoy - 09123456789', NOW(), 1),
-- Create for user_id 2 if it doesn't exist  
(2, 'STU000002', 'John', '', 'Doe', '2005-05-20', 'M', 'Grade 11', 'Section B', '456 Oak Avenue, Manila', 'A+', 'Father: Robert Doe - 09987654321', NOW(), 1),
-- Create for user_id 3 if it doesn't exist
(3, 'STU000003', 'Jane', '', 'Smith', '2005-07-10', 'F', 'Grade 12', 'Section C', '789 Pine Road, Caloocan', 'B+', 'Mother: Sarah Smith - 09555666777', NOW(), 1);

-- Add some sample allergies
INSERT IGNORE INTO allergies (student_id, allergy_text, severity, recorded_at) VALUES
(1, 'Peanuts', 'Severe', '2024-01-15'),
(1, 'Shellfish', 'Moderate', '2024-01-15'),
(2, 'Dust mites', 'Mild', '2024-02-01'),
(3, 'Pollen', 'Moderate', '2024-01-20');

-- Add some immunization records
INSERT IGNORE INTO immunizations (student_id, vaccine_name, date_administered, administered_by, notes) VALUES
(1, 'Hepatitis B', '2023-06-15', 'Dr. Smith', 'First dose'),
(1, 'MMR', '2023-07-20', 'Nurse Johnson', 'Complete'),
(2, 'Tetanus', '2023-08-10', 'Dr. Brown', 'Booster shot'),
(3, 'Flu Vaccine', '2023-10-15', 'Nurse Wilson', 'Annual vaccination');

-- Show final results
SELECT 'Final student records:' as info;
SELECT s.student_id, s.user_id, s.student_number, s.first_name, s.last_name, u.username 
FROM students s 
JOIN users u ON s.user_id = u.user_id 
ORDER BY s.student_id;