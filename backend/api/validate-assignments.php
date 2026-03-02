<?php
/**
 * Validate Student-Adviser Assignments
 * Checks the integrity of all student-adviser assignments
 * Returns detailed report of assignment status
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user (Admin, Adviser, or Clinic Staff can check)
$auth = new Auth($database);
if (!$auth->hasRole('Admin') && !$auth->hasRole('Adviser') && !$auth->hasRole('Clinic Staff')) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit();
}

try {
    // 1. Get overall statistics
    $statsQuery = "
        SELECT 
            COUNT(*) as total_students,
            COUNT(CASE WHEN current_adviser_id IS NOT NULL AND current_adviser_id > 0 THEN 1 END) as assigned_students,
            COUNT(CASE WHEN current_adviser_id IS NULL OR current_adviser_id = 0 THEN 1 END) as unassigned_students,
            COUNT(CASE WHEN current_section_id IS NOT NULL AND current_section_id > 0 THEN 1 END) as students_with_section,
            COUNT(CASE WHEN current_section_id IS NULL OR current_section_id = 0 THEN 1 END) as students_without_section
        FROM students 
        WHERE is_active = 1
    ";
    $statsStmt = $db->prepare($statsQuery);
    $statsStmt->execute();
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    // 2. Get unassigned students details
    $unassignedQuery = "
        SELECT s.student_id, s.student_number, 
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               s.grade_level, s.section, s.current_adviser_id, s.current_section_id
        FROM students s 
        WHERE s.is_active = 1 
        AND (s.current_adviser_id IS NULL OR s.current_adviser_id = 0)
        ORDER BY s.grade_level, s.student_number
    ";
    $unassignedStmt = $db->prepare($unassignedQuery);
    $unassignedStmt->execute();
    $unassignedStudents = $unassignedStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Get adviser workload
    $adviserWorkloadQuery = "
        SELECT a.user_id, CONCAT(a.first_name, ' ', a.last_name) as adviser_name,
               a.grade_level as adviser_grade, a.section as adviser_section,
               COUNT(s.student_id) as student_count,
               GROUP_CONCAT(CONCAT(s.first_name, ' ', s.last_name) SEPARATOR ', ') as students
        FROM advisers a
        LEFT JOIN students s ON a.user_id = s.current_adviser_id AND s.is_active = 1
        WHERE a.is_active = 1
        GROUP BY a.user_id, a.first_name, a.last_name, a.grade_level, a.section
        ORDER BY student_count DESC, adviser_name
    ";
    $adviserStmt = $db->prepare($adviserWorkloadQuery);
    $adviserStmt->execute();
    $adviserWorkload = $adviserStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 4. Get sections with capacity info
    $sectionsQuery = "
        SELECT s.id, s.section_name, gl.level_name, s.capacity, s.current_enrollment,
               s.adviser_id, CONCAT(a.first_name, ' ', a.last_name) as adviser_name,
               (s.capacity - s.current_enrollment) as available_slots
        FROM sections s
        INNER JOIN grade_levels gl ON s.grade_level_id = gl.id
        LEFT JOIN advisers a ON s.adviser_id = a.user_id
        WHERE s.is_active = 1
        ORDER BY gl.level_number, s.section_name
    ";
    $sectionsStmt = $db->prepare($sectionsQuery);
    $sectionsStmt->execute();
    $sections = $sectionsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 5. Check for data integrity issues
    $integrityIssues = [];
    
    // Check for students assigned to inactive advisers
    $inactiveAdviserQuery = "
        SELECT s.student_number, CONCAT(s.first_name, ' ', s.last_name) as student_name,
               s.current_adviser_id
        FROM students s
        LEFT JOIN advisers a ON s.current_adviser_id = a.user_id
        WHERE s.is_active = 1 
        AND s.current_adviser_id IS NOT NULL 
        AND s.current_adviser_id > 0
        AND (a.user_id IS NULL OR a.is_active = 0)
    ";
    $inactiveStmt = $db->prepare($inactiveAdviserQuery);
    $inactiveStmt->execute();
    $studentsWithInactiveAdvisers = $inactiveStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($studentsWithInactiveAdvisers) > 0) {
        $integrityIssues[] = [
            'type' => 'inactive_adviser',
            'message' => 'Students assigned to inactive advisers',
            'count' => count($studentsWithInactiveAdvisers),
            'details' => $studentsWithInactiveAdvisers
        ];
    }
    
    // Check for students assigned to non-existent sections
    $invalidSectionQuery = "
        SELECT s.student_number, CONCAT(s.first_name, ' ', s.last_name) as student_name,
               s.current_section_id
        FROM students s
        LEFT JOIN sections sec ON s.current_section_id = sec.id
        WHERE s.is_active = 1 
        AND s.current_section_id IS NOT NULL 
        AND s.current_section_id > 0
        AND (sec.id IS NULL OR sec.is_active = 0)
    ";
    $invalidSectionStmt = $db->prepare($invalidSectionQuery);
    $invalidSectionStmt->execute();
    $studentsWithInvalidSections = $invalidSectionStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($studentsWithInvalidSections) > 0) {
        $integrityIssues[] = [
            'type' => 'invalid_section',
            'message' => 'Students assigned to invalid sections',
            'count' => count($studentsWithInvalidSections),
            'details' => $studentsWithInvalidSections
        ];
    }
    
    // Determine overall health status
    $healthStatus = 'excellent';
    if (count($integrityIssues) > 0) {
        $healthStatus = 'critical';
    } elseif ($stats['unassigned_students'] > 0) {
        $healthStatus = 'needs_attention';
    } elseif ($stats['students_without_section'] > 0) {
        $healthStatus = 'warning';
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Assignment validation completed',
        'data' => [
            'health_status' => $healthStatus,
            'statistics' => [
                'total_students' => (int)$stats['total_students'],
                'assigned_students' => (int)$stats['assigned_students'],
                'unassigned_students' => (int)$stats['unassigned_students'],
                'students_with_section' => (int)$stats['students_with_section'],
                'students_without_section' => (int)$stats['students_without_section'],
                'assignment_percentage' => $stats['total_students'] > 0 ? 
                    round(($stats['assigned_students'] / $stats['total_students']) * 100, 2) : 0
            ],
            'unassigned_students' => $unassignedStudents,
            'adviser_workload' => $adviserWorkload,
            'sections' => $sections,
            'integrity_issues' => $integrityIssues,
            'recommendations' => generateRecommendations($stats, $integrityIssues)
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error in validate-assignments: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error validating assignments: ' . $e->getMessage()
    ]);
}

function generateRecommendations($stats, $integrityIssues) {
    $recommendations = [];
    
    if ($stats['unassigned_students'] > 0) {
        $recommendations[] = [
            'priority' => 'high',
            'action' => 'fix_assignments',
            'message' => "Run the fix-student-assignments API to assign {$stats['unassigned_students']} unassigned students"
        ];
    }
    
    if (count($integrityIssues) > 0) {
        $recommendations[] = [
            'priority' => 'critical',
            'action' => 'fix_integrity',
            'message' => 'Fix data integrity issues found in the system'
        ];
    }
    
    if ($stats['students_without_section'] > 0) {
        $recommendations[] = [
            'priority' => 'medium',
            'action' => 'assign_sections',
            'message' => "Assign {$stats['students_without_section']} students to proper sections"
        ];
    }
    
    if (empty($recommendations)) {
        $recommendations[] = [
            'priority' => 'info',
            'action' => 'maintain',
            'message' => 'All student-adviser assignments are properly configured'
        ];
    }
    
    return $recommendations;
}
?>