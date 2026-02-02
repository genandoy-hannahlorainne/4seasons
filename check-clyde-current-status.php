<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Checking Clyde's Current Status ===\n\n";

// Check Clyde's current assignment
$query = "SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.student_number,
    s.grade_level,
    s.current_section_id,
    s.current_school_year_id,
    sec.section_name,
    sec.adviser_id as section_adviser_id,
    gl.level_number,
    sy.year_name,
    u.user_id as adviser_user_id,
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

echo "STUDENT INFO:\n";
echo "  Name: {$student['first_name']} {$student['last_name']}\n";
echo "  Student Number: {$student['student_number']}\n";
echo "  Grade Level: {$student['grade_level']}\n";
echo "  Current Section ID: {$student['current_section_id']}\n";
echo "  Current School Year ID: {$student['current_school_year_id']}\n\n";

echo "SECTION INFO:\n";
echo "  Section: Grade {$student['level_number']} - {$student['section_name']}\n";
echo "  School Year: {$student['year_name']}\n";
echo "  Section's Adviser ID: " . ($student['section_adviser_id'] ?? 'NULL') . "\n";
echo "  Adviser Name: " . ($student['adviser_name'] ?? 'NONE') . "\n\n";

// Check Airah's info
echo "=== Checking Airah's Info ===\n\n";
$query = "SELECT u.user_id, u.full_name, r.role_name 
          FROM users u
          LEFT JOIN roles r ON u.role_id = r.role_id
          WHERE u.full_name LIKE '%Airah%' OR u.email LIKE '%airah%'";
$stmt = $db->prepare($query);
$stmt->execute();
$airah = $stmt->fetch(PDO::FETCH_ASSOC);

if ($airah) {
    echo "Airah's User ID: {$airah['user_id']}\n";
    echo "Full Name: {$airah['full_name']}\n";
    echo "Role: {$airah['role_name']}\n\n";
    
    // Check what sections Airah is advising
    echo "Sections advised by Airah:\n";
    $query = "SELECT 
        sec.id,
        sec.section_name,
        gl.level_number,
        sy.year_name,
        COUNT(s.student_id) as student_count
    FROM sections sec
    LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
    LEFT JOIN school_years sy ON sec.school_year_id = sy.id
    LEFT JOIN students s ON s.current_section_id = sec.id AND s.enrollment_status = 'active'
    WHERE sec.adviser_id = ?
    GROUP BY sec.id, sec.section_name, gl.level_number, sy.year_name
    ORDER BY sy.year_name DESC, gl.level_number, sec.section_name";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$airah['user_id']]);
    $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($sections) > 0) {
        foreach ($sections as $section) {
            echo "  - Grade {$section['level_number']} - {$section['section_name']} ({$section['year_name']}) - {$section['student_count']} students\n";
        }
    } else {
        echo "  No sections assigned\n";
    }
} else {
    echo "Airah not found in database\n";
}

echo "\n=== Checking Grade 9 - Section 2 ===\n\n";
$query = "SELECT 
    sec.id,
    sec.section_name,
    sec.adviser_id,
    gl.level_number,
    sy.year_name,
    u.full_name as adviser_name
FROM sections sec
LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
LEFT JOIN school_years sy ON sec.school_year_id = sy.id
LEFT JOIN users u ON sec.adviser_id = u.user_id
WHERE gl.level_number = 9 
AND sec.section_name = '2'
ORDER BY sy.year_name DESC";

$stmt = $db->prepare($query);
$stmt->execute();
$sections = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($sections) > 0) {
    foreach ($sections as $section) {
        echo "Section ID: {$section['id']}\n";
        echo "  Grade {$section['level_number']} - Section {$section['section_name']}\n";
        echo "  School Year: {$section['year_name']}\n";
        echo "  Adviser ID: " . ($section['adviser_id'] ?? 'NULL') . "\n";
        echo "  Adviser Name: " . ($section['adviser_name'] ?? 'NONE') . "\n";
        echo "  ---\n";
    }
} else {
    echo "No Grade 9 - Section 2 found\n";
}
?>
