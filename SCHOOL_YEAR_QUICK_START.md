# School Year Management - Quick Start Guide

## Current Status

Based on the analysis, here's the current state of your system:

- **Active School Year**: 2024-2025 (ID: 6)
- **Students**: 2 Grade 12 students in STEM 2 section
- **Adviser**: Gale Gregory assigned to Grade 12 STEM 2
- **Issue**: 1 student without school year assignment

## Quick Fix Commands

### 1. Fix Student Without School Year
```bash
echo "yes" | php fix-student-school-years.php
```

This will assign all students without a school year to the active school year (2024-2025).

### 2. Check Current Status
```bash
php fix-student-school-years.php
```

Shows:
- Active school year
- Students without school year
- Student distribution by school year
- Students by grade level
- Sections with student counts and advisers

### 3. View All Sections
```bash
php check-sections.php
```

### 4. View School Years
```bash
php check-school-years.php
```

## Common Tasks

### Task 1: Create a New School Year

**Example: Create 2026-2027**
```bash
php setup-new-school-year.php 2026-2027
```

This creates:
- New school year entry
- All sections for grades 7-12
  - Grades 7-10: Sections 1, 2, 3
  - Grades 11-12: All strand sections

**To make it active immediately:**
```bash
php setup-new-school-year.php 2026-2027 --set-active
```

### Task 2: Set Active School Year

**SQL Method:**
```sql
-- Deactivate all
UPDATE school_years SET is_active = 0;

-- Activate specific year
UPDATE school_years SET is_active = 1 WHERE year_name = '2024-2025';
```

**Or use the script:**
```bash
php check-school-years.php
```
(It will offer to set one as active if none is active)

### Task 3: Assign Adviser to Section

**Find section ID:**
```sql
SELECT sec.id, sec.section_name, gl.level_name, sy.year_name
FROM sections sec
JOIN grade_levels gl ON sec.grade_level_id = gl.id
JOIN school_years sy ON sec.school_year_id = sy.id
WHERE sy.year_name = '2024-2025'
AND gl.level_number = 7
AND sec.section_name = '1';
```

**Assign adviser:**
```sql
UPDATE sections 
SET adviser_id = 44  -- user_id of the adviser (NOT adviser_id)
WHERE id = 15;  -- section_id
```

**Important**: Use `user_id` from the `users` table, NOT `adviser_id` from the `advisers` table!

### Task 4: Create Student Account with Correct School Year

When creating a student account through the UI:
1. Admin selects grade level and section
2. System automatically assigns to active school year
3. Student is linked to the selected section

**Manual SQL (if needed):**
```sql
-- Get active school year ID
SELECT id FROM school_years WHERE is_active = 1;

-- Get section ID
SELECT id FROM sections 
WHERE grade_level_id = (SELECT id FROM grade_levels WHERE level_number = 7)
AND section_name = '1'
AND school_year_id = 6;  -- active school year ID

-- Update student
UPDATE students 
SET current_school_year_id = 6,  -- active school year
    current_section_id = 15  -- section ID
WHERE student_id = 123;
```

### Task 5: Promote Students to Next Year

**Using the UI:**
1. Login as adviser
2. Go to "My Class Management"
3. Select current school year (2024-2025)
4. Select students
5. Click "Promote Selected"
6. Choose target school year (2025-2026)
7. Choose target section
8. Confirm

**Using SQL (bulk promotion):**
```sql
-- Promote all Grade 7 Section 1 students to Grade 8 Section 1 for 2025-2026
UPDATE students s
JOIN sections sec_old ON s.current_section_id = sec_old.id
JOIN sections sec_new ON sec_new.grade_level_id = (SELECT id FROM grade_levels WHERE level_number = 8)
                      AND sec_new.section_name = '1'
                      AND sec_new.school_year_id = 7  -- 2025-2026
SET s.grade_level = 8,
    s.current_school_year_id = 7,
    s.current_section_id = sec_new.id,
    s.enrollment_status = 'promoted',
    s.promotion_date = NOW()
WHERE sec_old.grade_level_id = (SELECT id FROM grade_levels WHERE level_number = 7)
AND sec_old.section_name = '1'
AND sec_old.school_year_id = 6  -- 2024-2025
AND s.is_active = 1;
```

## Troubleshooting

### Problem: Adviser sees no students

**Check 1: Is there an active school year?**
```bash
php check-school-years.php
```

**Check 2: Is adviser assigned to a section?**
```sql
SELECT sec.*, gl.level_name, sy.year_name
FROM sections sec
JOIN grade_levels gl ON sec.grade_level_id = gl.id
JOIN school_years sy ON sec.school_year_id = sy.id
WHERE sec.adviser_id = 44;  -- Replace with adviser's user_id
```

**Check 3: Are students in that section?**
```bash
php fix-student-school-years.php
```

Look for the section with the adviser's name and check student count.

### Problem: Students in wrong school year

**Fix:**
```bash
echo "yes" | php fix-student-school-years.php
```

This assigns all students without a school year to the active one.

### Problem: Need to move students to different section

```sql
-- Get target section ID
SELECT id FROM sections 
WHERE grade_level_id = (SELECT id FROM grade_levels WHERE level_number = 7)
AND section_name = '2'
AND school_year_id = 6;

-- Move students
UPDATE students 
SET current_section_id = 16  -- new section ID
WHERE student_id IN (1, 2, 3);  -- student IDs to move
```

## Best Practices

1. **Always have one active school year**
   - Only one school year should have `is_active = 1`
   - This is the "current" school year for the system

2. **Create sections before assigning students**
   - Use `setup-new-school-year.php` to create all sections at once
   - Or manually create sections as needed

3. **Assign advisers to sections**
   - Each section should have an adviser
   - Use `user_id` from users table, not `adviser_id`

4. **Keep students linked to correct school year**
   - Run `fix-student-school-years.php` periodically
   - Check after bulk imports or data migrations

5. **Use promotion feature for year transitions**
   - Don't manually update students
   - Use the promotion UI or API
   - This maintains proper audit trail

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `setup-new-school-year.php` | Create new school year with all sections |
| `fix-student-school-years.php` | Check and fix student-school year assignments |
| `check-school-years.php` | View all school years and set active |
| `check-sections.php` | View all sections |
| `setup-promotion-test-data.php` | Setup test data for promotion feature |
| `setup-grade-7-10-sections.php` | Create sections for grades 7-10 |
| `cleanup-and-setup-sections.php` | Clean up and create sections |

## Need Help?

Run the analysis script to see current state:
```bash
php fix-student-school-years.php
```

This shows:
- Active school year
- Students without school year
- Distribution by school year
- Distribution by grade level
- All sections with student counts and advisers

Use this information to identify and fix issues.
