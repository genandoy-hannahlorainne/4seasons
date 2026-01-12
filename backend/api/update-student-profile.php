<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get JSON input
$input = json_decode(file_get_contents("php://input"), true);

$userId = $input['user_id'] ?? null;
$firstName = $input['firstName'] ?? null;
$middleName = $input['middleName'] ?? null;
$lastName = $input['lastName'] ?? null;
$gender = $input['gender'] ?? null;
$birthday = $input['birthday'] ?? null;
$gradeLevel = $input['gradeLevel'] ?? null;
$section = $input['section'] ?? null;
$address = $input['address'] ?? null;
$bloodType = $input['bloodType'] ?? null;
$emergencyContact = $input['emergencyContact'] ?? null;
$contactNumber = $input['contactNumber'] ?? null;
$email = $input['email'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required'
    ]);
    exit;
}

try {
    // Get student_id from user_id
    $studentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':user_id', $userId);
    $studentStmt->execute();
    
    if ($studentStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Student not found'
        ]);
        exit;
    }
    
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    $studentId = $student['student_id'];
    
    // Update students table
    $updateStudentQuery = "UPDATE students SET 
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
                          WHERE student_id = :student_id";
    
    $updateStudentStmt = $db->prepare($updateStudentQuery);
    $updateStudentStmt->bindParam(':student_id', $studentId);
    $updateStudentStmt->bindParam(':first_name', $firstName);
    $updateStudentStmt->bindParam(':middle_name', $middleName);
    $updateStudentStmt->bindParam(':last_name', $lastName);
    $updateStudentStmt->bindParam(':birth_date', $birthday);
    
    // Convert gender from form format to database format
    $genderDb = $gender === 'male' ? 'M' : ($gender === 'female' ? 'F' : 'Other');
    $updateStudentStmt->bindParam(':gender', $genderDb);
    
    $updateStudentStmt->bindParam(':grade_level', $gradeLevel);
    $updateStudentStmt->bindParam(':section', $section);
    $updateStudentStmt->bindParam(':address', $address);
    $updateStudentStmt->bindParam(':blood_type', $bloodType);
    $updateStudentStmt->bindParam(':emergency_contact', $emergencyContact);
    
    $updateStudentStmt->execute();
    
    // Update users table
    $updateUserQuery = "UPDATE users SET 
                        email = :email,
                        phone = :phone
                      WHERE user_id = :user_id";
    
    $updateUserStmt = $db->prepare($updateUserQuery);
    $updateUserStmt->bindParam(':user_id', $userId);
    $updateUserStmt->bindParam(':email', $email);
    $updateUserStmt->bindParam(':phone', $contactNumber);
    
    $updateUserStmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'data' => [
            'student_id' => $studentId,
            'user_id' => $userId
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
