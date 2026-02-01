# Promotion and Adviser Assignment Guide

## How the System Works

### Current Implementation ✅

The system correctly handles student-adviser relationships through the following mechanism:

1. **Students Table** has these key fields:
   - `current_grade_level_id` - Current grade level
   - `current_section_id` - Current section
   - `current_adviser_id` - Current adviser (references `users.user_id`)
   - `current_school_year_id` - Current school year
   - `enrollment_status` - Student status (active, promoted, graduated, etc.)

2. **Sections Table** has:
   - `adviser_id` - The adviser assigned to this section (references `users.user_id`)
   - `school_year_id` - The school year this section belongs to
   - `grade_level_id` - The grade level
   - `section_name` - Section name

3. **When Students Are Promoted:**
   - Their `current_grade_level_id` is updated to the new grade
   - Their `current_section_id` is updated to the new section
   - Their `current_adviser_id` is automatically updated to match the new section's adviser
   - Their `current_school_year_id` is updated to the new school year

### How Advisers See Their Students

The `get-class-roster.php` API works as follows:

```php
// 1. Get the adviser's section for the requested school year
SELECT * FROM sections 
WHERE adviser_id = [user_id] 
AND school_year_id = [requested_year]

// 2. Get all students in that section
SELECT * FROM students 
WHERE current_section_id = [section_id]
AND current_school_year_id = [school_year_id]
AND enrollment_status = 'active'
```

## Current System Status

### School Year 2024-2025 (ID 6)
- **Gale Gregory** → Grade 12 STEM 2 (1 student)
- **Diane Capadosa** → Grade 8-2 (0 students)
- **Airah Icawat** → Grade 9-3 (0 students)

### School Year 2025-2026 (ID 7)
- **Diane Capadosa** → Grade 8-2 (0 students)
- **All other sections** → UNASSIGNED

## Why Advisers Get 404 Error

When an adviser tries to view their class roster for a school year where they don't have a section assigned, they get:

```json
{
  "success": false,
  "message": "No section assigned for this school year"
}
```

This is **CORRECT BEHAVIOR** because:
- The adviser doesn't have a section for that school year
- They shouldn't see any students for a year they're not teaching

## Workflow for New School Year

### Step 1: Create New School Year
```sql
INSERT INTO school_years (year_name, start_date, end_date, is_current)
VALUES ('2025-2026', '2025-06-01', '2026-03-31', 0);
```

### Step 2: Create Sections for New School Year
```sql
-- Sections are already created for 2025-2026
-- But most don't have advisers assigned yet
```

### Step 3: Assign Advisers to Sections
```sql
-- Example: Assign Gale Gregory to Grade 12 STEM 2 for 2025-2026
UPDATE sections 
SET adviser_id = 44  -- Gale's user_id
WHERE school_year_id = 7 
AND grade_level_id = [Grade 12 ID]
AND section_name = 'STEM 2';
```

### Step 4: Promote Students
When you run the bulk promotion:
```php
// The system automatically:
// 1. Moves students to new grade level
// 2. Assigns them to new sections
// 3. Updates their adviser_id to match the new section's adviser
// 4. Updates their school_year_id to the new year
```

### Step 5: Verify
After promotion, students will:
- Appear in their NEW adviser's class roster
- NOT appear in their OLD adviser's roster
- Be associated with the NEW school year

## Example Promotion Flow

### Before Promotion (2024-2025)
```
Student: Juan Dela Cruz
- Grade: 11
- Section: STEM 2
- Adviser: Gale Gregory (user_id: 44)
- School Year: 2024-2025 (ID: 6)
```

### After Promotion (2025-2026)
```
Student: Juan Dela Cruz
- Grade: 12
- Section: STEM 1 (or STEM 2, depending on assignment)
- Adviser: [Whoever is assigned to that section for 2025-2026]
- School Year: 2025-2026 (ID: 7)
```

### What Advisers See

**Gale Gregory viewing 2024-2025:**
- Sees Juan Dela Cruz (if Juan was in Grade 11 STEM 2)

**Gale Gregory viewing 2025-2026:**
- Gets 404 error (no section assigned yet)
- OR sees Juan Dela Cruz (if Gale is assigned to Grade 12 STEM 2 for 2025-2026)

**New Adviser viewing 2025-2026:**
- Sees Juan Dela Cruz (if assigned to Juan's new section)

## How to Fix Current Situation

### Option 1: Assign Advisers to 2025-2026 Sections

Run this script to assign advisers to sections for the new school year:

```php
<?php
require_once 'backend/config/database.php';
$database = new Database();
$db = $database->getConnection();

// Assign Gale Gregory to Grade 12 STEM 2 for 2025-2026
$db->exec("UPDATE sections SET adviser_id = 44 
           WHERE school_year_id = 7 
           AND grade_level_id = (SELECT id FROM grade_levels WHERE level_number = 12)
           AND section_name = 'STEM 2'");

// Assign Airah Icawat to Grade 10-3 for 2025-2026
$db->exec("UPDATE sections SET adviser_id = 48 
           WHERE school_year_id = 7 
           AND grade_level_id = (SELECT id FROM grade_levels WHERE level_number = 10)
           AND section_name = '3'");

echo "Advisers assigned to 2025-2026 sections!\n";
?>
```

### Option 2: Use Admin Interface

The admin should use the "Assign Adviser to Section" feature in the admin dashboard to assign advisers to sections for the new school year BEFORE promoting students.

## Best Practice Workflow

1. **Create new school year** (e.g., 2025-2026)
2. **Create sections** for the new school year
3. **Assign advisers** to those sections
4. **Promote students** - they will automatically be assigned to the new sections with the correct advisers
5. **Verify** - advisers can now see their students for the new school year

## Summary

✅ **The system is working correctly!**

The 404 error is expected behavior when an adviser doesn't have a section assigned for a particular school year. 

To fix:
1. Assign advisers to sections for 2025-2026
2. Promote students
3. Students will automatically appear in their new adviser's roster

The key insight: **Students follow their sections, and sections have advisers. When students move to a new section, they automatically get that section's adviser.**
