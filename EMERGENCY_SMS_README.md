# Emergency SMS Notification System - Quick Start

## 🚀 Setup (IMPORTANT - Run This First!)

Bago mo gamitin ang emergency notification system, **kailangan mo i-run ang setup script**:

```bash
php setup-emergency-notifications.php
```

### Ano ang ginagawa ng script?
1. ✅ Nag-check kung may `user_id` at `priority` columns sa notifications table
2. ✅ Nag-add ng missing columns kung wala
3. ✅ Nag-update ng `channel` enum para kasama ang 'System'
4. ✅ Nag-test kung gumagana ang notification system

### Expected Output:
```
=== Emergency Notification System Setup ===

1. Checking notifications table structure...
   ✓ Enhancements applied successfully

2. Checking channel enum values...
   ✓ Channel enum includes 'System'

3. Verifying final structure...
   ✓ All required columns present

4. Testing notification system...
   Found admin: Admin User (ID: 1)
   ✓ Test notification created (ID: 123)
   ✓ Test notification cleaned up

=== Setup Complete ===
✓ Emergency notification system is ready!
```

---

## 📋 How It Works

### For Clinic Staff:

1. **Create Emergency Visit**
   - Go to: Dashboard → Visits → New Visit
   - Select student
   - Choose **"Emergency"** as visit type
   - ✅ "Notify Parent via SMS" checkbox **automatically checks**
   - ✅ Checkbox becomes **disabled** (hindi mo pwede i-uncheck)
   - ✅ May lalabas na red badge: **"Auto-enabled for Emergency"**
   - Fill in diagnosis and vitals
   - Click "Save Visit"

2. **What Happens Next?**
   - ✅ Admin receives notification
   - ✅ SMS is queued for parent
   - ✅ Emergency alert appears on admin dashboard

### For Admin:

1. **View Emergency Alerts**
   - Login to admin dashboard
   - **Red banner** appears at top kung may emergency
   - Shows student name, complaint, time

2. **Send SMS to Parent**
   - Click **"📱 SMS Parent"** button (green button)
   - Confirm the action
   - Success message shows phone number and SMS text

3. **Manage Notifications**
   - Click "View" to see full details
   - Click "Mark All Read" to dismiss alerts

---

## 🎯 Quick Test

### Test 1: Database Setup
```bash
php setup-emergency-notifications.php
```
Expected: ✓ All checks pass

### Test 2: Create Emergency Visit
1. Login as **Clinic Staff**
2. Create new visit with type **"Emergency"**
3. Check: SMS checkbox auto-checked? ✅
4. Check: Badge appears? ✅
5. Submit visit

### Test 3: Admin Notification
1. Login as **Admin**
2. Go to Dashboard
3. Check: Red emergency banner appears? ✅
4. Check: "SMS Parent" button visible? ✅
5. Click "SMS Parent"
6. Check: Success message? ✅

---

## ❌ Troubleshooting

### Problem: Admin dashboard walang emergency notification

**Solution:**
```bash
# Run setup script
php setup-emergency-notifications.php

# Check if it worked
php -r "
require_once 'backend/config/database.php';
\$db = (new Database())->getConnection();
\$stmt = \$db->query('SHOW COLUMNS FROM notifications LIKE \"user_id\"');
echo \$stmt->rowCount() > 0 ? '✓ user_id column exists' : '✗ user_id column missing';
"
```

### Problem: Checkbox hindi nag-auto-check

**Solution:**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Rebuild frontend:
   ```bash
   cd frontend
   npm run build
   ```
3. Refresh page (Ctrl + F5)

### Problem: SMS Parent button walang nangyayari

**Solution:**
1. Check browser console (F12) for errors
2. Check if API file exists:
   ```bash
   dir backend\api\admin\send-parent-sms.php
   ```
3. Check if you're logged in as Admin

---

## 📁 Files Overview

### Created Files:
- `backend/api/admin/send-parent-sms.php` - API for sending SMS
- `setup-emergency-notifications.php` - Database setup script
- `EMERGENCY_SMS_NOTIFICATION_FEATURE.md` - Technical docs
- `EMERGENCY_SMS_USER_GUIDE.md` - User guide
- `EMERGENCY_NOTIFICATION_TROUBLESHOOTING.md` - Troubleshooting
- `IMPLEMENTATION_SUMMARY.md` - Overview
- `EMERGENCY_SMS_README.md` - This file

### Modified Files:
- `frontend/src/app/features/dashboard/staff/visits/visit-form.component.ts`
- `frontend/src/app/features/dashboard/admin/admin-dashboard.component.ts`
- `frontend/src/app/core/services/admin.service.ts`

### Database Files:
- `database/notifications-enhancement.sql` - SQL for table updates

---

## 🔧 Configuration

### SMS Gateway (Optional - For Production)

Para mag-send ng actual SMS, kailangan mo i-configure ang SMS gateway.

**Option 1: Semaphore (Philippines)**
1. Get API key from https://semaphore.co
2. Edit `backend/api/admin/send-parent-sms.php`
3. Uncomment the Semaphore code section
4. Add your API key

**Option 2: Twilio (International)**
1. Get credentials from https://twilio.com
2. Install Twilio SDK: `composer require twilio/sdk`
3. Update the code with Twilio implementation

**Option 3: Globe Labs (Philippines)**
1. Get API credentials from Globe Labs
2. Update the code with Globe Labs API

---

## 📊 Database Schema

### notifications table (after setup):
```
notification_id - Primary key
parent_id - Link to parent (optional)
user_id - Link to user (admin/adviser) ← NEW
student_id - Link to student
visit_id - Link to medical visit
channel - 'SMS', 'Email', or 'System' ← UPDATED
message - Notification text
status - 'Pending', 'Sent', 'Failed'
priority - 'normal' or 'urgent' ← NEW
provider_id - SMS provider reference
sent_at - When SMS was sent
created_at - When notification was created
```

---

## 🎓 Training Guide

### For Clinic Staff:
1. Always verify student identity
2. Use "Emergency" only for actual emergencies
3. Fill in all required fields
4. Check if parent phone number is shown
5. Document symptoms clearly

### For Admin:
1. Check emergency alerts regularly
2. Respond within 5 minutes
3. Verify SMS was sent
4. Follow up with parent if needed
5. Mark notifications as read after handling

---

## 📞 Support

### Need Help?

1. **Setup Issues**: Check `EMERGENCY_NOTIFICATION_TROUBLESHOOTING.md`
2. **Usage Questions**: Check `EMERGENCY_SMS_USER_GUIDE.md`
3. **Technical Details**: Check `EMERGENCY_SMS_NOTIFICATION_FEATURE.md`

### Common Commands:

```bash
# Run setup
php setup-emergency-notifications.php

# Check database structure
php -r "require_once 'backend/config/database.php'; \$db = (new Database())->getConnection(); \$stmt = \$db->query('DESCRIBE notifications'); while(\$r=\$stmt->fetch(PDO::FETCH_ASSOC)) echo \$r['Field'].PHP_EOL;"

# Rebuild frontend
cd frontend && npm run build

# Check PHP errors
type backend\logs\error.log
```

---

## ✅ Checklist

Before using the system:
- [ ] Ran `php setup-emergency-notifications.php`
- [ ] All checks passed (✓)
- [ ] Tested emergency visit creation
- [ ] Tested admin notification display
- [ ] Tested SMS Parent button
- [ ] Configured SMS gateway (optional)

---

**Status**: ✅ Ready to Use  
**Last Updated**: February 2, 2026  
**Version**: 1.0
