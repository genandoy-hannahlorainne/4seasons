<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

// Validate basic required fields
if (empty($data->role)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Role is required'
    ]);
    exit;
}

if (empty($data->password)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password is required'
    ]);
    exit;
}

if (!empty($data->role) && !empty($data->password)) {
    
    try {
        $db->beginTransaction();
        
        // Get role_id
        $roleMap = [
            'student' => 'Student',
            'adviser' => 'Adviser',
            'clinic-staff' => 'Clinic Staff'
        ];
        
        $roleName = $roleMap[$data->role] ?? null;
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
        if ($data->role === 'student' && !empty($data->studentNumber)) {
            $username = $data->studentNumber;
        } else {
            $username = strtolower($data->firstName . '.' . $data->lastName);
        }
        
        // Check if username exists
        $checkQuery = "SELECT user_id FROM users WHERE username = :username";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":username", $username);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            throw new Exception("Username already exists");
        }
        
        // Hash password
        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
        
        // Create full name
        $full_name = trim($data->firstName . ' ' . ($data->middleName ?? '') . ' ' . $data->lastName);
        
        // Insert into users table
        $userQuery = "INSERT INTO users (role_id, username, password_hash, email, phone, full_name) 
                     VALUES (:role_id, :username, :password_hash, :email, :phone, :full_name)";
        $userStmt = $db->prepare($userQuery);
        $userStmt->bindParam(":role_id", $role_id);
        $userStmt->bindParam(":username", $username);
        $userStmt->bindParam(":password_hash", $password_hash);
        $email = $data->email ?? null;
        $userStmt->bindParam(":email", $email);
        $phone = $data->contactNumber ?? null;
        $userStmt->bindParam(":phone", $phone);
        $userStmt->bindParam(":full_name", $full_name);
        $userStmt->execute();
        
        $user_id = $db->lastInsertId();
        
        // Insert role-specific data
        if ($data->role === 'student') {
            // Validate required student fields
            if (empty($data->studentNumber) || empty($data->firstName) || empty($data->lastName)) {
                throw new Exception("Student number, first name, and last name are required");
            }
            
            $studentQuery = "INSERT INTO students 
                           (user_id, student_number, first_name, middle_name, last_name, birth_date, gender) 
                           VALUES (:user_id, :student_number, :first_name, :middle_name, :last_name, :birth_date, :gender)";
            $studentStmt = $db->prepare($studentQuery);
            $studentStmt->bindParam(":user_id", $user_id);
            $studentStmt->bindParam(":student_number", $data->studentNumber);
            $studentStmt->bindParam(":first_name", $data->firstName);
            $middleName = $data->middleName ?? null;
            $studentStmt->bindParam(":middle_name", $middleName);
            $studentStmt->bindParam(":last_name", $data->lastName);
            $birthDate = $data->birthday ?? null;
            $studentStmt->bindParam(":birth_date", $birthDate);
            
            // Convert gender to database format
            $genderMap = ['male' => 'M', 'female' => 'F', 'other' => 'Other'];
            $gender = $genderMap[strtolower($data->gender ?? '')] ?? 'Other';
            $studentStmt->bindParam(":gender", $gender);
            $studentStmt->execute();
            
        } elseif ($data->role === 'adviser') {
            $adviserQuery = "INSERT INTO advisers 
                           (user_id, first_name, last_name, contact_phone) 
                           VALUES (:user_id, :first_name, :last_name, :contact_phone)";
            $adviserStmt = $db->prepare($adviserQuery);
            $adviserStmt->bindParam(":user_id", $user_id);
            $adviserStmt->bindParam(":first_name", $data->firstName);
            $adviserStmt->bindParam(":last_name", $data->lastName);
            $contactPhone = $data->contactNumber ?? null;
            $adviserStmt->bindParam(":contact_phone", $contactPhone);
            $adviserStmt->execute();
            
        } elseif ($data->role === 'clinic-staff') {
            $staffQuery = "INSERT INTO clinic_staff 
                         (user_id, position) 
                         VALUES (:user_id, 'Staff')";
            $staffStmt = $db->prepare($staffQuery);
            $staffStmt->bindParam(":user_id", $user_id);
            $staffStmt->execute();
        }
        
        // Log activity
        $logQuery = "INSERT INTO activity_logs (user_id, action, ip_address) 
                    VALUES (:user_id, 'Registration', :ip)";
        $logStmt = $db->prepare($logQuery);
        $logStmt->bindParam(":user_id", $user_id);
        $ip = $_SERVER['REMOTE_ADDR'];
        $logStmt->bindParam(":ip", $ip);
        $logStmt->execute();
        
        $db->commit();
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful',
            'username' => $username
        ]);
        
    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Required fields are missing'
    ]);
}
?>
