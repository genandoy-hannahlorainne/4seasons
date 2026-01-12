<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get parameters
$gradeLevel = $_GET['grade_level'] ?? null;
$section = $_GET['section'] ?? null;

if (!$gradeLevel || !$section) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Grade level and section are required'
    ]);
    exit;
}

try {
    // Get adviser by grade level and section
    $adviserQuery = "SELECT 
                        a.adviser_id,
                        a.first_name,
                        a.last_name,
                        a.grade_level,
                        a.section
                     FROM advisers a
                     WHERE a.grade_level = :grade_level 
                       AND a.section = :section 
                       AND a.is_active = 1
                     LIMIT 1";
    
    $adviserStmt = $db->prepare($adviserQuery);
    $adviserStmt->bindParam(':grade_level', $gradeLevel);
    $adviserStmt->bindParam(':section', $section);
    $adviserStmt->execute();
    
    if ($adviserStmt->rowCount() === 0) {
        echo json_encode([
            'success' => true,
            'data' => [
                'adviser_name' => 'N/A'
            ]
        ]);
        exit;
    }
    
    $adviser = $adviserStmt->fetch(PDO::FETCH_ASSOC);
    $adviserName = trim($adviser['first_name'] . ' ' . $adviser['last_name']);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'adviser_id' => $adviser['adviser_id'],
            'adviser_name' => $adviserName,
            'grade_level' => $adviser['grade_level'],
            'section' => $adviser['section']
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
