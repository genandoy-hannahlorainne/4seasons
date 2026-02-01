<?php
/**
 * Get Adviser's Class Roster
 * GET /api/adviser/get-class-roster?school_year_id=X
 */

header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../middleware/auth.php';

verifyAdviserRole();

try {
    $school_year_id = $_GET['school_year_id'] ?? null;
    $adviser_id = $_SESSION['user_id'];

    if (!$school_year_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing school_year_id parameter']);
        exit;
    }

    // Get adviser's current section
    $sectionQuery = "SELECT sec.id, sec.section_name, gl.level_name, gl.level_number
                    FROM sections sec
                    LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
                    WHERE sec.adviser_id = ? AND sec.school_year_id = ?";
    
    $sectionStmt = $db->prepare($sectionQuery);
    $sectionStmt->execute([$adviser_id, $school_year_id]);
    
    if ($sectionStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'No section assigned for this school year']);
        exit;
    }

    $section = $sectionStmt->fetch(PDO::FETCH_ASSOC);

    // Get students in this section
    $studentQuery = "SELECT 
                    s.student_id,
                    s.first_name,
                    s.last_name,
                    s.student_id as student_number,
                    COUNT(mv.id) as total_medical_visits,
                    MAX(mv.visit_date) as last_visit_date,
                    s.enrollment_status
                    FROM students s
                    LEFT JOIN medical_visits mv ON s.student_id = mv.student_id
                    WHERE s.current_section_id = ? 
                    AND s.current_school_year_id = ?
                    AND s.enrollment_status = 'active'
                    GROUP BY s.student_id
                    ORDER BY s.last_name, s.first_name";

    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->execute([$section['id'], $school_year_id]);
    $students = $studentStmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'section' => $section,
        'students' => $students,
        'total_students' => count($students)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
