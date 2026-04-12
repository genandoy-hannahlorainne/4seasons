# SHDF Comprehensive Form Submission Fix

## Issue
The comprehensive SHDF form fails to submit with a 403 error: "This action is unauthorized."

## Root Cause
The `SHDFFormRequest` has an `authorize()` method that checks if the logged-in user can submit the form for the student. This check fails when:

1. The `student.user_id` doesn't match the logged-in `user.user_id`
2. The student has no `user_id` assigned
3. The user's role is not 'Student'
4. The user account is inactive

## Diagnosis

### Step 1: Check Student-User Mapping

Run this command to check if the student is properly linked to a user account:

```bash
cd backend-laravel
php artisan student:check-user-mapping {student_id}
```

This will show:
- Student information
- User ID assigned to the student
- User account details
- Whether there's a mismatch

### Step 2: Check Laravel Logs

After attempting to submit the form, check the logs:

```bash
tail -f backend-laravel/storage/logs/laravel.log
```

Look for:
```
[SHDF Form Request] Authorization check
```

This will show:
- student_id
- student_user_id (from students table)
- logged_in_user_id (from auth)
- user_role
- can_submit (true/false)

## Solutions

### Solution 1: Fix Student-User Mapping

If the student has no `user_id` or wrong `user_id`:

```sql
-- Find the correct user_id
SELECT user_id, email, role_id FROM users WHERE email LIKE '%{student_id}%';

-- Update the student record
UPDATE students SET user_id = {correct_user_id} WHERE student_id = {student_id};
```

Or use the command:
```bash
php artisan student:check-user-mapping {student_id}
# Follow the prompts to link the user
```

### Solution 2: Verify User Role

Make sure the user has the 'Student' role:

```sql
SELECT u.user_id, u.email, r.role_name 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
WHERE u.user_id = {user_id};

-- If role is wrong, find the correct role_id
SELECT id, role_name FROM roles WHERE role_name = 'Student';

-- Update the user's role
UPDATE users SET role_id = {student_role_id} WHERE user_id = {user_id};
```

### Solution 3: Activate User Account

If the user account is inactive:

```sql
UPDATE users SET is_active = 1 WHERE user_id = {user_id};
```

## Testing After Fix

1. Login as the student
2. Navigate to the comprehensive SHDF form
3. Fill out all required fields
4. Upload signature
5. Click "Submit Health Form"
6. Should see success message and redirect to success page

## Prevention

To prevent this issue:
1. Always create user accounts before creating student records
2. Ensure `student.user_id` is set when creating students
3. Verify role assignments are correct
4. Keep user accounts active

## Files Modified

- `app/Http/Requests/SHDFFormRequest.php` - Added logging to authorize method
- `app/Console/Commands/CheckStudentUserMapping.php` - Created diagnostic command

## Common Scenarios

### Scenario 1: Student has no user_id
**Symptom:** Authorization fails, student can't submit
**Fix:** Link student to user account using the command or SQL

### Scenario 2: Wrong user_id
**Symptom:** Student A can submit for Student B
**Fix:** Correct the user_id mapping in students table

### Scenario 3: Wrong role
**Symptom:** Authorization fails even with correct user_id
**Fix:** Update user's role_id to Student role

### Scenario 4: Inactive account
**Symptom:** Can't login or authorization fails
**Fix:** Set is_active = 1 in users table

## Quick Fix for Testing

If you need to temporarily bypass authorization for testing:

```php
// In SHDFFormRequest.php
public function authorize(): bool
{
    return true; // TEMPORARY - REMOVE AFTER TESTING
}
```

**WARNING:** Remove this after testing! It allows anyone to submit forms for any student.
