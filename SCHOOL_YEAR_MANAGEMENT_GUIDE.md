# School Year Management Guide

## Overview
This guide explains how to properly add and manage school years in the database to ensure advisers see correct data in their class management interface.

## Database Structure

### School Years Table
```sql
CREATE TABLE `school_years` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `year_name` varchar(20) NOT NULL,        -- e.g., '2024-2025'
  `start_date` date NOT NULL,              -- e.g., '2024-08-01'
  `end_date` date NOT NULL,                -- e.g., '2025-05-31'
  `is_active` tinyint(1) DEFAULT 0,        -- Only ONE should be 1 (active)
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

### Important Fields
- **year_name**: Format should be "YYYY-YYYY" (e.g., "2024-2025")
- **is_active**: Only ONE school year should have `is_active = 1` at a time
- **start_date**: Usually August 1st
- **end_date**: Usually May 31st of the following year

## How School Years Affect Data

### 1. Student Records
Students have a `current_school_year_id` field that links them to a school year:
```sql
SELECT * FROM students WHERE current_school_year_id = 6; -- 2024-2025
```

### 2. Sections
Sections are created per school year and grade level:
```sql
SELECT * FROM sections WHERE school_year_id = 6; -- All sections for 2024-2025
```

### 3. Adviser Class Roster
Advisers see students based on:
- Their assigned section (sections.adviser_id)
- The selected school year
- Students in that section for that school year

## Step-by-Step: Adding a New School Year

### Method 1: Using the Setup Script (Recommended)

Run the provided script:
```bash
php setup-new-school-year.php
```

This script will:
1. Check existing school years
2. Create the next school year
3. Create all sections (Grades 7-12) for the new year
4. Optionally set it as active

### Method 2: Manual SQL

```sql
-- 1. Add new school year
INSERT INTO school_years (year_name, start_date, end_date, is_active, created_at)
VALUES ('2026-2027', '2026-08-01', '2027-05-31', 0, NOW());

-- 2. Get the new school year ID
SET @new_sy_id = LAST_INSERT_ID();

-- 3. Create sections for the new school year
-- For Grades 7-10 (Sections 1, 2, 3)
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, is_active)
SELECT '1', id, @new_sy_id, 50, 1 FROM grade_levels WHERE level_number BETWEEN 7 AND 10
UNION ALL
SELECT '2', id, @new_sy_id, 50, 1 FROM grade_levels WHERE level_number BETWEEN 7 AND 10
UNION ALL
SELECT '3', id, @new_sy_id, 50, 1 FROM grade_levels WHERE level_number BETWEEN 7 AND 10;

-- For Grades 11-12 (Strand sections)
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, is_active)
SELECT section_name, gl.id, @new_sy_id, 50, 1
FROM grade_levels gl
CROSS JOIN (
  SELECT 'STEM 1' as section_name UNION ALL
  SELECT 'STEM 2' UNION ALL
  SELECT 'ABM 1' UNION ALL
  SELECT 'ABM 2' UNION ALL
  SELECT 'HUMSS 1' UNION ALL
  SELECT 'HUMSS 2' UNION ALL
  SELECT 'TVL-HE 1' UNION ALL
  SELECT 'TVL-HE 2' UNION ALL
  SELECT 'TVL-EIM 1' UNION ALL
  SELECT 'TVL-EIM 2'
) sections
WHERE gl.level_number IN (11, 12);
```

## Setting Active School Year

**IMPORTANT**: Only ONE school year should be active at a time.

```sql
-- Set 2024-2025 as active (deactivate all others first)
UPDATE school_years SET is_active = 0;
UPDATE school_years SET is_active = 1 WHERE year_name = '2024-2025';
```

## Assigning Students to School Year

### When Creating New Students
```sql
-- Get current active school year
SELECT id FROM school_years WHERE is_active = 1;

-- Assign student to current school year
UPDATE students 
SET current_school_year_id = 6  -- ID of active school year
WHERE student_id = 123;
```

### When Promoting Students
The promotion API automatically updates:
- `current_school_year_id` to target school year
- `grade_level` to next grade
- `current_section_id` to target section

## Assigning Advisers to Sections

```sql
-- Assign adviser to a section
UPDATE sections 
SET adviser_id = 44  -- user_id of the adviser
WHERE id = 15  -- section_id
AND school_year_id = 6;  -- current school year
```

## Troubleshooting

### Problem: Adviser sees no students in class management

**Check 1: Is there an active school year?**
```sql
SELECT * FROM school_years WHERE is_active = 1;
```

**Check 2: Is the adviser assigned to a section?**
```sql
SELECT sec.*, gl.level_name, sy.year_name
FROM sections sec
JOIN grade_levels gl ON sec.grade_level_id = gl.id
JOIN school_years sy ON sec.school_year_id = sy.id
WHERE sec.adviser_id = 44;  -- Replace with adviser's user_id
```

**Check 3: Are there students in that section?**
```sql
SELECT s.*, sec.section_name, gl.level_name
FROM students s
JOIN sections sec ON s.current_section_id = sec.id
JOIN grade_levels gl ON s.grade_level = gl.level_number
WHERE sec.adviser_id = 44  -- Replace with adviser's user_id
AND s.current_school_year_id = 6;  -- Replace with school year ID
```

### Problem: Students not showing in correct school year

**Fix: Update student's school year**
```sql
UPDATE students 
SET current_school_year_id = 6  -- Current active school year
WHERE student_id IN (1, 2, 3);  -- Student IDs
```

### Problem: Sections missing for new school year

**Fix: Run section creation script**
```bash
php setup-new-school-year.php
```

Or manually create sections using the SQL above.

## Best Practices

1. **Always create sections when adding a new school year**
   - Grades 7-10: Sections 1, 2, 3
   - Grades 11-12: All strand sections

2. **Only one active school year at a time**
   - Set `is_active = 1` for current year
   - Set `is_active = 0` for all others

3. **Update students when school year changes**
   - Use the promotion feature to move students to next year
   - Or manually update `current_school_year_id`

4. **Assign advisers to sections for each school year**
   - Advisers need to be assigned to sections
   - One adviser per section
   - Can be different advisers each year

5. **Keep historical data**
   - Don't delete old school years
   - Don't delete old sections
   - This preserves student history

## Admin Interface (Future Enhancement)

Consider adding an admin interface for:
- Creating new school years
- Setting active school year
- Bulk creating sections
- Assigning advisers to sections
- Viewing school year statistics

## Related Files
- `setup-new-school-year.php` - Script to create new school year
- `check-school-years.php` - Check current school years
- `check-sections.php` - View all sections
- `setup-promotion-test-data.php` - Setup test data for promotion
