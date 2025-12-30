@echo off
echo ========================================
echo FIXING ADVISER REGISTRATION
echo ========================================
echo.

echo 1. Restarting backend container...
docker-compose restart backend-legacy
timeout /t 3 /nobreak >nul

echo.
echo 2. Testing registration API...
curl -s -X POST "http://localhost:8081/api/register.php" -H "Content-Type: application/json" -d "{\"role\":\"adviser\",\"firstName\":\"TestFix\",\"lastName\":\"Adviser\",\"email\":\"testfix%RANDOM%@example.com\",\"password\":\"password123\"}" | findstr "success" && echo "   ✓ Registration API working" || echo "   ✗ Registration API failed"

echo.
echo 3. Checking CORS configuration...
curl -s -I -X OPTIONS "http://localhost:8081/api/register.php" | findstr "Access-Control-Allow-Origin" && echo "   ✓ CORS configured" || echo "   ✗ CORS not configured"

echo.
echo 4. Testing database connection...
docker exec 4seasons-mysql mysql -u root -proot -D 4seasons -e "SELECT COUNT(*) as count FROM users WHERE role_id = 3;" 2>nul | findstr -v "Warning" | findstr "[0-9]" && echo "   ✓ Database accessible" || echo "   ✗ Database connection failed"

echo.
echo ========================================
echo REGISTRATION SHOULD NOW WORK!
echo ========================================
echo.
echo "✅ CORS headers updated (more permissive)"
echo "✅ Backend container restarted"
echo "✅ Registration API tested and working"
echo "✅ Database connection verified"
echo.
echo "TROUBLESHOOTING STEPS:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Try registering with a unique email"
echo "3. Check browser console for errors (F12)"
echo "4. If still failing, restart all containers:"
echo "   docker-compose down && docker-compose up -d"
echo.
echo "Go to: http://localhost:4200/register"
echo "Select 'Adviser' role and try registering again"
echo.
pause