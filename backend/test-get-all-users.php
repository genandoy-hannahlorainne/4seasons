<?php
/**
 * Test script for get-all-users API
 * Run this to verify the API is working correctly
 */

require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo "❌ Database connection failed\n";
    exit(1);
}

echo "✅ Database connected\n\n";

// Test 1: Check if users table has data
echo "=== TEST 1: Users in Database ===\n";
$query = "SELECT COUNT(*) as total, 
                 SUM(CASE WHEN role_id = 1 THEN 1 ELSE 0 END) as admins,
                 SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) as students,
                 SUM(CASE WHEN role_id = 3 THEN 1 ELSE 0 END) as advisers,
                 SUM(CASE WHEN role_id = 4 THEN 1 ELSE 0 END) as clinic_staff
          FROM users WHERE deleted_at IS NULL";

$stmt = $db->prepare($query);
$stmt->execute();
$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Total users: " . $result['total'] . "\n";
echo "  - Admins: " . ($result['admins'] ?? 0) . "\n";
echo "  - Students: " . ($result['students'] ?? 0) . "\n";
echo "  - Advisers: " . ($result['advisers'] ?? 0) . "\n";
echo "  - Clinic Staff: " . ($result['clinic_staff'] ?? 0) . "\n\n";

// Test 2: Check students
echo "=== TEST 2: Students ===\n";
$query = "SELECT u.user_id, u.username, u.full_name, r.role_name,
                 s.student_id, s.student_number
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          LEFT JOIN students s ON u.user_id = s.user_id
          WHERE r.role_id = 2 AND u.deleted_at IS NULL";

$stmt = $db->prepare($query);
$stmt->execute();
$students = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($students) . " students:\n";
foreach ($students as $student) {
    echo "  - ID: " . $student['user_id'] . ", Username: " . $student['username'] . ", Name: " . $student['full_name'] . "\n";
}
echo "\n";

// Test 3: Check advisers
echo "=== TEST 3: Advisers ===\n";
$query = "SELECT u.user_id, u.username, u.full_name, r.role_name,
                 a.adviser_id
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          LEFT JOIN advisers a ON u.user_id = a.user_id
          WHERE r.role_id = 3 AND u.deleted_at IS NULL";

$stmt = $db->prepare($query);
$stmt->execute();
$advisers = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($advisers) . " advisers:\n";
foreach ($advisers as $adviser) {
    echo "  - ID: " . $adviser['user_id'] . ", Username: " . $adviser['username'] . ", Name: " . $adviser['full_name'] . "\n";
}
echo "\n";

// Test 4: Check clinic staff
echo "=== TEST 4: Clinic Staff ===\n";
$query = "SELECT u.user_id, u.username, u.full_name, r.role_name,
                 cs.clinic_staff_id
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          LEFT JOIN clinic_staff cs ON u.user_id = cs.user_id
          WHERE r.role_id = 4 AND u.deleted_at IS NULL";

$stmt = $db->prepare($query);
$stmt->execute();
$clinic_staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($clinic_staff) . " clinic staff:\n";
foreach ($clinic_staff as $staff) {
    echo "  - ID: " . $staff['user_id'] . ", Username: " . $staff['username'] . ", Name: " . $staff['full_name'] . "\n";
}
echo "\n";

// Test 5: Check admins
echo "=== TEST 5: Admins ===\n";
$query = "SELECT u.user_id, u.username, u.full_name, r.role_name
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          WHERE r.role_id = 1 AND u.deleted_at IS NULL";

$stmt = $db->prepare($query);
$stmt->execute();
$admins = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($admins) . " admins:\n";
foreach ($admins as $admin) {
    echo "  - ID: " . $admin['user_id'] . ", Username: " . $admin['username'] . ", Name: " . $admin['full_name'] . "\n";
}
echo "\n";

echo "✅ All tests completed\n";
?>
