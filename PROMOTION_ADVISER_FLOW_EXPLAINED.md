# Promotion Adviser Flow - How It Works

## Overview
Ang adviser assignment sa system ay **automatic** based sa section assignment. Walang separate `adviser_id` column sa students table - ang relationship ay through sections.

## Database Structure

### Students Table (Relevant Columns)
```
- student_id
- current_section_id  → Points to sections table
- current_school_year_id
- grade_level
- enrollment_status
```

### Sections Table (Relevant Columns)
```
- id
- section_name
- grade_level_id
- school_year_id
- adviser_id  → Points to users table
```

## How Adviser Assignment Works

### Current Design (CORRECT!)
```
Student → current_section_id → Section → adviser_id → User (Adviser)
```

Ang adviser ng student ay determined through **JOIN**:
```sql
SELECT s.*, sec.adviser_id, u.full_name as adviser_name
FROM students s
LEFT JOIN sections sec ON s.current_section_id = sec.id
LEFT JOIN users u ON sec.adviser_id = u.user_id
WHERE s.student_id = ?
```

## Promotion Flow Example

### Before Promotion
```
Student: Clyde Alonzo
Grade: 8
Section: Daffodils (ID: 60)
School Year: 2025-2026
Adviser: Diane Capadosa (ID: 55)
```

### Promotion Process
```php
UPDATE students 
SET current_section_id = 61,        // Grade 9 - Bonifacio
    current_school_year_id = 10,    // 2026-2027
    grade_level = '9',
    enrollment_status = 'promoted'
WHERE student_id = 19;
```

### After Promotion
```
Student: Clyde Alonzo
Grade: 9
Section: Bonifacio (ID: 61)
School Year: 2026-2027
Adviser: Gale Gregory (ID: 53)  ← AUTOMATICALLY CHANGED!
```

## Why This Design is Correct

### ✓ Advantages
1. **No Redundancy** - Adviser info is stored once (in sections table)
2. **Automatic Updates** - When section's adviser changes, all students automatically see the change
3. **Data Integrity** - No risk of student.adviser_id being out of sync with section.adviser_id
4. **Simpler Promotion** - Only need to update section_id, not both section_id and adviser_id

### ✗ Alternative Design (NOT USED)
```
Students table with adviser_id column:
- student_id
- current_section_id
- adviser_id  ← Would need manual sync
```

This would require:
```php
// BAD: Need to update both
UPDATE students 
SET current_section_id = ?,
    adviser_id = ?  // Must manually sync!
WHERE student_id = ?;
```

## Current Promotion API

### File: `backend/api/adviser/promote-students.php`

The current implementation is **CORRECT**:

```php
// Promotion action
$updateQuery = "UPDATE students SET 
               enrollment_status = 'promoted',
               grade_level = :new_grade_level,
               current_school_year_id = :new_school_year_id,
               current_section_id = :new_section_id,  // This is enough!
               promotion_date = NOW()
               WHERE student_id = :student_id";
```

**No need to update adviser_id** because:
1. Column doesn't exist in students table
2. Adviser is determined by section relationship
3. Automatic through JOIN queries

## Important Requirements

### ⚠️ Critical: Target Sections Must Have Advisers

When promoting students, make sure:

1. **Target section exists** for the next school year
2. **Target section has an adviser assigned** (`sections.adviser_id` is not NULL)
3. **Adviser is active** and has proper role

### Example: Preparing for Promotion

```sql
-- 1. Create next school year
INSERT INTO school_years (year_name, start_date, end_date, is_current)
VALUES ('2026-2027', '2026-06-01', '2027-03-31', 0);

-- 2. Create sections for next school year
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, adviser_id)
VALUES ('Bonifacio', 9, 10, 40, 53);  -- Assign adviser_id!

-- 3. Now students can be promoted to this section
UPDATE students 
SET current_section_id = 61,  -- Grade 9 - Bonifacio
    current_school_year_id = 10,
    grade_level = '9'
WHERE student_id = 19;
```

## Testing Results

### Test Scenario
```
✓ Clyde starts in Grade 8 - Daffodils (Diane Capadosa)
✓ Promoted to Grade 9 - Bonifacio (Gale Gregory)
✓ Adviser automatically changed from Diane to Gale
✓ No manual adviser_id update needed
```

### Verification Query
```sql
-- Check student's current adviser
SELECT 
    s.first_name,
    s.last_name,
    s.grade_level,
    sec.section_name,
    u.full_name as adviser_name
FROM students s
LEFT JOIN sections sec ON s.current_section_id = sec.id
LEFT JOIN users u ON sec.adviser_id = u.user_id
WHERE s.student_number = '136883100331';
```

## Admin Responsibilities

### Before Each School Year
1. Create new school year record
2. Create sections for all grade levels
3. **Assign advisers to each section**
4. Set section capacities

### During Promotion
1. Select target section with assigned adviser
2. Promote students to that section
3. System automatically handles adviser assignment

## Conclusion

✓ **Current system is CORRECT and WORKING**
✓ **No code changes needed**
✓ **Adviser assignment is automatic through section relationship**
✓ **Just ensure target sections have advisers assigned before promotion**

## Scripts for Testing
- `check-promotion-flow.php` - Understand the flow
- `test-promotion-adviser-flow.php` - Test complete promotion scenario
