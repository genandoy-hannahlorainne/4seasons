@echo off
echo Testing Laravel Login - Final Test...
echo.

curl -X POST "http://localhost:8080/api/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"STU001\",\"password\":\"password123\"}"

echo.
echo.
echo Test complete!
pause