<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

// Check for user 136883100331
$query = "SELECT user_id, username, email, full_name, temp_password, password_must_change, created_at 
          FROM users 
          WHERE username = '136883100331'
          ORDER BY created_at DESC 
          LIMIT 1";

$stmt = $db->query($query);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo "=== CHECKING USER 136883100331 ===\n";
if ($user) {
    echo "✅ USER FOUND:\n";
    echo "User ID: " . $user['user_id'] . "\n";
    echo "Username: " . $user['username'] . "\n";
    echo "Email: " . $user['email'] . "\n";
    echo "Full Name: " . $user['full_name'] . "\n";
    echo "Temp Password: " . $user['temp_password'] . "\n";
    echo "Must Change Password: " . $user['password_must_change'] . "\n";
    echo "Created At: " . $user['created_at'] . "\n";
} else {
    echo "❌ USER NOT FOUND\n";
    echo "This means the create-user API was never called or failed before inserting.\n";
}

// Check email logs
echo "\n=== CHECKING EMAIL LOGS ===\n";
$emailQuery = "SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5";
$emailStmt = $db->query($emailQuery);
$emails = $emailStmt->fetchAll(PDO::FETCH_ASSOC);

if (count($emails) > 0) {
    foreach ($emails as $email) {
        echo "---\n";
        echo "To: " . $email['recipient'] . "\n";
        echo "Subject: " . $email['subject'] . "\n";
        echo "Status: " . $email['status'] . "\n";
        echo "Created: " . $email['created_at'] . "\n";
    }
} else {
    echo "No email logs found\n";
}

// Check all recent users
echo "\n=== ALL RECENT USERS (Last 5) ===\n";
$recentQuery = "SELECT user_id, username, email, full_name, created_at FROM users ORDER BY created_at DESC LIMIT 5";
$recentStmt = $db->query($recentQuery);
$recentUsers = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($recentUsers as $u) {
    echo "- " . $u['username'] . " (" . $u['full_name'] . ") - " . $u['created_at'] . "\n";
}
?>
