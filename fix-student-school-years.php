<?php
/**
 * Fix Student School Year Assignments
 * Ensures all active students are assigned to the correct school year
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== FIX STUDENT SCHOOL YEAR ASSIGNMENTS ===\n\n";

try {
    // Get active school year
    $syQuery = "SELECT * FROM school_years WHERE is_active = 1";
    $syStmt = $db->query($syQuery);
    $activeSchoolYear = $syStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$activeSchoolYear) {
        echo "❌ No active school year found!\n";
        echo "Please set one school year as active:\n";
        echo "  UPDATE school_years SET is_active = 1 WHERE year_name = '2024-2025';\n";
        exit(1);
    }
    
    echo "Active School Year: {$activeSchoolYear['year_name']} (ID: {$activeSchoolYear['id']})\n\n";
    
    // Check students without school year
    $checkQuery = "SELECT COUNT(*) as count 
                   FROM students 
                   WHERE is_active = 1 
                   AND (current_school_year_id IS NULL OR current_school_year_id = 0)";
    $checkStmt = $db->query($checkQuery);
    $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $studentsWithoutSY = $result['count'];
    
    echo "Students without school year: $studentsWithoutSY\n";
    
    if ($studentsWithoutSY > 0) {
        echo "\nDo you want to assign these students to '{$activeSchoolYear['year_name']}'? (yes/no): ";
        $confirm = trim(fgets(STDIN));
        
        if (strtolower($confirm) === 'yes' || strtolower($confirm) === 'y') {
            $db->beginTransaction();
            
            $updateQuery = "UPDATE students 
                           SET current_school_year_id = :school_year_id 
                           WHERE is_active = 1 
                           AND (current_school_year_id IS NULL OR current_school_year_id = 0)";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(':school_year_id', $activeSchoolYear['id']);
            $updateStmt->execute();
            
            $updatedCount = $updateStmt->rowCount();
            
            $db->commit();
            
            echo "✓ Updated $updatedCount students\n";
        } else {
            echo "Skipped updating students\n";
        }
    }
    
    // Show student distribution by school year
    echo "\n=== Student Distribution by School Year ===\n";
    $distQuery = "SELECT 
                    sy.year_name,
                    sy.is_active,
                    COUNT(s.student_id) as student_count
                  FROM school_years sy
                  LEFT JOIN students s ON sy.id = s.current_school_year_id AND s.is_active = 1
                  GROUP BY sy.id
                  ORDER BY sy.year_name";
    $distStmt = $db->query($distQuery);
    $distribution = $distStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($distribution as $dist) {
        $status = $dist['is_active'] ? '(ACTIVE)' : '';
        echo "  {$dist['year_name']} $status: {$dist['student_count']} students\n";
    }
    
    // Show students by grade level in active school year
    echo "\n=== Students by Grade Level ({$activeSchoolYear['year_name']}) ===\n";
    $gradeQuery = "SELECT 
                     s.grade_level,
                     gl.level_name,
                     COUNT(s.student_id) as student_count
                   FROM students s
                   LEFT JOIN grade_levels gl ON s.grade_level = gl.level_number
                   WHERE s.is_active = 1 
                   AND s.current_school_year_id = :school_year_id
                   GROUP BY s.grade_level
                   ORDER BY s.grade_level";
    $gradeStmt = $db->prepare($gradeQuery);
    $gradeStmt->bindParam(':school_year_id', $activeSchoolYear['id']);
    $gradeStmt->execute();
    $gradeDistribution = $gradeStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($gradeDistribution as $grade) {
        echo "  Grade {$grade['grade_level']}: {$grade['student_count']} students\n";
    }
    
    // Show sections with student counts
    echo "\n=== Sections with Student Counts ({$activeSchoolYear['year_name']}) ===\n";
    $sectionQuery = "SELECT 
                       gl.level_number,
                       sec.section_name,
                       sec.capacity,
                       COUNT(s.student_id) as enrolled_count,
                       adv.first_name as adviser_first_name,
                       adv.last_name as adviser_last_name
                     FROM sections sec
                     JOIN grade_levels gl ON sec.grade_level_id = gl.id
                     LEFT JOIN students s ON sec.id = s.current_section_id 
                                          AND s.is_active = 1 
                                          AND s.current_school_year_id = :school_year_id
                     LEFT JOIN advisers adv ON sec.adviser_id = adv.user_id
                     WHERE sec.school_year_id = :school_year_id
                     AND sec.is_active = 1
                     GROUP BY sec.id
                     ORDER BY gl.level_number, sec.section_name";
    $sectionStmt = $db->prepare($sectionQuery);
    $sectionStmt->bindParam(':school_year_id', $activeSchoolYear['id']);
    $sectionStmt->execute();
    $sections = $sectionStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $currentGrade = null;
    foreach ($sections as $section) {
        if ($currentGrade !== $section['level_number']) {
            $currentGrade = $section['level_number'];
            echo "\nGrade $currentGrade:\n";
        }
        
        $adviserName = ($section['adviser_first_name'] && $section['adviser_last_name']) 
            ? "{$section['adviser_first_name']} {$section['adviser_last_name']}" 
            : null;
        $adviserInfo = $adviserName ? " (Adviser: $adviserName)" : " (No adviser)";
        echo "  Section {$section['section_name']}: {$section['enrolled_count']}/{$section['capacity']} students$adviserInfo\n";
    }
    
    echo "\n✅ ANALYSIS COMPLETE!\n";
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
?>
