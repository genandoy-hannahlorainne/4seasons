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

// Handle both formats: individual names OR full_name
$firstName = $input['firstName'] ?? $input['first_name'] ?? null;
$middleName = $input['middleName'] ?? $input['middle_name'] ?? null;
$lastName = $input['lastName'] ?? $input['last_name'] ?? null;
$fullName = $input['full_name'] ?? null;

// If full_name is provided but individual names are not, try to parse it
if ($fullName && (!$firstName || !$lastName)) {
    $nameParts = explode(' ', trim($fullName));
    if (count($nameParts) >= 2) {
        $firstName = $nameParts[0];
        $lastName = end($nameParts);
        if (count($nameParts) > 2) {
            $middleName = implode(' ', array_slice($nameParts, 1, -1));
        }
    } else {
        $firstName = $fullName;
        $lastName = '';
    }
}

$gender = $input['gender'] ?? null;
$birthday = $input['birthday'] ?? $input['birth_date'] ?? null;
$gradeLevel = $input['gradeLevel'] ?? $input['grade_level'] ?? null;
$section = $input['section'] ?? null;
$address = $input['address'] ?? null;
$bloodType = $input['bloodType'] ?? $input['blood_type'] ?? null;
$emergencyContact = $input['emergency_contact'] ?? $input['emergency_contact_person'] ?? null;
$emergencyContactRelation = $input['emergency_contact_relation'] ?? null;
$emergencyContactPhone = $input['emergency_contact_phone'] ?? $input['phone_number'] ?? null;
$contactNumber = $input['contactNumber'] ?? $input['phone'] ?? null;
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
    error_log("=== UPDATE STUDENT PROFILE ===");
    error_log("User ID: " . $userId);
    error_log("Input data: " . json_encode($input));
    
    // Get student_id from user_id
    $studentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':user_id', $userId);
    $studentStmt->execute();
    
    if ($studentStmt->rowCount() === 0) {
        error_log("❌ Student not found for user_id: " . $userId);
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Student not found'
        ]);
        exit;
    }
    
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    $studentId = $student['student_id'];
    error_log("✅ Found student_id: " . $studentId);
    
    // Convert gender to database format if needed
    if ($gender) {
        $genderLower = strtolower($gender);
        if ($genderLower === 'male' || $genderLower === 'm') {
            $genderDb = 'M';
        } elseif ($genderLower === 'female' || $genderLower === 'f') {
            $genderDb = 'F';
        } else {
            $genderDb = $gender; // Keep as is if already in correct format
        }
    } else {
        $genderDb = null;
    }
    
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
                            emergency_contact = :emergency_contact,
                            emergency_contact_relation = :emergency_contact_relation,
                            emergency_contact_phone = :emergency_contact_phone
                          WHERE student_id = :student_id";
    
    $updateStudentStmt = $db->prepare($updateStudentQuery);
    $updateStudentStmt->bindParam(':student_id', $studentId);
    $updateStudentStmt->bindParam(':first_name', $firstName);
    $updateStudentStmt->bindParam(':middle_name', $middleName);
    $updateStudentStmt->bindParam(':last_name', $lastName);
    $updateStudentStmt->bindParam(':birth_date', $birthday);
    $updateStudentStmt->bindParam(':gender', $genderDb);
    $updateStudentStmt->bindParam(':grade_level', $gradeLevel);
    $updateStudentStmt->bindParam(':section', $section);
    $updateStudentStmt->bindParam(':address', $address);
    $updateStudentStmt->bindParam(':blood_type', $bloodType);
    $updateStudentStmt->bindParam(':emergency_contact', $emergencyContact);
    $updateStudentStmt->bindParam(':emergency_contact_relation', $emergencyContactRelation);
    $updateStudentStmt->bindParam(':emergency_contact_phone', $emergencyContactPhone);
    
    $updateStudentStmt->execute();
    error_log("✅ Students table updated");
    
    // Handle emergency contact - create/update parent record if emergency contact info is provided
    if (!empty($emergencyContact) && !empty($emergencyContactPhone)) {
        error_log("Processing emergency contact as parent record");
        
        // Check if parent already exists for this student
        $checkParentQuery = "SELECT p.parent_id, p.phone, p.email 
                            FROM parents p
                            INNER JOIN student_parent sp ON p.parent_id = sp.parent_id
                            WHERE sp.student_id = :student_id 
                            AND p.relation = :relation
                            LIMIT 1";
        $checkParentStmt = $db->prepare($checkParentQuery);
        $checkParentStmt->bindParam(':student_id', $studentId);
        $checkParentStmt->bindParam(':relation', $emergencyContactRelation);
        $checkParentStmt->execute();
        $existingParent = $checkParentStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingParent) {
            // Update existing parent record
            error_log("Updating existing parent record: " . $existingParent['parent_id']);
            
            // Parse emergency contact name
            $nameParts = explode(' ', trim($emergencyContact));
            $parentFirstName = $nameParts[0];
            $parentLastName = count($nameParts) > 1 ? end($nameParts) : '';
            
            $updateParentQuery = "UPDATE parents SET 
                                 first_name = :first_name,
                                 last_name = :last_name,
                                 phone = :phone,
                                 address = :address
                                 WHERE parent_id = :parent_id";
            $updateParentStmt = $db->prepare($updateParentQuery);
            $updateParentStmt->bindParam(':parent_id', $existingParent['parent_id']);
            $updateParentStmt->bindParam(':first_name', $parentFirstName);
            $updateParentStmt->bindParam(':last_name', $parentLastName);
            $updateParentStmt->bindParam(':phone', $emergencyContactPhone);
            $updateParentStmt->bindParam(':address', $address);
            $updateParentStmt->execute();
            
            error_log("✅ Parent record updated");
        } else {
            // Create new parent record
            error_log("Creating new parent record");
            
            // Parse emergency contact name
            $nameParts = explode(' ', trim($emergencyContact));
            $parentFirstName = $nameParts[0];
            $parentLastName = count($nameParts) > 1 ? end($nameParts) : '';
            
            $insertParentQuery = "INSERT INTO parents (first_name, last_name, relation, phone, address, is_active) 
                                 VALUES (:first_name, :last_name, :relation, :phone, :address, 1)";
            $insertParentStmt = $db->prepare($insertParentQuery);
            $insertParentStmt->bindParam(':first_name', $parentFirstName);
            $insertParentStmt->bindParam(':last_name', $parentLastName);
            $insertParentStmt->bindParam(':relation', $emergencyContactRelation);
            $insertParentStmt->bindParam(':phone', $emergencyContactPhone);
            $insertParentStmt->bindParam(':address', $address);
            $insertParentStmt->execute();
            
            $parentId = $db->lastInsertId();
            error_log("✅ Parent record created with ID: " . $parentId);
            
            // Link student to parent
            $linkQuery = "INSERT INTO student_parent (student_id, parent_id, relationship_note) 
                         VALUES (:student_id, :parent_id, :relationship_note)";
            $linkStmt = $db->prepare($linkQuery);
            $linkStmt->bindParam(':student_id', $studentId);
            $linkStmt->bindParam(':parent_id', $parentId);
            $relationshipNote = "Emergency Contact";
            $linkStmt->bindParam(':relationship_note', $relationshipNote);
            $linkStmt->execute();
            
            error_log("✅ Student linked to parent");
        }
    }
    
    // Build full name for users table
    $fullName = trim($firstName . ' ' . ($middleName ? $middleName . ' ' : '') . $lastName);
    
    // Update users table
    $updateUserQuery = "UPDATE users SET 
                        full_name = :full_name,
                        email = :email,
                        phone = :phone
                      WHERE user_id = :user_id";
    
    $updateUserStmt = $db->prepare($updateUserQuery);
    $updateUserStmt->bindParam(':user_id', $userId);
    $updateUserStmt->bindParam(':full_name', $fullName);
    $updateUserStmt->bindParam(':email', $email);
    $updateUserStmt->bindParam(':phone', $contactNumber);
    
    $updateUserStmt->execute();
    error_log("✅ Users table updated with full_name: " . $fullName);
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'data' => [
            'student_id' => $studentId,
            'user_id' => $userId,
            'full_name' => $fullName
        ]
    ]);

} catch (PDOException $e) {
    error_log("❌ Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
