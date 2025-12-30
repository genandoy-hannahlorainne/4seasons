@echo off
echo ========================================
echo Testing Both Medical Endpoints
echo ========================================
echo.

echo The error was caused by a 404 on the student medical data endpoint.
echo I've fixed the StudentController getMedicalData method.
echo.

echo Testing both endpoints now:
echo.

echo 1. Testing student medical data endpoint (for dashboard):
curl -X GET "http://localhost:8080/api/student/medical-data?student_id=1" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo 2. Testing medical records endpoint (for MyMedical page):
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo ========================================
echo Both endpoints should now return 200 OK
echo ========================================
echo.

echo Next Steps:
echo 1. Make sure sample data is added: add-sample-medical-data.bat
echo 2. Refresh the student dashboard page
echo 3. Try clicking MyMedical again
echo.
pause