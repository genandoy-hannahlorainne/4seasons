<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Fixing Clyde's Promotion to Airah's Class ===\n\n";

// Step 1: Get Airah's user_id
$query = "SELECT user_id, full_name FROM users WHERE full_name LIKE '%Airah%'";
$stmt = $db->prepare($query);
$stmt->execute();
$airah = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$airah) {
    echo "ERROR: Airah not found!\n";
    exit;
}

echo "STEP 1: Found Airah\n";
echo "  User ID: {$airah['user_id']}\n";
echo "  Name: {$airah['full_name']}\n\n";

// Step 2: Get or create school year 2025-2026 (current year for Grade 9)
$query = "SELECT id FROM school_years WHERE year_name = '2025-2026'";
$stmt = $db->prepare($query);
$stmt->execute();
$schoolYear = $stmt->fetch(PDO::FETCH_ASSOC);

echo "STEP 2: School Year 2025-2026\n";
echo "  School Year ID: {$schoolYear['id']}\n\n";

// Step 3: Get Grade 9 level
$query = "SELECT id FROM grade_levels WHERE level_number = 9";
$stmt = $db->prepare($query);
$stmt->execute();
$grade9 = $stmt->fetch(PDO::FETCH_ASSOC);

echo "STEP 3: Grade 9 Level\n";
echo "  Grade Level ID: {$grade9['id']}\n\n";

// Step 4: Check if Grade 9 - Section 2 exists for 2025-2026
$query = "SELECT id, adviser_id FROM sections 
          WHERE section_name = '2' 
          AND grade_level_id = ? 
          AND school_year_id = ?";
$stmt = $db->prepare($query);
$stmt->execute([$grade9['id'], $schoolYear['id']]);
$section = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$section) {
    echo "STEP 4: Creating Grade 9 - Section 2 for 2025-2026\n";
    $insertQuery = "INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, adviser_id) 
                    VALUES ('2', ?, ?, 40, ?)";
    $stmt = $db->prepare($insertQuery);
    $stmt->execute([$grade9['id'], $schoolYear['id'], $airah['user_id']]);
    $sectionId = $db->lastInsertId();
    echo "  ✓ Created Section ID: $sectionId\n";
    echo "  ✓ Assigned Airah as adviser\n\n";
} else {
    $sectionId = $section['id'];
    echo "STEP 4: Grade 9 - Section 2 exists (ID: $sectionId)\n";
    
    // Update adviser to Airah
    if ($section['adviser_id'] != $airah['user_id']) {
        echo "  Updating adviser to Airah...\n";
        $updateQuery = "UPDATE sections SET adviser_id = ? WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute([$airah['user_id'], $sectionId]);
        echo "  ✓ Adviser updated\n\n";
    } else {
        echo "  ✓ Airah is already the adviser\n\n";
    }
}

// Step 5: Promote Clyde to Grade 9 - Section 2
echo "STEP 5: Promoting Clyde to Grade 9 - Section 2\n";
$updateQuery = "UPDATE students 
                SET current_section_id = ?,
                    current_school_year_id = ?,
                    grade_level = '9',
                    enrollment_status = 'active'
                WHERE student_number = '136883100331'";
$stmt = $db->prepare($updateQuery);
$stmt->execute([$sectionId, $schoolYear['id']]);
echo "  ✓ Clyde promoted to Grade 9 - Section 2\n\n";

// Step 6: Verify
echo "STEP 6: Verification\n";
echo "---------------------------------------------------\n";
$query = "SELECT 
    s.first_name,
    s.last_name,
    s.student_number,
    s.grade_level,
    sec.section_name,
    gl.level_number,
    sy.year_name,
    u.full_name as adviser_name
FROM students s
LEFT JOIN sections sec ON s.current_section_id = sec.id
LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
LEFT JOIN users u ON sec.adviser_id = u.user_id
WHERE s.student_number = '136883100331'";

$stmt = $db->prepare($query);
$stmt->execute();
$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Student: {$result['first_name']} {$result['last_name']}\n";
echo "Student Number: {$result['student_number']}\n";
echo "Grade: {$result['level_number']}\n";
echo "Section: {$result['section_name']}\n";
echo "School Year: {$result['year_name']}\n";
echo "Adviser: {$result['adviser_name']}\n\n";

if ($result['adviser_name'] == $airah['full_name']) {
    echo "✓ SUCCESS! Clyde is now under Airah's advisory!\n";
} else {
    echo "⚠ WARNING: Adviser mismatch!\n";
    echo "  Expected: {$airah['full_name']}\n";
    echo "  Got: {$result['adviser_name']}\n";
}
?>
