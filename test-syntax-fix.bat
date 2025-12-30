@echo off
echo ========================================
echo Testing Syntax Fix
echo ========================================
echo.

echo I fixed the syntax error in StudentController.php
echo There were extra closing brackets that were causing PHP syntax errors.
echo.

echo Testing the endpoint now:
echo.

echo 1. Testing student medical data endpoint:
curl -X GET "http://localhost:8080/api/student/medical-data?student_id=1" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.

echo 2. Testing medical records endpoint:
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.

echo ========================================
echo If both return 200 OK, the fix worked!
echo Now try refreshing your browser and clicking MyMedical
echo ========================================
pause