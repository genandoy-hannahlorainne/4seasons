<?php
// Simulate the API call to get student medical data

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Testing Student Medical Data API ===\n\n";

// Get Clyde's student_id
$query = "SELECT student_id, user_id FROM students WHERE student_number = '136883100331'";
$stmt = $db->prepare($query);
$stmt->execute();
$clyde = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Clyde's Info:\n";
echo "  Student ID: {$clyde['student_id']}\n";
echo "  User ID: {$clyde['user_id']}\n\n";

// Simulate the adviser query from the API
echo "Testing Adviser Query:\n";
echo "---------------------------------------------------\n";

$adviserQuery = "SELECT 
                    u.user_id,
                    u.full_name,
                    u.phone,
                    u.email
                 FROM students s
                 LEFT JOIN sections sec ON s.current_section_id = sec.id
                 LEFT JOIN users u ON sec.adviser_id = u.user_id
                 WHERE s.student_id = :student_id
                 AND s.is_active = 1
                 LIMIT 1";

$adviserStmt = $db->prepare($adviserQuery);
$adviserStmt->bindParam(":student_id", $clyde['student_id']);
$adviserStmt->execute();
$adviser = $adviserStmt->fetch(PDO::FETCH_ASSOC);

if ($adviser) {
    echo "✓ Adviser Found:\n";
    echo "  User ID: {$adviser['user_id']}\n";
    echo "  Full Name: {$adviser['full_name']}\n";
    echo "  Phone: " . ($adviser['phone'] ?? 'NULL') . "\n";
    echo "  Email: {$adviser['email']}\n\n";
    
    $adviserName = $adviser['full_name'];
    $adviserContact = $adviser['phone'] ?: $adviser['email'];
    
    echo "API Response Values:\n";
    echo "  adviser_name: $adviserName\n";
    echo "  adviser_contact: $adviserContact\n\n";
    
    if ($adviserName == 'Airah   Icawat') {
        echo "✓ SUCCESS! API will return Airah as adviser\n";
    } else {
        echo "⚠ WARNING: Expected 'Airah   Icawat', got '$adviserName'\n";
    }
} else {
    echo "❌ ERROR: No adviser found!\n";
    
    // Debug: Check student's current section
    echo "\nDebug Info:\n";
    $debugQuery = "SELECT 
        s.student_id,
        s.current_section_id,
        sec.section_name,
        sec.adviser_id,
        gl.level_number
    FROM students s
    LEFT JOIN sections sec ON s.current_section_id = sec.id
    LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
    WHERE s.student_id = ?";
    
    $debugStmt = $db->prepare($debugQuery);
    $debugStmt->execute([$clyde['student_id']]);
    $debug = $debugStmt->fetch(PDO::FETCH_ASSOC);
    
    echo "  Student ID: {$debug['student_id']}\n";
    echo "  Current Section ID: " . ($debug['current_section_id'] ?? 'NULL') . "\n";
    echo "  Section Name: " . ($debug['section_name'] ?? 'NULL') . "\n";
    echo "  Section Adviser ID: " . ($debug['adviser_id'] ?? 'NULL') . "\n";
}
?>
