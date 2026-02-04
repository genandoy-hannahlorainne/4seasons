# Emergency SMS Notification Feature

## Overview
Implemented automatic SMS notification system for emergency clinic visits with admin control.

## Features Implemented

### 1. **Clinic Staff Visit Form** (Frontend)
**File**: `frontend/src/app/features/dashboard/staff/visits/visit-form.component.ts`

#### Changes:
- ✅ Added auto-check functionality for "Notify Parent via SMS" checkbox when visit type is "Emergency"
- ✅ Checkbox is automatically enabled and disabled (cannot be unchecked) for emergency visits
- ✅ Added visual badge "Auto-enabled for Emergency" to indicate automatic behavior
- ✅ Added emergency notice banner: "🚨 Emergency visits automatically notify admin and parents"
- ✅ Shows parent phone number when SMS notification is enabled
- ✅ Warns if no parent phone number is on file

#### User Experience:
1. Clinic staff selects visit type
2. If "Emergency" is selected:
   - "Notify Parent via SMS" checkbox is automatically checked
   - Checkbox becomes disabled (cannot be unchecked)
   - Red badge appears showing "Auto-enabled for Emergency"
   - Emergency notice appears below
3. If "Routine" is selected:
   - Checkbox can be manually checked/unchecked by staff

### 2. **Backend Visit Processing** (Already Implemented)
**File**: `backend/api/save-medical-visit.php`

#### Existing Emergency Workflow:
- ✅ Emergency visits automatically notify all admins via email
- ✅ Emergency visits force `notify_parent = true`
- ✅ SMS notification is logged in the notifications table
- ✅ Parent phone number is retrieved from student records

#### SMS Message Format:
**Emergency:**
```
URGENT: Your child [Student Name] had an emergency clinic visit on [Date]. 
Reason: [Complaint]. Please contact Four Seasons School Clinic immediately at [CLINIC_PHONE].
```

**Routine:**
```
Good day! Your child [Student Name] visited Four Seasons School Clinic on [Date]. 
Reason: [Complaint]. For more details, please contact the clinic.
```

### 3. **Admin Dashboard - Emergency Notifications**
**File**: `frontend/src/app/features/dashboard/admin/admin-dashboard.component.ts`

#### Changes:
- ✅ Added "SMS Parent" button to each emergency notification
- ✅ Button appears alongside "View" button in emergency alerts
- ✅ Green styling to distinguish from other actions
- ✅ Icon: 📱 message icon

#### Admin Actions:
1. **View Emergency Alerts**: Red banner at top of dashboard shows all emergency visits
2. **Send SMS**: Click "SMS Parent" button to manually send SMS to parent
3. **View Details**: Click "View" to see full emergency details
4. **Mark as Read**: Dismiss individual or all emergency notifications

### 4. **New API Endpoint - Send Parent SMS**
**File**: `backend/api/admin/send-parent-sms.php`

#### Functionality:
- ✅ Admin-only endpoint (requires Admin role)
- ✅ Accepts `visit_id` parameter
- ✅ Retrieves student and parent information
- ✅ Generates appropriate SMS message based on visit type
- ✅ Logs SMS in notifications table
- ✅ Returns SMS details for confirmation

#### Request:
```json
POST /backend/api/admin/send-parent-sms.php
{
  "visit_id": 123
}
```

#### Response:
```json
{
  "success": true,
  "message": "SMS notification sent to parent",
  "phone": "+639123456789",
  "sms_message": "URGENT: Your child..."
}
```

### 5. **Admin Service Update**
**File**: `frontend/src/app/core/services/admin.service.ts`

#### New Method:
```typescript
sendParentSMS(visitId: number): Observable<any> {
  return this.http.post<any>(`${environment.apiUrl}/admin/send-parent-sms.php`, {
    visit_id: visitId
  });
}
```

## Workflow Summary

### Emergency Visit Flow:
1. **Clinic Staff** scans student QR or searches for student
2. **Clinic Staff** selects "Emergency" as visit type
   - ✅ "Notify Parent" checkbox auto-checks and disables
   - ✅ Emergency notice appears
3. **Clinic Staff** fills in diagnosis and vitals
4. **Clinic Staff** submits the visit
5. **Backend** automatically:
   - ✅ Notifies all admins via email
   - ✅ Creates urgent notification in database
   - ✅ Queues SMS to parent (if phone number exists)
6. **Admin** sees emergency alert on dashboard
7. **Admin** can:
   - ✅ Click "SMS Parent" to send/resend SMS
   - ✅ View full emergency details
   - ✅ Mark notification as read

### Routine Visit Flow:
1. **Clinic Staff** selects "Routine" as visit type
2. **Clinic Staff** can optionally check "Notify Parent" checkbox
3. **Backend** notifies adviser (not admin)
4. **SMS** is sent only if checkbox was manually checked

## Database Tables Used

### `medical_visits`
- Stores visit information
- `visit_type` ENUM: 'Routine', 'Emergency', 'Follow-up', 'Referral'
- `status` ENUM: 'Open', 'Closed', 'Referred'

### `notifications`
- Stores all notifications (email, SMS, system)
- `channel`: 'Email', 'SMS', 'System'
- `priority`: 'normal', 'urgent'
- `status`: 'Pending', 'Sent', 'Failed'

### `students`
- Contains student information
- `emergency_contact`: Phone number field

### `parents`
- Contains parent information
- `phone`: Parent phone number

## SMS Gateway Integration (TODO)

The system is ready for SMS gateway integration. To connect to an actual SMS provider:

### Example: Semaphore API Integration
```php
// In backend/api/admin/send-parent-sms.php
$apiKey = 'YOUR_SEMAPHORE_API_KEY';
$apiUrl = 'https://api.semaphore.co/api/v4/messages';
$postData = [
    'apikey' => $apiKey,
    'number' => $parentPhone,
    'message' => $smsMessage,
    'sendername' => 'FourSeasons'
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
```

### Other SMS Providers:
- **Globe Labs** (Philippines)
- **Twilio** (International)
- **Nexmo/Vonage** (International)
- **Plivo** (International)

## Testing Checklist

### Frontend Testing:
- [ ] Visit form loads correctly
- [ ] Selecting "Emergency" auto-checks SMS notification
- [ ] Emergency checkbox is disabled (cannot uncheck)
- [ ] Badge appears for emergency visits
- [ ] Emergency notice displays correctly
- [ ] Selecting "Routine" allows manual checkbox control
- [ ] Parent phone number displays when available
- [ ] Warning shows when no phone number exists

### Backend Testing:
- [ ] Emergency visits create admin notifications
- [ ] SMS is logged in notifications table
- [ ] Parent phone number is retrieved correctly
- [ ] SMS message format is correct
- [ ] Admin can send SMS via API endpoint
- [ ] Only admins can access SMS endpoint

### Admin Dashboard Testing:
- [ ] Emergency notifications appear in red banner
- [ ] "SMS Parent" button is visible
- [ ] Clicking SMS button sends notification
- [ ] Success message shows phone and SMS text
- [ ] Error handling works for missing phone numbers
- [ ] Notifications can be marked as read

## Security Considerations

1. ✅ **Role-based Access**: Only admins can manually send SMS
2. ✅ **Authentication**: All endpoints require valid JWT token
3. ✅ **Data Validation**: Visit ID and phone numbers are validated
4. ✅ **SQL Injection Prevention**: Prepared statements used throughout
5. ✅ **Rate Limiting**: Consider adding rate limits for SMS sending (TODO)
6. ✅ **Phone Number Privacy**: Phone numbers only shown to authorized users

## Future Enhancements

1. **SMS Delivery Status**: Track if SMS was successfully delivered
2. **SMS Templates**: Allow admins to customize SMS messages
3. **Bulk SMS**: Send SMS to multiple parents at once
4. **SMS History**: View all sent SMS messages
5. **SMS Cost Tracking**: Monitor SMS usage and costs
6. **Two-way SMS**: Allow parents to reply to SMS
7. **SMS Scheduling**: Schedule SMS for later delivery
8. **Multi-language SMS**: Support for different languages

## Files Modified

### Frontend:
1. `frontend/src/app/features/dashboard/staff/visits/visit-form.component.ts`
2. `frontend/src/app/features/dashboard/admin/admin-dashboard.component.ts`
3. `frontend/src/app/core/services/admin.service.ts`

### Backend:
1. `backend/api/admin/send-parent-sms.php` (NEW)
2. `backend/api/save-medical-visit.php` (Already had emergency logic)

## Documentation:
1. `EMERGENCY_SMS_NOTIFICATION_FEATURE.md` (THIS FILE)

---

**Implementation Date**: February 2, 2026
**Status**: ✅ Complete and Ready for Testing
**Next Steps**: Test the feature and integrate with actual SMS gateway
