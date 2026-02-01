<?php
require_once 'backend/config/database.php';

$db = (new Database())->getConnection();

echo "=== CHECKING DIANE CAPADOSA (user_id: 47) ===\n\n";

// 1. Check adviser record
echo "1. Adviser Record:\n";
$adviserQuery = "SELECT * FROM advisers WHERE user_id = 47";
$adviserStmt = $db->query($adviserQuery);
$adviser = $adviserStmt->fetch(PDO::FETCH_ASSOC);
print_r($adviser);

// 2. Check section assignments
echo "\n2. Section Assignments:\n";
$sectionQuery = "SELECT 
                    sec.id,
                    sec.section_name,
                    gl.level_number,
                    gl.level_name,
                    sy.year_name,
                    sy.id as school_year_id,
                    sy.is_active
                 FROM sections sec
                 JOIN grade_levels gl ON sec.grade_level_id = gl.id
                 JOIN school_years sy ON sec.school_year_id = sy.id
                 WHERE sec.adviser_id = 47";
$sectionStmt = $db->query($sectionQuery);
$sections = $sectionStmt->fetchAll(PDO::FETCH_ASSOC);

if (count($sections) > 0) {
    foreach ($sections as $sec) {
        $active = $sec['is_active'] ? '(ACTIVE)' : '';
        echo "  - Grade {$sec['level_number']} Section {$sec['section_name']} - {$sec['year_name']} $active (section_id: {$sec['id']})\n";
    }
} else {
    echo "  No sections assigned!\n";
}

// 3. Check students in assigned sections
echo "\n3. Students in Assigned Sections:\n";
foreach ($sections as $sec) {
    echo "\n  {$sec['year_name']} - Grade {$sec['level_number']} Section {$sec['section_name']}:\n";
    
    $studentQuery = "SELECT 
                        s.student_id,
                        s.student_number,
                        s.first_name,
                        s.last_name,
                        s.grade_level,
                        s.current_section_id,
                        s.current_school_year_id,
                        s.enrollment_status,
                        sy.year_name as student_school_year
                     FROM students s
                     LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
                     WHERE s.current_section_id = {$sec['id']}
                     AND s.is_active = 1";
    $studentStmt = $db->query($studentQuery);
    $students = $studentStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($students) > 0) {
        foreach ($students as $student) {
            echo "    - {$student['first_name']} {$student['last_name']} ({$student['student_number']})\n";
            echo "      Grade: {$student['grade_level']}, School Year: {$student['student_school_year']}, Status: {$student['enrollment_status']}\n";
        }
    } else {
        echo "    No students\n";
    }
}

// 4. Check all students with Grade 8
echo "\n4. All Grade 8 Students:\n";
$allGrade8Query = "SELECT 
                    s.student_id,
                    s.student_number,
                    s.first_name,
                    s.last_name,
                    s.grade_level,
                    s.current_section_id,
                    sec.section_name,
                    s.current_school_year_id,
                    sy.year_name,
                    s.enrollment_status
                   FROM students s
                   LEFT JOIN sections sec ON s.current_section_id = sec.id
                   LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
                   WHERE s.grade_level = 8
                   AND s.is_active = 1";
$allGrade8Stmt = $db->query($allGrade8Query);
$allGrade8 = $allGrade8Stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($allGrade8 as $student) {
    echo "  - {$student['first_name']} {$student['last_name']} ({$student['student_number']})\n";
    echo "    Section: {$student['section_name']} (ID: {$student['current_section_id']})\n";
    echo "    School Year: {$student['year_name']} (ID: {$student['current_school_year_id']})\n";
    echo "    Status: {$student['enrollment_status']}\n\n";
}

// 5. Check school years
echo "5. School Years:\n";
$syQuery = "SELECT * FROM school_years ORDER BY year_name";
$syStmt = $db->query($syQuery);
$schoolYears = $syStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($schoolYears as $sy) {
    $active = $sy['is_active'] ? '(ACTIVE)' : '';
    echo "  - {$sy['year_name']} (ID: {$sy['id']}) $active\n";
}
?>
