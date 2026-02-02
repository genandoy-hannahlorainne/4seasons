<?php
require_once 'backend/config/database.php';

$db = (new Database())->getConnection();

echo "=== FIX CLYDE AND DIANE ===\n\n";

try {
    $db->beginTransaction();
    
    // 1. Fix Clyde Alonzo - assign to Grade 8 Section 2 for 2024-2025
    echo "1. Fixing Clyde Alonzo...\n";
    
    $updateClydeQuery = "UPDATE students 
                        SET current_section_id = 21,  -- Grade 8 Section 2
                            current_school_year_id = 6  -- 2024-2025
                        WHERE student_number = '136883100332'";
    $db->exec($updateClydeQuery);
    echo "   ✓ Assigned Clyde to Grade 8 Section 2 (2024-2025)\n";
    
    // 2. Assign Diane to Grade 8 Section 2 for 2025-2026 as well
    echo "\n2. Assigning Diane to 2025-2026...\n";
    
    // Find Grade 8 Section 2 for 2025-2026
    $findSectionQuery = "SELECT sec.id 
                        FROM sections sec
                        JOIN grade_levels gl ON sec.grade_level_id = gl.id
                        WHERE gl.level_number = 8
                        AND sec.section_name = '2'
                        AND sec.school_year_id = 7  -- 2025-2026
                        LIMIT 1";
    $findSectionStmt = $db->query($findSectionQuery);
    
    if ($findSectionStmt->rowCount() > 0) {
        $section = $findSectionStmt->fetch(PDO::FETCH_ASSOC);
        $sectionId = $section['id'];
        
        $assignDianeQuery = "UPDATE sections 
                            SET adviser_id = 47  -- Diane's user_id
                            WHERE id = $sectionId";
        $db->exec($assignDianeQuery);
        echo "   ✓ Assigned Diane to Grade 8 Section 2 (2025-2026) - section_id: $sectionId\n";
    } else {
        echo "   ⚠️  Grade 8 Section 2 not found for 2025-2026\n";
    }
    
    $db->commit();
    
    echo "\n✅ FIX COMPLETE!\n";
    
    // Verify
    echo "\n=== VERIFICATION ===\n";
    
    echo "\nClyde Alonzo:\n";
    $clydeQuery = "SELECT 
                    s.*,
                    sec.section_name,
                    sy.year_name
                   FROM students s
                   LEFT JOIN sections sec ON s.current_section_id = sec.id
                   LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
                   WHERE s.student_number = '136883100332'";
    $clydeStmt = $db->query($clydeQuery);
    $clyde = $clydeStmt->fetch(PDO::FETCH_ASSOC);
    echo "  Section: Grade {$clyde['grade_level']} Section {$clyde['section_name']}\n";
    echo "  School Year: {$clyde['year_name']}\n";
    
    echo "\nDiane's Sections:\n";
    $dianeQuery = "SELECT 
                    sec.id,
                    gl.level_number,
                    sec.section_name,
                    sy.year_name,
                    sy.is_active
                   FROM sections sec
                   JOIN grade_levels gl ON sec.grade_level_id = gl.id
                   JOIN school_years sy ON sec.school_year_id = sy.id
                   WHERE sec.adviser_id = 47
                   ORDER BY sy.year_name";
    $dianeStmt = $db->query($dianeQuery);
    $dianeSections = $dianeStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($dianeSections as $sec) {
        $active = $sec['is_active'] ? '(ACTIVE)' : '';
        echo "  - Grade {$sec['level_number']} Section {$sec['section_name']} - {$sec['year_name']} $active\n";
    }
    
} catch (Exception $e) {
    $db->rollBack();
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
}
?>
