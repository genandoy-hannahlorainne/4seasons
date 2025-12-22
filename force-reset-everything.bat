@echo off
echo ========================================
echo FORCE RESET EVERYTHING - NUCLEAR OPTION
echo ========================================
echo.

echo This will completely reset and fix everything!
echo.

echo Step 1: Stop all containers
echo ===========================
docker-compose down
echo.

echo Step 2: Remove old containers and rebuild
echo =========================================
docker-compose up --build -d
echo.

echo Step 3: Wait for containers to start
echo ====================================
echo Waiting 30 seconds for containers to fully start...
timeout /t 30 /nobreak
echo.

echo Step 4: Force recreate database data
echo ====================================
docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons < complete-backend-fix.sql
echo.

echo Step 5: Test everything
echo =======================
echo.

echo Testing backend:
curl -X GET "http://localhost:8080/api/test" -w "\nStatus: %%{http_code}\n" -s
echo.

echo Testing student profile:
curl -X GET "http://localhost:8080/api/student/profile" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo Testing medical records:
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo ========================================
echo NUCLEAR RESET COMPLETE!
echo ========================================
echo.
echo Everything should be working now:
echo - Frontend: http://localhost:4200
echo - Backend: http://localhost:8080
echo - Database: Fully reset with sample data
echo.
echo Try MyMedical page now!
echo.
pause