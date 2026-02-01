<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'backend/config/database.php';
require_once 'backend/services/EmailService.php';

$database = new Database();
$db = $database->getConnection();
$emailService = new EmailService($database);

// Get the user details
$username = '136883100331';
$query = "SELECT user_id, username, email, full_name, temp_password FROM users WHERE username = :username";
$stmt = $db->prepare($query);
$stmt->bindParam(':username', $username);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    die("User not found: $username\n");
}

echo "=== RESENDING EMAIL FOR USER ===\n";
echo "Username: " . $user['username'] . "\n";
echo "Email: " . $user['email'] . "\n";
echo "Full Name: " . $user['full_name'] . "\n";
echo "Temp Password: " . $user['temp_password'] . "\n\n";

echo "Sending email...\n";

$result = $emailService->sendAccountCreationEmail(
    $user['email'],
    $user['full_name'],
    $user['username'],
    $user['temp_password'],
    'Student'
);

echo "\n";
echo "Result: " . ($result ? '✅ SUCCESS' : '❌ FAILED') . "\n";

if ($result) {
    echo "\nCheck your Mailtrap inbox at: https://mailtrap.io/inboxes\n";
} else {
    echo "\nCheck error logs for details\n";
}
?>
