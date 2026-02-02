<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

// Count school years
$stmt = $db->query("SELECT COUNT(*) as count FROM school_years");
$count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "Total school years in database: $count\n\n";

if ($count > 0) {
    echo "School Years:\n";
    $stmt = $db->query("SELECT id, year_name, is_active, is_current FROM school_years ORDER BY start_date DESC");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo sprintf("  ID: %d | %s | Active: %d | Current: %d\n",
                     $row['id'],
                     $row['year_name'],
                     $row['is_active'],
                     $row['is_current']);
    }
} else {
    echo "No school years found. You need to create school years first.\n";
    echo "\nTo create a school year, use the Admin panel:\n";
    echo "1. Log in as admin\n";
    echo "2. Go to School Years section\n";
    echo "3. Click 'Create New School Year'\n";
}
?>
