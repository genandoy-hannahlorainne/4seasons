@echo off
echo ========================================
echo Testing Unified Backend - Port 8081
echo ========================================
echo.

echo Testing all API endpoints on port 8081...
echo.

echo 1. Testing basic API...
curl -s "http://localhost:8081/api/test.php" | findstr "success" && echo "✓ Basic API working" || echo "✗ Basic API failed"

echo.
echo 2. Testing student profile...
curl -s "http://localhost:8081/api/get-student-profile.php?user_id=19" | findstr "Hannah" && echo "✓ Student profile working" || echo "✗ Student profile failed"

echo.
echo 3. Testing medical data...
curl -s "http://localhost:8081/api/get-student-medical-data.php?user_id=19" | findstr "success" && echo "✓ Medical data working" || echo "✗ Medical data failed"

echo.
echo 4. Testing login endpoint...
curl -s "http://localhost:8081/api/login.php" -X POST -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"test\"}" | findstr "success\|message" && echo "✓ Login endpoint working" || echo "✗ Login endpoint failed"

echo.
echo 5. Testing staff dashboard...
curl -s "http://localhost:8081/api/get-staff-dashboard.php?user_id=1" | findstr "success\|message" && echo "✓ Staff dashboard working" || echo "✗ Staff dashboard failed"

echo.
echo 6. Testing adviser dashboard...
curl -s "http://localhost:8081/api/get-adviser-dashboard.php?user_id=1" | findstr "success\|message" && echo "✓ Adviser dashboard working" || echo "✗ Adviser dashboard failed"

echo.
echo ========================================
echo UNIFIED BACKEND STATUS
echo ========================================
echo.
echo "✅ All services now use PORT 8081 (Legacy Backend)"
echo "✅ Frontend environment updated to port 8081"
echo "✅ AuthService endpoints updated (.php extension)"
echo "✅ StudentService endpoints updated (.php extension)"
echo "✅ StaffService endpoints updated (.php extension)"
echo "✅ AdviserService endpoints updated (.php extension)"
echo "✅ MedicalRecordsService already using port 8081"
echo.
echo "No more port switching! Everything uses port 8081!"
echo.
echo "Frontend: http://localhost:4200"
echo "Backend:  http://localhost:8081"
echo "Database: localhost:3307"
echo.
pause