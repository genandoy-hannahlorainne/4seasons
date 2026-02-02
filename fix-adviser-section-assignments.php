<?php
/**
 * Fix Adviser Section Assignments
 * Assigns advisers to sections based on their grade_level and section fields
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== FIX ADVISER SECTION ASSIGNMENTS ===\n\n";

try {
    // Get active school year
    $syQuery = "SELECT * FROM school_years WHERE is_active = 1";
    $syStmt = $db->query($syQuery);
    $activeSchoolYear = $syStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$activeSchoolYear) {
        echo "❌ No active school year found!\n";
        echo "Please set one school year as active first.\n";
        exit(1);
    }
    
    echo "Active School Year: {$activeSchoolYear['year_name']} (ID: {$activeSchoolYear['id']})\n\n";
    
    // Get advisers with grade_level and section but not assigned to sections table
    $adviserQuery = "SELECT 
                        a.adviser_id,
                        a.user_id,
                        a.first_name,
                        a.last_name,
                        a.grade_level,
                        a.section,
                        u.username
                     FROM advisers a
                     JOIN users u ON a.user_id = u.user_id
                     WHERE a.is_active = 1
                     AND a.grade_level IS NOT NULL
                     AND a.section IS NOT NULL
                     AND a.grade_level != ''
                     AND a.section != ''";
    $adviserStmt = $db->query($adviserQuery);
    $advisers = $adviserStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($advisers) . " adviser(s) with grade level and section:\n\n";
    
    if (count($advisers) === 0) {
        echo "No advisers to process.\n";
        exit(0);
    }
    
    $db->beginTransaction();
    
    $assignedCount = 0;
    $notFoundCount = 0;
    $alreadyAssignedCount = 0;
    
    foreach ($advisers as $adviser) {
        echo "Processing: {$adviser['first_name']} {$adviser['last_name']} (Grade {$adviser['grade_level']}, Section {$adviser['section']})\n";
        
        // Check if already assigned to a section for this school year
        $checkQuery = "SELECT id FROM sections 
                      WHERE adviser_id = :user_id 
                      AND school_year_id = :school_year_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':user_id', $adviser['user_id']);
        $checkStmt->bindParam(':school_year_id', $activeSchoolYear['id']);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            echo "  ℹ️  Already assigned to a section\n";
            $alreadyAssignedCount++;
            continue;
        }
        
        // Find the section
        $findSectionQuery = "SELECT sec.id, sec.section_name, gl.level_name
                            FROM sections sec
                            JOIN grade_levels gl ON sec.grade_level_id = gl.id
                            WHERE gl.level_number = :grade_level
                            AND sec.section_name = :section_name
                            AND sec.school_year_id = :school_year_id
                            AND sec.is_active = 1
                            LIMIT 1";
        $findSectionStmt = $db->prepare($findSectionQuery);
        $findSectionStmt->bindParam(':grade_level', $adviser['grade_level']);
        $findSectionStmt->bindParam(':section_name', $adviser['section']);
        $findSectionStmt->bindParam(':school_year_id', $activeSchoolYear['id']);
        $findSectionStmt->execute();
        
        if ($findSectionStmt->rowCount() === 0) {
            echo "  ❌ Section not found: Grade {$adviser['grade_level']}, Section {$adviser['section']}\n";
            $notFoundCount++;
            continue;
        }
        
        $section = $findSectionStmt->fetch(PDO::FETCH_ASSOC);
        
        // Check if section already has an adviser
        $checkAdviserQuery = "SELECT adviser_id FROM sections WHERE id = :section_id";
        $checkAdviserStmt = $db->prepare($checkAdviserQuery);
        $checkAdviserStmt->bindParam(':section_id', $section['id']);
        $checkAdviserStmt->execute();
        $existingSection = $checkAdviserStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingSection['adviser_id']) {
            echo "  ⚠️  Section already has an adviser (user_id: {$existingSection['adviser_id']})\n";
            echo "     Do you want to replace? (yes/no): ";
            $confirm = trim(fgets(STDIN));
            
            if (strtolower($confirm) !== 'yes' && strtolower($confirm) !== 'y') {
                echo "     Skipped\n";
                continue;
            }
        }
        
        // Assign adviser to section
        $assignQuery = "UPDATE sections SET adviser_id = :user_id WHERE id = :section_id";
        $assignStmt = $db->prepare($assignQuery);
        $assignStmt->bindParam(':user_id', $adviser['user_id']);
        $assignStmt->bindParam(':section_id', $section['id']);
        $assignStmt->execute();
        
        echo "  ✓ Assigned to {$section['level_name']} Section {$section['section_name']} (section_id: {$section['id']})\n";
        $assignedCount++;
    }
    
    $db->commit();
    
    echo "\n✅ PROCESSING COMPLETE!\n";
    echo "Assigned: $assignedCount\n";
    echo "Already assigned: $alreadyAssignedCount\n";
    echo "Section not found: $notFoundCount\n";
    
    // Show current section assignments
    echo "\n=== Current Section Assignments ({$activeSchoolYear['year_name']}) ===\n";
    $assignmentQuery = "SELECT 
                          gl.level_number,
                          sec.section_name,
                          a.first_name,
                          a.last_name,
                          u.username
                        FROM sections sec
                        JOIN grade_levels gl ON sec.grade_level_id = gl.id
                        LEFT JOIN advisers a ON sec.adviser_id = a.user_id
                        LEFT JOIN users u ON a.user_id = u.user_id
                        WHERE sec.school_year_id = :school_year_id
                        AND sec.adviser_id IS NOT NULL
                        ORDER BY gl.level_number, sec.section_name";
    $assignmentStmt = $db->prepare($assignmentQuery);
    $assignmentStmt->bindParam(':school_year_id', $activeSchoolYear['id']);
    $assignmentStmt->execute();
    $assignments = $assignmentStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $currentGrade = null;
    foreach ($assignments as $assignment) {
        if ($currentGrade !== $assignment['level_number']) {
            $currentGrade = $assignment['level_number'];
            echo "\nGrade $currentGrade:\n";
        }
        
        $adviserName = $assignment['first_name'] && $assignment['last_name'] 
            ? "{$assignment['first_name']} {$assignment['last_name']} ({$assignment['username']})"
            : "Unknown";
        echo "  Section {$assignment['section_name']}: $adviserName\n";
    }
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
?>
