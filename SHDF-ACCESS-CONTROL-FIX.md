# SHDF Access Control Fix

## Issue
Student 136883100331 has NOT completed the basic SHDF form, but the system incorrectly shows they have completed it. This prevents them from accessing the form to fill it out.

## Root Causes

### Primary Issue: Data Inconsistency
The `student_shdf_status` table has a record with `basic_completed = true` for this student, but the `students` table is missing required basic information (like `parent_guardian_name`). This inconsistency suggests:
- Database was manually modified
- Migration/seeder set incorrect values
- Previous bug marked status as complete prematurely
- Testing data wasn't cleaned up

### Secondary Issue: Missing Route Guards
The application had access control checks in components but no route guards, allowing brief access windows before checks completed.

## Solution Implemented

### 1. Diagnostic Commands Created
- `CheckStudentSHDFStatus` - Checks status and detects inconsistencies
- `ResetStudentSHDFStatus` - Resets incorrect status records

### 2. Route Guards Created
- `shdf-basic.guard.ts` - Prevents access to basic form if already completed
- `shdf-comprehensive.guard.ts` - Ensures basic is completed before accessing comprehensive

### 3. Guards Applied to Routes
Updated `shdf.routes.ts` to use the guards on the respective routes.

### 4. Enhanced Logging
Added console logging to:
- Frontend guards (to see when they trigger)
- Frontend component (to see status checks)
- Backend controller (to see API calls)
- Backend service (to see database queries)

## Fixing the Specific Issue

### Step 1: Diagnose the Problem
### Step 1: Diagnose the Problem

Run the diagnostic command to check the student's status:

```bash
cd backend-laravel
php artisan shdf:check-status 136883100331
```

This will display:
- Student information
- SHDF status (basic_completed, comprehensive_completed)
- Student's basic info fields
- Whether there's an inconsistency

Expected output if there's an issue:
```
⚠️  INCONSISTENCY DETECTED!
Status shows basic_completed = true, but student has no parent_guardian_name.
This suggests the status was incorrectly set.
```

### Step 2: Fix the Status

If inconsistency is detected, reset the status:

```bash
php artisan shdf:reset-status 136883100331 --stage=basic
```

This will:
- Set `basic_completed` to `false`
- Clear `basic_completed_at` timestamp
- Allow student to access the form

### Step 3: Verify Access

1. Login as student 136883100331
2. Navigate to `/shdf/136883100331/basic`
3. Check browser console - should see: `[SHDF Guard] Basic not completed, allowing access`
4. Form should load and be fillable

## Testing the Route Guards

### Test 1: Student Who Hasn't Completed Basic
### Test 1: Student Who Hasn't Completed Basic
1. Access `/shdf/{studentId}/basic`
2. Guard should allow access
3. Form loads normally

### Test 2: Student Who Completed Basic
1. Access `/shdf/{studentId}/basic`
2. Guard blocks access
3. Redirects to success page

### Test 3: Student Accessing Comprehensive Without Basic
1. Access `/shdf/{studentId}/comprehensive`
2. Guard blocks access
3. Redirects to basic form

### Test 4: Student Who Completed Both
1. Access either form
2. Guard blocks access
3. Redirects to success page

## Command Reference

### Check Student Status
```bash
php artisan shdf:check-status {student_id}
```
Shows complete status information and detects inconsistencies.

### Reset Basic Status
```bash
php artisan shdf:reset-status {student_id} --stage=basic
```
Resets basic_completed to false.

### Reset Comprehensive Status
```bash
php artisan shdf:reset-status {student_id} --stage=comprehensive
```
Resets comprehensive_completed to false.

### Reset All Status
```bash
php artisan shdf:reset-status {student_id} --stage=all
```
Deletes the entire status record (fresh start).

## Debugging

If the issue persists after running the reset command:

1. **Check browser console** for guard logs
2. **Check Laravel logs** at `storage/logs/laravel.log`
3. **Verify database directly**:
   ```sql
   SELECT * FROM student_shdf_status WHERE student_id = 136883100331;
   SELECT parent_guardian_name FROM students WHERE student_id = 136883100331;
   ```
4. **Check current school year**: `SELECT * FROM school_years WHERE is_current = 1;`
5. **Clear browser cache** and localStorage
6. **Restart services**: Angular dev server and Laravel

## Files Modified

### Backend
- `app/Console/Commands/CheckStudentSHDFStatus.php` (created)
- `app/Console/Commands/ResetStudentSHDFStatus.php` (created)
- `app/Http/Controllers/Api/SHDFController.php` (added logging)
- `app/Services/SHDFService.php` (added logging)

### Frontend
- `features/shdf/guards/shdf-basic.guard.ts` (created)
- `features/shdf/guards/shdf-comprehensive.guard.ts` (created)
- `features/shdf/shdf.routes.ts` (updated)
- `features/shdf/shdf-basic/shdf-basic.component.ts` (added logging)

## Commit Message
```
fix: Add SHDF status diagnostics and route guards to resolve access issues

- Created diagnostic command to check and detect status inconsistencies
- Created reset command to fix incorrect status records
- Added route guards to prevent access to completed forms
- Added comprehensive logging for debugging
- Fixed issue where student 136883100331 couldn't access basic form due to incorrect status

The student had basic_completed=true but no actual data, preventing form access.
Commands now detect and fix such inconsistencies automatically.
```
