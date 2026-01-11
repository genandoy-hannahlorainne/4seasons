# Admin Management Features - Complete Guide

## Overview
The admin dashboard now includes comprehensive user management and system administration features.

---

## 🎯 Admin Dashboard Features

### 1. **Dashboard Overview**
- **Statistics Cards**: Display total users, students, advisers, and clinic staff
- **System Activity**: Real-time activity log showing user registrations, medical records updates, reports, and system events
- **Alerts & Warnings**: System notifications and alerts
- **Recent Users**: Table showing the 10 most recently registered users with their roles and status

### 2. **Quick Actions**
The admin dashboard includes 6 quick action buttons:

#### ✅ **Manage Users** (Fully Functional)
- **Route**: `/dashboard/admin/manage-users`
- **Features**:
  - View all users (students, advisers, clinic staff)
  - Filter users by role
  - Search users by name, username, or email
  - View detailed user information
  - Edit user details (name, email, phone)
  - Reset user passwords
  - Activate/Deactivate users
  - Delete users (soft delete)
  - Real-time filtering and search

#### ⚙️ **System Settings** (Placeholder)
- **Route**: `/dashboard/admin/settings`
- **Status**: Ready for implementation
- **Planned Features**:
  - System configuration
  - Email settings
  - Notification preferences
  - System parameters

#### 📊 **View Reports** (Placeholder)
- **Route**: `/dashboard/admin/reports`
- **Status**: Ready for implementation
- **Planned Features**:
  - User statistics reports
  - Medical records reports
  - System usage analytics
  - Export reports to PDF/Excel

#### 💾 **Database Backup** (Functional)
- **Feature**: Opens a confirmation modal
- **Functionality**:
  - Confirms backup action
  - Shows estimated time
  - Initiates database backup process
- **Status**: Modal implemented, backend integration ready

#### 📋 **Audit Logs** (Placeholder)
- **Route**: `/dashboard/admin/audit-logs`
- **Status**: Ready for implementation
- **Planned Features**:
  - View all system activities
  - Filter by user, action, date
  - Export audit logs
  - Track user actions

#### 🔒 **Security** (Placeholder)
- **Route**: `/dashboard/admin/security`
- **Status**: Ready for implementation
- **Planned Features**:
  - Change admin password
  - Manage admin permissions
  - View login history
  - Security settings

---

## 📋 Manage Users Component - Complete Features

### User Management Interface
Located at: `/dashboard/admin/manage-users`

#### **Filtering & Search**
- Filter by role: All Users, Students, Advisers, Clinic Staff
- Real-time search by:
  - Full name
  - Username
  - Email address

#### **User Table Display**
Shows for each user:
- Full Name
- Username
- Email
- Role (with color-coded badges)
- Status (Active/Inactive)
- Registration Date
- Action button (View/Edit)

#### **User Details Modal**
Click the edit button (✎) to open user details:

**Basic Information Section:**
- Full Name (editable)
- Username (read-only)
- Email (editable)
- Phone (editable)
- Role (read-only)
- Status (display only)
- Registration Date (read-only)

**Modal Actions:**
1. **Save Changes** - Update user information
2. **Reset Password** - Opens password reset modal
3. **Deactivate/Activate** - Toggle user status
4. **Close** - Close the modal

#### **Password Reset Modal**
- Secure password reset interface
- Minimum 6 characters required
- Confirmation feedback
- Error handling

---

## 🔧 Backend API Endpoints

### User Management API
**Base URL**: `http://localhost:8081/api/manage-user.php`

#### **1. Get User Details**
```
GET /manage-user.php?action=view&user_id=19
```
Returns: User information including name, email, phone, role, status

#### **2. Update User**
```
PUT /manage-user.php?action=update&user_id=19
Body: {
  "full_name": "New Name",
  "email": "newemail@example.com",
  "phone": "+1234567890"
}
```

#### **3. Reset Password**
```
PUT /manage-user.php?action=reset-password&user_id=19
Body: {
  "password": "newpassword123"
}
```

#### **4. Deactivate User**
```
DELETE /manage-user.php?action=deactivate&user_id=19
```

#### **5. Activate User**
```
PUT /manage-user.php?action=activate&user_id=19
```

#### **6. Delete User**
```
DELETE /manage-user.php?action=delete&user_id=19
```

---

## 🎨 UI/UX Features

### Color-Coded Badges
- **Student**: Green badge
- **Adviser**: Purple badge
- **Clinic Staff**: Red badge

### Status Indicators
- **Active**: Green dot + "Active" text
- **Inactive**: Red dot + "Inactive" text

### Responsive Design
- Desktop: Full table view with all columns
- Tablet: Optimized layout
- Mobile: Simplified view with essential information

### User Feedback
- Success messages for completed actions
- Error messages for failed operations
- Loading states during data fetching
- Confirmation dialogs for destructive actions

---

## 📊 Admin Service Methods

All methods available in `AdminService`:

```typescript
// Fetch all users
getAllUsers(): Observable<any>

// Fetch users by role
getUsersByRole(role: string): Observable<any>
getStudents(): Observable<any>
getAdvisers(): Observable<any>
getClinicStaff(): Observable<any>

// User management
getUserDetails(userId: number): Observable<any>
updateUser(userId: number, userData: any): Observable<any>
resetPassword(userId: number, newPassword: string): Observable<any>
deactivateUser(userId: number): Observable<any>
activateUser(userId: number): Observable<any>
deleteUser(userId: number): Observable<any>
```

---

## 🚀 How to Use

### Access Admin Dashboard
1. Login as admin (username: `admin`, password: `admin123`)
2. Navigate to `/dashboard/admin`

### Manage Users
1. Click "Manage Users" button in Quick Actions
2. Use filters and search to find users
3. Click the edit button (✎) to view/edit user details
4. Make changes and click "Save Changes"
5. Use "Reset Password" to change user passwords
6. Use "Deactivate/Activate" to toggle user status

### Database Backup
1. Click "Database Backup" button
2. Confirm the backup action
3. System will initiate backup process

---

## ✅ Current Status

### Fully Implemented ✅
- ✅ Manage Users (complete with all CRUD operations)
- ✅ User filtering and search
- ✅ User details modal
- ✅ Password reset
- ✅ User activation/deactivation
- ✅ User deletion
- ✅ Database backup modal
- ✅ Dashboard statistics
- ✅ Recent users display

### Ready for Implementation 🔄
- 🔄 System Settings
- 🔄 View Reports
- 🔄 Audit Logs
- 🔄 Security Settings

---

## 📝 Notes

- All user changes are logged in the activity log
- Soft deletes are used (users are marked as deleted, not removed)
- Passwords are hashed using BCRYPT
- All API endpoints require proper authentication
- Admin actions are tracked for audit purposes

---

## 🔐 Security Features

- Password hashing with BCRYPT
- Soft deletes for data retention
- Role-based access control
- Activity logging
- Confirmation dialogs for destructive actions
- Input validation on all forms

---

## 📞 Support

For issues or questions about admin features, refer to:
- Backend API: `backend/api/manage-user.php`
- Frontend Component: `frontend/src/app/features/dashboard/admin/manage-users/`
- Admin Service: `frontend/src/app/core/services/admin.service.ts`
