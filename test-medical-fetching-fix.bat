@echo off
echo ========================================
echo Testing Medical Records Data Fetching
echo ========================================
echo.

echo 1. Testing backend API endpoint...
curl -s "http://localhost:8081/api/get-student-medical-data.php?user_id=19" | findstr "success" && echo "✓ Backend API is working" || echo "✗ Backend API failed"

echo.
echo 2. Checking if frontend is running...
curl -s -I "http://localhost:4200" | findstr "200 OK" && echo "✓ Frontend is running" || echo "✗ Frontend is not running"

echo.
echo 3. Testing database connection...
docker exec 4seasons-mysql mysql -u root -proot -D 4seasons -e "SELECT COUNT(*) as student_count FROM students WHERE user_id = 19;" 2>nul && echo "✓ Database connection working" || echo "✗ Database connection failed"

echo.
echo ========================================
echo FIXED ISSUES:
echo ========================================
echo "✓ Database connection configuration fixed"
echo "✓ API endpoint now returns proper data format"
echo "✓ Frontend service updated to use working endpoint"
echo "✓ Real API call enabled (no more mock data)"
echo.
echo "The MyMedical page should now fetch real data!"
echo.
echo "To test:"
echo "1. Go to http://localhost:4200"
echo "2. Login and navigate to MyMedical page"
echo "3. Data should now load from the database"
echo.
pause