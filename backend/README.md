# Backend API

PHP backend for PDMHS Student Medical System.

## Requirements

- PHP 7.4 or higher
- MySQL/MariaDB
- Apache/Nginx with PHP support
- XAMPP/WAMP (recommended for local development)

## Setup Instructions

### 1. Database Setup

Import the database schema:
```bash
mysql -u root -p 4seasons < database/4seasons.sql
mysql -u root -p 4seasons < database/seed_roles.sql
```

Or using phpMyAdmin:
- Create database `4seasons`
- Import `database/4seasons.sql`
- Import `database/seed_roles.sql`

### 2. Configure Database Connection

Edit `backend/config/database.php` if needed:
```php
private $host = "localhost";
private $db_name = "4seasons";
private $username = "root";
private $password = "";
```

### 3. Setup Web Server

#### Using XAMPP/WAMP:
1. Copy the entire project to `htdocs/4seasons/`
2. Start Apache and MySQL
3. Access: `http://localhost/4seasons/backend/api/`

#### Using PHP Built-in Server:
```bash
cd backend
php -S localhost:8000
```
Then update Angular environment to: `http://localhost:8000/api`

### 4. Test CORS

The API is configured to allow requests from `http://localhost:4200` (Angular dev server).

If you need to change this, edit the CORS headers in `backend/config/database.php`.

## API Endpoints

### POST /api/login.php
Login user
```json
{
  "username": "student123",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "user_id": 1,
    "username": "student123",
    "email": "student@example.com",
    "role_name": "Student",
    "student_info": { ... }
  }
}
```

### POST /api/register.php
Register new user
```json
{
  "role": "student",
  "studentNumber": "2024-001",
  "firstName": "Juan",
  "middleName": "Dela",
  "lastName": "Cruz",
  "gender": "male",
  "birthday": "2005-01-15",
  "contactNumber": "09123456789",
  "email": "juan@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Registration successful",
  "username": "2024-001"
}
```

## Security Notes

- Passwords are hashed using `password_hash()` with BCRYPT
- All database queries use prepared statements (PDO)
- CORS is configured for development (update for production)
- Activity logs track all login and registration attempts

## Troubleshooting

**CORS errors:**
- Check that Apache is running
- Verify the API URL in Angular environment matches your setup
- Check browser console for specific CORS errors

**Database connection errors:**
- Verify MySQL is running
- Check database credentials in `config/database.php`
- Ensure database `4seasons` exists

**404 errors:**
- Check that files are in the correct location
- Verify Apache is serving from the correct directory
- Check `.htaccess` if using Apache
