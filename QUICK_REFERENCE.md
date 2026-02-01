# Quick Reference - Student Account System

## 🎯 System Status: ✅ FULLY OPERATIONAL

## 📋 Test Accounts Created

### Student Account 1
```
Username: 136883100330
Password: $yCsl4lh
Email: genandoyhl@gmail.com
Name: Hannah Lorainne Genandoy
```

### Student Account 2
```
Username: 136883100331
Password: 5I$T6ssM
Email: hann@gmail.com
Name: Wallance Delgado
```

### Adviser Account
```
Username: 00001
Password: eY7#wdpT
Email: galeg@gmail.com
Name: Gale Gregory
```

## 🔐 Login Instructions

1. Go to: http://localhost:4200/login
2. Enter username and password from above
3. You will be forced to change password on first login
4. After password change, you can access the dashboard

## 📧 Check Emails

All account creation emails are in **Mailtrap** (not real Gmail):
- URL: https://mailtrap.io/inboxes
- Login with your Mailtrap credentials
- Look for emails with subject: "Your PDMHS Medical System Account"

## ✅ What's Working

- ✅ Admin creates user accounts
- ✅ Email notifications sent automatically
- ✅ QR codes generated for students
- ✅ Passwords match (database = email)
- ✅ Forced password change on first login
- ✅ Student profile editing
- ✅ Role-based access control

## 🔧 Quick Commands

### Check system status:
```bash
php verify-system-status.php
```

### Check specific user:
```bash
php check-latest-user.php
```

### Resend email (if needed):
```bash
php resend-email.php
```

## 📁 Important Files

- **Email Config**: `backend/config/email.php`
- **Create User API**: `backend/api/admin/create-user.php`
- **Email Service**: `backend/services/EmailService.php`
- **Email Logs**: Check `email_logs` table in database

## 🐛 Troubleshooting

### Email not sending?
1. Check `backend/config/email.php` - should use Mailtrap config
2. Check error logs: `C:\xampp\apache\logs\error.log`
3. Run: `php backend/api/admin/test-email.php`

### Password not working?
1. Check database: `SELECT temp_password FROM users WHERE username = 'xxx'`
2. Use exact password from email (case-sensitive)
3. Check if password was already changed

### QR code not generated?
1. Check `qr_codes` table: `SELECT * FROM qr_codes WHERE student_id = xxx`
2. QR codes only generated for student accounts (not advisers/staff)

## 📝 Notes

- **Mailtrap** is for testing only - emails don't go to real inboxes
- For production, switch to Gmail or professional email service
- All passwords are temporary and must be changed on first login
- QR codes are unique per student and never expire

## 🚀 Production Checklist

When ready to go live:
- [ ] Update email config to use real SMTP (Gmail/SendGrid)
- [ ] Test with real email addresses
- [ ] Verify email deliverability
- [ ] Update login URL in email templates
- [ ] Set up email monitoring/logging
- [ ] Configure backup email service

---

**Last Updated**: February 2, 2026
**Status**: All systems operational ✅
