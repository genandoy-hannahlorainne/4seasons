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
        $userQuery = "INSERT INTO users (role_id, username, password_hash, email, phone, full_name, is_active) 
                     VALUES (:role_id, :username, :password_hash, :email, :phone, :full_name, 1)";
        $userStmt = $db->prepare($userQuery);
        $userStmt->bindParam(":role_id", $role_id);
        $userStmt->bindParam(":username", $username);
        $userStmt->bindParam(":password_hash", $password_hash);
        $email = $data->email ?? null;
        $userStmt->bindParam(":email", $email);
        $phone = $data->contactNumber ?? $data->phone ?? null;
        $userStmt->bindParam(":phone", $phone);
        $userStmt->bindParam(":full_name", $full_name);
        $userStmt->execute();
        
        $user_id = $db->lastInsertId();
        
        // Insert role-specific data
        if ($data->role === 'student') {
            // Log incoming student data for debugging
            error_log("Student registration data: " . json_encode([
                'studentNumber' => $data->studentNumber ?? 'MISSING',
                'firstName' => $data->firstName ?? 'MISSING',
                'middleName' => $data->middleName ?? 'MISSING',
                'lastName' => $data->lastName ?? 'MISSING',
                'gender' => $data->gender ?? 'MISSING',
                'birthday' => $data->birthday ?? 'MISSING',
                'gradeLevel' => $data->gradeLevel ?? 'MISSING',
                'section' => $data->section ?? 'MISSING'
            ]));
            
            // Validate required student fields
            if (empty($data->studentNumber) || empty($data->firstName) || empty($data->lastName)) {
                throw new Exception("Student number, first name, and last name are required");
            }
            
            // Check if student number already exists
            $checkStudentQuery = "SELECT student_id FROM students WHERE student_number = :student_number";
            $checkStudentStmt = $db->prepare($checkStudentQuery);
            $checkStudentStmt->bindParam(":student_number", $data->studentNumber);
            $checkStudentStmt->execute();
            
            if ($checkStudentStmt->rowCount() > 0) {
                throw new Exception("Student number already exists");
            }
            
            $studentQuery = "INSERT INTO students 
                           (user_id, student_number, first_name, middle_name, last_name, birth_date, gender, grade_level, section, is_active) 
                           VALUES (:user_id, :student_number, :first_name, :middle_name, :last_name, :birth_date, :gender, :grade_level, :section, 1)";
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
            
            // Grade level and section
            $gradeLevel = $data->gradeLevel ?? null;
            $studentStmt->bindParam(":grade_level", $gradeLevel);
            $section = $data->section ?? null;
            $studentStmt->bindParam(":section", $section);
            $studentStmt->execute();
            
            $student_id = $db->lastInsertId();
            
            // Auto-assign adviser based on grade level and section
            if (!empty($gradeLevel) && !empty($section)) {
                $adviserQuery = "SELECT adviser_id, user_id FROM advisers 
                               WHERE grade_level = :grade_level 
                               AND section = :section 
                               AND is_active = 1 
                               LIMIT 1";
                $adviserStmt = $db->prepare($adviserQuery);
                $adviserStmt->bindParam(":grade_level", $gradeLevel);
                $adviserStmt->bindParam(":section", $section);
                $adviserStmt->execute();
                
                if ($adviserStmt->rowCount() > 0) {
                    $adviserRow = $adviserStmt->fetch(PDO::FETCH_ASSOC);
                    $adviser_id = $adviserRow['adviser_id'];
                    $adviser_user_id = $adviserRow['user_id'];
                    
                    // Update student with adviser (using user_id for foreign key)
                    $updateAdviserQuery = "UPDATE students SET current_adviser_id = :adviser_user_id WHERE student_id = :student_id";
                    $updateAdviserStmt = $db->prepare($updateAdviserQuery);
                    $updateAdviserStmt->bindParam(":adviser_user_id", $adviser_user_id);
                    $updateAdviserStmt->bindParam(":student_id", $student_id);
                    $updateAdviserStmt->execute();
                    
                    // Also add to student_adviser junction table
                    $junctionQuery = "INSERT INTO student_adviser (student_id, adviser_id, assigned_date) 
                                    VALUES (:student_id, :adviser_id, CURDATE())";
                    $junctionStmt = $db->prepare($junctionQuery);
                    $junctionStmt->bindParam(":student_id", $student_id);
                    $junctionStmt->bindParam(":adviser_id", $adviser_id);
                    $junctionStmt->execute();
                }
            }
            
            // Generate QR code for the student
            $qr_token = bin2hex(random_bytes(16));
            $qr_expires_at = date('Y-m-d H:i:s', strtotime('+1 year'));
            
            $qrQuery = "INSERT INTO qr_codes (student_id, qr_token, qr_generated_at, qr_expires_at) 
                       VALUES (:student_id, :qr_token, NOW(), :qr_expires_at)";
            $qrStmt = $db->prepare($qrQuery);
            $qrStmt->bindParam(":student_id", $student_id);
            $qrStmt->bindParam(":qr_token", $qr_token);
            $qrStmt->bindParam(":qr_expires_at", $qr_expires_at);
            $qrStmt->execute();
            
        } elseif ($data->role === 'adviser') {
            $adviserQuery = "INSERT INTO advisers 
                           (user_id, first_name, last_name, contact_phone, grade_level, section, is_active) 
                           VALUES (:user_id, :first_name, :last_name, :contact_phone, :grade_level, :section, 1)";
            $adviserStmt = $db->prepare($adviserQuery);
            $adviserStmt->bindParam(":user_id", $user_id);
            $adviserStmt->bindParam(":first_name", $data->firstName);
            $adviserStmt->bindParam(":last_name", $data->lastName);
            $contactPhone = $data->contactNumber ?? $data->phone ?? null;
            $adviserStmt->bindParam(":contact_phone", $contactPhone);
            $gradeLevel = $data->gradeLevel ?? null;
            $adviserStmt->bindParam(":grade_level", $gradeLevel);
            $section = $data->section ?? null;
            $adviserStmt->bindParam(":section", $section);
            $adviserStmt->execute();
            
        } elseif ($data->role === 'clinic-staff') {
            // Validate required clinic staff fields
            if (empty($data->firstName) || empty($data->lastName)) {
                throw new Exception("First name and last name are required for clinic staff");
            }
            
            $staffQuery = "INSERT INTO clinic_staff 
                         (user_id, position, is_active) 
                         VALUES (:user_id, :position, 1)";
            $staffStmt = $db->prepare($staffQuery);
            $staffStmt->bindParam(":user_id", $user_id);
            $position = $data->position ?? 'Staff';
            $staffStmt->bindParam(":position", $position);
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
