<?php
/**
 * Check School Year 7 Sections and Advisers
 */

require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== School Year 7 Analysis ===\n\n";

// Check what school_year_id 7 is
$yearQuery = "SELECT * FROM school_years WHERE id = 7";
$yearStmt = $db->prepare($yearQuery);
$yearStmt->execute();
$year = $yearStmt->fetch(PDO::FETCH_ASSOC);

if ($year) {
    echo "School Year ID 7: {$year['year_name']}\n";
    echo "Status: {$year['status']}\n";
    echo "Start: {$year['start_date']}\n";
    echo "End: {$year['end_date']}\n\n";
} else {
    echo "School Year ID 7 not found!\n\n";
}

// Check sections for this school year
echo "Sections for School Year 7:\n";
$sectionQuery = "SELECT 
                   sec.id,
                   gl.level_name,
                   sec.section_name,
                   sec.adviser_id,
                   CONCAT(a.first_name, ' ', a.last_name) as adviser_name,
                   a.user_id as adviser_user_id,
                   sec.current_enrollment
                 FROM sections sec
                 INNER JOIN grade_levels gl ON sec.grade_level_id = gl.id
                 LEFT JOIN advisers a ON sec.adviser_id = a.user_id
                 WHERE sec.school_year_id = 7
                 ORDER BY gl.level_number, sec.section_name";

$sectionStmt = $db->prepare($sectionQuery);
$sectionStmt->execute();
$sections = $sectionStmt->fetchAll(PDO::FETCH_ASSOC);

if (count($sections) > 0) {
    foreach ($sections as $section) {
        echo sprintf("  Section ID %d: %s - %s | Adviser: %s (user_id: %s) | Students: %d\n",
            $section['id'],
            $section['level_name'],
            $section['section_name'],
            $section['adviser_name'] ?? 'UNASSIGNED',
            $section['adviser_user_id'] ?? 'NULL',
            $section['current_enrollment']
        );
    }
} else {
    echo "  No sections found for school year 7\n";
}
echo "\n";

// Check all advisers
echo "All Active Advisers:\n";
$adviserQuery = "SELECT 
                   a.adviser_id,
                   a.user_id,
                   CONCAT(a.first_name, ' ', a.last_name) as name,
                   u.username
                 FROM advisers a
                 INNER JOIN users u ON a.user_id = u.user_id
                 WHERE a.is_active = 1
                 ORDER BY a.first_name, a.last_name";

$adviserStmt = $db->prepare($adviserQuery);
$adviserStmt->execute();
$advisers = $adviserStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($advisers as $adviser) {
    echo sprintf("  Adviser ID %d (user_id: %d): %s | Username: %s\n",
        $adviser['adviser_id'],
        $adviser['user_id'],
        $adviser['name'],
        $adviser['username']
    );
    
    // Check their sections
    $advSectionQuery = "SELECT sy.year_name, gl.level_name, sec.section_name
                        FROM sections sec
                        INNER JOIN school_years sy ON sec.school_year_id = sy.id
                        INNER JOIN grade_levels gl ON sec.grade_level_id = gl.id
                        WHERE sec.adviser_id = ?";
    $advSectionStmt = $db->prepare($advSectionQuery);
    $advSectionStmt->execute([$adviser['user_id']]);
    $advSections = $advSectionStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($advSections) > 0) {
        foreach ($advSections as $advSection) {
            echo "    - {$advSection['year_name']}: {$advSection['level_name']} - {$advSection['section_name']}\n";
        }
    } else {
        echo "    - No sections assigned\n";
    }
}

?>
