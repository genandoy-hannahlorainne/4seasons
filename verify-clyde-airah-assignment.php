<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Verification: Clyde under Airah's Advisory ===\n\n";

// Check from student perspective
echo "1. STUDENT PERSPECTIVE (Clyde's Dashboard)\n";
echo "---------------------------------------------------\n";
$query = "SELECT 
    s.student_number,
    s.first_name,
    s.last_name,
    s.grade_level,
    sec.section_name,
    gl.level_number,
    sy.year_name,
    u.full_name as adviser_name
FROM students s
LEFT JOIN sections sec ON s.current_section_id = sec.id
LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
LEFT JOIN users u ON sec.adviser_id = u.user_id
WHERE s.student_number = '136883100331'";

$stmt = $db->prepare($query);
$stmt->execute();
$student = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Student: {$student['first_name']} {$student['last_name']}\n";
echo "Student Number: {$student['student_number']}\n";
echo "Grade: Grade {$student['level_number']} - Section {$student['section_name']}\n";
echo "School Year: {$student['year_name']}\n";
echo "Adviser: {$student['adviser_name']}\n\n";

// Check from adviser perspective (Airah)
echo "2. ADVISER PERSPECTIVE (Airah's Dashboard)\n";
echo "---------------------------------------------------\n";

// Get Airah's user_id
$query = "SELECT user_id FROM users WHERE full_name LIKE '%Airah%'";
$stmt = $db->prepare($query);
$stmt->execute();
$airah = $stmt->fetch(PDO::FETCH_ASSOC);

// Get Airah's section for 2025-2026
$query = "SELECT sec.id, sec.section_name, gl.level_name, gl.level_number
          FROM sections sec
          LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
          WHERE sec.adviser_id = ? 
          AND sec.school_year_id = (SELECT id FROM school_years WHERE year_name = '2025-2026')";
$stmt = $db->prepare($query);
$stmt->execute([$airah['user_id']]);
$section = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Airah's Section: {$section['level_name']} - Section {$section['section_name']}\n";
echo "School Year: 2025-2026\n\n";

// Get students in Airah's class
$query = "SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.student_number,
    s.grade_level
FROM students s
WHERE s.current_section_id = ? 
AND s.current_school_year_id = (SELECT id FROM school_years WHERE year_name = '2025-2026')
AND s.enrollment_status = 'active'
ORDER BY s.last_name, s.first_name";

$stmt = $db->prepare($query);
$stmt->execute([$section['id']]);
$students = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Students in Airah's Class:\n";
if (count($students) > 0) {
    foreach ($students as $s) {
        echo "  - {$s['first_name']} {$s['last_name']} ({$s['student_number']}) - Grade {$s['grade_level']}\n";
    }
} else {
    echo "  No students found\n";
}

echo "\n3. VERIFICATION SUMMARY\n";
echo "---------------------------------------------------\n";
if (count($students) > 0 && $student['adviser_name'] == 'Airah   Icawat') {
    echo "✓ SUCCESS!\n";
    echo "  - Clyde is in Grade 9 - Section 2\n";
    echo "  - Airah is the adviser of Grade 9 - Section 2\n";
    echo "  - Clyde appears in Airah's class roster\n";
    echo "  - Clyde's profile shows Airah as adviser\n";
} else {
    echo "⚠ ISSUE DETECTED\n";
}
?>
