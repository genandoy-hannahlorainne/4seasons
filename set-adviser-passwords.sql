-- Set passwords for adviser accounts
-- Password: adviser123

-- For jane.smith
UPDATE users 
SET password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username = 'jane.smith';

-- For irene.delmonte  
UPDATE users 
SET password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username = 'irene.delmonte';

-- Show updated accounts
SELECT u.username, r.role_name, a.first_name, a.last_name 
FROM users u 
JOIN roles r ON u.role_id = r.role_id 
LEFT JOIN advisers a ON u.user_id = a.user_id 
WHERE r.role_name = 'Adviser';