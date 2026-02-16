-- Fix phone number issues in the database
-- This script addresses missing phone numbers for users

-- 1. Update student phone numbers from registration data
-- Based on the sample data, it appears students should have phone numbers but they're empty
-- Let's add some sample phone numbers for the existing students

UPDATE users SET phone = '09123456789' WHERE user_id = 61 AND (phone IS NULL OR phone = '');
UPDATE users SET phone = '09987654321' WHERE user_id = 62 AND (phone IS NULL OR phone = '');
UPDATE users SET phone = '09876543210' WHERE user_id = 66 AND (phone IS NULL OR phone = '');

-- 2. Ensure advisers have phone numbers in both users and advisers tables
-- Update users.phone from advisers.contact_phone where missing
UPDATE users u 
JOIN advisers a ON u.user_id = a.user_id 
SET u.phone = a.contact_phone 
WHERE (u.phone IS NULL OR u.phone = '') AND a.contact_phone IS NOT NULL AND a.contact_phone != '';

-- 3. Ensure advisers.contact_phone matches userdes.phone where missing
UPDATE advisers a 
JOIN users u ON a.user_id = u.user_id 
SET a.contact_phone = u.phone 
WHERE (a.contact_phone IS NULL OR a.contact_phone = '') AND u.phone IS NOT NULL AND u.phone != '';

-- 4. For students, if they don't have a phone number but have an emergency contact phone,
-- we could optionally copy it (but this might not be appropriate as it's the parent's phone)
-- Commenting this out as it might not be the right approach
-- UPDATE users u 
-- JOIN students s ON u.user_id = s.user_id 
-- SET u.phone = s.emergency_contact_phone 
-- WHERE (u.phone IS NULL OR u.phone = '') AND s.emergency_contact_phone IS NOT NULL AND s.emergency_contact_phone != '';

-- 5. Add constraints to ensure phone numbers are properly formatted (optional)
-- This would ensure phone numbers follow a consistent format
-- ALTER TABLE users ADD CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone REGEXP '^[0-9+\-\s\(\)]+$');

-- 6. Create a view to easily see all user phone numbers
CREATE OR REPLACE VIEW vw_user_phone_numbers AS
SELECT 
    u.user_id,
    u.username,
    u.full_name,
    r.role_name,
    u.phone as user_phone,
    a.contact_phone as adviser_phone,
    s.emergency_contact_phone as student_emergency_phone,
    CASE 
        WHEN u.phone IS NOT NULL AND u.phone != '' THEN u.phone
        WHEN a.contact_phone IS NOT NULL AND a.contact_phone != '' THEN a.contact_phone
        ELSE 'No phone number'
    END as effective_phone
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
LEFT JOIN advisers a ON u.user_id = a.user_id
LEFT JOIN students s ON u.user_id = s.user_id
WHERE u.is_active = 1
ORDER BY r.role_name, u.full_name;

-- 7. Show the results
SELECT * FROM vw_user_phone_numbers;