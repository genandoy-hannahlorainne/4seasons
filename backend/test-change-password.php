<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Testing Change Password ===\n\n";

// Get admin user
echo "1. Finding admin user:\n";
$stmt = $db->prepare("SELECT user_id, username, password_hash FROM users WHERE username = 'admin'");
$stmt->execute();
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if ($admin) {
    echo "   Found: User ID {$admin['user_id']}, Username: {$admin['username']}\n";
    
    // Test password verification
    echo "\n2. Testing password verification:\n";
    $testPassword = "admin123";
    $isValid = password_verify($testPassword, $admin['password_hash']);
    echo "   Current password 'admin123' is " . ($isValid ? "VALID" : "INVALID") . "\n";
    
    // Test new password hash
    echo "\n3. Testing new password hash:\n";
    $newPassword = "newpassword123";
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    echo "   New password hash created: " . substr($newHash, 0, 20) . "...\n";
    
    // Simulate the update
    echo "\n4. Simulating password update:\n";
    $updateStmt = $db->prepare("UPDATE users SET password_hash = :hash WHERE user_id = :id");
    $updateStmt->bindParam(":hash", $newHash);
    $updateStmt->bindParam(":id", $admin['user_id']);
    $result = $updateStmt->execute();
    echo "   Update result: " . ($result ? "SUCCESS" : "FAILED") . "\n";
    
    // Verify the update
    echo "\n5. Verifying update:\n";
    $verifyStmt = $db->prepare("SELECT password_hash FROM users WHERE user_id = :id");
    $verifyStmt->bindParam(":id", $admin['user_id']);
    $verifyStmt->execute();
    $updated = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    $newPasswordValid = password_verify($newPassword, $updated['password_hash']);
    echo "   New password verification: " . ($newPasswordValid ? "VALID" : "INVALID") . "\n";
    
    // Reset to original password
    echo "\n6. Resetting to original password:\n";
    $resetStmt = $db->prepare("UPDATE users SET password_hash = :hash WHERE user_id = :id");
    $resetStmt->bindParam(":hash", $admin['password_hash']);
    $resetStmt->bindParam(":id", $admin['user_id']);
    $resetStmt->execute();
    echo "   Reset complete\n";
    
} else {
    echo "   Admin user not found!\n";
}

echo "\n=== End Test ===\n";
?>
