<?php
require_once '../cors.php';

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
    // Log all HTTP headers for debugging
    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (strpos($key, 'HTTP_') === 0) {
            $headers[$key] = $value;
        }
    }
    error_log("Available HTTP headers: " . json_encode($headers));
    error_log("User ID not provided in header");
    
    // For testing, use a default user_id
    $user_id = 30;
}

// Get JSON input
$rawInput = file_get_contents('php://input');
error_log("Raw input: " . $rawInput);

$input = json_decode($rawInput, true);
error_log("Decoded input: " . json_encode($input));

if (!$input) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input'
    ]);
    exit();
}

try {
    // Log incoming data for debugging
    error_log("Update medical info - User ID: " . $user_id);
    error_log("Input data: " . json_encode($input));
    
    // Get student ID first
    $studentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":user_id", $user_id);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    error_log("Student query result: " . json_encode($student));
    
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
    error_log("Update query: " . $updateQuery);
    error_log("Update params: " . json_encode($params));
    
    $updateStmt = $db->prepare($updateQuery);
    
    if ($updateStmt->execute($params)) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Medical information updated successfully'
        ]);
    } else {
        error_log("Update failed: " . json_encode($updateStmt->errorInfo()));
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