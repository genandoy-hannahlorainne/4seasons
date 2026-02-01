<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Verification: Class Management Fix ===\n\n";

// Get Diane's user_id
$query = "SELECT user_id, full_name FROM users WHERE email LIKE '%diane%'";
$stmt = $db->prepare($query);
$stmt->execute();
$diane = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Adviser: {$diane['full_name']} (User ID: {$diane['user_id']})\n\n";

// Get school year 2025-2026
$query = "SELECT id, year_name FROM school_years WHERE year_name = '2025-2026'";
$stmt = $db->prepare($query);
$stmt->execute();
$schoolYear = $stmt->fetch(PDO::FETCH_ASSOC);

echo "School Year: {$schoolYear['year_name']} (ID: {$schoolYear['id']})\n\n";

// Simulate the API call - Get adviser's section
$sectionQuery = "SELECT sec.id, sec.section_name, gl.level_name, gl.level_number
                FROM sections sec
                LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
                WHERE sec.adviser_id = ? AND sec.school_year_id = ?";

$sectionStmt = $db->prepare($sectionQuery);
$sectionStmt->execute([$diane['user_id'], $schoolYear['id']]);

if ($sectionStmt->rowCount() === 0) {
    echo "❌ ERROR: No section assigned for this school year\n";
    exit;
}

$section = $sectionStmt->fetch(PDO::FETCH_ASSOC);
echo "Section Found: {$section['level_name']} - {$section['section_name']} (ID: {$section['id']})\n\n";

// Get students in this section
$studentQuery = "SELECT 
                s.student_id,
                s.first_name,
                s.last_name,
                s.student_number,
                COUNT(mv.visit_id) as total_medical_visits,
                MAX(mv.visit_datetime) as last_visit_date,
                s.enrollment_status
                FROM students s
                LEFT JOIN medical_visits mv ON s.student_id = mv.student_id
                WHERE s.current_section_id = ? 
                AND s.current_school_year_id = ?
                AND s.enrollment_status = 'active'
                GROUP BY s.student_id, s.first_name, s.last_name, s.student_number, s.enrollment_status
                ORDER BY s.last_name, s.first_name";

$studentStmt = $db->prepare($studentQuery);
$studentStmt->execute([$section['id'], $schoolYear['id']]);
$students = $studentStmt->fetchAll(PDO::FETCH_ASSOC);

echo "=== Students in Class ===\n\n";
if (count($students) > 0) {
    echo "✓ Found " . count($students) . " student(s):\n\n";
    foreach ($students as $student) {
        echo "- {$student['first_name']} {$student['last_name']} ({$student['student_number']})\n";
        echo "  Medical Visits: {$student['total_medical_visits']}\n";
        echo "  Last Visit: " . ($student['last_visit_date'] ?? 'N/A') . "\n";
        echo "  Status: {$student['enrollment_status']}\n\n";
    }
    echo "✓ SUCCESS: Class Management should now show students!\n";
} else {
    echo "❌ ERROR: No students found\n";
}
?>
