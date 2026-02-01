<?php
/**
 * Create School Year
 * POST /api/admin/school-years/create
 */

header('Content-Type: application/json');
require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

// Verify admin role
verifyAdminRole();

try {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['year_name']) || !isset($data['start_date']) || !isset($data['end_date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: year_name, start_date, end_date']);
        exit;
    }

    $year_name = trim($data['year_name']);
    $start_date = $data['start_date'];
    $end_date = $data['end_date'];
    $is_active = $data['is_active'] ?? false;
    $current_user_id = $_SESSION['user_id'];

    // Validate date format
    if (!strtotime($start_date) || !strtotime($end_date)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD']);
        exit;
    }

    // Validate start date is before end date
    if (strtotime($start_date) >= strtotime($end_date)) {
        http_response_code(400);
        echo json_encode(['error' => 'Start date must be before end date']);
        exit;
    }

    // Check if year already exists
    $checkQuery = "SELECT id FROM school_years WHERE year_name = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$year_name]);

    if ($checkStmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'School year already exists']);
        exit;
    }

    // If setting as active, deactivate all others
    if ($is_active) {
        $deactivateQuery = "UPDATE school_years SET is_active = FALSE";
        $db->prepare($deactivateQuery)->execute();
    }

    // Insert new school year
    $insertQuery = "INSERT INTO school_years (year_name, start_date, end_date, is_active, created_by) 
                    VALUES (?, ?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->execute([$year_name, $start_date, $end_date, $is_active, $current_user_id]);

    $schoolYearId = $db->lastInsertId();

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'School year created successfully',
        'school_year_id' => $schoolYearId,
        'year_name' => $year_name
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
