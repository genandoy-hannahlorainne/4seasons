<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get user_id from header or query param
$user_id = $_GET['user_id'] ?? $_SERVER['HTTP_USER_ID'] ?? null;

if (empty($user_id)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required'
    ]);
    exit;
}

try {
    // Get adviser info
    $adviserQuery = "SELECT a.adviser_id, a.grade_level, a.section
                     FROM advisers a 
                     WHERE a.user_id = :user_id AND a.is_active = 1";
    $adviserStmt = $db->prepare($adviserQuery);
    $adviserStmt->bindParam(":user_id", $user_id);
    $adviserStmt->execute();
    $adviser = $adviserStmt->fetch(PDO::FETCH_ASSOC);

    if (!$adviser) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Adviser not found'
        ]);
        exit;
    }

    // If adviser has no grade/section set, return error
    if (empty($adviser['grade_level']) || empty($adviser['section'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Adviser must have grade level and section set'
        ]);
        exit;
    }

    // Find all students with matching grade and section
    $studentsQuery = "SELECT s.student_id
                      FROM students s
                      WHERE s.grade_level = :grade_level 
                        AND s.section = :section 
                        AND s.is_active = 1
                        AND s.student_id NOT IN (
                            SELECT student_id FROM student_adviser WHERE adviser_id = :adviser_id
                        )";
    
    $studentsStmt = $db->prepare($studentsQuery);
    $studentsStmt->bindParam(":grade_level", $adviser['grade_level']);
    $studentsStmt->bindParam(":section", $adviser['section']);
    $studentsStmt->bindParam(":adviser_id", $adviser['adviser_id']);
    $studentsStmt->execute();
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Assign each student to the adviser
    $assignQuery = "INSERT INTO student_adviser (student_id, adviser_id, assigned_date) 
                    VALUES (:student_id, :adviser_id, CURDATE())";
    $assignStmt = $db->prepare($assignQuery);
    
    $assignedCount = 0;
    foreach ($students as $student) {
        try {
            $assignStmt->bindParam(":student_id", $student['student_id']);
            $assignStmt->bindParam(":adviser_id", $adviser['adviser_id']);
            $assignStmt->execute();
            $assignedCount++;
        } catch (Exception $e) {
            // Skip if already assigned
        }
    }

    echo json_encode([
        'success' => true,
        'message' => "Assigned $assignedCount students to adviser",
        'assigned_count' => $assignedCount,
        'grade_level' => $adviser['grade_level'],
        'section' => $adviser['section']
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
