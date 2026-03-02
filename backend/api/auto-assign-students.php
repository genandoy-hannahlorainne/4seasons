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
    $adviserQuery = "SELECT a.adviser_id, a.user_id
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

    // Get active sections assigned to this adviser
    $sectionsQuery = "SELECT sec.id, sec.section_name, gl.level_number
                      FROM sections sec
                      INNER JOIN grade_levels gl ON sec.grade_level_id = gl.id
                      WHERE sec.adviser_id = :adviser_user_id
                      AND sec.is_active = 1";
    $sectionsStmt = $db->prepare($sectionsQuery);
    $sectionsStmt->bindParam(":adviser_user_id", $user_id);
    $sectionsStmt->execute();
    $sections = $sectionsStmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($sections)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No active section assigned to this adviser'
        ]);
        exit;
    }

    $db->beginTransaction();
    $assignedCount = 0;

    $studentsQuery = "SELECT s.student_id
                      FROM students s
                      WHERE s.grade_level = :grade_level
                        AND s.section = :section_name
                        AND s.is_active = 1
                        AND (s.current_adviser_id IS NULL OR s.current_adviser_id = 0 OR s.current_adviser_id <> :adviser_user_id)";
    $studentsStmt = $db->prepare($studentsQuery);

    $updateStudentQuery = "UPDATE students
                           SET current_adviser_id = :adviser_user_id,
                               current_section_id = :section_id
                           WHERE student_id = :student_id";
    $updateStudentStmt = $db->prepare($updateStudentQuery);

    $assignQuery = "INSERT INTO student_adviser (student_id, adviser_id, assigned_date)
                    VALUES (:student_id, :adviser_id, CURDATE())";
    $assignStmt = $db->prepare($assignQuery);

    foreach ($sections as $assignedSection) {
        $studentsStmt->bindParam(":grade_level", $assignedSection['level_number']);
        $studentsStmt->bindParam(":section_name", $assignedSection['section_name']);
        $studentsStmt->bindParam(":adviser_user_id", $user_id);
        $studentsStmt->execute();
        $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($students as $student) {
            $updateStudentStmt->bindParam(":adviser_user_id", $user_id);
            $updateStudentStmt->bindParam(":section_id", $assignedSection['id']);
            $updateStudentStmt->bindParam(":student_id", $student['student_id']);
            $updateStudentStmt->execute();

            try {
                $assignStmt->bindParam(":student_id", $student['student_id']);
                $assignStmt->bindParam(":adviser_id", $adviser['adviser_id']);
                $assignStmt->execute();
            } catch (Exception $e) {
                // Skip duplicate history entries
            }

            $assignedCount++;
        }
    }

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => "Assigned $assignedCount students to adviser",
        'assigned_count' => $assignedCount,
        'sections_count' => count($sections)
    ]);

} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
