# Testing SMS Parent Button - Quick Guide

## Issue Fixed: "visit_id is required"

The issue was that the notification object structure has `visit.visit_id` instead of just `visit_id`.

**Fixed in**: `frontend/src/app/features/dashboard/admin/admin-dashboard.component.ts`

---

## How to Test:

### Step 1: Open Browser Console
1. Open your application
2. Press **F12** to open Developer Tools
3. Go to **Console** tab

### Step 2: Login as Admin
1. Login with admin credentials
2. Go to Admin Dashboard

### Step 3: Check Console Logs
You should see logs like:
```
✅ Admin notifications response: {success: true, notifications: [...]}
🔍 Notification structure: {notification_id: 7, visit: {...}, student: {...}}
🔍 Visit ID: 16
✅ Emergency notifications loaded: 1
```

### Step 4: Click SMS Parent Button
1. Find the red emergency banner
2. Click **"📱 SMS Parent"** button
3. Confirm the action

### Step 5: Check Result
**Success:**
```
SMS sent successfully to +639123456789

Message: URGENT: Your child Hannah Lorainne had an emergency...
```

**If Still Error:**
Check console for error details and the notification structure.

---

## Debug Information

### What the Code Does Now:

```typescript
sendSMSToParent(notification: any): void {
  // Try to get visit_id from two possible locations
  const visitId = notification.visit?.visit_id || notification.visit_id;
  
  // If no visit_id found, show error
  if (!visitId) {
    alert('Error: Visit ID not found');
    console.error('Notification object:', notification);
    return;
  }
  
  // Send SMS with the visit_id
  this.adminService.sendParentSMS(visitId).subscribe(...);
}
```

### Notification Structure (from backend):

```json
{
  "notification_id": 7,
  "message": "EMERGENCY ALERT: Student...",
  "priority": "urgent",
  "status": "Pending",
  "created_at": "2026-02-02 12:00:00",
  "student": {
    "student_id": 21,
    "full_name": "Hannah Lorainne",
    "student_number": "136883100330",
    "grade_section": "7-A"
  },
  "visit": {
    "visit_id": 16,           ← THIS IS WHAT WE NEED
    "visit_type": "Emergency",
    "chief_complaint": "High fever",
    "status": "Open"
  },
  "staff": {
    "name": "Clinic Staff",
    "position": "Nurse"
  }
}
```

---

## If Still Not Working:

### Check 1: Verify Notification Has Visit ID
Open console and type:
```javascript
// This will show the notification structure
console.log(this.emergencyNotifications);
```

### Check 2: Check Network Tab
1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Click "SMS Parent" button
4. Look for request to `send-parent-sms.php`
5. Check the **Request Payload**:
   ```json
   {
     "visit_id": 16
   }
   ```

### Check 3: Check Backend Response
In Network tab, check the **Response**:

**Success:**
```json
{
  "success": true,
  "message": "SMS notification sent to parent",
  "phone": "+639123456789",
  "sms_message": "URGENT: Your child..."
}
```

**Error:**
```json
{
  "success": false,
  "message": "visit_id is required"
}
```

---

## Common Issues:

### Issue 1: visit_id is null
**Cause**: Notification doesn't have visit information
**Solution**: Check if the notification was created with a visit_id

```sql
SELECT * FROM notifications WHERE notification_id = 7;
-- Check if visit_id column has a value
```

### Issue 2: visit object is null
**Cause**: Backend didn't join the medical_visits table
**Solution**: Check `backend/api/get-admin-notifications.php` query

### Issue 3: Button doesn't do anything
**Cause**: JavaScript error
**Solution**: Check browser console for errors

---

## Manual Test (If Needed):

You can test the API directly using curl:

```bash
# Get your auth token first (from browser localStorage or login response)
$TOKEN = "your_jwt_token_here"

# Test the SMS API
curl -X POST http://localhost/backend/api/admin/send-parent-sms.php `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d '{"visit_id": 16}'
```

Expected response:
```json
{
  "success": true,
  "message": "SMS notification sent to parent",
  "phone": "+639123456789",
  "sms_message": "URGENT: Your child Hannah Lorainne..."
}
```

---

## Verification Checklist:

- [ ] Browser console shows notification structure
- [ ] Console shows visit_id value
- [ ] SMS Parent button is visible
- [ ] Clicking button shows confirmation dialog
- [ ] After confirm, success message appears
- [ ] Success message shows phone number
- [ ] Success message shows SMS text
- [ ] No errors in console

---

## Success Indicators:

✅ Console shows: `🔍 Visit ID: 16`  
✅ Alert shows: `SMS sent successfully to +639123456789`  
✅ No errors in console  
✅ Network tab shows 200 OK response

---

**Last Updated**: February 2, 2026  
**Status**: Fixed - Ready to test
