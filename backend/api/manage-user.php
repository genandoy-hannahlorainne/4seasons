<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = isset($_GET['action']) ? $_GET['action'] : null;
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    
    if ($method === 'GET' && $action === 'view' && $user_id) {
        // Get user details
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                         r.role_name
                  FROM users u
                  JOIN roles r ON u.role_id = r.role_id
                  WHERE u.user_id = ?";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
        
    } elseif ($method === 'PUT' && $action === 'update' && $user_id) {
        // Update user
        $data = json_decode(file_get_contents("php://input"), true);
        
        $updates = [];
        $params = [];
        
        if (isset($data['full_name'])) {
            $updates[] = "full_name = ?";
            $params[] = $data['full_name'];
        }
        if (isset($data['email'])) {
            $updates[] = "email = ?";
            $params[] = $data['email'];
        }
        if (isset($data['phone'])) {
            $updates[] = "phone = ?";
            $params[] = $data['phone'];
        }
        if (isset($data['is_active'])) {
            $updates[] = "is_active = ?";
            $params[] = $data['is_active'] ? 1 : 0;
        }
        
        if (empty($updates)) {
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            exit;
        }
        
        $params[] = $user_id;
        $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE user_id = ?";
        
        $stmt = $db->prepare($query);
        if ($stmt->execute($params)) {
            echo json_encode(['success' => true, 'message' => 'User updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update user']);
        }
        
    } elseif ($method === 'PUT' && $action === 'reset-password' && $user_id) {
        // Reset user password
        $data = json_decode(file_get_contents("php://input"), true);
        $new_password = isset($data['password']) ? $data['password'] : null;
        
        if (!$new_password || strlen($new_password) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
            exit;
        }
        
        $password_hash = password_hash($new_password, PASSWORD_BCRYPT);
        $query = "UPDATE users SET password_hash = ? WHERE user_id = ?";
        
        $stmt = $db->prepare($query);
        if ($stmt->execute([$password_hash, $user_id])) {
            echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to reset password']);
        }
        
    } elseif ($method === 'DELETE' && $action === 'deactivate' && $user_id) {
        // Deactivate user
        $query = "UPDATE users SET is_active = 0 WHERE user_id = ?";
        
        $stmt = $db->prepare($query);
        if ($stmt->execute([$user_id])) {
            echo json_encode(['success' => true, 'message' => 'User deactivated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to deactivate user']);
        }
        
    } elseif ($method === 'PUT' && $action === 'activate' && $user_id) {
        // Activate user
        $query = "UPDATE users SET is_active = 1 WHERE user_id = ?";
        
        $stmt = $db->prepare($query);
        if ($stmt->execute([$user_id])) {
            echo json_encode(['success' => true, 'message' => 'User activated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to activate user']);
        }
        
    } elseif ($method === 'DELETE' && $action === 'delete' && $user_id) {
        // Soft delete user
        $query = "UPDATE users SET deleted_at = NOW() WHERE user_id = ?";
        
        $stmt = $db->prepare($query);
        if ($stmt->execute([$user_id])) {
            echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete user']);
        }
        
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
