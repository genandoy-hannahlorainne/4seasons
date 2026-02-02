# Emergency SMS Notification - User Guide

## For Clinic Staff

### Creating an Emergency Visit

1. **Navigate to**: Dashboard → Visits → New Visit

2. **Select Student**: 
   - Scan QR code, OR
   - Search by student number/name

3. **Choose Visit Type**:
   - Select "Emergency" from dropdown
   - ✅ **"Notify Parent via SMS" checkbox will automatically check**
   - ✅ **Checkbox becomes disabled (you cannot uncheck it)**
   - ✅ **Red badge appears: "Auto-enabled for Emergency"**
   - ✅ **Emergency notice shows: "🚨 Emergency visits automatically notify admin and parents"**

4. **Fill in Details**:
   - Date & Time (auto-filled with current time)
   - Vitals (Temperature, Blood Pressure, Pulse)
   - Diagnosis Category
   - Status

5. **Submit**:
   - Click "Save Visit"
   - System automatically:
     - Notifies all admins
     - Sends SMS to parent (if phone number exists)
     - Creates emergency alert

### Creating a Routine Visit

1. **Select "Routine"** as visit type
2. **Manually check** "Notify Parent via SMS" if needed
3. System will:
   - Notify adviser (not admin)
   - Send SMS only if you checked the box

---

## For Admin

### Viewing Emergency Alerts

1. **Login** to admin dashboard
2. **Red banner** appears at top if there are emergency visits
3. Banner shows:
   - Number of emergency alerts
   - Student name and number
   - Time of visit
   - Complaint/reason

### Sending SMS to Parent

1. **Locate** the emergency notification in the red banner
2. **Click** "📱 SMS Parent" button (green button)
3. **Confirm** the action in the popup
4. **Success message** shows:
   - Phone number SMS was sent to
   - Full SMS message text

### SMS Message Examples

**Emergency SMS:**
```
URGENT: Your child John Doe had an emergency clinic 
visit on Feb 2, 2026 3:45 PM. Reason: High fever and 
difficulty breathing. Please contact Four Seasons 
School Clinic immediately at [CLINIC_PHONE].
```

**Routine SMS:**
```
Good day! Your child Jane Smith visited Four Seasons 
School Clinic on Feb 2, 2026 10:30 AM. Reason: 
Headache. For more details, please contact the clinic.
```

### Managing Notifications

**View Details:**
- Click "View" button to see full emergency information
- Shows student details, complaint, vitals, staff info

**Mark as Read:**
- Click "Mark All Read" to dismiss all emergency alerts
- Or confirm when viewing individual notification

**Resend SMS:**
- If parent didn't receive SMS, click "SMS Parent" again
- System will resend the notification

---

## Visual Guide

### Clinic Staff - Emergency Visit Form

```
┌─────────────────────────────────────────────────┐
│ Visit Details                                   │
├─────────────────────────────────────────────────┤
│ Date & Time: [Feb 2, 2026 3:45 PM]            │
│                                                 │
│ Visit Type: [Emergency ▼]                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Status & Notification                           │
├─────────────────────────────────────────────────┤
│ Visit Status: [Pending ▼]                      │
│                                                 │
│ ☑ Notify Parent/Guardian via SMS               │
│   [Auto-enabled for Emergency]                 │
│                                                 │
│ 📱 SMS will be sent to: +639123456789          │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 🚨 Emergency visits automatically       │   │
│ │    notify admin and parents             │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Admin Dashboard - Emergency Banner

```
┌─────────────────────────────────────────────────────────┐
│ 🚨 2 Emergency Alerts          [Mark All Read]          │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ EMERGENCY ALERT: Student John Doe has been         │ │
│ │ flagged for emergency medical attention.           │ │
│ │                                                     │ │
│ │ John Doe (2024-001) | 15m ago                      │ │
│ │                                                     │ │
│ │                    [📱 SMS Parent]  [View]         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ EMERGENCY ALERT: Student Jane Smith has been       │ │
│ │ flagged for emergency medical attention.           │ │
│ │                                                     │ │
│ │ Jane Smith (2024-002) | 1h ago                     │ │
│ │                                                     │ │
│ │                    [📱 SMS Parent]  [View]         │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "No parent phone number on file"

**Problem**: Student doesn't have parent phone number in system

**Solution**:
1. Go to Student Management
2. Find the student
3. Edit student profile
4. Add parent phone number in emergency contact field
5. Try sending SMS again

### SMS not received by parent

**Possible Causes**:
1. Wrong phone number format
2. SMS gateway not configured
3. Network issues
4. Parent's phone is off

**Solutions**:
1. Verify phone number is correct (+639XXXXXXXXX format)
2. Contact system administrator to check SMS gateway
3. Try resending SMS
4. Call parent directly as backup

### Emergency notification not appearing

**Check**:
1. Visit type is set to "Emergency"
2. Visit was successfully saved
3. Refresh admin dashboard
4. Check browser console for errors

---

## Best Practices

### For Clinic Staff:
1. ✅ Always verify student identity before creating visit
2. ✅ Use "Emergency" only for actual emergencies
3. ✅ Fill in all required fields accurately
4. ✅ Double-check parent phone number if shown
5. ✅ Document vitals and symptoms clearly

### For Admin:
1. ✅ Check emergency alerts regularly
2. ✅ Respond to emergencies within 5 minutes
3. ✅ Verify SMS was sent successfully
4. ✅ Follow up with parent if needed
5. ✅ Mark notifications as read after handling
6. ✅ Keep emergency contact numbers updated

### For Parents:
1. ✅ Keep phone number updated with school
2. ✅ Respond to emergency SMS immediately
3. ✅ Save clinic phone number in contacts
4. ✅ Inform school of any phone number changes

---

## Emergency Response Protocol

### Level 1 - Minor Emergency
- **Examples**: Minor cuts, mild fever, headache
- **Action**: SMS sent to parent, adviser notified
- **Response Time**: Within 30 minutes

### Level 2 - Moderate Emergency
- **Examples**: High fever, severe pain, allergic reaction
- **Action**: SMS sent to parent, admin notified, call parent
- **Response Time**: Within 10 minutes

### Level 3 - Critical Emergency
- **Examples**: Difficulty breathing, unconscious, severe injury
- **Action**: Call 911, SMS parent, admin notified, call parent
- **Response Time**: Immediate

---

## Contact Information

**Clinic Phone**: [INSERT CLINIC PHONE]
**Admin Email**: [INSERT ADMIN EMAIL]
**Emergency Hotline**: [INSERT EMERGENCY NUMBER]

---

**Last Updated**: February 2, 2026
**Version**: 1.0
