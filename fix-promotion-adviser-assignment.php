<?php
/**
 * Fix Promotion Adviser Assignment
 * 
 * This script ensures that when students are promoted:
 * 1. Their current_adviser_id is updated to match their new section's adviser
 * 2. They appear in the new adviser's class roster
 * 3. They no longer appear in the old adviser's roster
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Fix Promotion Adviser Assignment ===\n\n";

try {
    $db->beginTransaction();

    // Step 1: Update all students' current_adviser_id to match their current section's adviser
    echo "Step 1: Syncing student adviser assignments with their current sections...\n";
    
    $syncQuery = "UPDATE students s
                  INNER JOIN sections sec ON s.current_section_id = sec.id
                  SET s.current_adviser_id = sec.adviser_id
                  WHERE s.enrollment_status = 'active'
                  AND s.current_section_id IS NOT NULL
                  AND (s.current_adviser_id IS NULL OR s.current_adviser_id != sec.adviser_id)";
    
    $syncStmt = $db->prepare($syncQuery);
    $syncStmt->execute();
    $synced = $syncStmt->rowCount();
    echo "✓ Synced $synced students with their section advisers\n\n";

    // Step 2: Show current state
    echo "Step 2: Current student distribution by school year and adviser:\n";
    
    $distQuery = "SELECT 
                    sy.year_name,
                    CONCAT(a.first_name, ' ', a.last_name) as adviser_name,
                    sec.section_name,
                    gl.level_name,
                    COUNT(s.student_id) as student_count
                  FROM students s
                  INNER JOIN sections sec ON s.current_section_id = sec.id
                  INNER JOIN school_years sy ON s.current_school_year_id = sy.id
                  INNER JOIN grade_levels gl ON sec.grade_level_id = gl.id
                  LEFT JOIN advisers a ON s.current_adviser_id = a.user_id
                  WHERE s.enrollment_status = 'active'
                  GROUP BY sy.year_name, adviser_name, sec.section_name, gl.level_name
                  ORDER BY sy.year_name, gl.level_number, sec.section_name";
    
    $distStmt = $db->prepare($distQuery);
    $distStmt->execute();
    $distribution = $distStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($distribution as $row) {
        echo sprintf("  %s | %s - %s | Adviser: %s | Students: %d\n",
            $row['year_name'],
            $row['level_name'],
            $row['section_name'],
            $row['adviser_name'] ?? 'UNASSIGNED',
            $row['student_count']
        );
    }
    echo "\n";

    // Step 3: Check for students without advisers
    echo "Step 3: Checking for students without advisers...\n";
    
    $orphanQuery = "SELECT 
                      s.student_id,
                      s.student_number,
                      CONCAT(s.first_name, ' ', s.last_name) as student_name,
                      sy.year_name,
                      gl.level_name,
                      sec.section_name
                    FROM students s
                    LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
                    LEFT JOIN sections sec ON s.current_section_id = sec.id
                    LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
                    WHERE s.enrollment_status = 'active'
                    AND s.current_adviser_id IS NULL";
    
    $orphanStmt = $db->prepare($orphanQuery);
    $orphanStmt->execute();
    $orphans = $orphanStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($orphans) > 0) {
        echo "⚠ Found " . count($orphans) . " students without advisers:\n";
        foreach ($orphans as $orphan) {
            echo sprintf("  - %s (%s) in %s - %s %s\n",
                $orphan['student_name'],
                $orphan['student_number'],
                $orphan['year_name'] ?? 'No Year',
                $orphan['level_name'] ?? 'No Grade',
                $orphan['section_name'] ?? 'No Section'
            );
        }
    } else {
        echo "✓ All active students have advisers assigned\n";
    }
    echo "\n";

    // Step 4: Verify section adviser assignments
    echo "Step 4: Verifying section adviser assignments...\n";
    
    $sectionQuery = "SELECT 
                       sy.year_name,
                       gl.level_name,
                       sec.section_name,
                       CONCAT(a.first_name, ' ', a.last_name) as adviser_name,
                       sec.current_enrollment,
                       (SELECT COUNT(*) FROM students s 
                        WHERE s.current_section_id = sec.id 
                        AND s.enrollment_status = 'active') as actual_students
                     FROM sections sec
                     INNER JOIN school_years sy ON sec.school_year_id = sy.id
                     INNER JOIN grade_levels gl ON sec.grade_level_id = gl.id
                     LEFT JOIN advisers a ON sec.adviser_id = a.user_id
                     ORDER BY sy.year_name, gl.level_number, sec.section_name";
    
    $sectionStmt = $db->prepare($sectionQuery);
    $sectionStmt->execute();
    $sections = $sectionStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($sections as $section) {
        $mismatch = $section['current_enrollment'] != $section['actual_students'] ? ' ⚠ MISMATCH' : '';
        echo sprintf("  %s | %s - %s | Adviser: %s | Enrolled: %d | Actual: %d%s\n",
            $section['year_name'],
            $section['level_name'],
            $section['section_name'],
            $section['adviser_name'] ?? 'UNASSIGNED',
            $section['current_enrollment'],
            $section['actual_students'],
            $mismatch
        );
    }
    echo "\n";

    // Step 5: Fix enrollment counts
    echo "Step 5: Fixing section enrollment counts...\n";
    
    $fixCountQuery = "UPDATE sections sec
                      SET sec.current_enrollment = (
                        SELECT COUNT(*) 
                        FROM students s 
                        WHERE s.current_section_id = sec.id 
                        AND s.enrollment_status = 'active'
                      )";
    
    $fixCountStmt = $db->prepare($fixCountQuery);
    $fixCountStmt->execute();
    echo "✓ Updated enrollment counts for all sections\n\n";

    $db->commit();
    
    echo "=== Fix Complete ===\n";
    echo "All students are now properly assigned to their section advisers.\n";
    echo "Advisers will now see the correct students for their sections.\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
