<?php
/**
 * Test Create School Year API
 */

$apiUrl = 'http://localhost/4seasons/backend/api/admin/school-years/create.php';

// Test data
$data = [
    'year_name' => '2024-2025',
    'start_date' => '2024-06-01',
    'end_date' => '2025-05-31',
    'is_active' => true
];

// Initialize cURL
$ch = curl_init($apiUrl);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'user_id: 32' // Admin user ID
]);

// Execute request
echo "Testing Create School Year API...\n";
echo "URL: $apiUrl\n";
echo "Data: " . json_encode($data, JSON_PRETTY_PRINT) . "\n\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

if ($httpCode === 201) {
    echo "✅ SUCCESS: School year created!\n";
    $result = json_decode($response, true);
    echo "School Year ID: " . $result['school_year_id'] . "\n";
    echo "Year Name: " . $result['year_name'] . "\n";
} else {
    echo "❌ ERROR: Failed to create school year\n";
    $error = json_decode($response, true);
    if (isset($error['error'])) {
        echo "Error: " . $error['error'] . "\n";
    }
}

curl_close($ch);
?>
