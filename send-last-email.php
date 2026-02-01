<?php
error_reporting(E_ALL);
ini_set('display_errors', 0); // Suppress debug output

require_once 'backend/config/database.php';
require_once 'backend/services/EmailService.php';

$database = new Database();
$db = $database->getConnection();
$emailService = new EmailService($database);

$query = "SELECT username, email, full_name, temp_password FROM users WHERE username = '136883100330'";
$stmt = $db->query($query);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Sending to: " . $user['email'] . " (" . $user['full_name'] . ")\n";
echo "Username: " . $user['username'] . "\n";
echo "Password: " . $user['temp_password'] . "\n\n";

$result = $emailService->sendAccountCreationEmail(
    $user['email'],
    $user['full_name'],
    $user['username'],
    $user['temp_password'],
    'Student'
);

echo "Result: " . ($result ? '✅ SUCCESS' : '❌ FAILED') . "\n";
?>
