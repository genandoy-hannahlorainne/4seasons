<?php
/**
 * Setup Test Data for Grade Promotion Feature
 * Creates sections for next school year so advisers can promote students
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== SETUP PROMOTION TEST DATA ===\n\n";

try {
    $db->beginTransaction();
    
    // 1. Check current school years
    echo "1. Checking school years...\n";
    $syQuery = "SELECT * FROM school_years ORDER BY year_name";
    $syStmt = $db->query($syQuery);
    $schoolYears = $syStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($schoolYears as $sy) {
        echo "   - {$sy['year_name']} (ID: {$sy['id']}) - " . 
             ($sy['is_active'] ? 'ACTIVE' : 'Not Active') . "\n";
    }
    
    // Get current and next school year
    $currentSY = array_filter($schoolYears, fn($sy) => $sy['is_active'] == 1);
    $currentSY = reset($currentSY);
    
    if (!$currentSY) {
        echo "   ❌ No active school year found!\n";
        exit(1);
    }
    
    echo "   ✓ Current school year: {$currentSY['year_name']}\n";
    
    // Find or create next school year
    $nextSYName = (intval(substr($currentSY['year_name'], 0, 4)) + 1) . '-' . 
                  (intval(substr($currentSY['year_name'], 5, 4)) + 1);
    
    $nextSY = array_filter($schoolYears, fn($sy) => $sy['year_name'] == $nextSYName);
    $nextSY = reset($nextSY);
    
    if (!$nextSY) {
        echo "   Creating next school year: $nextSYName\n";
        $createSYQuery = "INSERT INTO school_years (year_name, start_date, end_date, is_active) 
                         VALUES (:year_name, :start_date, :end_date, 0)";
        $createSYStmt = $db->prepare($createSYQuery);
        $startDate = (intval(substr($currentSY['year_name'], 0, 4)) + 1) . '-08-01';
        $endDate = (intval(substr($currentSY['year_name'], 5, 4)) + 1) . '-05-31';
        $createSYStmt->bindParam(':year_name', $nextSYName);
        $createSYStmt->bindParam(':start_date', $startDate);
        $createSYStmt->bindParam(':end_date', $endDate);
        $createSYStmt->execute();
        $nextSYId = $db->lastInsertId();
        echo "   ✓ Created school year: $nextSYName (ID: $nextSYId)\n";
    } else {
        $nextSYId = $nextSY['id'];
        echo "   ✓ Next school year exists: {$nextSY['year_name']} (ID: $nextSYId)\n";
    }
    
    // 2. Get grade levels
    echo "\n2. Getting grade levels...\n";
    $glQuery = "SELECT * FROM grade_levels ORDER BY level_number";
    $glStmt = $db->query($glQuery);
    $gradeLevels = $glStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($gradeLevels as $gl) {
        echo "   - Grade {$gl['level_number']}: {$gl['level_name']} (ID: {$gl['id']})\n";
    }
    
    // 3. Create sections for next school year (Grade 8-12)
    echo "\n3. Creating sections for next school year...\n";
    
    $sectionsToCreate = [
        ['grade' => 8, 'sections' => ['A', 'B']],
        ['grade' => 9, 'sections' => ['A', 'B']],
        ['grade' => 10, 'sections' => ['A', 'B']],
        ['grade' => 11, 'sections' => ['STEM 1', 'STEM 2', 'HUMSS 1']],
        ['grade' => 12, 'sections' => ['STEM 1', 'STEM 2', 'HUMSS 1']],
    ];
    
    foreach ($sectionsToCreate as $gradeData) {
        $gradeLevel = $gradeData['grade'];
        $gl = array_filter($gradeLevels, fn($g) => $g['level_number'] == $gradeLevel);
        $gl = reset($gl);
        
        if (!$gl) {
            echo "   ⚠️ Grade level $gradeLevel not found, skipping...\n";
            continue;
        }
        
        foreach ($gradeData['sections'] as $sectionName) {
            // Check if section already exists
            $checkQuery = "SELECT id FROM sections 
                          WHERE grade_level_id = :grade_level_id 
                          AND school_year_id = :school_year_id 
                          AND section_name = :section_name";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':grade_level_id', $gl['id']);
            $checkStmt->bindParam(':school_year_id', $nextSYId);
            $checkStmt->bindParam(':section_name', $sectionName);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                echo "   - Grade {$gradeLevel} Section {$sectionName}: Already exists\n";
                continue;
            }
            
            // Create section
            $createSecQuery = "INSERT INTO sections 
                              (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active) 
                              VALUES (:section_name, :grade_level_id, :school_year_id, 50, 0, 1)";
            $createSecStmt = $db->prepare($createSecQuery);
            $createSecStmt->bindParam(':section_name', $sectionName);
            $createSecStmt->bindParam(':grade_level_id', $gl['id']);
            $createSecStmt->bindParam(':school_year_id', $nextSYId);
            $createSecStmt->execute();
            
            echo "   ✓ Created Grade {$gradeLevel} Section {$sectionName}\n";
        }
    }
    
    // 4. Show current students that can be promoted
    echo "\n4. Students ready for promotion:\n";
    $studentsQuery = "SELECT 
                        s.student_id,
                        s.student_number,
                        s.first_name,
                        s.last_name,
                        s.grade_level,
                        gl.level_name,
                        sec.section_name,
                        sy.year_name,
                        s.enrollment_status
                      FROM students s
                      LEFT JOIN grade_levels gl ON s.grade_level = gl.level_number
                      LEFT JOIN sections sec ON s.current_section_id = sec.id
                      LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
                      WHERE s.is_active = 1 
                      AND s.enrollment_status = 'active'
                      ORDER BY s.grade_level, s.last_name";
    $studentsStmt = $db->query($studentsQuery);
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $byGrade = [];
    foreach ($students as $student) {
        $grade = $student['grade_level'];
        if (!isset($byGrade[$grade])) {
            $byGrade[$grade] = [];
        }
        $byGrade[$grade][] = $student;
    }
    
    foreach ($byGrade as $grade => $gradeStudents) {
        echo "   Grade $grade: " . count($gradeStudents) . " students\n";
        foreach ($gradeStudents as $student) {
            $action = $grade == 12 ? '→ GRADUATE' : "→ Grade " . ($grade + 1);
            echo "      - {$student['first_name']} {$student['last_name']} ({$student['student_number']}) $action\n";
        }
    }
    
    $db->commit();
    
    echo "\n✅ SETUP COMPLETE!\n";
    echo "\nNext steps:\n";
    echo "1. Login as adviser (username: 00001, check database for password)\n";
    echo "2. Go to 'My Class Management'\n";
    echo "3. Select current school year: {$currentSY['year_name']}\n";
    echo "4. Select students and click 'Promote Selected'\n";
    echo "5. Choose target school year: $nextSYName\n";
    echo "6. Choose target section\n";
    echo "7. Confirm promotion\n";
    
} catch (Exception $e) {
    $db->rollBack();
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
?>
