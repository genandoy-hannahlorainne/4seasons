<?php
require_once 'backend/config/database.php';

$db = (new Database())->getConnection();
$stmt = $db->query('SELECT * FROM school_years ORDER BY year_name');

echo "School Years:\n";
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  - {$row['year_name']} (ID: {$row['id']}) - Active: {$row['is_active']}\n";
}

// Set 2024-2025 as active if none is active
$activeStmt = $db->query('SELECT COUNT(*) as count FROM school_years WHERE is_active = 1');
$activeCount = $activeStmt->fetch(PDO::FETCH_ASSOC)['count'];

if ($activeCount == 0) {
    echo "\nNo active school year found. Setting 2024-2025 as active...\n";
    $db->exec("UPDATE school_years SET is_active = 1 WHERE year_name = '2024-2025'");
    echo "✓ Done\n";
}
?>
