<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Fixing Clyde's Section Assignment ===\n\n";

// Get Clyde's student_id
$query = "SELECT student_id FROM students WHERE student_number = '136883100331'";
$stmt = $db->prepare($query);
$stmt->execute();
$student = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$student) {
    echo "ERROR: Student not found!\n";
    exit;
}

$student_id = $student['student_id'];
echo "Student ID: $student_id\n";

// Get the Grade 8 - Daffodils section for 2025-2026
$query = "SELECT sec.id as section_id, sec.school_year_id, sec.adviser_id
          FROM sections sec
          LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
          LEFT JOIN school_years sy ON sec.school_year_id = sy.id
          WHERE gl.level_number = 8 
          AND sec.section_name = 'Daffodils'
          AND sy.year_name = '2025-2026'";
$stmt = $db->prepare($query);
$stmt->execute();
$section = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$section) {
    echo "ERROR: Section not found!\n";
    exit;
}

echo "Section ID: {$section['section_id']}\n";
echo "School Year ID: {$section['school_year_id']}\n";
echo "Adviser ID: " . ($section['adviser_id'] ?? 'NULL') . "\n\n";

// Update student's current_section_id and current_school_year_id
$updateQuery = "UPDATE students 
                SET current_section_id = :section_id,
                    current_school_year_id = :school_year_id
                WHERE student_id = :student_id";

$updateStmt = $db->prepare($updateQuery);
$updateStmt->bindParam(':section_id', $section['section_id']);
$updateStmt->bindParam(':school_year_id', $section['school_year_id']);
$updateStmt->bindParam(':student_id', $student_id);

if ($updateStmt->execute()) {
    echo "✓ Successfully updated Clyde's section assignment!\n\n";
    
    // Verify the update
    $verifyQuery = "SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.current_section_id,
        s.current_school_year_id,
        sec.section_name,
        gl.level_name,
        sy.year_name
    FROM students s
    LEFT JOIN sections sec ON s.current_section_id = sec.id
    LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
    LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
    WHERE s.student_id = ?";
    
    $verifyStmt = $db->prepare($verifyQuery);
    $verifyStmt->execute([$student_id]);
    $result = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    
    echo "=== Verification ===\n";
    echo "Student: {$result['first_name']} {$result['last_name']}\n";
    echo "Section: {$result['level_name']} - {$result['section_name']}\n";
    echo "School Year: {$result['year_name']}\n";
    echo "Section ID: {$result['current_section_id']}\n";
    echo "School Year ID: {$result['current_school_year_id']}\n";
} else {
    echo "ERROR: Failed to update student!\n";
}
?>
