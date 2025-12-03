<?php
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

// Simulate a student registration
$testData = [
    'role' => 'student',
    'studentNumber' => '2023-00435-TG-0',
    'firstName' => 'Mitka',
    'middleName' => 'Pacoma',
    'lastName' => 'Test',
    'gender' => 'male',
    'birthday' => '2000-01-01',
    'contactNumber' => '09123456789',
    'email' => 'test@example.com',
    'password' => 'password123'
];

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection failed");
    }
    
    $db->beginTransaction();
    
    // Get role_id
    $roleMap = [
        'student' => 'Student',
        'adviser' => 'Adviser',
        'clinic-staff' => 'Clinic Staff'
    ];
    
    $roleName = $roleMap[$testData['role']] ?? null;
    if (!$roleName) {
        throw new Exception("Invalid role");
    }
    
    $roleQuery = "SELECT role_id FROM roles WHERE role_name = :role_name";
    $roleStmt = $db->prepare($roleQuery);
    $roleStmt->bindParam(":role_name", $roleName);
    $roleStmt->execute();
    $roleRow = $roleStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$roleRow) {
        throw new Exception("Role not found");
    }
    
    $role_id = $roleRow['role_id'];
    
    // Create username
    $username = $testData['studentNumber'];
    
    // Check if username exists
    $checkQuery = "SELECT user_id FROM users WHERE username = :username";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":username", $username);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        throw new Exception("Username already exists - test user may already be in database");
    }
    
    // Hash password
    $password_hash = password_hash($testData['password'], PASSWORD_BCRYPT);
    
    // Create full name
    $full_name = trim($testData['firstName'] . ' ' . $testData['middleName'] . ' ' . $testData['lastName']);
    
    // Insert into users table
    $userQuery = "INSERT INTO users (role_id, username, password_hash, email, phone, full_name) 
                 VALUES (:role_id, :username, :password_hash, :email, :phone, :full_name)";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(":role_id", $role_id);
    $userStmt->bindParam(":username", $username);
    $userStmt->bindParam(":password_hash", $password_hash);
    $userStmt->bindParam(":email", $testData['email']);
    $userStmt->bindParam(":phone", $testData['contactNumber']);
    $userStmt->bindParam(":full_name", $full_name);
    $userStmt->execute();
    
    $user_id = $db->lastInsertId();
    
    // Insert into students table
    $studentQuery = "INSERT INTO students 
                   (user_id, student_number, first_name, middle_name, last_name, birth_date, gender) 
                   VALUES (:user_id, :student_number, :first_name, :middle_name, :last_name, :birth_date, :gender)";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":user_id", $user_id);
    $studentStmt->bindParam(":student_number", $testData['studentNumber']);
    $studentStmt->bindParam(":first_name", $testData['firstName']);
    $studentStmt->bindParam(":middle_name", $testData['middleName']);
    $studentStmt->bindParam(":last_name", $testData['lastName']);
    $studentStmt->bindParam(":birth_date", $testData['birthday']);
    
    // Convert gender to database format
    $genderMap = ['male' => 'M', 'female' => 'F', 'other' => 'Other'];
    $gender = $genderMap[strtolower($testData['gender'])] ?? 'Other';
    $studentStmt->bindParam(":gender", $gender);
    $studentStmt->execute();
    
    // Log activity
    $logQuery = "INSERT INTO activity_logs (user_id, action, ip_address) 
                VALUES (:user_id, 'Registration', :ip)";
    $logStmt = $db->prepare($logQuery);
    $logStmt->bindParam(":user_id", $user_id);
    $ip = '127.0.0.1';
    $logStmt->bindParam(":ip", $ip);
    $logStmt->execute();
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Test registration successful',
        'username' => $username,
        'user_id' => $user_id
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'code' => $e->getCode()
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
