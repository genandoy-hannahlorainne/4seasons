<?php
/**
 * Get Current Active School Year
 * GET /api/admin/school-years/get-current.php
 */

header('Content-Type: application/json');
require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

verifyAdminRole();

try {
    $currentDate = date('Y-m-d');
    
    // Get the currently active school year
    $query = "SELECT id, year_name, start_date, end_date, is_active 
              FROM school_years 
              WHERE is_active = TRUE 
              OR (start_date <= ? AND end_date >= ?)
              ORDER BY is_active DESC, start_date DESC 
              LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$currentDate, $currentDate]);
    $currentSchoolYear = $stmt->fetch(PDO::FETCH_ASSOC);

    // If no active school year found, get the most recent one
    if (!$currentSchoolYear) {
        $fallbackQuery = "SELECT id, year_name, start_date, end_date, is_active 
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
            
            // Create next school year automatically
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

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'current_school_year' => $currentSchoolYear,
        'next_school_year' => $nextSchoolYear,
        'auto_detected' => true,
        'detection_date' => $currentDate
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>