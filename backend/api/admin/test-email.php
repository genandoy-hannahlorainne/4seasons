<?php
// Test email sending
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../../config/database.php';
require_once '../../services/EmailService.php';

echo "<h1>Email Test</h1>";

$database = new Database();
$emailService = new EmailService($database);

echo "<p>Attempting to send test email...</p>";

$result = $emailService->sendAccountCreationEmail(
    'genandoyhl@gmail.com',
    'Test User',
    'testuser123',
    'TestPass123!',
    'student'
);

echo "<p>Email send result: " . ($result ? 'SUCCESS' : 'FAILED') . "</p>";

// Check error log
echo "<h2>Recent Error Logs:</h2>";
echo "<pre>";
$logFile = 'C:\\xampp\\apache\\logs\\error.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $recentLines = array_slice($lines, -50);
    foreach ($recentLines as $line) {
        if (stripos($line, 'email') !== false || stripos($line, 'smtp') !== false || stripos($line, 'phpmailer') !== false) {
            echo htmlspecialchars($line) . "\n";
        }
    }
} else {
    echo "Log file not found";
}
echo "</pre>";
?>
