@echo off
echo ========================================
echo TESTING ALL SYSTEM ACCOUNTS
echo ========================================
echo.

echo 1. Testing Student Account...
curl -s -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d "{\"username\":\"00001\",\"password\":\"password\"}" | findstr "success" && echo "   ✓ Student (00001) - WORKING" || echo "   ✗ Student (00001) - FAILED"

echo.
echo 2. Testing Adviser Accounts...
curl -s -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d "{\"username\":\"jane.smith\",\"password\":\"password\"}" | findstr "success" && echo "   ✓ Adviser (jane.smith) - WORKING" || echo "   ✗ Adviser (jane.smith) - FAILED"

curl -s -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d "{\"username\":\"irene.delmonte\",\"password\":\"password\"}" | findstr "success" && echo "   ✓ Adviser (irene.delmonte) - WORKING" || echo "   ✗ Adviser (irene.delmonte) - FAILED"

echo.
echo ========================================
echo ALL SYSTEM LOGIN CREDENTIALS
echo ========================================
echo.
echo "STUDENT ACCOUNT:"
echo "Username: 00001"
echo "Password: password"
echo "Role: Student (Hannah Lorainne Genandoy)"
echo.
echo "ADVISER ACCOUNTS:"
echo "Username: jane.smith"
echo "Password: password"
echo "Role: Adviser (Jane Smith)"
echo.
echo "Username: irene.delmonte"
echo "Password: password"
echo "Role: Adviser (Irene DelMonte)"
echo.
echo "All accounts are ready to use!"
echo "Go to: http://localhost:4200"
echo.
pause