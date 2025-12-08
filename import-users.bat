@echo off
echo Importing users to database...
docker exec -i 4seasons-db mysql -uroot -proot 4seasons < database/users-data.sql
echo Done! Users imported successfully.
echo.
echo You can now login with the shared user accounts.
pause
