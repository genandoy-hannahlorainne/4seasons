<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Checking Student Section Data ===\n\n";

// Check Clyde's data
$query = "SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.student_number,
    s.current_section_id,
    s.current_school_year_id,
    s.enrollment_status,
    sec.section_name,
    sec.school_year_id as section_school_year_id,
    sec.adviser_id,
    gl.level_name,
    sy.year_name
FROM students s
LEFT JOIN sections sec ON s.current_section_id = sec.id
LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
WHERE s.student_number = '136883100331'";

$stmt = $db->prepare($query);
$stmt->execute();
$student = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Student: {$student['first_name']} {$student['last_name']}\n";
echo "Student Number: {$student['student_number']}\n";
echo "Current Section ID: " . ($student['current_section_id'] ?? 'NULL') . "\n";
echo "Current School Year ID: " . ($student['current_school_year_id'] ?? 'NULL') . "\n";
echo "Enrollment Status: {$student['enrollment_status']}\n";
echo "Section Name: " . ($student['section_name'] ?? 'NULL') . "\n";
echo "Section School Year ID: " . ($student['section_school_year_id'] ?? 'NULL') . "\n";
echo "Grade Level: " . ($student['level_name'] ?? 'NULL') . "\n";
echo "School Year: " . ($student['year_name'] ?? 'NULL') . "\n";
echo "Adviser ID: " . ($student['adviser_id'] ?? 'NULL') . "\n\n";

// Check all sections for school year 2025-2026
echo "=== All Sections for 2025-2026 ===\n\n";
$query = "SELECT 
    sec.id,
    sec.section_name,
    sec.school_year_id,
    sec.adviser_id,
    gl.level_name,
    gl.level_number,
    sy.year_name
FROM sections sec
LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
LEFT JOIN school_years sy ON sec.school_year_id = sy.id
WHERE sy.year_name = '2025-2026'
ORDER BY gl.level_number, sec.section_name";

$stmt = $db->prepare($query);
$stmt->execute();
$sections = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($sections as $section) {
    echo "Section ID: {$section['id']}\n";
    echo "Section: {$section['level_name']} - {$section['section_name']}\n";
    echo "School Year: {$section['year_name']}\n";
    echo "Adviser ID: {$section['adviser_id']}\n";
    
    // Count students in this section
    $countQuery = "SELECT COUNT(*) as count FROM students 
                   WHERE current_section_id = ? AND current_school_year_id = ? AND enrollment_status = 'active'";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute([$section['id'], $section['school_year_id']]);
    $count = $countStmt->fetch(PDO::FETCH_ASSOC);
    echo "Students: {$count['count']}\n";
    echo "---\n";
}
?>
