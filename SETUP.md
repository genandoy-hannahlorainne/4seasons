# PDMHS Student Medical System - Setup Guide

## Quick Start

### 1. Database Setup

**Using phpMyAdmin:**
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Create new database: `4seasons`
3. Import files in order:
   - `database/4seasons.sql`
   - `database/seed_roles.sql`

**Using MySQL CLI:**
```bash
mysql -u root -p
CREATE DATABASE 4seasons;
exit

mysql -u root -p 4seasons < database/4seasons.sql
mysql -u root -p 4seasons < database/seed_roles.sql
```

### 2. Backend Setup (PHP)

**Using XAMPP/WAMP:**
1. Copy entire project to `C:\xampp\htdocs\4seasons\`
2. Start Apache and MySQL from XAMPP Control Panel
3. Backend will be available at: `http://localhost/4seasons/backend/api/`

**Verify backend is working:**
- Open: `http://localhost/4seasons/backend/api/login.php`
- Should see: `{"success":false,"message":"Username and password are required"}`

### 3. Frontend Setup (Angular)

```bash
cd frontend
npm install
ng serve
```

Frontend will run at: `http://localhost:4200`

### 4. Test the System

**Register a new student:**
1. Go to http://localhost:4200
2. Click "Sign Up"
3. Select "Student" role
4. Fill in the form:
   - Student Number: `2024-001`
   - First Name: `Juan`
   - Last Name: `Cruz`
   - Gender: `Male`
   - Birthday: `2005-01-15`
   - Contact: `09123456789`
   - Email: `juan@test.com`
   - Password: `password123`
5. Click "Create Account"
6. Note the username shown in the alert

**Login:**
1. Click "Log In" from landing page
2. Select "Student" role
3. Enter username: `2024-001`
4. Enter password: `password123`
5. Click "Login"

## Configuration

### Backend API URL

Edit `frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost/4seasons/backend/api'
};
```

### Database Connection

Edit `backend/config/database.php`:
```php
private $host = "localhost";
private $db_name = "4seasons";
private $username = "root";
private $password = "";
```

## Troubleshooting

### CORS Errors
- Ensure Apache is running
- Check that backend URL matches in environment.ts
- Verify CORS headers in `backend/config/database.php`

### Database Connection Failed
- Start MySQL from XAMPP
- Check database credentials
- Verify database `4seasons` exists

### 404 Not Found
- Check project is in `htdocs/4seasons/`
- Verify Apache is running
- Check file paths are correct

### Registration/Login Not Working
- Open browser console (F12) to see errors
- Check Network tab for API responses
- Verify roles are seeded in database:
  ```sql
  SELECT * FROM roles;
  ```

## Default Roles

After running `seed_roles.sql`:
- 1: Admin
- 2: Student
- 3: Adviser
- 4: Clinic Staff
- 5: Parent

## Project Structure

```
4seasons/
├── backend/
│   ├── api/
│   │   ├── login.php
│   │   └── register.php
│   ├── config/
│   │   └── database.php
│   └── README.md
├── database/
│   ├── 4seasons.sql
│   ├── seed_roles.sql
│   └── README.md
├── frontend/
│   └── (Angular app)
└── SETUP.md
```
