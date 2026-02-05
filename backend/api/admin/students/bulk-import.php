<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';
require_once '../../../services/EmailService.php';

$database = new Database();
$db = $database->getConnection();

$auth = new Auth($database);
$auth->requireRole('Admin');
$adminId = $auth->userId();

// Log request for debugging
error_log("Bulk import request received from admin ID: $adminId");
error_log("FILES: " . print_r($_FILES, true));

// Check if file was uploaded
if (!isset($_FILES['csv_file'])) {
    error_log("No file uploaded in request");
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No file uploaded']);
    exit();
}

$file = $_FILES['csv_file'];

// Validate file type
$fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if ($fileExt !== 'csv') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Only CSV files are allowed']);
    exit();
}

// Validate file size (max 5MB)
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File size exceeds 5MB limit']);
    exit();
}

try {
    $db->beginTransaction();
    
    $handle = fopen($file['tmp_name'], 'r');
    if ($handle === false) {
        throw new Exception('Failed to open CSV file');
    }
    
    // Read header row
    $header = fgetcsv($handle);
    if ($header === false) {
        throw new Exception('CSV file is empty');
    }
    
    // Expected columns: student_number, first_name, last_name, email, grade_level, section, gender, date_of_birth
    $requiredColumns = ['student_number', 'first_name', 'last_name', 'email', 'grade_level', 'section'];
    $headerMap = array_flip(array_map('strtolower', array_map('trim', $header)));
    
    foreach ($requiredColumns as $col) {
        if (!isset($headerMap[$col])) {
            throw new Exception("Missing required column: $col");
        }
    }
    
    $successCount = 0;
    $errorCount = 0;
    $errors = [];
    $rowNumber = 1;
    
    // Get student role_id
    $roleQuery = "SELECT role_id FROM roles WHERE role_name = 'Student'";
    $roleStmt = $db->prepare($roleQuery);
    $roleStmt->execute();
    $studentRoleId = $roleStmt->fetchColumn();
    
    if (!$studentRoleId) {
        throw new Exception('Student role not found in database');
    }
    
    while (($row = fgetcsv($handle)) !== false) {
        $rowNumber++;
        
        try {
            // Map CSV columns to data
            $studentNumber = trim($row[$headerMap['student_number']] ?? '');
            $firstName = trim($row[$headerMap['first_name']] ?? '');
            $lastName = trim($row[$headerMap['last_name']] ?? '');
            $email = trim($row[$headerMap['email']] ?? '');
            $phone = trim($row[$headerMap['phone']] ?? '');
            $gradeLevel = trim($row[$headerMap['grade_level']] ?? '');
            $section = trim($row[$headerMap['section']] ?? '');
            $gender = trim($row[$headerMap['gender']] ?? 'Other');
            $dateOfBirth = trim($row[$headerMap['date_of_birth']] ?? '');
            
            // Validate required fields
            if (empty($studentNumber) || empty($firstName) || empty($lastName) || empty($email)) {
                throw new Exception("Missing required fields");
            }
            
            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception("Invalid email format: $email");
            }
            
            // Check if student number already exists
            $checkQuery = "SELECT student_id FROM students WHERE student_number = :student_number";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':student_number', $studentNumber);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                throw new Exception("Student number already exists: $studentNumber");
            }
            
            // Check if email already exists
            $checkEmailQuery = "SELECT user_id FROM users WHERE email = :email";
            $checkEmailStmt = $db->prepare($checkEmailQuery);
            $checkEmailStmt->bindParam(':email', $email);
            $checkEmailStmt->execute();
            
            if ($checkEmailStmt->rowCount() > 0) {
                throw new Exception("Email already exists: $email");
            }
            
            // Generate username from student number
            $username = strtolower($studentNumber);
            
            // Generate temporary password
            $tempPassword = 'Student' . rand(1000, 9999);
            $passwordHash = password_hash($tempPassword, PASSWORD_BCRYPT);
            
            // Create user account
            $userQuery = "INSERT INTO users (role_id, username, password_hash, email, phone, full_name, is_active, password_must_change, temp_password, created_by_admin_id) 
                         VALUES (:role_id, :username, :password_hash, :email, :phone, :full_name, 1, 1, :temp_password, :admin_id)";
            $userStmt = $db->prepare($userQuery);
            $fullName = $firstName . ' ' . $lastName;
            $userStmt->bindParam(':role_id', $studentRoleId);
            $userStmt->bindParam(':username', $username);
            $userStmt->bindParam(':password_hash', $passwordHash);
            $userStmt->bindParam(':email', $email);
            $userStmt->bindParam(':phone', $phone);
            $userStmt->bindParam(':full_name', $fullName);
            $userStmt->bindParam(':temp_password', $tempPassword);
            $userStmt->bindParam(':admin_id', $adminId);
            $userStmt->execute();
            
            $userId = $db->lastInsertId();
            
            // Create student profile
            $studentQuery = "INSERT INTO students (user_id, student_number, first_name, last_name, grade_level, section, gender, date_of_birth, is_active) 
                            VALUES (:user_id, :student_number, :first_name, :last_name, :grade_level, :section, :gender, :date_of_birth, 1)";
            $studentStmt = $db->prepare($studentQuery);
            $studentStmt->bindParam(':user_id', $userId);
            $studentStmt->bindParam(':student_number', $studentNumber);
            $studentStmt->bindParam(':first_name', $firstName);
            $studentStmt->bindParam(':last_name', $lastName);
            $studentStmt->bindParam(':grade_level', $gradeLevel);
            $studentStmt->bindParam(':section', $section);
            $studentStmt->bindParam(':gender', $gender);
            
            if (!empty($dateOfBirth)) {
                $studentStmt->bindParam(':date_of_birth', $dateOfBirth);
            } else {
                $nullValue = null;
                $studentStmt->bindParam(':date_of_birth', $nullValue);
            }
            
            $studentStmt->execute();
            
            // Send welcome email with credentials
            try {
                $emailService = new EmailService($database);
                $emailService->sendStudentCredentials($email, $fullName, $username, $tempPassword);
            } catch (Exception $e) {
                error_log("Failed to send email to $email: " . $e->getMessage());
            }
            
            $successCount++;
            
        } catch (Exception $e) {
            $errorCount++;
            $errors[] = [
                'row' => $rowNumber,
                'student_number' => $studentNumber ?? 'N/A',
                'error' => $e->getMessage()
            ];
        }
    }
    
    fclose($handle);
    
    $db->commit();
    
    // Log activity
    $logQuery = "INSERT INTO activity_logs (user_id, action, details, ip_address) 
                VALUES (:user_id, 'Bulk Student Import', :details, :ip)";
    $logStmt = $db->prepare($logQuery);
    $details = "Imported $successCount students, $errorCount errors";
    $logStmt->bindParam(':user_id', $adminId);
    $logStmt->bindParam(':details', $details);
    $ip = $_SERVER['REMOTE_ADDR'];
    $logStmt->bindParam(':ip', $ip);
    $logStmt->execute();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Import completed: $successCount successful, $errorCount failed",
        'success_count' => $successCount,
        'error_count' => $errorCount,
        'errors' => $errors
    ]);
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Bulk import error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
