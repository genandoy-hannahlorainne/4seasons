<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);
$auth->requireRole(['Admin', 'Adviser']);

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

try {
    switch ($method) {
        case 'PUT':
            // Mark notification as read
            if (empty($data->notification_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'notification_id is required']);
                exit();
            }
            
            // Check if notifications table has user_id column
            $checkColumns = "SHOW COLUMNS FROM notifications LIKE 'user_id'";
            $checkStmt = $db->prepare($checkColumns);
            $checkStmt->execute();
            $hasUserIdColumn = $checkStmt->rowCount() > 0;
            
            if ($hasUserIdColumn) {
                // Update notification status
                $query = "UPDATE notifications 
                         SET status = 'Read', read_at = NOW() 
                         WHERE notification_id = :notification_id 
                           AND user_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':notification_id', $data->notification_id);
                $stmt->bindParam(':user_id', $auth->userId());
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Notification not found or already read']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Notification management not available']);
            }
            break;
            
        case 'DELETE':
            // Delete notification
            if (empty($data->notification_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'notification_id is required']);
                exit();
            }
            
            $checkColumns = "SHOW COLUMNS FROM notifications LIKE 'user_id'";
            $checkStmt = $db->prepare($checkColumns);
            $checkStmt->execute();
            $hasUserIdColumn = $checkStmt->rowCount() > 0;
            
            if ($hasUserIdColumn) {
                $query = "DELETE FROM notifications 
                         WHERE notification_id = :notification_id 
                           AND user_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':notification_id', $data->notification_id);
                $stmt->bindParam(':user_id', $auth->userId());
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['success' => true, 'message' => 'Notification deleted']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Notification not found']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Notification management not available']);
            }
            break;
            
        case 'POST':
            // Mark all notifications as read
            $checkColumns = "SHOW COLUMNS FROM notifications LIKE 'user_id'";
            $checkStmt = $db->prepare($checkColumns);
            $checkStmt->execute();
            $hasUserIdColumn = $checkStmt->rowCount() > 0;
            
            if ($hasUserIdColumn) {
                $query = "UPDATE notifications 
                         SET status = 'Read', read_at = NOW() 
                         WHERE user_id = :user_id AND status = 'Pending'";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $auth->userId());
                $stmt->execute();
                
                $updatedCount = $stmt->rowCount();
                echo json_encode([
                    'success' => true, 
                    'message' => "Marked {$updatedCount} notifications as read",
                    'updated_count' => $updatedCount
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Notification management not available']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>