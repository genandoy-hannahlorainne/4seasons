# Student Promotion - Quick Guide

## How Adviser Assignment Works

```
Student → Section → Adviser
```

**Simple Rule:** Ang adviser ng student ay kung sino ang adviser ng section niya.

## Example

### Before Promotion
- **Student:** Clyde Alonzo
- **Section:** Grade 8 - Daffodils
- **Adviser:** Diane Capadosa ← (from section's adviser_id)

### After Promotion to Grade 9
- **Student:** Clyde Alonzo
- **Section:** Grade 9 - Bonifacio
- **Adviser:** [New Adviser] ← (from new section's adviser_id)

## Important: Before Promoting Students

### ✓ Checklist
1. [ ] Next school year is created
2. [ ] Target sections are created
3. [ ] **Advisers are assigned to target sections** ← CRITICAL!
4. [ ] Section capacities are set

### ⚠️ If Target Section Has No Adviser
```
Result: Student will be promoted but will have NO adviser
Fix: Assign adviser to section first
```

## Promotion Process

### 1. Admin Creates Next School Year
```sql
INSERT INTO school_years (year_name, start_date, end_date)
VALUES ('2026-2027', '2026-06-01', '2027-03-31');
```

### 2. Admin Creates Sections
```sql
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity)
VALUES ('Bonifacio', 9, 10, 40);
```

### 3. Admin Assigns Advisers to Sections
```sql
UPDATE sections 
SET adviser_id = 53  -- Gale Gregory
WHERE id = 61;       -- Grade 9 - Bonifacio
```

### 4. Adviser Promotes Students
```
Frontend: Class Management → Select Students → Promote
Backend: Updates current_section_id to new section
Result: Student automatically gets new section's adviser
```

## What Gets Updated During Promotion

```sql
UPDATE students 
SET current_section_id = 61,        -- New section
    current_school_year_id = 10,    -- New school year
    grade_level = '9',              -- New grade
    enrollment_status = 'promoted'
WHERE student_id = 19;
```

**Note:** No need to update `adviser_id` - it doesn't exist in students table!

## Verification

### Check if student has adviser
```sql
SELECT 
    s.first_name,
    s.last_name,
    sec.section_name,
    u.full_name as adviser_name
FROM students s
LEFT JOIN sections sec ON s.current_section_id = sec.id
LEFT JOIN users u ON sec.adviser_id = u.user_id
WHERE s.student_id = 19;
```

### Check if section has adviser
```sql
SELECT 
    sec.section_name,
    u.full_name as adviser_name
FROM sections sec
LEFT JOIN users u ON sec.adviser_id = u.user_id
WHERE sec.id = 61;
```

## Common Mistakes

### ❌ Wrong: Trying to update student's adviser directly
```sql
-- This won't work - column doesn't exist!
UPDATE students SET adviser_id = 53 WHERE student_id = 19;
```

### ✓ Correct: Update section's adviser
```sql
-- This affects all students in that section
UPDATE sections SET adviser_id = 53 WHERE id = 61;
```

## Summary

1. **Adviser is determined by section** - not stored in student record
2. **When student changes section** - adviser automatically changes
3. **Before promoting** - make sure target section has adviser
4. **No manual sync needed** - system handles it automatically

## Quick Commands

### Reset test data
```bash
php reset-clyde-to-grade8.php
```

### Test promotion flow
```bash
php test-promotion-adviser-flow.php
```

### Check current state
```bash
php check-promotion-flow.php
```
