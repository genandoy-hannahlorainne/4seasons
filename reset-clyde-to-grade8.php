<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Resetting Clyde to Grade 8 - Daffodils ===\n\n";

// Get Grade 8 - Daffodils section for 2025-2026
$query = "SELECT sec.id, sec.school_year_id, sec.adviser_id
          FROM sections sec
          LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
          LEFT JOIN school_years sy ON sec.school_year_id = sy.id
          WHERE gl.level_number = 8 
          AND sec.section_name = 'Daffodils'
          AND sy.year_name = '2025-2026'";
$stmt = $db->prepare($query);
$stmt->execute();
$section = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$section) {
    echo "ERROR: Grade 8 - Daffodils section not found!\n";
    exit;
}

echo "Target Section:\n";
echo "  Section ID: {$section['id']}\n";
echo "  School Year ID: {$section['school_year_id']}\n";
echo "  Adviser ID: " . ($section['adviser_id'] ?? 'NULL') . "\n\n";

// Update Clyde
$updateQuery = "UPDATE students 
                SET current_section_id = ?,
                    current_school_year_id = ?,
                    grade_level = '8',
                    enrollment_status = 'active'
                WHERE student_number = '136883100331'";
$stmt = $db->prepare($updateQuery);
$stmt->execute([$section['id'], $section['school_year_id']]);

echo "✓ Clyde reset to Grade 8 - Daffodils (2025-2026)\n\n";

// Verify
$query = "SELECT 
    s.first_name,
    s.last_name,
    s.grade_level,
    sec.section_name,
    u.full_name as adviser_name,
    sy.year_name
FROM students s
LEFT JOIN sections sec ON s.current_section_id = sec.id
LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
LEFT JOIN users u ON sec.adviser_id = u.user_id
WHERE s.student_number = '136883100331'";

$stmt = $db->prepare($query);
$stmt->execute();
$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Verification:\n";
echo "  Student: {$result['first_name']} {$result['last_name']}\n";
echo "  Grade: {$result['grade_level']}\n";
echo "  Section: {$result['section_name']}\n";
echo "  School Year: {$result['year_name']}\n";
echo "  Adviser: " . ($result['adviser_name'] ?? 'NONE') . "\n";
?>
