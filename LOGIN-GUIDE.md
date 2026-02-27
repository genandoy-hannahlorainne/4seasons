# 🔐 Medical Record System - Login Guide

## How to Login

### 👨‍💼 **Admin Users**
**URL:** `http://localhost:4202/admin/login`

**Credentials:**
- Username: `admin`
- Password: `admin123`

**Features:**
- System administration
- User management
- Reports and analytics
- School year management

---

### 👨‍🏫 **Advisers**
**URL:** `http://localhost:4202/login` → Select "Adviser"

**Sample Credentials:**
- Username: `2026-01`
- Password: `password123` (or check with admin)

**Features:**
- Class management
- Student health monitoring
- Medical alerts
- Student profiles

---

### 👩‍⚕️ **Clinic Staff**
**URL:** `http://localhost:4202/login` → Select "Clinic Staff"

**Sample Credentials:**
- Username: `STAFF-01`
- Password: `password123` (or check with admin)

**Features:**
- Medical visits recording
- Student health records
- Emergency visits
- Medical reports

---

### 👨‍🎓 **Students**
**URL:** `http://localhost:4202/login` → Select "Student"

**Sample Credentials:**
- Username: `136663100330` (Student Number)
- Password: `password123` (or check with admin)

**Features:**
- Personal health records
- Medical visit history
- QR code access
- Health alerts

---

## 🚨 Common Login Issues & Solutions

### ❌ "Please use the admin portal to login"
**Problem:** Trying to login as admin through regular login form
**Solution:** Use admin portal at `/admin/login`

### ❌ "Security Error: Role mismatch"
**Problem:** Selected wrong role during login
**Solution:** 
1. Go back to role selection
2. Choose the correct role for your account
3. Login with appropriate credentials

### ❌ "Cannot connect to server"
**Problem:** Backend server not running
**Solution:** 
1. Start Laravel server: `php artisan serve --port=8000`
2. Start Angular server: `ng serve --port=4202`

### ❌ "Invalid credentials"
**Problem:** Wrong username or password
**Solution:** 
1. Check username (case-sensitive)
2. Contact admin for password reset
3. Use correct credentials for your role

---

## 🔧 For Developers

### Backend (Laravel API)
- **URL:** `http://localhost:8000/api`
- **Login Endpoint:** `POST /api/login`
- **Authentication:** JWT Bearer tokens

### Frontend (Angular)
- **URL:** `http://localhost:4202`
- **Admin Portal:** `/admin/login`
- **Regular Login:** `/login`

### Test Credentials
```
Admin: admin / admin123
Adviser: 2026-01 / password123
Staff: STAFF-01 / password123
Student: 136663100330 / password123
```

---

## 📱 Mobile Access
The system is responsive and works on mobile devices. Use the same URLs and credentials.

---

## 🆘 Need Help?
1. Check this guide first
2. Verify server status
3. Contact system administrator
4. Check browser console for errors

**System Status:**
- ✅ Laravel API: `http://localhost:8000/api/health`
- ✅ Angular App: `http://localhost:4202`