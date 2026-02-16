-- Fix missing phone numbers for existing users
-- Update empty student phone numbers with sample data
UPDATE users SET phone = '09123456789' WHERE user_id = 61 AND (phone IS NULL OR phone = '');
UPDATE users SET phone = '09987654321' WHERE user_id = 62 AND (phone IS NULL OR phone = '');
UPDATE users SET phone = '09876543210' WHERE user_id = 66 AND (phone IS NULL OR phone = '');

-- Sync adviser phone numbers between users and advisers tables
UPDATE users u 
JOIN advisers a ON u.user_id = a.user_id 
SET u.phone = a.contact_phone 
WHERE (u.phone IS NULL OR u.phone = '') 
  AND a.contact_phone IS NOT NULL 
  AND a.contact_phone != '';

UPDATE advisers a 
JOIN users u ON a.user_id = u.user_id 
SET a.contact_phone = u.phone 
WHERE (a.contact_phone IS NULL OR a.contact_phone = '') 
  AND u.phone IS NOT NULL 
  AND u.phone != '';