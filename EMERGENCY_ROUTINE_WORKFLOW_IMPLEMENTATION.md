# Emergency/Routine Visit Workflow Implementation

## Overview
Successfully implemented differentiated workflows for Emergency and Routine medical visits as requested. The system now automatically triggers different actions based on the visit type selected by clinic staff.

## Workflow Implementation

### 🚨 Emergency Visit Workflow
When clinic staff selects "Emergency" as visit type:

1. **Automatic Flagging**: Visit is flagged as "Emergency" in the database
2. **Admin Notification**: All admins receive immediate system notifications with urgent priority
3. **Email Alerts**: Emergency email notifications sent to all admin users
4. **Forced Parent Notification**: Parent/guardian SMS notification is automatically enabled
5. **Enhanced Logging**: Emergency visits are logged with special priority markers
6. **Real-time Dashboard**: Emergency alerts appear prominently on admin dashboard

**Admin Notification Message Format:**
```
EMERGENCY ALERT: Student [Name] ([Student Number]) from Grade [X]-[Section] has been flagged for emergency medical attention. Complaint: [Chief Complaint]
```

### 📋 Routine Visit Workflow  
When clinic staff selects "Routine" as visit type:

1. **Standard Flagging**: Visit is flagged as "Routine" in the database
2. **Adviser Notification**: Student's class adviser receives a system notification
3. **Email Notification**: Routine email notification sent to class adviser
4. **Optional Parent Notification**: Parent notification remains optional (checkbox)
5. **Standard Logging**: Normal priority logging

**Adviser Notification Message Format:**
```
Student [Name] ([Student Number]) visited the clinic for routine care. Complaint: [Chief Complaint]
```

## Technical Implementation

### Frontend Changes
- **Visit Form**: Updated dropdown to only show "Routine" and "Emergency" options
- **Admin Dashboard**: Added emergency notifications banner with real-time alerts
- **Notification Management**: Added mark as read and delete functionality
- **Notification System**: Enhanced to handle system notifications with priority levels

### Backend Changes
- **API Enhancement**: `save-medical-visit.php` now includes workflow logic
- **Email Service**: Complete email notification system with templates
- **Database Migration**: Added `user_id` and `priority` columns to notifications table
- **New APIs**: 
  - `get-admin-notifications.php` - Retrieves admin notifications
  - `manage-notifications.php` - Mark as read/delete notifications
  - Enhanced `get-adviser-notifications.php` - Includes system notifications

### Database Schema Updates
```sql
-- Enhanced notifications table
ALTER TABLE `notifications` 
ADD COLUMN `user_id` int(10) UNSIGNED DEFAULT NULL,
ADD COLUMN `priority` enum('normal','urgent') DEFAULT 'normal',
ADD COLUMN `read_at` timestamp NULL DEFAULT NULL,
ADD KEY `fk_notif_user` (`user_id`);

-- Updated channel enum to include System notifications
ALTER TABLE `notifications` 
MODIFY COLUMN `channel` enum('SMS','Email','System') DEFAULT 'SMS';

-- Email logs table for tracking
CREATE TABLE `email_logs` (
  `log_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `recipient` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `priority` enum('high','normal','low') DEFAULT 'normal',
  `status` enum('sending','sent','failed') DEFAULT 'sending',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sent_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`log_id`)
);
```

## Files Modified/Created

### Backend Files
- `backend/api/save-medical-visit.php` - Added workflow logic and email integration
- `backend/api/get-admin-notifications.php` - New admin notifications API
- `backend/api/manage-notifications.php` - New notification management API
- `backend/api/get-adviser-notifications.php` - Enhanced with system notifications
- `backend/services/EmailService.php` - Complete email service with templates
- `backend/config/email.php` - Email configuration
- `backend/test-emergency-routine-workflow.php` - Comprehensive testing script
- `database/notifications-enhancement.sql` - Database migration script
- `database/email-logs-table.sql` - Email logs table creation

### Frontend Files
- `frontend/src/app/features/dashboard/staff/visits/visit-form.component.ts` - Updated visit type options
- `frontend/src/app/features/dashboard/admin/admin-dashboard.component.ts` - Added emergency notifications with management
- `frontend/src/app/core/services/admin.service.ts` - Added notifications methods

## Key Features

### 1. Multi-Channel Notifications
- **System Notifications**: In-app notifications with priority levels
- **Email Notifications**: HTML email templates for different scenarios
- **SMS Notifications**: Parent/guardian SMS alerts (existing functionality)

### 2. Priority-Based Handling
- **Emergency Priority**: Urgent notifications with red alerts
- **Routine Priority**: Normal notifications with standard styling
- **Visual Indicators**: Different colors and animations for priority levels

### 3. Notification Management
- **Mark as Read**: Individual notification management
- **Mark All Read**: Bulk notification management
- **Delete Notifications**: Remove unwanted notifications
- **Real-time Updates**: Live notification updates

### 4. Email System Features
- **HTML Templates**: Professional email templates for each scenario
- **Fallback Templates**: Built-in templates when files don't exist
- **Email Logging**: Complete tracking of email delivery
- **Error Handling**: Graceful failure handling with logging

### 5. Comprehensive Testing
- **Database Structure Validation**: Checks for required tables and columns
- **User Data Validation**: Ensures required user types exist
- **Email Service Testing**: Tests email configuration
- **Workflow Simulation**: Simulates both emergency and routine workflows
- **API Endpoint Validation**: Checks for required API files

## Usage Instructions

### For Clinic Staff
1. Select student using QR scanner or search
2. Choose visit type: "Routine" or "Emergency"
3. Fill in medical details
4. Submit form - workflow triggers automatically

### For Admins
1. Emergency notifications appear as red banner on dashboard
2. Click "View" to see emergency details and mark as read
3. Use "Mark All Read" to clear all emergency notifications
4. Receive email notifications for all emergency cases

### For Advisers
1. System notifications appear in notifications panel
2. Routine visit notifications for their students
3. Email notifications for student visits
4. Integrated with existing notification system

## Configuration

### Email Setup
1. Update `backend/config/email.php` with your SMTP settings
2. Configure sender email and credentials
3. Test email configuration using the test script

### Database Migration
Run the migration scripts to enable full functionality:
```bash
mysql -u username -p database_name < database/notifications-enhancement.sql
mysql -u username -p database_name < database/email-logs-table.sql
```

## Testing

### Automated Testing
Run the comprehensive test script:
```bash
php backend/test-emergency-routine-workflow.php
```

### Manual Testing
1. Create test emergency visit - verify admin gets notification and email
2. Create test routine visit - verify adviser gets notification and email
3. Test notification management (mark as read, delete)
4. Verify email delivery and logging
5. Test with both enhanced and legacy database structures

## Monitoring and Logs

### Email Logs
- All email attempts logged in `email_logs` table
- Track delivery status and errors
- Monitor email performance

### System Logs
- PHP error logs for debugging
- Activity logs for audit trail
- Notification delivery tracking

## Security Considerations

### Authentication
- All APIs require proper authentication
- Role-based access control enforced
- User can only manage their own notifications

### Data Validation
- Input sanitization and validation
- SQL injection prevention
- XSS protection in email templates

## Performance Optimizations

### Database Indexing
- Indexed notification queries for performance
- Efficient user lookup queries
- Optimized email log queries

### Caching
- Notification count caching
- User data caching where appropriate
- Email template caching

## Future Enhancements

### Planned Features
- Mobile push notifications for critical cases
- Integration with hospital referral systems
- Advanced reporting for emergency patterns
- Automated escalation for unread emergency notifications
- SMS integration for emergency alerts
- Real-time WebSocket notifications

### Scalability Improvements
- Queue-based email sending for high volume
- Redis caching for notification counts
- Database partitioning for large datasets

---

**Status**: ✅ Complete and Production Ready
**Version**: 2.0
**Last Updated**: January 15, 2026

## Changelog

### Version 2.0 (Current)
- ✅ Added email notification system
- ✅ Enhanced notification management
- ✅ Comprehensive testing framework
- ✅ Email logging and tracking
- ✅ Professional email templates
- ✅ Real-time dashboard updates

### Version 1.0
- ✅ Basic Emergency/Routine workflow
- ✅ System notifications
- ✅ Database enhancements
- ✅ Frontend integration