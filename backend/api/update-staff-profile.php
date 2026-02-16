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
$fullName = $input['full_name'] ?? null;
$email = $input['email'] ?? null;
$phone = $input['phone'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required'
    ]);
    exit;
}

try {
    error_log("=== UPDATE STAFF PROFILE ===");
    error_log("User ID: " . $userId);
    error_log("Input data: " . json_encode($input));
    
    // Get clinic_staff_id from user_id
    $staffQuery = "SELECT clinic_staff_id FROM clinic_staff WHERE user_id = :user_id AND is_active = 1";
    $staffStmt = $db->prepare($staffQuery);
    $staffStmt->bindParam(':user_id', $userId);
    $staffStmt->execute();
    
    if ($staffStmt->rowCount() === 0) {
        error_log("❌ Staff not found for user_id: " . $userId);
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Staff not found'
        ]);
        exit;
    }
    
    $staff = $staffStmt->fetch(PDO::FETCH_ASSOC);
    $staffId = $staff['clinic_staff_id'];
    error_log("✅ Found clinic_staff_id: " . $staffId);
    
    // Update users table (clinic_staff table doesn't have phone field)
    $updateUserQuery = "UPDATE users SET 
                        full_name = :full_name,
                        email = :email,
                        phone = :phone
                      WHERE user_id = :user_id";
    
    $updateUserStmt = $db->prepare($updateUserQuery);
    $updateUserStmt->bindParam(':user_id', $userId);
    $updateUserStmt->bindParam(':full_name', $fullName);
    $updateUserStmt->bindParam(':email', $email);
    $updateUserStmt->bindParam(':phone', $phone);
    
    $updateUserStmt->execute();
    error_log("✅ Users table updated");
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'data' => [
            'clinic_staff_id' => $staffId,
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