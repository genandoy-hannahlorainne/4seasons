# Admin Notification System Guide

## Where to See Notifications

### Admin Dashboard Location
**URL:** `/dashboard/admin` or click "Dashboard" in the admin menu

### Notification Types

The notifications appear at the top of the admin dashboard in colored banners:

#### 1. 🟠 Password Change Requests (Orange Banner)
- Shows when users request password changes
- Displays:
  - User's full name and role
  - Username
  - Reason for request
  - Time requested
- Actions:
  - **Approve**: Generates a temporary password for the user
  - **Dismiss**: Rejects the request

#### 2. 🔵 Emergency Drill Alerts (Blue Banner)
- Shows when emergency drills are started
- Displays:
  - Drill name and type
  - Status (active)
  - Time started
- Actions:
  - **View Dashboard**: Opens the drill monitoring dashboard

#### 3. 🔴 Medical Emergency Notifications (Red Banner)
- Shows urgent medical visits
- Displays:
  - Student name and number
  - Medical issue
  - Time of visit
- Actions:
  - **SMS Parent**: Send notification to parent
  - **View**: View visit details

## How to Test

### Test Notifications Created
I've created sample notifications for you:
- 2 password change requests (from r.saril and m.ocado)
- 1 emergency drill alert

### To View Them:
1. Login as admin (username: `admin` or your admin account)
2. Navigate to Admin Dashboard
3. Scroll to the top - you'll see the colored notification banners

### To Test Password Change Approval:
1. Click **Approve** on a password change request
2. A popup will show the temporary password
3. Give this password to the user
4. User must change it on next login

### To Test Password Change Request (as a user):
Currently, users need to use the API endpoint:
```
POST /api/request-password-change
Headers: Authorization: Bearer {token}
Body: { "reason": "Your reason here" }
```

## API Endpoints

### For Users:
- `POST /api/request-password-change` - Request password change

### For Admins:
- `GET /api/admin/notifications` - Get all notifications
- `POST /api/admin/notifications/{id}/approve-password-change` - Approve request
- `POST /api/admin/notifications/{id}/dismiss` - Dismiss request
- `PUT /api/admin/notifications/{id}/read` - Mark as read
- `POST /api/admin/notifications/mark-all-read` - Mark all as read

## Notification Flow

### Password Change Request Flow:
1. User requests password change (with optional reason)
2. Notification created with status "Pending"
3. Admin sees orange banner on dashboard
4. Admin approves or dismisses:
   - **Approve**: Password reset, temp password generated, user must change on login
   - **Dismiss**: Request marked as read, no action taken

### Emergency Drill Alert Flow:
1. Admin starts an emergency drill
2. Notification automatically created
3. Admin sees blue banner on dashboard
4. Admin can click to view drill dashboard
5. Admin can mark as read when acknowledged

## Screenshots Location

When you login as admin and go to the dashboard, you'll see:

```
┌─────────────────────────────────────────────────────┐
│ 🔑 2 Password Change Requests                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ User Name (Role)                    [Approve]   │ │
│ │ Reason: I forgot my password        [Dismiss]   │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🔔 1 Emergency Drill Alert              [Mark Read] │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Fire Drill - Building A (Fire)  [View Dashboard]│ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ⚠️ Emergency Medical Notifications                  │
│ (Shows urgent medical visits if any)                │
└─────────────────────────────────────────────────────┘
```

## Next Steps

If you want to add a "Request Password Change" button in user profiles:
1. I can add it to adviser/staff profile pages
2. Users can click the button and submit a request
3. Admin will see it on the dashboard

Let me know if you'd like me to add this feature!
