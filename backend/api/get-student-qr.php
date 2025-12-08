<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get student_id from request
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->student_id)) {
        echo json_encode([
            'success' => false,
            'message' => 'Student ID is required'
        ]);
        exit();
    }
    
    $student_id = $data->student_id;
    
    // Check if QR code already exists
    $query = "SELECT qr_id, qr_token, qr_generated_at, qr_expires_at 
              FROM qr_codes 
              WHERE student_id = :student_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $student_id);
    $stmt->execute();
    
    $qr_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // If QR code doesn't exist or is expired, generate new one
    if (!$qr_data || ($qr_data['qr_expires_at'] && strtotime($qr_data['qr_expires_at']) < time())) {
        // Generate unique token
        $qr_token = bin2hex(random_bytes(16)); // 32 character hex string
        
        // Set expiration to 1 year from now (or never expire by setting NULL)
        $expires_at = null; // Never expires
        // Or use: $expires_at = date('Y-m-d H:i:s', strtotime('+1 year'));
        
        if ($qr_data) {
            // Update existing QR code
            $query = "UPDATE qr_codes 
                     SET qr_token = :qr_token, 
                         qr_generated_at = NOW(), 
                         qr_expires_at = :expires_at 
                     WHERE student_id = :student_id";
        } else {
            // Insert new QR code
            $query = "INSERT INTO qr_codes (student_id, qr_token, qr_generated_at, qr_expires_at) 
                     VALUES (:student_id, :qr_token, NOW(), :expires_at)";
        }
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':qr_token', $qr_token);
        $stmt->bindParam(':expires_at', $expires_at);
        $stmt->execute();
        
        // Fetch the newly created/updated QR code
        $query = "SELECT qr_id, qr_token, qr_generated_at, qr_expires_at 
                  FROM qr_codes 
                  WHERE student_id = :student_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();
        
        $qr_data = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Get student info for QR code
    $query = "SELECT student_id, student_number, first_name, last_name, grade_level, section 
              FROM students 
              WHERE student_id = :student_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $student_id);
    $stmt->execute();
    
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        echo json_encode([
            'success' => false,
            'message' => 'Student not found'
        ]);
        exit();
    }
    
    // Create QR code data (this will be encoded in the QR)
    $qr_content = json_encode([
        'student_id' => $student['student_id'],
        'student_number' => $student['student_number'],
        'token' => $qr_data['qr_token']
    ]);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'qr_id' => $qr_data['qr_id'],
            'qr_token' => $qr_data['qr_token'],
            'qr_content' => $qr_content,
            'generated_at' => $qr_data['qr_generated_at'],
            'expires_at' => $qr_data['qr_expires_at'],
            'student' => $student
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
