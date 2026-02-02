<?php
/**
 * Get Promotion Summary
 * GET /api/admin/promotions/get-summary?current_school_year_id=X&target_school_year_id=Y
 */

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);

// Require Admin role
if (!$auth->hasRole('Admin')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Admin role required.'
    ]);
    exit();
}

try {
    $current_school_year_id = $_GET['current_school_year_id'] ?? null;
    $target_school_year_id = $_GET['target_school_year_id'] ?? null;

    if (!$current_school_year_id || !$target_school_year_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required parameters'
        ]);
        exit;
    }

    // Get summary by grade level
    $summaryQuery = "SELECT 
                    gl.id as grade_level_id,
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
                     COALESCE(SUM(sec.capacity), 0) as total_capacity,
                     COALESCE(SUM(sec.current_enrollment), 0) as current_enrollment,
                     COUNT(CASE WHEN sec.adviser_id IS NOT NULL THEN 1 END) as sections_with_advisers,
                     COUNT(CASE WHEN sec.adviser_id IS NULL THEN 1 END) as sections_without_advisers
                     FROM grade_levels gl
                     LEFT JOIN sections sec ON sec.grade_level_id = gl.id 
                        AND sec.school_year_id = ?
                        AND sec.is_active = 1
                     GROUP BY gl.id, gl.level_number, gl.level_name
                     ORDER BY gl.level_number";

    $sectionsStmt = $db->prepare($sectionsQuery);
    $sectionsStmt->execute([$target_school_year_id]);
    $sections = $sectionsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate total sections with/without advisers
    $total_sections_with_advisers = 0;
    $total_sections_without_advisers = 0;
    foreach ($sections as $section) {
        $total_sections_with_advisers += (int)$section['sections_with_advisers'];
        $total_sections_without_advisers += (int)$section['sections_without_advisers'];
    }

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
        'total_students' => array_sum(array_column($summary, 'total_students')),
        'adviser_assignment_status' => [
            'total_sections' => $total_sections_with_advisers + $total_sections_without_advisers,
            'sections_with_advisers' => $total_sections_with_advisers,
            'sections_without_advisers' => $total_sections_without_advisers,
            'all_assigned' => $total_sections_without_advisers === 0
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in get-summary.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
