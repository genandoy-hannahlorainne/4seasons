<?php
/**
 * Test script to verify medical records API works
 */

require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== TESTING MEDICAL RECORDS API ===\n\n";

// 1. Get a student user
echo "1. Finding a student user...\n";
$query = "SELECT u.user_id, u.username, u.full_name, s.student_id, s.student_number
          FROM users u
          JOIN students s ON u.user_id = s.user_id
          WHERE u.is_active = 1 AND s.is_active = 1
          LIMIT 1";
$stmt = $db->prepare($query);
$stmt->execute();

if ($stmt->rowCount() === 0) {
    echo "❌ No student users found\n";
    exit(1);
}

$student = $stmt->fetch(PDO::FETCH_ASSOC);
echo "✅ Found student: {$student['full_name']} (User ID: {$student['user_id']}, Student ID: {$student['student_id']})\n\n";

// 2. Test getting medical data
echo "2. Testing medical data fetch...\n";

$studentId = $student['student_id'];
$userId = $student['user_id'];

// Get allergies
$query = "SELECT COUNT(*) as count FROM allergies WHERE student_id = :student_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':student_id', $studentId);
$stmt->execute();
$allergyCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "   - Allergies: $allergyCount\n";

// Get immunizations
$query = "SELECT COUNT(*) as count FROM immunizations WHERE student_id = :student_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':student_id', $studentId);
$stmt->execute();
$immunizationCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "   - Immunizations: $immunizationCount\n";

// Get medical visits
$query = "SELECT COUNT(*) as count FROM medical_visits WHERE student_id = :student_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':student_id', $studentId);
$stmt->execute();
$visitCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "   - Medical Visits: $visitCount\n";

// Get adviser
$query = "SELECT a.adviser_id, a.first_name, a.last_name
          FROM advisers a
          INNER JOIN student_adviser sa ON a.adviser_id = sa.adviser_id
          WHERE sa.student_id = :student_id AND a.is_active = 1
          LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':student_id', $studentId);
$stmt->execute();
$adviser = $stmt->fetch(PDO::FETCH_ASSOC);
echo "   - Adviser: " . ($adviser ? "{$adviser['first_name']} {$adviser['last_name']}" : "Not assigned") . "\n";

echo "\n✅ All medical data accessible\n";
echo "\n=== TEST COMPLETE ===\n";
?>
