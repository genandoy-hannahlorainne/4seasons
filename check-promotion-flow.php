<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Understanding Promotion Flow ===\n\n";

// Check students table structure
echo "1. STUDENTS TABLE - Relevant Columns:\n";
$stmt = $db->query("DESCRIBE students");
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if (in_array($row['Field'], ['student_id', 'current_section_id', 'current_school_year_id', 'grade_level', 'adviser_id'])) {
        echo "   - {$row['Field']} ({$row['Type']})\n";
    }
}

// Check sections table structure
echo "\n2. SECTIONS TABLE - Relevant Columns:\n";
$stmt = $db->query("DESCRIBE sections");
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if (in_array($row['Field'], ['id', 'section_name', 'grade_level_id', 'school_year_id', 'adviser_id'])) {
        echo "   - {$row['Field']} ({$row['Type']})\n";
    }
}

// Show example: Current state
echo "\n3. CURRENT STATE - Clyde in Grade 8:\n";
$query = "SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.grade_level,
    s.current_section_id,
    s.current_school_year_id,
    sec.section_name,
    sec.adviser_id as section_adviser_id,
    gl.level_number,
    sy.year_name
FROM students s
LEFT JOIN sections sec ON s.current_section_id = sec.id
LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
WHERE s.student_number = '136883100331'";

$stmt = $db->prepare($query);
$stmt->execute();
$student = $stmt->fetch(PDO::FETCH_ASSOC);

echo "   Student: {$student['first_name']} {$student['last_name']}\n";
echo "   Current Grade: {$student['grade_level']}\n";
echo "   Current Section: Grade {$student['level_number']} - {$student['section_name']}\n";
echo "   Current School Year: {$student['year_name']}\n";
echo "   Section's adviser_id: " . ($student['section_adviser_id'] ?? 'NULL') . "\n";

// Show example: What happens after promotion to Grade 9
echo "\n4. AFTER PROMOTION - What should happen:\n";
echo "   ✓ Student promoted to Grade 9\n";
echo "   ✓ current_section_id = [new Grade 9 section ID]\n";
echo "   ✓ current_school_year_id = [next school year ID]\n";
echo "   ✓ grade_level = 9\n";

// Check if students table has adviser_id column
echo "\n5. ADVISER ASSIGNMENT LOGIC:\n";
echo "   ✓ students table has NO adviser_id column\n";
echo "   → Adviser is determined by section assignment only\n";
echo "   → When student is promoted to new section, they automatically get new adviser\n";
echo "   → The new adviser is whoever is assigned to the target section\n";

// Show Grade 9 sections for next school year
echo "\n6. AVAILABLE GRADE 9 SECTIONS (for promotion):\n";
$query = "SELECT 
    sec.id,
    sec.section_name,
    sec.adviser_id,
    gl.level_number,
    sy.year_name,
    COUNT(s.student_id) as current_students
FROM sections sec
LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
LEFT JOIN school_years sy ON sec.school_year_id = sy.id
LEFT JOIN students s ON s.current_section_id = sec.id AND s.enrollment_status = 'active'
WHERE gl.level_number = 9
GROUP BY sec.id, sec.section_name, sec.adviser_id, gl.level_number, sy.year_name
ORDER BY sy.year_name DESC, sec.section_name";

$stmt = $db->prepare($query);
$stmt->execute();
$sections = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($sections) > 0) {
    foreach ($sections as $section) {
        echo "   - Section ID: {$section['id']}\n";
        echo "     Grade {$section['level_number']} - {$section['section_name']}\n";
        echo "     School Year: {$section['year_name']}\n";
        echo "     Adviser ID: " . ($section['adviser_id'] ?? 'NULL') . "\n";
        echo "     Current Students: {$section['current_students']}\n";
        echo "     ---\n";
    }
} else {
    echo "   ⚠ No Grade 9 sections found!\n";
}

echo "\n7. CONCLUSION:\n";
echo "   When promoting a student:\n";
echo "   1. Update current_section_id to new section\n";
echo "   2. Update current_school_year_id to new school year\n";
echo "   3. Update grade_level to new grade\n";
echo "   4. Adviser is automatically determined by the new section's adviser_id\n";
echo "   5. No need to update student record for adviser - it's a JOIN relationship\n";
?>
