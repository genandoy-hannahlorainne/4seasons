@echo off
echo Testing Medical Records API endpoints...
echo.

echo 1. Testing medical record endpoint...
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1"
echo.
echo.

echo 2. Testing medical visits endpoint...
curl -X GET "http://localhost:8080/api/medical-visits" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1"
echo.
echo.

echo 3. Testing visit details endpoint...
curl -X GET "http://localhost:8080/api/medical-visits/1" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1"
echo.
echo.

echo 4. Testing update medical info endpoint...
curl -X PUT "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -d "{\"emergency_contact\":\"Updated emergency contact\",\"address\":\"Updated address\"}"
echo.
echo.

echo Medical Records API tests completed!
pause