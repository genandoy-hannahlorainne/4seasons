-- =====================================================
-- CREATE ADMIN ACCOUNT
-- Run this SQL to create the system administrator
-- =====================================================

-- Step 1: Ensure admin role exists
INSERT INTO roles (role_name) 
VALUES ('admin') 
ON DUPLICATE KEY UPDATE role_name = role_name;

-- Step 2: Get the admin role_id
SET @admin_role_id = (SELECT role_id FROM roles WHERE role_name = 'admin');

-- Step 3: Delete existing admin user if exists (optional - comment out if you want to keep existing)
-- DELETE FROM users WHERE username = 'admin';

-- Step 4: Create admin user
-- Default credentials:
--   Username: admin
--   Password: admin123
INSERT INTO users (role_id, username, password_hash, email, full_name, is_active, created_at)
VALUES (
    @admin_role_id,
    'admin',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- bcrypt hash of 'admin123'
    'admin@4seasons.edu.ph',
    'System Administrator',
    1,
    NOW()
)
ON DUPLICATE KEY UPDATE 
    password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    is_active = 1;

-- Step 5: Verify admin was created
SELECT 
    u.user_id,
    u.username,
    r.role_name,
    u.email,
    u.full_name,
    u.is_active
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.username = 'admin';

-- =====================================================
-- ADMIN LOGIN CREDENTIALS
-- =====================================================
-- URL:      http://localhost:4200/admin/login
-- Username: admin
-- Password: admin123
--
-- IMPORTANT: Change the password after first login!
-- =====================================================
