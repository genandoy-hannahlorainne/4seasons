<?php
/**
 * Get Current School Year (Public endpoint for all users)
 * GET /api/get-current-school-year.php
 */

header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $currentDate = date('Y-m-d');
    
    // Get the currently active school year based on date range
    $query = "SELECT id, year_name, start_date, end_date, is_active 
              FROM school_years 
              WHERE (start_date <= ? AND end_date >= ?) 
              OR is_active = TRUE
              ORDER BY 
                CASE WHEN start_date <= ? AND end_date >= ? THEN 1 ELSE 2 END,
                is_active DESC,
                start_date DESC 
              LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$currentDate, $currentDate, $currentDate, $currentDate]);
    $currentSchoolYear = $stmt->fetch(PDO::FETCH_ASSOC);

    // If no school year found in date range, get the most recent active one
    if (!$currentSchoolYear) {
        $fallbackQuery = "SELECT id, year_name, start_date, end_date, is_active 
                         FROM school_years 
                         WHERE is_active = TRUE
                         ORDER BY start_date DESC 
                         LIMIT 1";
        $currentSchoolYear = $db->query($fallbackQuery)->fetch(PDO::FETCH_ASSOC);
    }

    // If still no school year, get the most recent one
    if (!$currentSchoolYear) {
        $lastResortQuery = "SELECT id, year_name, start_date, end_date, is_active 
                           FROM school_years 
                           ORDER BY start_date DESC 
                           LIMIT 1";
        $currentSchoolYear = $db->query($lastResortQuery)->fetch(PDO::FETCH_ASSOC);
    }

    if ($currentSchoolYear) {
        // Determine if we're in the promotion period (last 3 months of school year)
        $endDate = new DateTime($currentSchoolYear['end_date']);
        $promotionStartDate = clone $endDate;
        $promotionStartDate->modify('-3 months');
        $today = new DateTime($currentDate);
        
        $isPromotionPeriod = $today >= $promotionStartDate && $today <= $endDate;
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'current_school_year' => $currentSchoolYear,
            'is_promotion_period' => $isPromotionPeriod,
            'promotion_start_date' => $promotionStartDate->format('Y-m-d'),
            'detection_date' => $currentDate,
            'auto_detected' => true
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'No school year found. Please create a school year first.',
            'detection_date' => $currentDate
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>