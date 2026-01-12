<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== CHECKING ADMIN ROLE ===\n\n";

// Check roles table
$query = "SELECT * FROM roles ORDER BY role_id ASC";
$stmt = $db->prepare($query);
$stmt->execute();

echo "All Roles:\n";
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['role_id']}, Name: {$row['role_name']}\n";
}

echo "\n=== CHECKING ADMIN USER ===\n";

// Check admin user
$query = "SELECT u.user_id, u.username, u.full_name, u.role_id, r.role_name
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          WHERE u.username = 'admin'";

$stmt = $db->prepare($query);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Admin User Found:\n";
    echo "  User ID: {$row['user_id']}\n";
    echo "  Username: {$row['username']}\n";
    echo "  Full Name: {$row['full_name']}\n";
    echo "  Role ID: {$row['role_id']}\n";
    echo "  Role Name: {$row['role_name']}\n";
} else {
    echo "Admin user not found!\n";
}

echo "\n=== TESTING AUTH MIDDLEWARE ===\n";

// Simulate admin user request
$_SERVER['HTTP_USER_ID'] = '33';

require_once 'middleware/auth.php';

try {
    $auth = new Auth($database);
    echo "Auth object created successfully\n";
    
    // Try to require Admin role
    $auth->requireRole('Admin');
    echo "✓ Admin role check passed!\n";
} catch (Exception $e) {
    echo "✗ Admin role check failed: " . $e->getMessage() . "\n";
}
?>
