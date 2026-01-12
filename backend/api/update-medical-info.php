<?php
require_once '../cors.php';
require_once '../config/database.php';
require_once '../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);
$requesting_user_id = $auth->userId();

// Get JSON input
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input'
    ]);
    exit();
}

try {
    // Get the user_id to update (from request or use current user)
    $target_user_id = isset($input['user_id']) ? intval($input['user_id']) : $requesting_user_id;
    
    // Authorization: User can only update their own info, or admin can update anyone
    if ($requesting_user_id !== $target_user_id && !$auth->hasRole('Admin')) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Forbidden: You can only update your own medical information'
        ]);
        exit();
    }
    
    // Get student ID from user_id
    $studentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":user_id", $target_user_id, PDO::PARAM_INT);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Student not found'
        ]);
        exit();
    }
    
    // Update allowed fields
    $updateFields = [];
    $params = [':student_id' => $student['student_id']];
    
    if (isset($input['address'])) {
        $updateFields[] = "address = :address";
        $params[':address'] = $input['address'];
    }
    
    if (isset($input['emergency_contact'])) {
        $updateFields[] = "emergency_contact = :emergency_contact";
        $params[':emergency_contact'] = $input['emergency_contact'];
    }
    
    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No valid fields to update'
        ]);
        exit();
    }
    
    $updateQuery = "UPDATE students SET " . implode(', ', $updateFields) . " WHERE student_id = :student_id";
    
    $updateStmt = $db->prepare($updateQuery);
    
    if ($updateStmt->execute($params)) {
        $auth->logActivity('Update Medical Info', 'Updated medical info for user ID: ' . $target_user_id);
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Medical information updated successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update medical information'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating medical information: ' . $e->getMessage()
    ]);
}
?>