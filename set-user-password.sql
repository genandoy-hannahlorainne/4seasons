-- Set password for user 00001
-- Password: password
-- This is a bcrypt hash of "password"
UPDATE users 
SET password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username = '00001';

SELECT username, password_hash FROM users WHERE username = '00001';
