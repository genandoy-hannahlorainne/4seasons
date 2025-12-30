@echo off
echo ========================================
echo Medical Records Routing Test
echo ========================================
echo.

echo Testing if the medical records routes are accessible...
echo.

echo 1. Testing main medical records page route:
echo    URL: http://localhost:4200/dashboard/student/medical-records
echo.

echo 2. Testing personal info page route:
echo    URL: http://localhost:4200/dashboard/student/medical-records/personal-info
echo.

echo 3. Testing visits history page route:
echo    URL: http://localhost:4200/dashboard/student/medical-records/visits-history
echo.

echo 4. Testing backend API endpoints:
echo.

echo Testing medical record API...
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nHTTP Status: %%{http_code}\n" ^
  -s
echo.

echo Testing medical visits API...
curl -X GET "http://localhost:8080/api/medical-visits" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nHTTP Status: %%{http_code}\n" ^
  -s
echo.

echo ========================================
echo Routing Test Complete
echo ========================================
echo.
echo Manual Testing Steps:
echo 1. Open browser and go to: http://localhost:4200
echo 2. Login as a student
echo 3. Click on "MyMedical" in the navigation
echo 4. Verify the medical records page loads
echo 5. Test navigation to personal info and visits history
echo.
echo If pages don't load, check:
echo - Angular dev server is running (ng serve)
echo - Laravel backend is running
echo - Database has sample data
echo.
pause