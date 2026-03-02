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
        // Get adviser by grade level and section using section assignments
        $adviserQuery = "SELECT 
                                                a.adviser_id,
                                                a.user_id,
                                                u.full_name as adviser_name,
                                                gl.level_number,
                                                sec.section_name
                                         FROM sections sec
                                         INNER JOIN grade_levels gl ON sec.grade_level_id = gl.id
                                         INNER JOIN advisers a ON sec.adviser_id = a.user_id AND a.is_active = 1
                                         INNER JOIN users u ON a.user_id = u.user_id
                                         WHERE (
                                                        gl.level_number = :grade_level_number
                                                        OR gl.level_name = :grade_level_name
                                                     )
                                             AND sec.section_name = :section
                                             AND sec.is_active = 1
                                         LIMIT 1";
    
        $adviserStmt = $db->prepare($adviserQuery);
        $gradeLevelNumber = is_numeric($gradeLevel) ? (int)$gradeLevel : null;
        $gradeLevelName = stripos((string)$gradeLevel, 'Grade') === 0 ? (string)$gradeLevel : ('Grade ' . $gradeLevel);
        $adviserStmt->bindParam(':grade_level_number', $gradeLevelNumber);
        $adviserStmt->bindParam(':grade_level_name', $gradeLevelName);
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
    
    echo json_encode([
        'success' => true,
        'data' => [
            'adviser_id' => $adviser['adviser_id'],
            'adviser_user_id' => $adviser['user_id'],
            'adviser_name' => $adviser['adviser_name'],
            'grade_level' => $adviser['level_number'],
            'section' => $adviser['section_name']
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
