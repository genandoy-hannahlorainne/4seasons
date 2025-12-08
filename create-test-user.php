<?php
// Quick script to create a test user in Docker database
// Run: docker exec -i 4seasons-backend php /var/www/html/create-test-user.php

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

// Test user credentials
$username = "testuser";
$password = "password123";
$email = "test@example.com";
$full_name = "Test User";
$role_id = 2; // Student role

// Hash password
$password_hash = password_hash($password, PASSWORD_BCRYPT);

try {
    // Check if user exists
    $checkQuery = "SELECT user_id FROM users WHERE username = :username";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":username", $username);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        echo "User '$username' already exists!\n";
        echo "Username: $username\n";
        echo "Password: $password\n";
        exit(0);
    }
    
    // Create user
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
        
        // Create student record
        $studentQuery = "INSERT INTO students (user_id, student_number, first_name, last_name, is_active) 
                        VALUES (:user_id, :student_number, :first_name, :last_name, 1)";
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->bindParam(":user_id", $user_id);
        $student_number = "TEST-001";
        $studentStmt->bindParam(":student_number", $student_number);
        $first_name = "Test";
        $studentStmt->bindParam(":first_name", $first_name);
        $last_name = "User";
        $studentStmt->bindParam(":last_name", $last_name);
        $studentStmt->execute();
        
        echo "✓ Test user created successfully!\n\n";
        echo "Login credentials:\n";
        echo "Username: $username\n";
        echo "Password: $password\n";
    } else {
        echo "✗ Failed to create user\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
