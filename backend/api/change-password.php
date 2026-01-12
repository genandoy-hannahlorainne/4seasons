<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
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
if (empty($data->user_id) || empty($data->current_password) || empty($data->new_password)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'User ID, current password, and new password are required'
    ]);
    exit();
}

try {
    // Get current password hash from database
    $query = "SELECT password_hash FROM users WHERE user_id = :user_id AND is_active = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $data->user_id);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
        exit();
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Verify current password
    if (!password_verify($data->current_password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Current password is incorrect'
        ]);
        exit();
    }
    
    // Hash new password
    $new_password_hash = password_hash($data->new_password, PASSWORD_BCRYPT);
    
    // Update password
    $updateQuery = "UPDATE users SET password_hash = :password_hash WHERE user_id = :user_id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(":password_hash", $new_password_hash);
    $updateStmt->bindParam(":user_id", $data->user_id);
    $updateStmt->execute();
    
    // Log activity
    $logQuery = "INSERT INTO activity_logs (user_id, action, ip_address) 
                VALUES (:user_id, 'Password Changed', :ip)";
    $logStmt = $db->prepare($logQuery);
    $logStmt->bindParam(":user_id", $data->user_id);
    $ip = $_SERVER['REMOTE_ADDR'];
    $logStmt->bindParam(":ip", $ip);
    $logStmt->execute();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error changing password: ' . $e->getMessage()
    ]);
}
?>
