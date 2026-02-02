# Emergency Notification System - Troubleshooting Guide

## Problem: Admin Dashboard Not Showing Emergency Notifications

### Symptoms:
- Admin logs in successfully
- Dashboard loads but no emergency banner appears
- Even after creating emergency visit, no notification shows

### Root Cause:
The `notifications` table is missing required columns (`user_id`, `priority`) or the `channel` enum doesn't include 'System'.

### Solution:

#### Step 1: Run the Setup Script
```bash
php setup-emergency-notifications.php
```

This script will:
- ✅ Check if `user_id` column exists
- ✅ Check if `priority` column exists
- ✅ Check if `channel` enum includes 'System'
- ✅ Apply database enhancements if needed
- ✅ Test notification creation

#### Step 2: Verify Database Structure

**Option A: Using PHP Script**
```bash
php -r "
require_once 'backend/config/database.php';
\$db = (new Database())->getConnection();
\$stmt = \$db->query('SHOW COLUMNS FROM notifications');
while (\$row = \$stmt->fetch(PDO::FETCH_ASSOC)) {
    echo \$row['Field'] . ' - ' . \$row['Type'] . PHP_EOL;
}
"
```

**Option B: Using MySQL Command Line**
```sql
USE your_database_name;
DESCRIBE notifications;
```

**Expected Output:**
```
notification_id - bigint(20) unsigned
parent_id - int(10) unsigned
user_id - int(10) unsigned          ← Must exist
student_id - int(10) unsigned
visit_id - bigint(20) unsigned
channel - enum('SMS','Email','System')  ← Must include 'System'
message - text
status - enum('Pending','Sent','Failed')
priority - enum('normal','urgent')  ← Must exist
provider_id - varchar(100)
sent_at - datetime
created_at - timestamp
```

#### Step 3: Manual Database Update (If Script Fails)

If the setup script fails, manually run these SQL commands:

```sql
-- Add user_id column
ALTER TABLE `notifications` 
ADD COLUMN `user_id` int(10) UNSIGNED DEFAULT NULL AFTER `parent_id`;

-- Add priority column
ALTER TABLE `notifications` 
ADD COLUMN `priority` enum('normal','urgent') DEFAULT 'normal' AFTER `status`;

-- Update channel enum to include 'System'
ALTER TABLE `notifications` 
MODIFY COLUMN `channel` enum('SMS','Email','System') DEFAULT 'SMS';

-- Add foreign key for user_id
ALTER TABLE `notifications`
ADD KEY `fk_notif_user` (`user_id`);

ALTER TABLE `notifications`
ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);
```

#### Step 4: Test Notification Creation

Create a test emergency visit:
1. Login as Clinic Staff
2. Go to Visits → New Visit
3. Select a student
4. Choose "Emergency" as visit type
5. Fill in required fields
6. Submit

Then check as Admin:
1. Login as Admin
2. Go to Dashboard
3. Should see red emergency banner

#### Step 5: Check Browser Console

Open browser developer tools (F12) and check console for errors:

**Common Errors:**

**Error 1: API Returns Empty Notifications**
```javascript
// Console shows:
{success: true, notifications: [], total: 0}
```
**Solution**: Database columns missing. Run setup script.

**Error 2: API Error 500**
```javascript
// Console shows:
{success: false, message: "Database error: ..."}
```
**Solution**: Check database connection and column names.

**Error 3: No API Call**
```javascript
// Console shows nothing
```
**Solution**: Check if `getNotifications()` is being called in component.

---

## Problem: Emergency Visit Not Creating Notification

### Symptoms:
- Emergency visit saves successfully
- But no notification appears in admin dashboard
- Database has the visit but no notification record

### Diagnosis:

#### Check 1: Verify Visit Was Saved
```sql
SELECT * FROM medical_visits 
WHERE visit_type = 'Emergency' 
ORDER BY visit_datetime DESC 
LIMIT 5;
```

#### Check 2: Check Notifications Table
```sql
SELECT * FROM notifications 
WHERE channel = 'System' 
AND priority = 'urgent'
ORDER BY created_at DESC 
LIMIT 5;
```

#### Check 3: Check Backend Logs
Look at PHP error logs for any errors during visit creation:
```bash
# Windows
type backend\logs\error.log

# Or check PHP error log location
php -i | findstr error_log
```

### Solution:

If notifications are not being created, check `backend/api/save-medical-visit.php`:

1. **Verify the emergency workflow code exists** (around line 150-200)
2. **Check if admin users exist**:
```sql
SELECT u.user_id, u.full_name, u.email, r.role_name
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE r.role_name = 'Admin' AND u.is_active = 1;
```

3. **Test notification insertion manually**:
```sql
INSERT INTO notifications (user_id, visit_id, student_id, channel, message, priority, status, created_at)
VALUES (
    1,  -- Replace with actual admin user_id
    1,  -- Replace with actual visit_id
    1,  -- Replace with actual student_id
    'System',
    'TEST: Emergency notification',
    'urgent',
    'Pending',
    NOW()
);
```

---

## Problem: SMS Parent Button Not Working

### Symptoms:
- Emergency notification appears
- "SMS Parent" button is visible
- But clicking it shows error or nothing happens

### Diagnosis:

#### Check 1: Verify API Endpoint Exists
```bash
# Check if file exists
dir backend\api\admin\send-parent-sms.php
```

#### Check 2: Test API Directly
Using Postman or curl:
```bash
curl -X POST http://localhost/backend/api/admin/send-parent-sms.php \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"visit_id\": 1}"
```

#### Check 3: Check Browser Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Click "SMS Parent" button
4. Look for the API request

**Expected Request:**
```
POST /backend/api/admin/send-parent-sms.php
{
  "visit_id": 123
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SMS notification sent to parent",
  "phone": "+639123456789",
  "sms_message": "URGENT: Your child..."
}
```

### Common Errors:

**Error 1: 404 Not Found**
- **Cause**: API file doesn't exist or wrong path
- **Solution**: Verify file exists at `backend/api/admin/send-parent-sms.php`

**Error 2: 403 Forbidden**
- **Cause**: User is not admin or not authenticated
- **Solution**: Check authentication token and user role

**Error 3: "No parent phone number on file"**
- **Cause**: Student doesn't have parent phone in database
- **Solution**: Add parent phone number to student record

**Error 4: "Visit not found"**
- **Cause**: Invalid visit_id
- **Solution**: Check if visit exists in database

---

## Problem: Checkbox Not Auto-Checking for Emergency

### Symptoms:
- Select "Emergency" as visit type
- Checkbox doesn't automatically check
- No badge or notice appears

### Solution:

#### Check 1: Verify Component Code
Open `frontend/src/app/features/dashboard/staff/visits/visit-form.component.ts`

Look for:
```typescript
onVisitTypeChange(): void {
  if (this.visit.visitType === 'emergency') {
    this.visit.notifyParent = true;
  }
}
```

#### Check 2: Verify Template Binding
Look for:
```html
<select [(ngModel)]="visit.visitType" name="visitType" 
        (ngModelChange)="onVisitTypeChange()">
```

#### Check 3: Clear Browser Cache
```
Ctrl + Shift + Delete → Clear cached images and files
```

#### Check 4: Rebuild Frontend
```bash
cd frontend
npm run build
```

---

## Quick Diagnostic Checklist

Run through this checklist to identify the issue:

- [ ] Database has `user_id` column in notifications table
- [ ] Database has `priority` column in notifications table
- [ ] Database `channel` enum includes 'System'
- [ ] At least one Admin user exists and is active
- [ ] `backend/api/get-admin-notifications.php` exists
- [ ] `backend/api/admin/send-parent-sms.php` exists
- [ ] Frontend component has `onVisitTypeChange()` method
- [ ] Frontend component calls `adminService.getNotifications()`
- [ ] Browser console shows no JavaScript errors
- [ ] Network tab shows API calls being made
- [ ] Backend PHP error logs show no errors

---

## Still Having Issues?

### Enable Debug Mode

**Backend (PHP):**
Add to `backend/api/get-admin-notifications.php`:
```php
error_log("DEBUG: Getting notifications for user_id: " . $auth->userId());
error_log("DEBUG: Query: " . $query);
error_log("DEBUG: Results: " . json_encode($notifications));
```

**Frontend (Angular):**
Add to `admin-dashboard.component.ts`:
```typescript
this.adminService.getNotifications().subscribe({
  next: (response) => {
    console.log('🔍 DEBUG: Full response:', response);
    console.log('🔍 DEBUG: Notifications:', response.notifications);
    console.log('🔍 DEBUG: Total:', response.total);
    // ... rest of code
  }
});
```

### Check Database Connection
```php
<?php
require_once 'backend/config/database.php';
try {
    $db = (new Database())->getConnection();
    echo "✓ Database connected successfully\n";
    
    $stmt = $db->query("SELECT COUNT(*) as count FROM notifications");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✓ Notifications table accessible\n";
    echo "  Total notifications: " . $result['count'] . "\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
?>
```

---

## Contact Support

If you've tried all the above and still have issues:

1. **Gather Information:**
   - PHP version: `php -v`
   - Database version: `mysql --version`
   - Browser console errors (screenshot)
   - Network tab errors (screenshot)
   - PHP error logs

2. **Create Issue Report:**
   - Describe the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/logs

3. **Check Documentation:**
   - `EMERGENCY_SMS_NOTIFICATION_FEATURE.md` - Technical details
   - `EMERGENCY_SMS_USER_GUIDE.md` - User guide
   - `IMPLEMENTATION_SUMMARY.md` - Overview

---

**Last Updated**: February 2, 2026
