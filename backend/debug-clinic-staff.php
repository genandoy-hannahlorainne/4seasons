<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Checking Clinic Staff Data ===\n\n";

// Check roles
echo "1. Available Roles:\n";
$stmt = $db->prepare("SELECT * FROM roles");
$stmt->execute();
$roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($roles as $role) {
    echo "   Role ID: {$role['role_id']}, Name: {$role['role_name']}\n";
}

// Check users with clinic staff role
echo "\n2. Users with Clinic Staff Role (role_id = 4):\n";
$stmt = $db->prepare("SELECT u.user_id, u.username, u.full_name, u.role_id, u.is_active FROM users u WHERE u.role_id = 4");
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "   Found: " . count($users) . " users\n";
foreach ($users as $user) {
    echo "   - User ID: {$user['user_id']}, Username: {$user['username']}, Full Name: {$user['full_name']}, Active: {$user['is_active']}\n";
}

// Check clinic_staff table
echo "\n3. Clinic Staff Records:\n";
$stmt = $db->prepare("SELECT * FROM clinic_staff");
$stmt->execute();
$staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "   Found: " . count($staff) . " records\n";
foreach ($staff as $s) {
    echo "   - Staff ID: {$s['clinic_staff_id']}, User ID: {$s['user_id']}, Position: {$s['position']}, Active: {$s['is_active']}\n";
}

// Check the join
echo "\n4. Users with Clinic Staff (JOIN):\n";
$stmt = $db->prepare("SELECT u.user_id, u.username, u.full_name, u.is_active, cs.clinic_staff_id, cs.position 
                      FROM users u 
                      INNER JOIN clinic_staff cs ON u.user_id = cs.user_id 
                      WHERE u.role_id = 4");
$stmt->execute();
$joined = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "   Found: " . count($joined) . " joined records\n";
foreach ($joined as $j) {
    echo "   - User: {$j['username']} ({$j['full_name']}), Staff ID: {$j['clinic_staff_id']}, Position: {$j['position']}\n";
}

echo "\n=== End Debug ===\n";
?>
