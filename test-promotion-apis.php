<?php
/**
 * Test Promotion APIs
 */

echo "=== Testing Promotion APIs ===\n\n";

// Test 1: Check if get-summary.php exists
echo "Test 1: Checking if get-summary.php exists...\n";
$summaryFile = 'backend/api/admin/promotions/get-summary.php';
if (file_exists($summaryFile)) {
    echo "✓ File exists: $summaryFile\n";
    
    // Check for CORS headers
    $content = file_get_contents($summaryFile);
    if (strpos($content, 'Access-Control-Allow-Origin') !== false) {
        echo "✓ CORS headers found\n";
    } else {
        echo "✗ CORS headers missing\n";
    }
} else {
    echo "✗ File not found: $summaryFile\n";
}
echo "\n";

// Test 2: Check if bulk-promote.php exists
echo "Test 2: Checking if bulk-promote.php exists...\n";
$bulkFile = 'backend/api/admin/students/bulk-promote.php';
if (file_exists($bulkFile)) {
    echo "✓ File exists: $bulkFile\n";
    
    // Check for CORS headers
    $content = file_get_contents($bulkFile);
    if (strpos($content, 'Access-Control-Allow-Origin') !== false) {
        echo "✓ CORS headers found\n";
    } else {
        echo "✗ CORS headers missing\n";
    }
} else {
    echo "✗ File not found: $bulkFile\n";
}
echo "\n";

// Test 3: Check database connection
echo "Test 3: Checking database connection...\n";
try {
    require_once 'backend/config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    echo "✓ Database connection successful\n";
    
    // Check if required tables exist
    $tables = ['school_years', 'grade_levels', 'sections', 'students'];
    foreach ($tables as $table) {
        $query = "SHOW TABLES LIKE '$table'";
        $stmt = $db->query($query);
        if ($stmt->rowCount() > 0) {
            echo "✓ Table exists: $table\n";
        } else {
            echo "✗ Table missing: $table\n";
        }
    }
} catch (Exception $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 4: Check school years data
echo "Test 4: Checking school years data...\n";
try {
    $query = "SELECT id, year_name FROM school_years ORDER BY id";
    $stmt = $db->query($query);
    $years = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($years) > 0) {
        echo "✓ Found " . count($years) . " school years:\n";
        foreach ($years as $year) {
            echo "  - ID {$year['id']}: {$year['year_name']}\n";
        }
    } else {
        echo "✗ No school years found\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 5: Check grade levels
echo "Test 5: Checking grade levels...\n";
try {
    $query = "SELECT id, level_number, level_name FROM grade_levels ORDER BY level_number";
    $stmt = $db->query($query);
    $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($grades) > 0) {
        echo "✓ Found " . count($grades) . " grade levels:\n";
        foreach ($grades as $grade) {
            echo "  - ID {$grade['id']}: {$grade['level_name']} (Level {$grade['level_number']})\n";
        }
    } else {
        echo "✗ No grade levels found\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
echo "\n";

echo "=== Test Complete ===\n";
?>
