@echo off
echo ========================================
echo Fixing Backend 500 Errors
echo ========================================
echo.

echo The dashboard is showing 500 Internal Server Errors.
echo Let me check and fix the backend issues.
echo.

echo Step 1: Check if Laravel server is running
echo ==========================================
echo.
curl -X GET "http://localhost:8080/api/test" -w "\nStatus: %%{http_code}\n" -s
echo.

echo Step 2: Check Laravel logs for errors
echo =====================================
echo.
echo Checking Laravel error logs...
type backend-laravel\storage\logs\laravel.log | findstr /C:"ERROR" | tail -10
echo.

echo Step 3: Test student profile endpoint
echo ====================================
echo.
curl -X GET "http://localhost:8080/api/student/profile" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo Step 4: Create missing student records
echo ======================================
echo.
docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons < create-missing-students.sql
echo.

echo Step 5: Test again after creating students
echo ==========================================
echo.
curl -X GET "http://localhost:8080/api/student/profile" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo ========================================
echo Backend fix attempt complete!
echo ========================================
pause