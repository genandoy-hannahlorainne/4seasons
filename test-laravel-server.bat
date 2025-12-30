@echo off
echo ========================================
echo Testing Laravel Server
echo ========================================
echo.

echo Testing if Laravel server is running and responding...
echo.

echo 1. Testing basic API endpoint:
curl -X GET "http://localhost:8080/api/test" ^
  -H "Content-Type: application/json" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.

echo 2. Testing student profile endpoint:
curl -X GET "http://localhost:8080/api/student/profile" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.

echo 3. Testing student medical data endpoint:
curl -X GET "http://localhost:8080/api/student/medical-data?student_id=1" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.

echo If any of these return 404, there might be a Laravel routing issue.
echo If they return 500, there might be a PHP syntax error.
echo.

echo ========================================
echo Check the results above to identify the issue.
echo ========================================
pause