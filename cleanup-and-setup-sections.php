<?php
/**
 * Cleanup duplicate sections and setup Grade 11-12 sections for 2024-2025
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== CLEANUP AND SETUP SECTIONS ===\n\n";

try {
    $db->beginTransaction();
    
    // 1. Delete duplicate A, B sections for grades 8-10 in 2025-2026
    echo "1. Removing duplicate A, B sections for grades 8-10 in 2025-2026...\n";
    $deleteQuery = "DELETE FROM sections 
                   WHERE section_name IN ('A', 'B') 
                   AND grade_level_id IN (2, 3, 4) 
                   AND school_year_id = 7";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->execute();
    $deletedCount = $deleteStmt->rowCount();
    echo "   ✓ Deleted $deletedCount duplicate sections\n";
    
    // 2. Create Grade 11-12 sections for 2024-2025
    echo "\n2. Creating Grade 11-12 sections for 2024-2025...\n";
    
    $sections = [
        'STEM 1',
        'STEM 2',
        'ABM 1',
        'ABM 2',
        'HUMSS 1',
        'HUMSS 2',
        'TVL-HE 1',
        'TVL-HE 2',
        'TVL-EIM 1',
        'TVL-EIM 2'
    ];
    
    $grades = [11, 12];
    $schoolYearId = 6; // 2024-2025
    $createdCount = 0;
    $existingCount = 0;
    
    foreach ($grades as $gradeNum) {
        // Get grade level ID
        $glQuery = "SELECT id FROM grade_levels WHERE level_number = :level_number";
        $glStmt = $db->prepare($glQuery);
        $glStmt->bindParam(':level_number', $gradeNum);
        $glStmt->execute();
        $gradeLevel = $glStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$gradeLevel) {
            echo "   ⚠️ Grade $gradeNum not found\n";
            continue;
        }
        
        $gradeLevelId = $gradeLevel['id'];
        
        foreach ($sections as $sectionName) {
            // Check if exists
            $checkQuery = "SELECT id FROM sections 
                          WHERE grade_level_id = :grade_level_id 
                          AND school_year_id = :school_year_id 
                          AND section_name = :section_name";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':grade_level_id', $gradeLevelId);
            $checkStmt->bindParam(':school_year_id', $schoolYearId);
            $checkStmt->bindParam(':section_name', $sectionName);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                echo "   - Grade $gradeNum Section $sectionName: Already exists\n";
                $existingCount++;
                continue;
            }
            
            // Create section
            $createQuery = "INSERT INTO sections 
                           (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active) 
                           VALUES (:section_name, :grade_level_id, :school_year_id, 50, 0, 1)";
            $createStmt = $db->prepare($createQuery);
            $createStmt->bindParam(':section_name', $sectionName);
            $createStmt->bindParam(':grade_level_id', $gradeLevelId);
            $createStmt->bindParam(':school_year_id', $schoolYearId);
            $createStmt->execute();
            
            echo "   ✓ Created Grade $gradeNum Section $sectionName\n";
            $createdCount++;
        }
    }
    
    $db->commit();
    
    echo "\n✅ CLEANUP AND SETUP COMPLETE!\n";
    echo "Deleted: $deletedCount duplicate sections\n";
    echo "Created: $createdCount new sections\n";
    echo "Already existed: $existingCount sections\n";
    
} catch (Exception $e) {
    $db->rollBack();
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
?>
