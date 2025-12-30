@echo off
echo ========================================
echo TESTING ADVISER LOGIN FLOW
echo ========================================
echo.

echo 1. Testing Login API for irene.delmonte...
curl -s -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d "{\"username\":\"irene.delmonte\",\"password\":\"password\"}"
echo.
echo.

echo 2. Testing Frontend accessibility...
curl -s -I "http://localhost:4200" | findstr "200 OK" && echo "   ✓ Frontend accessible" || echo "   ✗ Frontend not accessible"

echo.
echo 3. Testing Backend API...
curl -s "http://localhost:8081/api/test.php" | findstr "success" && echo "   ✓ Backend API working" || echo "   ✗ Backend API failed"

echo.
echo ========================================
echo TROUBLESHOOTING STEPS
echo ========================================
echo.
echo "If you can't access the adviser dashboard:"
echo.
echo "1. Clear browser cache and localStorage:"
echo "   - Press F12 to open DevTools"
echo "   - Go to Application tab"
echo "   - Click 'Clear site data'"
echo.
echo "2. Try logging in again:"
echo "   - Username: irene.delmonte"
echo "   - Password: password"
echo.
echo "3. Check browser console for errors (F12)"
echo.
echo "4. Make sure you're going to:"
echo "   http://localhost:4200/login"
echo.
pause