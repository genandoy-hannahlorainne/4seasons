<?php
/**
 * Get Promotion Summary
 * GET /api/admin/promotions/get-summary?current_school_year_id=X&target_school_year_id=Y
 */

header('Content-Type: application/json');
require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

verifyAdminRole();

try {
    $current_school_year_id = $_GET['current_school_year_id'] ?? null;
    $target_school_year_id = $_GET['target_school_year_id'] ?? null;

    if (!$current_school_year_id || !$target_school_year_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters']);
        exit;
    }

    // Get summary by grade level
    $summaryQuery = "SELECT 
                    gl.id,
                    gl.level_number,
                    gl.level_name,
                    COUNT(s.student_id) as total_students
                    FROM grade_levels gl
                    LEFT JOIN students s ON s.current_grade_level_id = gl.id 
                        AND s.current_school_year_id = ?
                        AND s.enrollment_status = 'active'
                    GROUP BY gl.id, gl.level_number, gl.level_name
                    ORDER BY gl.level_number";

    $summaryStmt = $db->prepare($summaryQuery);
    $summaryStmt->execute([$current_school_year_id]);
    $summary = $summaryStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get target sections availability
    $sectionsQuery = "SELECT 
                     gl.level_number,
                     gl.level_name,
                     COUNT(sec.id) as total_sections,
                     SUM(sec.capacity) as total_capacity,
                     SUM(sec.current_enrollment) as current_enrollment
                     FROM grade_levels gl
                     LEFT JOIN sections sec ON sec.grade_level_id = gl.id AND sec.school_year_id = ?
                     GROUP BY gl.id, gl.level_number, gl.level_name
                     ORDER BY gl.level_number";

    $sectionsStmt = $db->prepare($sectionsQuery);
    $sectionsStmt->execute([$target_school_year_id]);
    $sections = $sectionsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get students needing manual adjustment
    $manualQuery = "SELECT 
                   s.student_id,
                   s.first_name,
                   s.last_name,
                   gl.level_name,
                   sec.section_name,
                   s.enrollment_status
                   FROM students s
                   LEFT JOIN grade_levels gl ON s.current_grade_level_id = gl.id
                   LEFT JOIN sections sec ON s.current_section_id = sec.id
                   WHERE s.current_school_year_id = ?
                   AND s.enrollment_status IN ('inactive', 'transferred', 'dropped')
                   ORDER BY s.enrollment_status, s.last_name";

    $manualStmt = $db->prepare($manualQuery);
    $manualStmt->execute([$current_school_year_id]);
    $manual_cases = $manualStmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'summary' => $summary,
        'target_sections' => $sections,
        'manual_cases' => $manual_cases,
        'total_students' => array_sum(array_column($summary, 'total_students'))
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
