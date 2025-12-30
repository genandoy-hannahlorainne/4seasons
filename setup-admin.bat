@echo off
echo =====================================================
echo    CREATE ADMIN ACCOUNT
echo =====================================================
echo.

echo Running SQL to create admin account...
docker exec -i 4seasons-mysql mysql -u root -proot_password 4seasons_db < create-admin-account.sql

echo.
echo =====================================================
echo    ADMIN ACCOUNT CREATED!
echo =====================================================
echo.
echo Login URL:  http://localhost:4200/admin/login
echo Username:   admin
echo Password:   admin123
echo.
echo IMPORTANT: Change password after first login!
echo =====================================================
pause
