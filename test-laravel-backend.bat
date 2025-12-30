@echo off
echo Testing Laravel Backend Migration...
echo.

echo 1. Testing API connectivity...
curl -X GET "http://localhost:8080/api/test" -H "Content-Type: application/json"
echo.
echo.

echo 2. Testing database connection...
curl -X GET "http://localhost:8080/api/test-db" -H "Content-Type: application/json"
echo.
echo.

echo 3. Testing registration endpoint...
curl -X POST "http://localhost:8080/api/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"student\",\"firstName\":\"Test\",\"lastName\":\"Student\",\"studentNumber\":\"TEST001\",\"password\":\"password123\",\"email\":\"test@example.com\",\"gender\":\"male\"}"
echo.
echo.

echo 4. Testing login endpoint...
curl -X POST "http://localhost:8080/api/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"TEST001\",\"password\":\"password123\"}"
echo.
echo.

echo Laravel Backend Test Complete!
pause