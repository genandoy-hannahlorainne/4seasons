# Production Deployment Checklist

## CRITICAL: Fix Student-User Mappings Before Deployment

### Why This Is Important
The SHDF comprehensive form requires proper authorization. Students must be correctly linked to their user accounts, otherwise they will get 403 Unauthorized errors when submitting forms.

## Pre-Deployment Steps

### Step 1: Check Current Mappings (Dry Run)
```bash
cd backend-laravel
php artisan student:fix-all-user-mappings --dry-run
```

This will show:
- How many students are already correctly mapped
- How many can be automatically fixed
- How many have no matching user accounts

### Step 2: Fix Mappings Automatically
```bash
php artisan student:fix-all-user-mappings
```

This will:
- Link students to their user accounts based on email patterns
- Update the `user_id` field in the students table
- Show a summary of what was fixed

### Step 3: Handle Students Without User Accounts

If some students have no user accounts, you need to create them:

```sql
-- Check which students have no user_id
SELECT student_id, first_name, last_name, email 
FROM students 
WHERE user_id IS NULL;

-- For each student, create a user account or link to existing one
-- Example:
INSERT INTO users (email, password, role_id, is_active, created_at, updated_at)
VALUES (
    '{student_id}@school.edu',
    '$2y$10$...',  -- hashed password
    (SELECT id FROM roles WHERE role_name = 'Student'),
    1,
    NOW(),
    NOW()
);

-- Then link the student
UPDATE students 
SET user_id = LAST_INSERT_ID() 
WHERE student_id = {student_id};
```

### Step 4: Verify Authorization Is Working

Test with a real student account:
1. Login as a student
2. Navigate to comprehensive SHDF form
3. Fill and submit
4. Should succeed without 403 errors

Check logs:
```bash
tail -f storage/logs/laravel.log | grep "SHDF Form Request"
```

Should see:
```
[SHDF Form Request] Authorization check
  student_id: 123
  student_user_id: 456
  logged_in_user_id: 456
  user_role: Student
  can_submit: true
```

## Deployment Steps

### 1. Backend Deployment

```bash
# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations (if any new ones)
php artisan migrate --force

# Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Fix student-user mappings
php artisan student:fix-all-user-mappings

# Restart services
sudo systemctl restart php-fpm
sudo systemctl restart nginx
```

### 2. Frontend Deployment

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build for production
npm run build --prod

# Deploy build files to web server
# (copy dist/ contents to your web server)
```

### 3. Post-Deployment Verification

Test these scenarios:

#### Test 1: Student Login and Form Submission
- [ ] Student can login
- [ ] Student can access basic SHDF form
- [ ] Student can submit basic form
- [ ] Student can access comprehensive form
- [ ] Student can submit comprehensive form
- [ ] No 403 errors

#### Test 2: Authorization Checks
- [ ] Student A cannot submit for Student B
- [ ] Clinic staff can view all forms
- [ ] Adviser can view their students' forms

#### Test 3: Route Guards
- [ ] Completed basic form redirects to success
- [ ] Comprehensive requires basic completion
- [ ] Direct URL access is properly controlled

## Rollback Plan

If issues occur in production:

### Quick Fix (Temporary)
If authorization is blocking legitimate submissions, you can temporarily bypass it:

```php
// In SHDFFormRequest.php - EMERGENCY ONLY
public function authorize(): bool
{
    return true; // TEMPORARY - FIX ASAP
}
```

**WARNING:** This allows anyone to submit for anyone. Use only as emergency measure and fix immediately.

### Proper Rollback
```bash
# Revert to previous version
git revert HEAD
git push origin main

# Redeploy
# ... follow deployment steps above
```

## Monitoring

After deployment, monitor:

1. **Laravel Logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```
   Look for authorization errors

2. **Web Server Logs**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Database**
   ```sql
   -- Check for students without user_id
   SELECT COUNT(*) FROM students WHERE user_id IS NULL;
   
   -- Check for orphaned mappings
   SELECT s.student_id, s.user_id 
   FROM students s 
   LEFT JOIN users u ON s.user_id = u.user_id 
   WHERE s.user_id IS NOT NULL AND u.user_id IS NULL;
   ```

## Common Issues and Solutions

### Issue: 403 Unauthorized on Form Submit
**Cause:** Student's user_id doesn't match logged-in user
**Fix:** 
```bash
php artisan student:check-user-mapping {student_id}
php artisan student:fix-all-user-mappings
```

### Issue: Student Can't Login
**Cause:** No user account exists
**Fix:** Create user account and link to student

### Issue: Wrong Student Can Submit
**Cause:** Incorrect user_id mapping
**Fix:** Correct the mapping in database

## Security Notes

1. **Never deploy with authorization bypassed**
2. **Always verify student-user mappings before deployment**
3. **Test authorization in staging environment first**
4. **Monitor logs for unauthorized access attempts**
5. **Keep user accounts and student records in sync**

## Files Modified in This Update

- `app/Http/Requests/SHDFFormRequest.php` - Authorization with logging
- `app/Console/Commands/CheckStudentUserMapping.php` - Diagnostic tool
- `app/Console/Commands/FixAllStudentUserMappings.php` - Bulk fix tool
- `frontend/src/app/features/shdf/shdf-form/shdf-form.component.ts` - Use correct endpoint
- Route guards for access control

## Support Commands

```bash
# Check specific student
php artisan student:check-user-mapping {student_id}

# Fix all mappings (dry run first)
php artisan student:fix-all-user-mappings --dry-run
php artisan student:fix-all-user-mappings

# Check SHDF status
php artisan shdf:check-status {student_id}

# Reset SHDF status if needed
php artisan shdf:reset-status {student_id} --stage=basic
```