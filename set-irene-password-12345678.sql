-- Set password for irene.delmonte to 12345678
-- This is a bcrypt hash of "12345678"
UPDATE users 
SET password_hash = '$2y$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'
WHERE username = 'irene.delmonte';

SELECT username, password_hash FROM users WHERE username = 'irene.delmonte';