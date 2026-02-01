<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'backend/config/database.php';
require_once 'backend/services/EmailService.php';

$database = new Database();
$db = $database->getConnection();
$emailService = new EmailService($database);

// Get specific users
$users = [
    ['username' => '00001', 'email' => 'galeg@gmail.com'],
    ['username' => '136883100330', 'email' => 'genandoyhl@gmail.com']
];

echo "=== RESENDING EMAILS WITH DELAY ===\n\n";

foreach ($users as $userData) {
    $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.temp_password, r.role_name
              FROM users u
              INNER JOIN roles r ON u.role_id = r.role_id
              WHERE u.username = :username";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $userData['username']);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "User not found: " . $userData['username'] . "\n\n";
        continue;
    }
    
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
    
    // Wait 3 seconds before next email to avoid rate limiting
    if ($result) {
        echo "Waiting 3 seconds before next email...\n\n";
        sleep(3);
    }
}

echo "All emails processed.\n";
?>
