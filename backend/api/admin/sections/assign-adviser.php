<?php
/**
 * Assign Adviser to Section
 * POST /api/admin/sections/assign-adviser.php
 * Body: { section_id, adviser_user_id }
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

$auth = new Auth($database);

if (!$auth->hasRole('Admin')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Admin role required.'
    ]);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['section_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing section_id'
        ]);
        exit;
    }
    
    $sectionId = $data['section_id'];
    $adviserUserId = $data['adviser_user_id'] ?? null;
    
    // If adviser_user_id is null, we're removing the adviser
    if ($adviserUserId === null) {
        $query = "UPDATE sections SET adviser_id = NULL WHERE id = :section_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':section_id', $sectionId);
        $stmt->execute();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Adviser removed from section'
        ]);
        exit;
    }
    
    // Verify adviser exists
    $adviserQuery = "SELECT adviser_id FROM advisers WHERE user_id = :user_id AND is_active = 1";
    $adviserStmt = $db->prepare($adviserQuery);
    $adviserStmt->bindParam(':user_id', $adviserUserId);
    $adviserStmt->execute();
    
    if ($adviserStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Adviser not found or inactive'
        ]);
        exit;
    }
    
    // Update section
    $query = "UPDATE sections SET adviser_id = :adviser_id WHERE id = :section_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':adviser_id', $adviserUserId);
    $stmt->bindParam(':section_id', $sectionId);
    $stmt->execute();
    
    // Update all students in this section to have this adviser
    $updateStudentsQuery = "UPDATE students 
                           SET current_adviser_id = :adviser_id 
                           WHERE current_section_id = :section_id 
                           AND enrollment_status = 'active'";
    $updateStudentsStmt = $db->prepare($updateStudentsQuery);
    $updateStudentsStmt->bindParam(':adviser_id', $adviserUserId);
    $updateStudentsStmt->bindParam(':section_id', $sectionId);
    $updateStudentsStmt->execute();
    $studentsUpdated = $updateStudentsStmt->rowCount();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Adviser assigned successfully',
        'students_updated' => $studentsUpdated
    ]);
    
} catch (Exception $e) {
    error_log("Error in assign-adviser.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error assigning adviser: ' . $e->getMessage()
    ]);
}
?>
