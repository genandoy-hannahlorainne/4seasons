@echo off
echo ========================================
echo TESTING REGISTRATION ENDPOINT
echo ========================================
echo.

echo 1. Testing registration API directly...
curl -s -X POST "http://localhost:8081/api/register.php" -H "Content-Type: application/json" -d "{\"role\":\"adviser\",\"firstName\":\"TestAdv\",\"lastName\":\"User\",\"email\":\"testadv%RANDOM%@example.com\",\"password\":\"password123\"}" | findstr "success" && echo "   ✓ Registration API working" || echo "   ✗ Registration API failed"

echo.
echo 2. Testing CORS headers...
curl -s -I -X OPTIONS "http://localhost:8081/api/register.php" -H "Origin: http://localhost:4200" | findstr "Access-Control" && echo "   ✓ CORS headers present" || echo "   ✗ CORS headers missing"

echo.
echo 3. Testing from frontend container...
docker exec 4seasons-frontend curl -s -X POST "http://backend-legacy/api/register.php" -H "Content-Type: application/json" -d "{\"role\":\"adviser\",\"firstName\":\"TestAdv2\",\"lastName\":\"User2\",\"email\":\"testadv2%RANDOM%@example.com\",\"password\":\"password123\"}" | findstr "success" && echo "   ✓ Frontend can reach backend" || echo "   ✗ Frontend cannot reach backend"

echo.
echo ========================================
echo REGISTRATION DIAGNOSTICS
echo ========================================
echo.
echo "If registration still fails, try these solutions:"
echo "1. Restart Docker containers: docker-compose restart"
echo "2. Clear browser cache and cookies"
echo "3. Try registering with a different email"
echo "4. Check browser console for detailed errors"
echo.
pause