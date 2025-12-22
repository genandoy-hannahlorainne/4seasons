@echo off
echo Testing Laravel Registration...
echo.

echo 1. Testing basic API...
curl -X GET "http://localhost:8080/api/test"
echo.
echo.

echo 2. Testing registration with curl...
curl -X POST "http://localhost:8080/api/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"student\",\"firstName\":\"Test\",\"lastName\":\"Student\",\"studentNumber\":\"TEST001\",\"password\":\"password123\"}" ^
  -v
echo.
echo.

echo Test complete!
pause