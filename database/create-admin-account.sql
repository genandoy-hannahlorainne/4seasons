-- ============================================
-- Create Hardcoded Admin Account
-- ============================================
-- This script creates a default admin account for initial system access
-- Username: admin
-- Password: Admin@123
-- ============================================

-- Use the 4seasons database
USE `4seasons`;

-- Insert admin user into users table
INSERT INTO `users` (`role_id`, `username`, `password_hash`, `email`, `phone`, `full_name`, `is_active`) 
VALUES (
    1, -- Admin role_id
    'admin',
    '$2y$10$VRKSez9gbIAB7fyx695fPeaHPg8Qo.VmabPGUBrRWquZYLV5Epd6W', -- Password: Admin@123
    'admin@pdmhs.edu.ph',
    '09171234567',
    'System Administrator',
    1
)
ON DUPLICATE KEY UPDATE 
    password_hash = '$2y$10$VRKSez9gbIAB7fyx695fPeaHPg8Qo.VmabPGUBrRWquZYLV5Epd6W',
    email = 'admin@pdmhs.edu.ph',
    is_active = 1;

-- ============================================
-- Add new columns to users table for password management
-- ============================================

-- Add password_must_change column (ignore if exists)
ALTER TABLE `users` 
ADD COLUMN `password_must_change` TINYINT(1) DEFAULT 0 COMMENT 'Force password change on next login' AFTER `password_hash`;

-- Add password_changed_at column (ignore if exists)
ALTER TABLE `users` 
ADD COLUMN `password_changed_at` DATETIME NULL COMMENT 'Last password change timestamp' AFTER `password_must_change`;

-- Add created_by_admin_id column (ignore if exists)
ALTER TABLE `users` 
ADD COLUMN `created_by_admin_id` INT UNSIGNED NULL COMMENT 'Admin who created this account' AFTER `password_changed_at`;

-- Add temp_password column (ignore if exists)
ALTER TABLE `users` 
ADD COLUMN `temp_password` VARCHAR(50) NULL COMMENT 'Temporary password for email (cleared after first login)' AFTER `created_by_admin_id`;

-- ============================================
-- Verification
-- ============================================

SELECT 'Admin account created successfully!' AS status;
SELECT 'Username: admin' AS info;
SELECT 'Password: Admin@123' AS info;
SELECT 'Email: admin@pdmhs.edu.ph' AS info;

-- Show the admin user
SELECT user_id, username, email, full_name, role_id, is_active 
FROM users 
WHERE username = 'admin';
