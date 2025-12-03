-- Complete setup: Import 4seasons.sql first, then run this

-- Insert roles if they don't exist
INSERT IGNORE INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'Admin'),
(2, 'Student'),
(3, 'Adviser'),
(4, 'Clinic Staff'),
(5, 'Parent');

-- Verify roles were inserted
SELECT * FROM roles;

-- Create a test student user (password: test123)
INSERT INTO `users` (`role_id`, `username`, `password_hash`, `email`, `full_name`) VALUES
(2, 'test-student', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'test@student.com', 'Test Student');

SET @test_user_id = LAST_INSERT_ID();

INSERT INTO `students` (`user_id`, `student_number`, `first_name`, `last_name`, `gender`) VALUES
(@test_user_id, 'TEST-001', 'Test', 'Student', 'M');

-- Show test account
SELECT u.username, u.email, s.student_number, s.first_name, s.last_name 
FROM users u 
JOIN students s ON u.user_id = s.user_id 
WHERE u.username = 'test-student';

SELECT 'Setup complete! Test login with username: test-student, password: test123' as message;
