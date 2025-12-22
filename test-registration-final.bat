@echo off
echo Testing Laravel Registration - Final Test...
echo.

curl -X POST "http://localhost:8080/api/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"student\",\"firstName\":\"John\",\"lastName\":\"Doe\",\"studentNumber\":\"STU001\",\"password\":\"password123\",\"email\":\"john@example.com\",\"gender\":\"male\"}"

echo.
echo.
echo Test complete!
pause