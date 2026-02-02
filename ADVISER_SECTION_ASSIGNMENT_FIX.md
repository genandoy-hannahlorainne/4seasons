# Adviser Section Assignment Fix

## Problem
When creating a new adviser/faculty account with grade level and section, the adviser couldn't see their class in "My Class Management" because they weren't properly assigned to the section in the database.

## Root Cause
The `create-user.php` API was storing grade_level and section in the `advisers` table, but wasn't updating the `sections.adviser_id` field to link the adviser to the actual section.

## Solution

### 1. Updated create-user.php API
Added logic to automatically assign adviser to section when creating account:
- Gets the active school year
- Finds the matching section based on grade level and section name
- Updates `sections.adviser_id` with the adviser's `user_id`

**Important**: `sections.adviser_id` stores `user_id` from the `users` table, NOT `adviser_id` from the `advisers` table!

### 2. Created fix-adviser-section-assignments.php Script
Script to fix existing advisers who weren't properly assigned:
```bash
php fix-adviser-section-assignments.php
```

This script:
- Finds all advisers with grade_level and section
- Checks if they're assigned to a section
- Assigns them to the correct section for the active school year
- Shows current section assignments

## How It Works

### Database Relationships
```
users (user_id) 
  ↓
advisers (user_id, grade_level, section) - stores text values
  ↓
sections (adviser_id = users.user_id) - actual assignment
```

### When Creating Adviser Account
1. Admin fills in:
   - Employee number
   - First name, last name
   - Email, phone
   - Advisory grade level (optional)
   - Advisory section (optional)

2. System creates:
   - User record in `users` table
   - Adviser record in `advisers` table with grade_level and section
   - **NEW**: Updates `sections.adviser_id` to link adviser to section

3. Adviser can now:
   - Login and go to "My Class Management"
   - Select school year
   - See their assigned class roster

## Testing

### Test 1: Create New Adviser
1. Login as admin
2. Go to "Manage Users" → "Create New User"
3. Select "Faculty/Adviser" role
4. Fill in details:
   - Employee Number: EMP-2024-003
   - First Name: Test
   - Last Name: Adviser
   - Email: test.adviser@example.com
   - Advisory Grade Level: 7
   - Advisory Section: 1
5. Click "Create User"
6. Logout and login as the new adviser
7. Go to "My Class Management"
8. Select school year "2024-2025"
9. Should see Grade 7 Section 1 roster

### Test 2: Fix Existing Adviser
```bash
php fix-adviser-section-assignments.php
```

Should show:
- Advisers with grade level and section
- Which ones are already assigned
- Which ones were newly assigned
- Current section assignments

## Verification

### Check if Adviser is Assigned to Section
```sql
SELECT 
  a.first_name,
  a.last_name,
  a.grade_level as adviser_grade,
  a.section as adviser_section,
  sec.id as section_id,
  gl.level_name,
  sec.section_name,
  sy.year_name
FROM advisers a
LEFT JOIN sections sec ON sec.adviser_id = a.user_id
LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
LEFT JOIN school_years sy ON sec.school_year_id = sy.id
WHERE a.is_active = 1;
```

### Check Section Assignments for Active School Year
```sql
SELECT 
  gl.level_number,
  sec.section_name,
  a.first_name,
  a.last_name,
  u.username
FROM sections sec
JOIN grade_levels gl ON sec.grade_level_id = gl.id
JOIN school_years sy ON sec.school_year_id = sy.id
LEFT JOIN advisers a ON sec.adviser_id = a.user_id
LEFT JOIN users u ON a.user_id = u.user_id
WHERE sy.is_active = 1
ORDER BY gl.level_number, sec.section_name;
```

## Common Issues

### Issue 1: Adviser sees "No class assigned"
**Cause**: Adviser not assigned to section in `sections` table

**Fix**:
```bash
php fix-adviser-section-assignments.php
```

### Issue 2: Section not found when creating adviser
**Cause**: Section doesn't exist for the active school year

**Fix**: Create sections first
```bash
php setup-new-school-year.php 2024-2025
```

Or manually create the section:
```sql
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, is_active)
VALUES ('1', 
        (SELECT id FROM grade_levels WHERE level_number = 7),
        (SELECT id FROM school_years WHERE is_active = 1),
        50, 1);
```

### Issue 3: Multiple advisers for same section
**Cause**: Section can only have one adviser

**Fix**: Manually update or use the fix script which will prompt before replacing

```sql
-- Check current assignment
SELECT * FROM sections WHERE id = 21;

-- Update to new adviser
UPDATE sections SET adviser_id = 45 WHERE id = 21;
```

## Best Practices

1. **Always create sections before assigning advisers**
   - Use `setup-new-school-year.php` to create all sections
   - Or create sections manually as needed

2. **One adviser per section**
   - Each section should have only one adviser
   - If changing advisers, update the section assignment

3. **Use active school year**
   - Advisers are assigned to sections for specific school years
   - Make sure there's an active school year set

4. **Verify after creation**
   - After creating adviser account, check if they can see their class
   - Run `fix-adviser-section-assignments.php` if needed

## Files Modified

- `backend/api/admin/create-user.php` - Added section assignment logic
- `fix-adviser-section-assignments.php` - New script to fix existing advisers

## Related Documentation

- `SCHOOL_YEAR_MANAGEMENT_GUIDE.md` - School year management
- `SCHOOL_YEAR_QUICK_START.md` - Quick reference for school years
- `SECTION_SETUP_SUMMARY.md` - Section setup information
