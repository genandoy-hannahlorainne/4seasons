<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id");
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

// Get user_id from query parameter
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required'
    ]);
    exit();
}

try {
    // Get student profile with user info
    $query = "SELECT 
                s.student_id,
                s.student_number,
                s.first_name,
                s.middle_name,
                s.last_name,
                s.birth_date,
                s.gender,
                s.grade_level,
                s.section,
                s.address,
                s.blood_type,
                s.emergency_contact,
                u.email,
                u.phone as contact_number
              FROM students s
              INNER JOIN users u ON s.user_id = u.user_id
              WHERE s.user_id = :user_id AND s.is_active = 1 AND s.deleted_at IS NULL";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'profile' => $profile
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Student profile not found'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching profile: ' . $e->getMessage()
    ]);
}
?>
