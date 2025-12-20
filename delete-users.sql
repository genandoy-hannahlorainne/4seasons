-- Delete all user accounts and related data
-- Run this in your MySQL database

-- First delete related records (due to foreign key constraints)
DELETE FROM student_adviser;
DELETE FROM student_parent;
DELETE FROM qr_codes;
DELETE FROM activity_logs;
DELETE FROM notifications;

-- Delete profile records
DELETE FROM students;
DELETE FROM advisers;
DELETE FROM clinic_staff;
DELETE FROM parents;

-- Finally delete users
DELETE FROM users;

-- Reset auto increment counters
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE students AUTO_INCREMENT = 1;
ALTER TABLE advisers AUTO_INCREMENT = 1;
ALTER TABLE clinic_staff AUTO_INCREMENT = 1;
ALTER TABLE parents AUTO_INCREMENT = 1;

SELECT 'All users deleted successfully!' as result;