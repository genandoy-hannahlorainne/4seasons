@echo off
echo Testing Registration with different approaches...
echo.

echo 1. Testing Laravel API connectivity...
curl -X GET "http://localhost:8080/api/test"
echo.
echo.

echo 2. Testing Laravel database...
curl -X GET "http://localhost:8080/api/test-db"
echo.
echo.

echo 3. Creating a test user directly in database...
docker exec -it 4seasons-mysql mysql -uroot -proot -e "USE 4seasons; INSERT INTO users (role_id, username, password_hash, email, full_name, created_at, updated_at) VALUES (2, 'testuser', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'test@example.com', 'Test User', NOW(), NOW());"
echo.

echo 4. Testing login with test user...
curl -X POST "http://localhost:8080/api/login" -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"password\":\"password\"}"
echo.
echo.

echo Test complete! You can now use the application.
pause