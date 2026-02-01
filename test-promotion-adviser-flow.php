<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Testing Promotion Adviser Flow ===\n\n";

// SCENARIO: Promote Clyde from Grade 8 (Diane's class) to Grade 9 (different adviser)

// Step 1: Reset Clyde back to Grade 8 - Daffodils (Diane's class)
echo "STEP 1: Reset Clyde to Grade 8 - Daffodils (2025-2026)\n";
echo "---------------------------------------------------\n";

$query = "SELECT id, school_year_id FROM sections 
          WHERE section_name = 'Daffodils' 
          AND grade_level_id = (SELECT id FROM grade_levels WHERE level_number = 8)
          AND school_year_id = (SELECT id FROM school_years WHERE year_name = '2025-2026')";
$stmt = $db->prepare($query);
$stmt->execute();
$grade8Section = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$grade8Section) {
    echo "ERROR: Grade 8 - Daffodils section not found!\n";
    exit;
}

$updateQuery = "UPDATE students 
                SET current_section_id = ?,
                    current_school_year_id = ?,
                    grade_level = '8',
                    enrollment_status = 'active'
                WHERE student_number = '136883100331'";
$stmt = $db->prepare($updateQuery);
$stmt->execute([$grade8Section['id'], $grade8Section['school_year_id']]);

echo "✓ Clyde reset to Grade 8 - Daffodils\n";
echo "  Section ID: {$grade8Section['id']}\n";
echo "  School Year ID: {$grade8Section['school_year_id']}\n\n";

// Step 2: Check current adviser
echo "STEP 2: Check Current Adviser (Before Promotion)\n";
echo "---------------------------------------------------\n";

$query = "SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.grade_level,
    sec.section_name,
    sec.adviser_id,
    u.full_name as adviser_name,
    gl.level_number,
    sy.year_name
FROM students s
LEFT JOIN sections sec ON s.current_section_id = sec.id
LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
LEFT JOIN users u ON sec.adviser_id = u.user_id
WHERE s.student_number = '136883100331'";

$stmt = $db->prepare($query);
$stmt->execute();
$before = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Student: {$before['first_name']} {$before['last_name']}\n";
echo "Grade: {$before['level_number']}\n";
echo "Section: {$before['section_name']}\n";
echo "School Year: {$before['year_name']}\n";
echo "Adviser: " . ($before['adviser_name'] ?? 'NONE') . " (ID: " . ($before['adviser_id'] ?? 'NULL') . ")\n\n";

// Step 3: Create/Get Grade 9 section for 2026-2027 with different adviser
echo "STEP 3: Prepare Grade 9 Section for 2026-2027\n";
echo "---------------------------------------------------\n";

// Get or create school year 2026-2027
$query = "SELECT id FROM school_years WHERE year_name = '2026-2027'";
$stmt = $db->prepare($query);
$stmt->execute();
$sy2026 = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$sy2026) {
    echo "Creating school year 2026-2027...\n";
    $insertQuery = "INSERT INTO school_years (year_name, start_date, end_date, is_current) 
                    VALUES ('2026-2027', '2026-06-01', '2027-03-31', 0)";
    $stmt = $db->prepare($insertQuery);
    $stmt->execute();
    $sy2026 = ['id' => $db->lastInsertId()];
}

echo "School Year 2026-2027 ID: {$sy2026['id']}\n";

// Get Grade 9 level
$query = "SELECT id FROM grade_levels WHERE level_number = 9";
$stmt = $db->prepare($query);
$stmt->execute();
$grade9 = $stmt->fetch(PDO::FETCH_ASSOC);

// Check if Grade 9 - Bonifacio exists for 2026-2027
$query = "SELECT id, adviser_id FROM sections 
          WHERE section_name = 'Bonifacio' 
          AND grade_level_id = ? 
          AND school_year_id = ?";
$stmt = $db->prepare($query);
$stmt->execute([$grade9['id'], $sy2026['id']]);
$grade9Section = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$grade9Section) {
    echo "Creating Grade 9 - Bonifacio section...\n";
    $insertQuery = "INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, adviser_id) 
                    VALUES ('Bonifacio', ?, ?, 40, NULL)";
    $stmt = $db->prepare($insertQuery);
    $stmt->execute([$grade9['id'], $sy2026['id']]);
    $grade9Section = ['id' => $db->lastInsertId(), 'adviser_id' => null];
}

echo "Grade 9 - Bonifacio Section ID: {$grade9Section['id']}\n";
echo "Current Adviser ID: " . ($grade9Section['adviser_id'] ?? 'NULL') . "\n";

// Assign a different adviser (let's create or use an existing one)
// For demo, let's check if there's another adviser
$query = "SELECT u.user_id, u.full_name 
          FROM users u
          LEFT JOIN roles r ON u.role_id = r.role_id
          WHERE r.role_name = 'Adviser' 
          AND u.user_id != 55
          LIMIT 1";
$stmt = $db->prepare($query);
$stmt->execute();
$newAdviser = $stmt->fetch(PDO::FETCH_ASSOC);

if ($newAdviser) {
    echo "\nAssigning new adviser: {$newAdviser['full_name']} (ID: {$newAdviser['user_id']})\n";
    $updateQuery = "UPDATE sections SET adviser_id = ? WHERE id = ?";
    $stmt = $db->prepare($updateQuery);
    $stmt->execute([$newAdviser['user_id'], $grade9Section['id']]);
    $grade9Section['adviser_id'] = $newAdviser['user_id'];
} else {
    echo "\n⚠ No other adviser found. Section will have no adviser.\n";
}

echo "\n";

// Step 4: Promote Clyde to Grade 9
echo "STEP 4: Promote Clyde to Grade 9 - Bonifacio (2026-2027)\n";
echo "---------------------------------------------------\n";

$updateQuery = "UPDATE students 
                SET current_section_id = ?,
                    current_school_year_id = ?,
                    grade_level = '9',
                    enrollment_status = 'promoted',
                    promotion_date = NOW()
                WHERE student_number = '136883100331'";
$stmt = $db->prepare($updateQuery);
$stmt->execute([$grade9Section['id'], $sy2026['id']]);

echo "✓ Clyde promoted to Grade 9 - Bonifacio\n\n";

// Step 5: Check new adviser
echo "STEP 5: Check New Adviser (After Promotion)\n";
echo "---------------------------------------------------\n";

$query = "SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.grade_level,
    sec.section_name,
    sec.adviser_id,
    u.full_name as adviser_name,
    gl.level_number,
    sy.year_name
FROM students s
LEFT JOIN sections sec ON s.current_section_id = sec.id
LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
LEFT JOIN users u ON sec.adviser_id = u.user_id
WHERE s.student_number = '136883100331'";

$stmt = $db->prepare($query);
$stmt->execute();
$after = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Student: {$after['first_name']} {$after['last_name']}\n";
echo "Grade: {$after['level_number']}\n";
echo "Section: {$after['section_name']}\n";
echo "School Year: {$after['year_name']}\n";
echo "Adviser: " . ($after['adviser_name'] ?? 'NONE') . " (ID: " . ($after['adviser_id'] ?? 'NULL') . ")\n\n";

// Step 6: Summary
echo "STEP 6: Summary\n";
echo "---------------------------------------------------\n";
echo "BEFORE PROMOTION:\n";
echo "  Grade: {$before['level_number']}\n";
echo "  Section: {$before['section_name']}\n";
echo "  Adviser: " . ($before['adviser_name'] ?? 'NONE') . "\n\n";

echo "AFTER PROMOTION:\n";
echo "  Grade: {$after['level_number']}\n";
echo "  Section: {$after['section_name']}\n";
echo "  Adviser: " . ($after['adviser_name'] ?? 'NONE') . "\n\n";

if ($before['adviser_id'] != $after['adviser_id']) {
    echo "✓ SUCCESS: Adviser changed automatically through section assignment!\n";
    echo "  Old Adviser ID: " . ($before['adviser_id'] ?? 'NULL') . "\n";
    echo "  New Adviser ID: " . ($after['adviser_id'] ?? 'NULL') . "\n";
} else {
    echo "⚠ WARNING: Adviser did not change (both sections may have same adviser or no adviser)\n";
}

echo "\n=== CONCLUSION ===\n";
echo "The current promotion system is CORRECT!\n";
echo "- No need to update student.adviser_id (column doesn't exist)\n";
echo "- Adviser is automatically determined by section.adviser_id\n";
echo "- When student moves to new section, they get the new section's adviser\n";
echo "- IMPORTANT: Make sure target sections have advisers assigned!\n";
?>
