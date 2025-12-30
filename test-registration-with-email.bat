@echo off
echo Testing Laravel Registration with email...
echo.

curl -X POST "http://localhost:8080/api/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"student\",\"firstName\":\"Test\",\"lastName\":\"Student\",\"studentNumber\":\"TEST002\",\"password\":\"password123\",\"email\":\"test@example.com\",\"gender\":\"male\"}" ^
  -v

echo.
echo Test complete!
pause