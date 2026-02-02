<?php
/**
 * Test Sections API
 * Check what sections are returned for Grade 9 in school year 2025-2026
 */

require_once 'backend/config/database.php';

$db = (new Database())->getConnection();

echo "=== TEST SECTIONS API ===\n\n";

// Test parameters (Grade 8 student promoting to Grade 9)
$targetSchoolYearId = 7;  // 2025-2026
$targetGradeLevel = 9;

echo "Looking for sections:\n";
echo "  School Year ID: $targetSchoolYearId\n";
echo "  Grade Level: $targetGradeLevel\n\n";

// Same query as the API
$query = "SELECT 
            sec.id,
            sec.section_name,
            sec.grade_level_id,
            sec.school_year_id,
            sec.adviser_id,
            sec.capacity,
            sec.current_enrollment,
            sec.is_active,
            gl.level_name,
            gl.level_number,
            sy.year_name,
            CONCAT(a.first_name, ' ', a.last_name) as adviser_name
          FROM sections sec
          INNER JOIN grade_levels gl ON sec.grade_level_id = gl.id
          INNER JOIN school_years sy ON sec.school_year_id = sy.id
          LEFT JOIN advisers a ON sec.adviser_id = a.user_id
          WHERE sec.is_active = 1
          AND sec.school_year_id = :school_year_id
          AND gl.level_number = :grade_level
          ORDER BY gl.level_number, sec.section_name";

$stmt = $db->prepare($query);
$stmt->bindParam(':school_year_id', $targetSchoolYearId);
$stmt->bindParam(':grade_level', $targetGradeLevel);
$stmt->execute();

$sections = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($sections) . " section(s):\n\n";

if (count($sections) > 0) {
    foreach ($sections as $section) {
        echo "Section ID: {$section['id']}\n";
        echo "  Name: {$section['section_name']}\n";
        echo "  Grade: {$section['level_name']} (Level {$section['level_number']})\n";
        echo "  School Year: {$section['year_name']}\n";
        echo "  Capacity: {$section['current_enrollment']}/{$section['capacity']}\n";
        echo "  Adviser: " . ($section['adviser_name'] ?: 'None') . "\n";
        echo "  Active: " . ($section['is_active'] ? 'Yes' : 'No') . "\n\n";
    }
} else {
    echo "❌ No sections found!\n\n";
    
    // Check what sections exist for this school year
    echo "Checking all sections for school year $targetSchoolYearId:\n";
    $allQuery = "SELECT 
                    gl.level_number,
                    sec.section_name,
                    sec.id
                 FROM sections sec
                 JOIN grade_levels gl ON sec.grade_level_id = gl.id
                 WHERE sec.school_year_id = :school_year_id
                 AND sec.is_active = 1
                 ORDER BY gl.level_number, sec.section_name";
    $allStmt = $db->prepare($allQuery);
    $allStmt->bindParam(':school_year_id', $targetSchoolYearId);
    $allStmt->execute();
    $allSections = $allStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($allSections) > 0) {
        foreach ($allSections as $sec) {
            echo "  - Grade {$sec['level_number']} Section {$sec['section_name']} (ID: {$sec['id']})\n";
        }
    } else {
        echo "  No sections at all for this school year!\n";
    }
}
?>
