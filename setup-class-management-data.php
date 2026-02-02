<?php
require_once 'backend/config/database.php';

$database = new Database();
$conn = $database->getConnection();

echo "=== SETTING UP CLASS MANAGEMENT DATA ===\n\n";

try {
    $conn->beginTransaction();
    
    // 1. Create school years
    echo "1. Creating school years...\n";
    $schoolYears = [
        ['2024-2025', '2024-06-01', '2025-03-31', 1],
        ['2025-2026', '2025-06-01', '2026-03-31', 0],
    ];
    
    foreach ($schoolYears as $year) {
        $checkYear = $conn->prepare("SELECT id FROM school_years WHERE year_name = ?");
        $checkYear->execute([$year[0]]);
        
        if ($checkYear->rowCount() == 0) {
            $insertYear = $conn->prepare("INSERT INTO school_years (year_name, start_date, end_date, is_active) VALUES (?, ?, ?, ?)");
            $insertYear->execute($year);
            echo "  ✓ Created: {$year[0]}\n";
        } else {
            echo "  - Already exists: {$year[0]}\n";
        }
    }
    
    // Get current school year ID
    $currentYearResult = $conn->query("SELECT id FROM school_years WHERE is_active = 1 LIMIT 1");
    $currentYear = $currentYearResult->fetch(PDO::FETCH_ASSOC);
    $schoolYearId = $currentYear['id'];
    echo "  Current school year ID: $schoolYearId\n\n";
    
    // 2. Get adviser info
    echo "2. Getting adviser info...\n";
    $adviserQuery = "SELECT a.adviser_id, a.grade_level, a.section, u.user_id
                     FROM advisers a
                     INNER JOIN users u ON a.user_id = u.user_id
                     WHERE u.username = '00001'";
    $adviser = $conn->query($adviserQuery)->fetch(PDO::FETCH_ASSOC);
    
    if (!$adviser) {
        echo "  ✗ Adviser not found!\n";
        exit;
    }
    
    echo "  ✓ Adviser ID: {$adviser['adviser_id']}\n";
    echo "  ✓ User ID: {$adviser['user_id']}\n";
    echo "  ✓ Grade Level: {$adviser['grade_level']}\n";
    echo "  ✓ Section: {$adviser['section']}\n\n";
    
    // 3. Get grade level ID for Grade 12
    echo "3. Getting grade level...\n";
    $gradeLevelQuery = "SELECT id FROM grade_levels WHERE level_number = 12";
    $gradeLevel = $conn->query($gradeLevelQuery)->fetch(PDO::FETCH_ASSOC);
    $gradeLevelId = $gradeLevel['id'];
    echo "  ✓ Grade 12 ID: $gradeLevelId\n\n";
    
    // 4. Create section for adviser
    echo "4. Creating section...\n";
    $checkSection = $conn->prepare("SELECT id FROM sections WHERE grade_level_id = ? AND section_name = ? AND school_year_id = ?");
    $checkSection->execute([$gradeLevelId, 'STEM 2', $schoolYearId]);
    
    if ($checkSection->rowCount() == 0) {
        // Use user_id for adviser_id (foreign key references users table)
        $insertSection = $conn->prepare("INSERT INTO sections (grade_level_id, section_name, school_year_id, adviser_id, created_at) VALUES (?, ?, ?, ?, NOW())");
        $insertSection->execute([$gradeLevelId, 'STEM 2', $schoolYearId, $adviser['user_id']]);
        $sectionId = $conn->lastInsertId();
        echo "  ✓ Created section: Grade 12 - STEM 2 (ID: $sectionId)\n\n";
    } else {
        $section = $checkSection->fetch(PDO::FETCH_ASSOC);
        $sectionId = $section['id'];
        
        // Update adviser_id if not set (use user_id)
        $updateSection = $conn->prepare("UPDATE sections SET adviser_id = ? WHERE id = ?");
        $updateSection->execute([$adviser['user_id'], $sectionId]);
        echo "  - Section already exists (ID: $sectionId), updated adviser\n\n";
    }
    
    // 5. Assign students to section
    echo "5. Assigning students to section...\n";
    $students = $conn->query("SELECT student_id, student_number, first_name, last_name FROM students WHERE is_active = 1")->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($students as $student) {
        // Use user_id for current_adviser_id (foreign key references users table)
        $updateStudent = $conn->prepare("UPDATE students SET current_section_id = ?, current_school_year_id = ?, current_adviser_id = ? WHERE student_id = ?");
        $updateStudent->execute([$sectionId, $schoolYearId, $adviser['user_id'], $student['student_id']]);
        echo "  ✓ Assigned: {$student['first_name']} {$student['last_name']} ({$student['student_number']})\n";
    }
    
    $conn->commit();
    
    echo "\n=== SETUP COMPLETE ===\n";
    echo "✓ School years created\n";
    echo "✓ Section created: Grade 12 - STEM 2\n";
    echo "✓ Adviser assigned to section\n";
    echo "✓ Students assigned to section\n\n";
    echo "Now you can:\n";
    echo "1. Login as adviser (username: 00001)\n";
    echo "2. Go to 'My Class Management'\n";
    echo "3. Select school year '2024-2025'\n";
    echo "4. View your class roster\n";
    
} catch (Exception $e) {
    $conn->rollBack();
    echo "\n✗ Error: " . $e->getMessage() . "\n";
}
?>
