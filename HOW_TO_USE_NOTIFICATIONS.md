# How to Use Real Notifications

## Password Change Requests

### For Users (Student/Adviser/Staff):
1. Login to your account
2. Go to **Profile** page
3. Click **"Request Password Reset from Admin"** button
4. Enter a reason (optional) - e.g., "I forgot my password"
5. Click **"Submit Request"**
6. You'll see a success message
7. Wait for admin to approve your request

### For Admin:
1. Login as admin
2. Go to **Admin Dashboard**
3. You'll see an **ORANGE banner** at the top with password change requests
4. Each request shows:
   - User's name and role
   - Username
   - Reason for request
   - Time requested
5. Click **"Approve"** to:
   - Reset the user's password
   - Get a temporary password
   - Give this password to the user
6. Or click **"Dismiss"** to reject the request

## Emergency Drill Notifications

### When You Start a Drill:
1. Login as admin
2. Go to **Emergency Drills** page
3. Create a new drill or start an existing one
4. Click **"Start Drill"**
5. A notification is automatically created

### On Admin Dashboard:
1. You'll see a **BLUE banner** with the drill alert
2. Shows:
   - Drill name and type
   - Status (active)
   - Time started
3. Click **"View Dashboard"** to monitor the drill
4. Click **"Mark All Read"** to clear the notification

## Medical Emergency Notifications

These are created automatically when:
- A student has an urgent medical visit
- Clinic staff marks a visit as urgent

You'll see a **RED banner** on the admin dashboard with:
- Student name and number
- Medical issue
- Actions: Send SMS to parent, View details

## Testing the System

### Test Password Change Request:
1. Open two browser windows/tabs
2. Window 1: Login as student, adviser, or staff (e.g., student account, `r.saril`, or `m.ocado`)
3. Window 2: Login as admin
4. In Window 1:
   - Go to Profile
   - Click "Request Password Reset from Admin"
   - Enter reason: "Testing the notification system"
   - Submit
5. In Window 2:
   - Refresh Admin Dashboard
   - You should see the orange banner with the request
   - Click "Approve" to test the approval flow

### Test Emergency Drill Notification:
1. Login as admin
2. Go to Emergency Drills
3. Create a new drill:
   - Name: "Test Fire Drill"
   - Type: Fire
   - Schedule it for now or leave unscheduled
4. Click "Start Drill"
5. Go back to Admin Dashboard
6. You should see the blue banner with the drill alert

## Notification Persistence

- Notifications are stored in the database
- They persist across page refreshes
- They remain until marked as read or dismissed
- Notification history shows all processed notifications

## API Endpoints Used

- `POST /api/request-password-change` - User requests password change
- `GET /api/admin/notifications` - Admin gets all notifications
- `POST /api/admin/notifications/{id}/approve-password-change` - Admin approves request
- `POST /api/admin/notifications/{id}/dismiss` - Admin dismisses request
- `POST /api/admin/notifications/mark-all-read` - Mark all as read

## Troubleshooting

If notifications don't appear:
1. Check browser console (F12) for errors
2. Verify you're logged in as admin
3. Refresh the page
4. Check if Angular dev server is running
5. Verify the API is responding: Check Network tab in browser DevTools

## Clean Up Test Data

To remove test notifications:
```sql
DELETE FROM notifications WHERE notification_type IN ('password_change_request', 'emergency_drill_alert');
```

Or run in Laravel:
```bash
php artisan tinker
>>> App\Models\Notification::whereIn('notification_type', ['password_change_request', 'emergency_drill_alert'])->delete();
```
