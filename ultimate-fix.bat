@echo off
echo ========================================
echo ULTIMATE FIX FOR ALL ISSUES
echo ========================================
echo.

echo This will fix ALL the 500 errors and missing data issues.
echo.

echo Step 1: Fix Database - Add Missing Student Records
echo =================================================
echo.
docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons < complete-backend-fix.sql
echo.

echo Step 2: Test Backend Endpoints
echo ==============================
echo.

echo Testing basic API...
curl -X GET "http://localhost:8080/api/test" -w "\nStatus: %%{http_code}\n" -s
echo.

echo Testing student profile...
curl -X GET "http://localhost:8080/api/student/profile" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo Testing student medical data...
curl -X GET "http://localhost:8080/api/student/medical-data?student_id=1" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo Testing medical records...
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo Step 3: Instructions
echo ====================
echo.
echo After running this script:
echo.
echo 1. All API endpoints should return 200 OK
echo 2. Refresh your browser (Ctrl+F5)
echo 3. Login as student (username: any student username)
echo 4. Dashboard should load without errors
echo 5. Click "MyMedical" - should work now!
echo.

echo If you still see errors:
echo - Check if Laravel server is running on port 8080
echo - Check if Docker containers are running
echo - Try restarting docker-compose
echo.

echo ========================================
echo ULTIMATE FIX COMPLETE!
echo ========================================
pause