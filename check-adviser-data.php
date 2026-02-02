<?php
require_once 'backend/config/database.php';

$database = new Database();
$conn = $database->getConnection();

echo "=== CHECKING ADVISER CLASS MANAGEMENT DATA ===\n\n";

// Check adviser (user_id 44, username 00001)
echo "1. ADVISER INFO:\n";
$adviserQuery = "SELECT a.adviser_id, a.first_name, a.last_name, a.grade_level, a.section, u.user_id, u.username
                 FROM advisers a
                 INNER JOIN users u ON a.user_id = u.user_id
                 WHERE u.username = '00001'";
$result = $conn->query($adviserQuery);
$adviser = $result->fetch(PDO::FETCH_ASSOC);

if ($adviser) {
    echo "✓ Adviser found:\n";
    echo "  - Adviser ID: " . $adviser['adviser_id'] . "\n";
    echo "  - Name: " . $adviser['first_name'] . " " . $adviser['last_name'] . "\n";
    echo "  - User ID: " . $adviser['user_id'] . "\n";
    echo "  - Grade Level: " . ($adviser['grade_level'] ?? 'Not set') . "\n";
    echo "  - Section: " . ($adviser['section'] ?? 'Not set') . "\n\n";
} else {
    echo "✗ Adviser not found\n\n";
    exit;
}

// Check school years
echo "2. SCHOOL YEARS:\n";
$yearQuery = "SELECT * FROM school_years ORDER BY start_date DESC";
$years = $conn->query($yearQuery)->fetchAll(PDO::FETCH_ASSOC);

if (count($years) > 0) {
    echo "✓ Found " . count($years) . " school year(s):\n";
    foreach ($years as $year) {
        echo "  - ID: {$year['id']}, Name: {$year['year_name']}, Active: " . ($year['is_active'] ? 'Yes' : 'No') . "\n";
    }
    echo "\n";
} else {
    echo "✗ No school years found\n\n";
}

// Check grade levels
echo "3. GRADE LEVELS:\n";
$gradeLevelQuery = "SELECT * FROM grade_levels ORDER BY level_number";
$gradeLevels = $conn->query($gradeLevelQuery)->fetchAll(PDO::FETCH_ASSOC);

if (count($gradeLevels) > 0) {
    echo "✓ Found " . count($gradeLevels) . " grade level(s):\n";
    foreach ($gradeLevels as $gl) {
        echo "  - ID: {$gl['id']}, Name: {$gl['level_name']}, Number: {$gl['level_number']}\n";
    }
    echo "\n";
} else {
    echo "✗ No grade levels found\n\n";
}

// Check sections
echo "4. SECTIONS:\n";
$sectionQuery = "SELECT s.*, gl.level_name, sy.year_name
                 FROM sections s
                 LEFT JOIN grade_levels gl ON s.grade_level_id = gl.id
                 LEFT JOIN school_years sy ON s.school_year_id = sy.id
                 ORDER BY s.id DESC";
$sections = $conn->query($sectionQuery)->fetchAll(PDO::FETCH_ASSOC);

if (count($sections) > 0) {
    echo "✓ Found " . count($sections) . " section(s):\n";
    foreach ($sections as $sec) {
        echo "  - ID: {$sec['id']}, Name: {$sec['section_name']}, Grade: {$sec['level_name']}, Year: {$sec['year_name']}, Adviser ID: " . ($sec['adviser_id'] ?? 'None') . "\n";
    }
    echo "\n";
} else {
    echo "✗ No sections found\n\n";
}

// Check if adviser has assigned section
echo "5. ADVISER'S ASSIGNED SECTIONS:\n";
$adviserSectionQuery = "SELECT s.*, gl.level_name, sy.year_name
                        FROM sections s
                        LEFT JOIN grade_levels gl ON s.grade_level_id = gl.id
                        LEFT JOIN school_years sy ON s.school_year_id = sy.id
                        WHERE s.adviser_id = :adviser_id";
$stmt = $conn->prepare($adviserSectionQuery);
$stmt->bindParam(':adviser_id', $adviser['adviser_id']);
$stmt->execute();
$adviserSections = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($adviserSections) > 0) {
    echo "✓ Adviser has " . count($adviserSections) . " assigned section(s):\n";
    foreach ($adviserSections as $sec) {
        echo "  - {$sec['level_name']} - {$sec['section_name']} ({$sec['year_name']})\n";
    }
    echo "\n";
} else {
    echo "✗ Adviser has no assigned sections\n\n";
}

// Check students
echo "6. STUDENTS:\n";
$studentQuery = "SELECT COUNT(*) as count FROM students WHERE is_active = 1";
$studentCount = $conn->query($studentQuery)->fetch(PDO::FETCH_ASSOC)['count'];
echo "Total active students: $studentCount\n\n";

// Check students assigned to sections
echo "7. STUDENTS IN SECTIONS:\n";
$studentSectionQuery = "SELECT s.student_id, s.student_number, s.first_name, s.last_name, 
                        s.current_section_id, s.current_school_year_id,
                        sec.section_name, gl.level_name, sy.year_name
                        FROM students s
                        LEFT JOIN sections sec ON s.current_section_id = sec.id
                        LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
                        LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
                        WHERE s.is_active = 1
                        LIMIT 5";
$studentSections = $conn->query($studentSectionQuery)->fetchAll(PDO::FETCH_ASSOC);

if (count($studentSections) > 0) {
    echo "Sample students:\n";
    foreach ($studentSections as $st) {
        $sectionInfo = $st['section_name'] ? "{$st['level_name']} - {$st['section_name']} ({$st['year_name']})" : "Not assigned";
        echo "  - {$st['first_name']} {$st['last_name']} ({$st['student_number']}): $sectionInfo\n";
    }
    echo "\n";
}

echo "\n=== SUMMARY ===\n";
echo "To make Class Management work, you need:\n";
echo "1. School years in database\n";
echo "2. Grade levels in database\n";
echo "3. Sections created and assigned to adviser\n";
echo "4. Students assigned to those sections\n";
?>
