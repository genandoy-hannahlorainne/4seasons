<?php
/**
 * Setup Sections for Grade 7-10
 * Creates sections 1, 2, 3 for grades 7-10 in both school years
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== SETUP GRADE 7-10 SECTIONS ===\n\n";

try {
    $db->beginTransaction();
    
    // Get school years
    $syQuery = "SELECT * FROM school_years ORDER BY year_name";
    $syStmt = $db->query($syQuery);
    $schoolYears = $syStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "School Years:\n";
    foreach ($schoolYears as $sy) {
        echo "  - {$sy['year_name']} (ID: {$sy['id']})\n";
    }
    
    // Get grade levels 7-10
    $glQuery = "SELECT * FROM grade_levels WHERE level_number BETWEEN 7 AND 10 ORDER BY level_number";
    $glStmt = $db->query($glQuery);
    $gradeLevels = $glStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nGrade Levels:\n";
    foreach ($gradeLevels as $gl) {
        echo "  - Grade {$gl['level_number']}: {$gl['level_name']} (ID: {$gl['id']})\n";
    }
    
    echo "\nCreating sections...\n";
    
    $sections = ['1', '2', '3'];
    $createdCount = 0;
    $existingCount = 0;
    
    foreach ($schoolYears as $sy) {
        foreach ($gradeLevels as $gl) {
            foreach ($sections as $sectionName) {
                // Check if section already exists
                $checkQuery = "SELECT id FROM sections 
                              WHERE grade_level_id = :grade_level_id 
                              AND school_year_id = :school_year_id 
                              AND section_name = :section_name";
                $checkStmt = $db->prepare($checkQuery);
                $checkStmt->bindParam(':grade_level_id', $gl['id']);
                $checkStmt->bindParam(':school_year_id', $sy['id']);
                $checkStmt->bindParam(':section_name', $sectionName);
                $checkStmt->execute();
                
                if ($checkStmt->rowCount() > 0) {
                    echo "  - Grade {$gl['level_number']} Section {$sectionName} ({$sy['year_name']}): Already exists\n";
                    $existingCount++;
                    continue;
                }
                
                // Create section
                $createQuery = "INSERT INTO sections 
                               (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active) 
                               VALUES (:section_name, :grade_level_id, :school_year_id, 50, 0, 1)";
                $createStmt = $db->prepare($createQuery);
                $createStmt->bindParam(':section_name', $sectionName);
                $createStmt->bindParam(':grade_level_id', $gl['id']);
                $createStmt->bindParam(':school_year_id', $sy['id']);
                $createStmt->execute();
                
                echo "  ✓ Created Grade {$gl['level_number']} Section {$sectionName} ({$sy['year_name']})\n";
                $createdCount++;
            }
        }
    }
    
    $db->commit();
    
    echo "\n✅ SETUP COMPLETE!\n";
    echo "Created: $createdCount sections\n";
    echo "Already existed: $existingCount sections\n";
    echo "\nNow you can create student accounts with sections 1-3 for grades 7-10.\n";
    
} catch (Exception $e) {
    $db->rollBack();
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
?>
