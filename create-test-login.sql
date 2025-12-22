-- Update existing user with known password for testing
UPDATE users SET password_hash = '$2y$12$LQv3c1yqBwrf2QmuLihzSOqiD1aHBZcbcs4qMrUzOAOIgpxVCUQxi' WHERE user_id = 19;
-- This is the hash for password "password123"

-- Or create a simple test user
INSERT IGNORE INTO users (role_id, username, password_hash, email, full_name, created_at, updated_at) 
VALUES (2, 'testuser', '$2y$12$LQv3c1yqBwrf2QmuLihzSOqiD1aHBZcbcs4qMrUzOAOIgpxVCUQxi', 'test@test.com', 'Test User', NOW(), NOW());

-- Get the new user_id
SELECT user_id, username, email FROM users WHERE username = 'testuser';