<?php
/**
 * Create Section
 * POST /api/admin/sections/create
 */

header('Content-Type: application/json');
require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

verifyAdminRole();

try {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['section_name']) || !isset($data['grade_level_id']) || !isset($data['school_year_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    $section_name = trim($data['section_name']);
    $grade_level_id = (int)$data['grade_level_id'];
    $school_year_id = (int)$data['school_year_id'];
    $capacity = $data['capacity'] ?? 50;
    $current_user_id = $_SESSION['user_id'];

    // Validate grade level exists
    $gradeQuery = "SELECT id FROM grade_levels WHERE id = ?";
    $gradeStmt = $db->prepare($gradeQuery);
    $gradeStmt->execute([$grade_level_id]);
    if ($gradeStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Grade level not found']);
        exit;
    }

    // Validate school year exists
    $yearQuery = "SELECT id FROM school_years WHERE id = ?";
    $yearStmt = $db->prepare($yearQuery);
    $yearStmt->execute([$school_year_id]);
    if ($yearStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'School year not found']);
        exit;
    }

    // Check if section already exists
    $checkQuery = "SELECT id FROM sections WHERE section_name = ? AND grade_level_id = ? AND school_year_id = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$section_name, $grade_level_id, $school_year_id]);
    if ($checkStmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Section already exists for this grade and year']);
        exit;
    }

    // Insert section
    $insertQuery = "INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, created_by) 
                    VALUES (?, ?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->execute([$section_name, $grade_level_id, $school_year_id, $capacity, $current_user_id]);

    $sectionId = $db->lastInsertId();

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Section created successfully',
        'section_id' => $sectionId,
        'section_name' => $section_name
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
