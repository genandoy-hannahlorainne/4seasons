<?php
/**
 * Direct test of create school year functionality
 */

// Simulate HTTP request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_USER_ID'] = '32';

// Simulate POST data
$testData = [
    'year_name' => '2024-2025',
    'start_date' => '2024-06-01',
    'end_date' => '2025-05-31',
    'is_active' => true
];

// Create a temporary file with the POST data
$tempFile = tmpfile();
fwrite($tempFile, json_encode($testData));
rewind($tempFile);

// Redirect stdin to our temp file
$oldStdin = STDIN;
define('STDIN', $tempFile);

// Capture output
ob_start();

try {
    require 'backend/api/admin/school-years/create.php';
    $output = ob_get_clean();
    
    echo "Response:\n";
    echo $output . "\n\n";
    
    $response = json_decode($output, true);
    if (isset($response['success']) && $response['success']) {
        echo "✅ SUCCESS: School year created!\n";
        echo "School Year ID: " . $response['school_year_id'] . "\n";
    } else {
        echo "❌ ERROR: " . ($response['error'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    ob_end_clean();
    echo "❌ EXCEPTION: " . $e->getMessage() . "\n";
}

fclose($tempFile);
?>
