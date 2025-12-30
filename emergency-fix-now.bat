@echo off
echo ========================================
echo EMERGENCY FIX - RESTORE DATA FETCHING
echo ========================================
echo.

echo Kanina okay na, ngayon ayaw na! Let me fix this ASAP!
echo.

echo Step 1: Quick Backend Test
echo ==========================
echo.
curl -X GET "http://localhost:8080/api/test" -w "\nBackend Status: %%{http_code}\n" -s
echo.

echo Step 2: Check if student records exist
echo ======================================
echo.
docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons -e "SELECT COUNT(*) as student_count FROM students;"
echo.

echo Step 3: Test specific endpoints that were working
echo ================================================
echo.

echo Testing student profile (user_id=1):
curl -X GET "http://localhost:8080/api/student/profile" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo Testing medical data (user_id=1):
curl -X GET "http://localhost:8080/api/student/medical-data?student_id=1" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo Testing medical records (user_id=1):
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo Step 4: Force recreate student records
echo =======================================
echo.
docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons < complete-backend-fix.sql
echo.

echo Step 5: Test again after recreating
echo ===================================
echo.

echo Testing student profile again:
curl -X GET "http://localhost:8080/api/student/profile" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo ========================================
echo EMERGENCY FIX COMPLETE!
echo ========================================
echo.
echo If all endpoints return 200 OK:
echo 1. Refresh browser (Ctrl+F5)
echo 2. Clear browser cache
echo 3. Login again
echo 4. MyMedical should work!
echo.
echo If still not working:
echo - Restart docker-compose
echo - Check Laravel logs
echo - Try different user_id
echo.
pause