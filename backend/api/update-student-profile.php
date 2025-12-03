<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: PUT, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (!isset($data->user_id)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required'
    ]);
    exit();
}

try {
    $db->beginTransaction();
    
    // Update students table
    $studentQuery = "UPDATE students SET 
                    first_name = :first_name,
                    middle_name = :middle_name,
                    last_name = :last_name,
                    birth_date = :birth_date,
                    gender = :gender,
                    grade_level = :grade_level,
                    section = :section,
                    address = :address,
                    blood_type = :blood_type,
                    emergency_contact = :emergency_contact
                    WHERE user_id = :user_id AND is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":first_name", $data->firstName);
    $middleName = $data->middleName ?? null;
    $studentStmt->bindParam(":middle_name", $middleName);
    $studentStmt->bindParam(":last_name", $data->lastName);
    $studentStmt->bindParam(":birth_date", $data->birthday);
    
    // Convert gender to database format
    $genderMap = ['male' => 'M', 'female' => 'F', 'other' => 'Other'];
    $gender = $genderMap[$data->gender] ?? 'Other';
    $studentStmt->bindParam(":gender", $gender);
    
    $studentStmt->bindParam(":grade_level", $data->gradeLevel);
    $studentStmt->bindParam(":section", $data->section);
    $studentStmt->bindParam(":address", $data->address);
    $bloodType = $data->bloodType ?? null;
    $studentStmt->bindParam(":blood_type", $bloodType);
    $studentStmt->bindParam(":emergency_contact", $data->emergencyContact);
    $studentStmt->bindParam(":user_id", $data->user_id);
    
    $studentStmt->execute();
    
    // Update users table
    $full_name = trim($data->firstName . ' ' . ($data->middleName ?? '') . ' ' . $data->lastName);
    
    $userQuery = "UPDATE users SET 
                 email = :email,
                 phone = :phone,
                 full_name = :full_name
                 WHERE user_id = :user_id";
    
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(":email", $data->email);
    $userStmt->bindParam(":phone", $data->contactNumber);
    $userStmt->bindParam(":full_name", $full_name);
    $userStmt->bindParam(":user_id", $data->user_id);
    
    $userStmt->execute();
    
    // Log activity
    $logQuery = "INSERT INTO activity_logs (user_id, action, details, ip_address) 
                VALUES (:user_id, 'Profile Update', 'Student updated their profile', :ip)";
    $logStmt = $db->prepare($logQuery);
    $logStmt->bindParam(":user_id", $data->user_id);
    $ip = $_SERVER['REMOTE_ADDR'];
    $logStmt->bindParam(":ip", $ip);
    $logStmt->execute();
    
    $db->commit();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully'
    ]);
    
} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating profile: ' . $e->getMessage()
    ]);
}
?>
