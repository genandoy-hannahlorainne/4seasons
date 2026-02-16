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
    error_log("=== UPDATE ADVISER PROFILE ===");
    error_log("User ID: " . $userId);
    error_log("Input data: " . json_encode($input));
    
    // Get adviser_id from user_id
    $adviserQuery = "SELECT adviser_id FROM advisers WHERE user_id = :user_id AND is_active = 1";
    $adviserStmt = $db->prepare($adviserQuery);
    $adviserStmt->bindParam(':user_id', $userId);
    $adviserStmt->execute();
    
    if ($adviserStmt->rowCount() === 0) {
        error_log("❌ Adviser not found for user_id: " . $userId);
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Adviser not found'
        ]);
        exit;
    }
    
    $adviser = $adviserStmt->fetch(PDO::FETCH_ASSOC);
    $adviserId = $adviser['adviser_id'];
    error_log("✅ Found adviser_id: " . $adviserId);
    
    // Update advisers table (contact_phone)
    if ($phone !== null) {
        $updateAdviserQuery = "UPDATE advisers SET contact_phone = :contact_phone WHERE adviser_id = :adviser_id";
        $updateAdviserStmt = $db->prepare($updateAdviserQuery);
        $updateAdviserStmt->bindParam(':adviser_id', $adviserId);
        $updateAdviserStmt->bindParam(':contact_phone', $phone);
        $updateAdviserStmt->execute();
        error_log("✅ Advisers table updated with contact_phone: " . $phone);
    }
    
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
    $updateUserStmt->bindParam(':phone', $phone);
    
    $updateUserStmt->execute();
    error_log("✅ Users table updated");
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'data' => [
            'adviser_id' => $adviserId,
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