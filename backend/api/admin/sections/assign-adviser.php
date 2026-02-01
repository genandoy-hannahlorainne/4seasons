<?php
/**
 * Assign Adviser to Section
 * POST /api/admin/sections/assign-adviser
 */

header('Content-Type: application/json');
require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

verifyAdminRole();

try {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['section_id']) || !isset($data['adviser_id']) || !isset($data['school_year_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    $section_id = (int)$data['section_id'];
    $adviser_id = (int)$data['adviser_id'];
    $school_year_id = (int)$data['school_year_id'];
    $current_user_id = $_SESSION['user_id'];

    // Validate section exists
    $sectionQuery = "SELECT id FROM sections WHERE id = ? AND school_year_id = ?";
    $sectionStmt = $db->prepare($sectionQuery);
    $sectionStmt->execute([$section_id, $school_year_id]);
    if ($sectionStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Section not found']);
        exit;
    }

    // Validate adviser exists and is active
    $adviserQuery = "SELECT user_id FROM users WHERE user_id = ? AND role = 'adviser' AND is_active = 1";
    $adviserStmt = $db->prepare($adviserQuery);
    $adviserStmt->execute([$adviser_id]);
    if ($adviserStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Adviser not found or inactive']);
        exit;
    }

    // Start transaction
    $db->beginTransaction();

    try {
        // Unassign previous adviser if exists
        $unassignQuery = "UPDATE adviser_assignments SET is_active = FALSE, unassigned_date = NOW() 
                         WHERE section_id = ? AND school_year_id = ? AND is_active = TRUE";
        $db->prepare($unassignQuery)->execute([$section_id, $school_year_id]);

        // Assign new adviser
        $assignQuery = "INSERT INTO adviser_assignments (adviser_id, section_id, school_year_id, assigned_by_admin_id) 
                       VALUES (?, ?, ?, ?)";
        $db->prepare($assignQuery)->execute([$adviser_id, $section_id, $school_year_id, $current_user_id]);

        // Update section adviser
        $updateQuery = "UPDATE sections SET adviser_id = ? WHERE id = ?";
        $db->prepare($updateQuery)->execute([$adviser_id, $section_id]);

        $db->commit();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Adviser assigned successfully',
            'section_id' => $section_id,
            'adviser_id' => $adviser_id
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
