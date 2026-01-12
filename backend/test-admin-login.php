<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Testing Admin Login ===\n\n";

// Check admin user
$stmt = $db->query("SELECT u.user_id, u.username, u.password_hash, r.role_id, r.role_name 
                    FROM users u 
                    JOIN roles r ON u.role_id = r.role_id 
                    WHERE u.username = 'admin'");
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if ($admin) {
    echo "✓ Admin user found:\n";
    echo "  User ID: {$admin['user_id']}\n";
    echo "  Username: {$admin['username']}\n";
    echo "  Role ID: {$admin['role_id']}\n";
    echo "  Role Name: '{$admin['role_name']}'\n\n";
    
    // Test password
    $testPassword = 'admin123';
    if (password_verify($testPassword, $admin['password_hash'])) {
        echo "✓ Password verification: SUCCESS\n";
        echo "  Password 'admin123' is correct\n\n";
    } else {
        echo "✗ Password verification: FAILED\n";
        echo "  Password 'admin123' is incorrect\n\n";
    }
    
    // Check role name case
    echo "Role name checks:\n";
    echo "  role_name === 'Admin': " . ($admin['role_name'] === 'Admin' ? 'TRUE' : 'FALSE') . "\n";
    echo "  role_name === 'admin': " . ($admin['role_name'] === 'admin' ? 'TRUE' : 'FALSE') . "\n";
    echo "  strtolower(role_name) === 'admin': " . (strtolower($admin['role_name']) === 'admin' ? 'TRUE' : 'FALSE') . "\n";
    
} else {
    echo "✗ Admin user NOT found!\n";
    echo "  Please run: php create-admin-user.php\n";
}
?>
