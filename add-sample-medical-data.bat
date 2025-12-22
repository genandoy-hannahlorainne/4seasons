@echo off
echo Adding sample medical data to database...
echo.

docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons < add-sample-medical-data.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Sample medical data added successfully!
    echo.
    echo Added:
    echo - Clinic staff records
    echo - Student allergies
    echo - Immunization records  
    echo - Medical visit history
    echo - Updated student medical info
) else (
    echo.
    echo Error adding sample medical data!
    echo Make sure Docker is running and the database container is up.
)

echo.
pause