<?php
/**
 * Setup New School Year
 * Creates a new school year and all necessary sections
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== SETUP NEW SCHOOL YEAR ===\n\n";

// Get year from command line or prompt
$newYearName = $argv[1] ?? null;

if (!$newYearName) {
    echo "Usage: php setup-new-school-year.php YYYY-YYYY [--set-active]\n";
    echo "Example: php setup-new-school-year.php 2026-2027\n";
    echo "Example: php setup-new-school-year.php 2026-2027 --set-active\n\n";
    
    // Show existing school years
    $syStmt = $db->query("SELECT * FROM school_years ORDER BY year_name");
    $schoolYears = $syStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Existing School Years:\n";
    foreach ($schoolYears as $sy) {
        $status = $sy['is_active'] ? '(ACTIVE)' : '';
        echo "  - {$sy['year_name']} (ID: {$sy['id']}) $status\n";
    }
    
    echo "\nEnter new school year name (YYYY-YYYY): ";
    $newYearName = trim(fgets(STDIN));
}

// Validate format
if (!preg_match('/^\d{4}-\d{4}$/', $newYearName)) {
    echo "❌ Invalid format. Use YYYY-YYYY (e.g., 2026-2027)\n";
    exit(1);
}

$setActive = in_array('--set-active', $argv);

try {
    $db->beginTransaction();
    
    // Check if year already exists
    $checkQuery = "SELECT id FROM school_years WHERE year_name = :year_name";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':year_name', $newYearName);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        echo "❌ School year '$newYearName' already exists!\n";
        $db->rollBack();
        exit(1);
    }
    
    // Parse year
    list($startYear, $endYear) = explode('-', $newYearName);
    $startDate = "$startYear-08-01";
    $endDate = "$endYear-05-31";
    
    echo "1. Creating school year '$newYearName'...\n";
    echo "   Start Date: $startDate\n";
    echo "   End Date: $endDate\n";
    
    // Create school year
    $createSYQuery = "INSERT INTO school_years (year_name, start_date, end_date, is_active) 
                     VALUES (:year_name, :start_date, :end_date, 0)";
    $createSYStmt = $db->prepare($createSYQuery);
    $createSYStmt->bindParam(':year_name', $newYearName);
    $createSYStmt->bindParam(':start_date', $startDate);
    $createSYStmt->bindParam(':end_date', $endDate);
    $createSYStmt->execute();
    
    $newSchoolYearId = $db->lastInsertId();
    echo "   ✓ Created school year (ID: $newSchoolYearId)\n";
    
    // Get grade levels
    echo "\n2. Getting grade levels...\n";
    $glQuery = "SELECT * FROM grade_levels ORDER BY level_number";
    $glStmt = $db->query($glQuery);
    $gradeLevels = $glStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($gradeLevels as $gl) {
        echo "   - Grade {$gl['level_number']}: {$gl['level_name']} (ID: {$gl['id']})\n";
    }
    
    // Create sections
    echo "\n3. Creating sections...\n";
    
    $createdCount = 0;
    
    // Grades 7-10: Sections 1, 2, 3
    $juniorSections = ['1', '2', '3'];
    foreach ($gradeLevels as $gl) {
        if ($gl['level_number'] >= 7 && $gl['level_number'] <= 10) {
            foreach ($juniorSections as $sectionName) {
                $createSecQuery = "INSERT INTO sections 
                                  (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active) 
                                  VALUES (:section_name, :grade_level_id, :school_year_id, 50, 0, 1)";
                $createSecStmt = $db->prepare($createSecQuery);
                $createSecStmt->bindParam(':section_name', $sectionName);
                $createSecStmt->bindParam(':grade_level_id', $gl['id']);
                $createSecStmt->bindParam(':school_year_id', $newSchoolYearId);
                $createSecStmt->execute();
                
                echo "   ✓ Created Grade {$gl['level_number']} Section $sectionName\n";
                $createdCount++;
            }
        }
    }
    
    // Grades 11-12: Strand sections
    $seniorSections = [
        'STEM 1', 'STEM 2',
        'ABM 1', 'ABM 2',
        'HUMSS 1', 'HUMSS 2',
        'TVL-HE 1', 'TVL-HE 2',
        'TVL-EIM 1', 'TVL-EIM 2'
    ];
    
    foreach ($gradeLevels as $gl) {
        if ($gl['level_number'] === 11 || $gl['level_number'] === 12) {
            foreach ($seniorSections as $sectionName) {
                $createSecQuery = "INSERT INTO sections 
                                  (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active) 
                                  VALUES (:section_name, :grade_level_id, :school_year_id, 50, 0, 1)";
                $createSecStmt = $db->prepare($createSecQuery);
                $createSecStmt->bindParam(':section_name', $sectionName);
                $createSecStmt->bindParam(':grade_level_id', $gl['id']);
                $createSecStmt->bindParam(':school_year_id', $newSchoolYearId);
                $createSecStmt->execute();
                
                echo "   ✓ Created Grade {$gl['level_number']} Section $sectionName\n";
                $createdCount++;
            }
        }
    }
    
    // Set as active if requested
    if ($setActive) {
        echo "\n4. Setting as active school year...\n";
        
        // Deactivate all others
        $db->exec("UPDATE school_years SET is_active = 0");
        
        // Activate new year
        $activateQuery = "UPDATE school_years SET is_active = 1 WHERE id = :id";
        $activateStmt = $db->prepare($activateQuery);
        $activateStmt->bindParam(':id', $newSchoolYearId);
        $activateStmt->execute();
        
        echo "   ✓ Set '$newYearName' as active school year\n";
    }
    
    $db->commit();
    
    echo "\n✅ SETUP COMPLETE!\n";
    echo "School Year: $newYearName (ID: $newSchoolYearId)\n";
    echo "Sections Created: $createdCount\n";
    echo "Status: " . ($setActive ? 'ACTIVE' : 'Inactive') . "\n";
    
    if (!$setActive) {
        echo "\nTo set this as the active school year, run:\n";
        echo "  UPDATE school_years SET is_active = 0;\n";
        echo "  UPDATE school_years SET is_active = 1 WHERE id = $newSchoolYearId;\n";
    }
    
    echo "\nNext steps:\n";
    echo "1. Assign advisers to sections for this school year\n";
    echo "2. Promote students from previous year (if applicable)\n";
    echo "3. Or create new student accounts for this year\n";
    
} catch (Exception $e) {
    $db->rollBack();
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
?>
