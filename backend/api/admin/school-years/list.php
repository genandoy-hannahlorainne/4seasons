<?php
/**
 * List School Years
 * GET /api/admin/school-years/list.php
 */

header('Content-Type: application/json');
require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

verifyAdminRole();

try {
    $query = "SELECT id, year_name, start_date, end_date, is_active, created_at 
              FROM school_years 
              ORDER BY start_date DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $schoolYears = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $schoolYears
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
