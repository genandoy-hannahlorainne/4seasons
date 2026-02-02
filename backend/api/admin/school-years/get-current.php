<?php
/**
 * Get Current Active School Year
 * GET /api/admin/school-years/get-current.php
 */

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

// Allow both Admin and Adviser roles
if (!$auth->hasRole('Admin') && !$auth->hasRole('Adviser')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Admin or Adviser role required.'
    ]);
    exit();
}

try {
    $currentDate = date('Y-m-d');
    
    // Get the current school year (marked with is_current = 1)
    $query = "SELECT id, year_name, start_date, end_date, is_active, is_current 
              FROM school_years 
              WHERE is_current = 1 
              LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $currentSchoolYear = $stmt->fetch(PDO::FETCH_ASSOC);

    // If no current school year found, get the most recent one
    if (!$currentSchoolYear) {
        $fallbackQuery = "SELECT id, year_name, start_date, end_date, is_active, is_current 
                         FROM school_years 
                         ORDER BY start_date DESC 
                         LIMIT 1";
        $currentSchoolYear = $db->query($fallbackQuery)->fetch(PDO::FETCH_ASSOC);
    }

    // Get the next school year (for promotion target)
    $nextYearQuery = "SELECT id, year_name, start_date, end_date, is_active 
                     FROM school_years 
                     WHERE start_date > ? 
                     ORDER BY start_date ASC 
                     LIMIT 1";
    
    $nextStmt = $db->prepare($nextYearQuery);
    $nextStmt->execute([$currentSchoolYear['end_date'] ?? $currentDate]);
    $nextSchoolYear = $nextStmt->fetch(PDO::FETCH_ASSOC);

    // Auto-generate next school year if it doesn't exist
    if (!$nextSchoolYear && $currentSchoolYear) {
        $currentYearName = $currentSchoolYear['year_name'];
        
        // Extract years from current year name (e.g., "2024-2025")
        if (preg_match('/(\d{4})-(\d{4})/', $currentYearName, $matches)) {
            $startYear = intval($matches[1]) + 1;
            $endYear = intval($matches[2]) + 1;
            $nextYearName = "$startYear-$endYear";
            
            $nextStartDate = date('Y-m-d', strtotime($currentSchoolYear['start_date'] . ' +1 year'));
            $nextEndDate = date('Y-m-d', strtotime($currentSchoolYear['end_date'] . ' +1 year'));
            
            // Create next school year automatically (only if Admin)
            if ($auth->hasRole('Admin')) {
                $createQuery = "INSERT INTO school_years (year_name, start_date, end_date, is_active) 
                               VALUES (?, ?, ?, FALSE)";
                $createStmt = $db->prepare($createQuery);
                $createStmt->execute([$nextYearName, $nextStartDate, $nextEndDate]);
                
                $nextSchoolYear = [
                    'id' => $db->lastInsertId(),
                    'year_name' => $nextYearName,
                    'start_date' => $nextStartDate,
                    'end_date' => $nextEndDate,
                    'is_active' => false
                ];
            }
        }
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'current_school_year' => $currentSchoolYear,
        'next_school_year' => $nextSchoolYear,
        'auto_detected' => true,
        'detection_date' => $currentDate
    ]);

} catch (Exception $e) {
    error_log("Error getting current school year: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>