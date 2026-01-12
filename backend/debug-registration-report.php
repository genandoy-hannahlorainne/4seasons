<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Registration Report Debug ===\n\n";

// Check users with created_at dates
echo "1. Users with created_at dates:\n";
$stmt = $db->prepare("SELECT u.user_id, u.username, u.created_at, r.role_name 
                      FROM users u 
                      LEFT JOIN roles r ON u.role_id = r.role_id 
                      ORDER BY u.created_at DESC LIMIT 10");
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $user) {
    echo "   - {$user['username']} ({$user['role_name']}): {$user['created_at']}\n";
}

// Check registration stats for current month
echo "\n2. Registration stats for current month:\n";
$startDate = date('Y-m-01');
$endDate = date('Y-m-d');
echo "   Date range: $startDate to $endDate\n";

$stmt = $db->prepare("SELECT 
                        DATE(created_at) as registration_date,
                        r.role_name,
                        COUNT(u.user_id) as count
                      FROM users u
                      JOIN roles r ON u.role_id = r.role_id
                      WHERE DATE(u.created_at) BETWEEN ? AND ?
                      AND r.role_name IN ('student', 'adviser', 'clinic_staff')
                      GROUP BY DATE(u.created_at), r.role_name
                      ORDER BY registration_date DESC");
$stmt->execute([$startDate, $endDate]);
$registrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "   Found: " . count($registrations) . " registration records\n";
foreach ($registrations as $reg) {
    echo "   - {$reg['registration_date']}: {$reg['role_name']} ({$reg['count']})\n";
}

// Check all registrations regardless of date
echo "\n3. All registrations by date:\n";
$stmt = $db->prepare("SELECT 
                        DATE(created_at) as registration_date,
                        r.role_name,
                        COUNT(u.user_id) as count
                      FROM users u
                      JOIN roles r ON u.role_id = r.role_id
                      WHERE r.role_name IN ('student', 'adviser', 'clinic_staff')
                      GROUP BY DATE(u.created_at), r.role_name
                      ORDER BY registration_date DESC");
$stmt->execute();
$allRegs = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "   Found: " . count($allRegs) . " total registration records\n";
foreach ($allRegs as $reg) {
    echo "   - {$reg['registration_date']}: {$reg['role_name']} ({$reg['count']})\n";
}

echo "\n=== End Debug ===\n";
?>
