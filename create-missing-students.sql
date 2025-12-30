-- Create missing student records for existing users

-- First, let's check what users exist with role_id = 2 (Student)
SELECT 'Existing student users:' as info;
SELECT user_id, username, full_name FROM users WHERE role_id = 2;

-- Insert student records for users that don't have them yet
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
) 
SELECT 
    u.user_id,
    CONCAT('STU', LPAD(u.user_id, 6, '0')) as student_number,
    SUBSTRING_INDEX(u.full_name, ' ', 1) as first_name,
    '' as middle_name,
    SUBSTRING_INDEX(u.full_name, ' ', -1) as last_name,
    '2005-01-01' as birth_date,
    'Other' as gender,
    'Grade 12' as grade_level,
    'Section A' as section,
    '123 Sample Street, Sample City' as address,
    'O+' as blood_type,
    'Emergency Contact: 09123456789' as emergency_contact,
    NOW() as created_at,
    1 as is_active
FROM users u 
WHERE u.role_id = 2 
AND NOT EXISTS (
    SELECT 1 FROM students s WHERE s.user_id = u.user_id
);

-- Show the created student records
SELECT 'Created student records:' as info;
SELECT s.student_id, s.user_id, s.student_number, s.first_name, s.last_name, u.username 
FROM students s 
JOIN users u ON s.user_id = u.user_id 
WHERE u.role_id = 2;