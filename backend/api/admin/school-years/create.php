<?php
/**
 * Create School Year
 * POST /api/admin/school-years/create.php
 */

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
    require_once __DIR__ . '/../../../config/database.php';
    require_once __DIR__ . '/../../../middleware/auth.php';

    $database = new Database();
    $db = $database->getConnection();

    // Authenticate user
    $auth = new Auth($database);

    // Require Admin role
    if (!$auth->hasRole('Admin')) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Access denied. Admin role required.'
        ]);
        exit();
    }

    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['year_name']) || !isset($data['start_date']) || !isset($data['end_date'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields: year_name, start_date, end_date'
        ]);
        exit;
    }

    $year_name = trim($data['year_name']);
    $start_date = $data['start_date'];
    $end_date = $data['end_date'];
    $is_active = isset($data['is_active']) && $data['is_active'] ? 1 : 0;
    $current_user_id = $auth->userId();

    // Validate date format
    if (!strtotime($start_date) || !strtotime($end_date)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid date format. Use YYYY-MM-DD'
        ]);
        exit;
    }

    // Validate start date is before end date
    if (strtotime($start_date) >= strtotime($end_date)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Start date must be before end date'
        ]);
        exit;
    }

    // Check if year already exists
    $checkQuery = "SELECT id FROM school_years WHERE year_name = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$year_name]);

    if ($checkStmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'error' => 'School year already exists'
        ]);
        exit;
    }

    // If setting as active, deactivate all others
    if ($is_active) {
        $deactivateQuery = "UPDATE school_years SET is_active = 0";
        $db->exec($deactivateQuery);
    }

    // Insert new school year
    $insertQuery = "INSERT INTO school_years (year_name, start_date, end_date, is_active, created_by) 
                    VALUES (?, ?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->execute([$year_name, $start_date, $end_date, $is_active, $current_user_id]);

    $schoolYearId = $db->lastInsertId();

    // Log the activity
    try {
        $auth->logActivity(
            'School Year Created',
            "Created school year: $year_name (ID: $schoolYearId)"
        );
    } catch (Exception $logError) {
        // Ignore logging errors
        error_log("Logging error: " . $logError->getMessage());
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'School year created successfully',
        'school_year_id' => (int)$schoolYearId,
        'year_name' => $year_name
    ]);

} catch (PDOException $e) {
    error_log("Database error in create.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Error in create.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
