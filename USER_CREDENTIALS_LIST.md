# User Credentials List

Based on the database analysis and testing, here are the login credentials for each user in the system:

## 🔐 **Confirmed Working Credentials**

### **1. Admin User** ✅
- **Username**: `admin`
- **Password**: `Admin@123`
- **Full Name**: System Administrator
- **Role**: Admin
- **User ID**: 32
- **Status**: Active
- **Email**: admin@pdmhs.edu.ph

### **2. Student User** ✅
- **Username**: `136883100330`
- **Password**: `Student@123`
- **Full Name**: Rithemay Surilla
- **Role**: Student
- **User ID**: 250
- **Status**: Active
- **Student Number**: 136883100330
- **Grade**: 7 - Mapagmahal
- **Adviser**: Gale Gregory
- **Email**: rithemay@gmail.com

## ⚠️ **Users with Changed Passwords**

### **3. Adviser/Faculty User** 🔒
- **Username**: `2026-01`
- **Password**: `[CHANGED FROM DEFAULT]`
- **Full Name**: Gale Gregory
- **Role**: Adviser
- **User ID**: 247
- **Status**: Active
- **Contact**: 09990312848
- **Email**: galegg@gmail.com
- **Note**: User changed password on 2026-03-01 14:13:01

### **4. Clinic Staff User** 🔒
- **Username**: `STAFF-01`
- **Password**: `[CHANGED FROM DEFAULT]`
- **Full Name**: Lulubelle Gabasa
- **Role**: Clinic Staff
- **User ID**: 251
- **Status**: Active
- **Note**: User changed password on 2026-03-01 15:03:19

## 📋 **Default Password Patterns**

The system originally used these password patterns:
- **Admin**: `Admin@123`
- **Students**: `Student@123`
- **Faculty/Advisers**: `[Default unknown - users changed passwords]`
- **Clinic Staff**: `[Default unknown - users changed passwords]`

## 🔄 **Password Reset Options**

For users who have changed their passwords and you don't know the current password:

1. **Admin Reset**: Use the admin account to reset their passwords
2. **Database Reset**: Manually update password hashes in the database
3. **Force Password Change**: Set `password_must_change = 1` to force reset on next login

## 🌐 **Access URLs**

- **Frontend Application**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **phpMyAdmin**: http://localhost:8081 (root/secret)

## 🧪 **Login Testing Results**

✅ **Working Credentials**:
- `admin` / `Admin@123` - System Administrator
- `136883100330` / `Student@123` - Rithemay Surilla (Student)

❌ **Password Unknown** (users changed from defaults):
- `2026-01` - Gale Gregory (Adviser)
- `STAFF-01` - Lulubelle Gabasa (Clinic Staff)

## 🔧 **Admin Functions**

As an admin, you can:
- Reset passwords for other users
- Create new user accounts
- View all user information
- Manage system settings

## ⚠️ **Security Notes**

- These are development/testing credentials
- In production, all default passwords should be changed
- The system supports forced password changes for security
- All passwords are hashed using bcrypt encryption
- Activity logs track all login attempts and password changes