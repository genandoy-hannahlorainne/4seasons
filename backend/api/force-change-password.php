<?php
// Handle CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);
$userId = $auth->userId();

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (empty($data->current_password) || empty($data->new_password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Current password and new password are required']);
    exit();
}

// Validate new password strength
if (strlen($data->new_password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'New password must be at least 8 characters long']);
    exit();
}

try {
    // Get current user data
    $query = "SELECT password_hash, password_must_change FROM users WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit();
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Verify current password
    if (!password_verify($data->current_password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
        exit();
    }
    
    // Hash new password
    $newPasswordHash = password_hash($data->new_password, PASSWORD_BCRYPT);
    
    // Update password and clear flags
    $updateQuery = "UPDATE users 
                   SET password_hash = :password_hash,
                       password_must_change = 0,
                       password_changed_at = NOW(),
                       temp_password = NULL
                   WHERE user_id = :user_id";
    
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':password_hash', $newPasswordHash);
    $updateStmt->bindParam(':user_id', $userId);
    $updateStmt->execute();
    
    // Log activity
    $logQuery = "INSERT INTO activity_logs (user_id, action, details, ip_address) 
                VALUES (:user_id, 'Password Changed', 'User changed password (forced change)', :ip)";
    $logStmt = $db->prepare($logQuery);
    $logStmt->bindParam(':user_id', $userId);
    $ip = $_SERVER['REMOTE_ADDR'];
    $logStmt->bindParam(':ip', $ip);
    $logStmt->execute();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Error changing password: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("Error changing password: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred']);
}
?>
