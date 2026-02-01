<?php
/**
 * Create Section
 * POST /api/admin/sections/create.php
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

try {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['section_name']) || !isset($data['grade_level_id']) || !isset($data['school_year_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields: section_name, grade_level_id, school_year_id'
        ]);
        exit;
    }

    $section_name = trim($data['section_name']);
    $grade_level_id = (int)$data['grade_level_id'];
    $school_year_id = (int)$data['school_year_id'];
    $capacity = isset($data['capacity']) ? (int)$data['capacity'] : 50;
    $current_user_id = $auth->userId();

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
        echo json_encode([
            'success' => false,
            'error' => 'Section already exists for this grade and year'
        ]);
        exit;
    }

    // Insert section
    $insertQuery = "INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, created_by) 
                    VALUES (?, ?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->execute([$section_name, $grade_level_id, $school_year_id, $capacity, $current_user_id]);

    $sectionId = $db->lastInsertId();

    // Log activity
    try {
        $auth->logActivity(
            'Section Created',
            "Created section: $section_name for Grade Level ID: $grade_level_id, School Year ID: $school_year_id"
        );
    } catch (Exception $logError) {
        error_log("Logging error: " . $logError->getMessage());
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Section created successfully',
        'section_id' => (int)$sectionId,
        'section_name' => $section_name
    ]);

} catch (PDOException $e) {
    error_log("Database error in create section: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Error in create section: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
