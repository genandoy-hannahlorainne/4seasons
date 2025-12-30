@echo off
echo ========================================
echo TESTING ADVISER LOGIN ACCOUNTS
echo ========================================
echo.

echo Testing jane.smith with common passwords...
curl -s -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d "{\"username\":\"jane.smith\",\"password\":\"password\"}" | findstr "success" && echo "✓ jane.smith - password: password" || echo "✗ jane.smith - password failed"

curl -s -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d "{\"username\":\"jane.smith\",\"password\":\"123456\"}" | findstr "success" && echo "✓ jane.smith - password: 123456" || echo "✗ jane.smith - 123456 failed"

curl -s -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d "{\"username\":\"jane.smith\",\"password\":\"adviser\"}" | findstr "success" && echo "✓ jane.smith - password: adviser" || echo "✗ jane.smith - adviser failed"

echo.
echo Testing irene.delmonte with common passwords...
curl -s -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d "{\"username\":\"irene.delmonte\",\"password\":\"password\"}" | findstr "success" && echo "✓ irene.delmonte - password: password" || echo "✗ irene.delmonte - password failed"

curl -s -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d "{\"username\":\"irene.delmonte\",\"password\":\"123456\"}" | findstr "success" && echo "✓ irene.delmonte - password: 123456" || echo "✗ irene.delmonte - 123456 failed"

curl -s -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d "{\"username\":\"irene.delmonte\",\"password\":\"adviser\"}" | findstr "success" && echo "✓ irene.delmonte - password: adviser" || echo "✗ irene.delmonte - adviser failed"

echo.
echo ========================================
echo If no passwords worked, I'll set new ones...
echo ========================================
pause