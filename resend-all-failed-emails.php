<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'backend/config/database.php';
require_once 'backend/services/EmailService.php';

$database = new Database();
$db = $database->getConnection();
$emailService = new EmailService($database);

// Get users with failed emails
$query = "SELECT DISTINCT u.user_id, u.username, u.email, u.full_name, u.temp_password, r.role_name
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          INNER JOIN email_logs el ON u.email = el.recipient
          WHERE el.status = 'failed'
          AND el.subject = 'Your PDMHS Medical System Account'
          ORDER BY u.created_at DESC";

$stmt = $db->query($query);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "=== RESENDING FAILED EMAILS ===\n";
echo "Found " . count($users) . " users with failed emails\n\n";

foreach ($users as $user) {
    echo "---\n";
    echo "Username: " . $user['username'] . "\n";
    echo "Email: " . $user['email'] . "\n";
    echo "Full Name: " . $user['full_name'] . "\n";
    echo "Temp Password: " . $user['temp_password'] . "\n";
    echo "Role: " . $user['role_name'] . "\n";
    echo "Sending... ";
    
    $result = $emailService->sendAccountCreationEmail(
        $user['email'],
        $user['full_name'],
        $user['username'],
        $user['temp_password'],
        $user['role_name']
    );
    
    echo ($result ? '✅ SUCCESS' : '❌ FAILED') . "\n\n";
}

echo "\nAll emails processed. Check Mailtrap inbox.\n";
?>
