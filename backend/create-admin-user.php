<?php
// Quick script to create an admin user in the database
// Run from backend directory: php create-admin-user.php

require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

// Admin user credentials
$username = "admin";
$password = "admin123";
$email = "admin@4seasons.local";
$full_name = "System Administrator";
$role_id = 1; // Admin role

// Hash password
$password_hash = password_hash($password, PASSWORD_BCRYPT);

try {
    // Check if user exists
    $checkQuery = "SELECT user_id FROM users WHERE username = :username";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":username", $username);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        echo "Admin user '$username' already exists!\n";
        echo "Username: $username\n";
        echo "Password: $password\n";
        exit(0);
    }
    
    // Create admin user
    $query = "INSERT INTO users (role_id, username, password_hash, email, full_name, is_active) 
              VALUES (:role_id, :username, :password_hash, :email, :full_name, 1)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":role_id", $role_id);
    $stmt->bindParam(":username", $username);
    $stmt->bindParam(":password_hash", $password_hash);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":full_name", $full_name);
    
    if ($stmt->execute()) {
        $user_id = $db->lastInsertId();
        
        // Log activity
        $logQuery = "INSERT INTO activity_logs (user_id, action, ip_address, created_at) 
                    VALUES (:user_id, :action, :ip_address, NOW())";
        $logStmt = $db->prepare($logQuery);
        $logStmt->bindParam(":user_id", $user_id);
        $action = "Admin Account Created";
        $logStmt->bindParam(":action", $action);
        $ip = "127.0.0.1";
        $logStmt->bindParam(":ip_address", $ip);
        $logStmt->execute();
        
        echo "✓ Admin user created successfully!\n\n";
        echo "Login credentials:\n";
        echo "Username: $username\n";
        echo "Password: $password\n";
        echo "Email: $email\n";
    } else {
        echo "✗ Failed to create admin user\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
