<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get user_id from header
$user_id = null;
if (isset($_SERVER['HTTP_USER_ID'])) {
    $user_id = $_SERVER['HTTP_USER_ID'];
} else {
    $user_id = 19; // Default for testing
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input'
    ]);
    exit();
}

try {
    // Get student ID first
    $studentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":user_id", $user_id);
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
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating medical information: ' . $e->getMessage()
    ]);
}
?>