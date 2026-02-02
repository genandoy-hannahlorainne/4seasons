<?php
require 'backend/config/database.php';

$db = (new Database())->getConnection();
$stmt = $db->query('SELECT sec.section_name, gl.level_number, sy.year_name 
                    FROM sections sec 
                    JOIN grade_levels gl ON sec.grade_level_id = gl.id 
                    JOIN school_years sy ON sec.school_year_id = sy.id 
                    ORDER BY sy.year_name, gl.level_number, sec.section_name');

echo "All Sections:\n";
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  Grade {$row['level_number']} Section {$row['section_name']} ({$row['year_name']})\n";
}
?>
