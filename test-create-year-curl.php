<?php
/**
 * Test Create School Year with verbose output
 */

$apiUrl = 'http://localhost/4seasons/backend/api/admin/school-years/create.php';

$data = [
    'year_name' => '2024-2025',
    'start_date' => '2024-06-01',
    'end_date' => '2025-05-31',
    'is_active' => true
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'user_id: 32'
]);
curl_setopt($ch, CURLOPT_VERBOSE, true);
curl_setopt($ch, CURLOPT_HEADER, true);

echo "Testing Create School Year API...\n\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

echo "HTTP Code: $httpCode\n";
echo "\nResponse Headers:\n";
echo $header . "\n";
echo "\nResponse Body:\n";
echo $body . "\n";

if ($httpCode === 201) {
    echo "\n✅ SUCCESS!\n";
} else {
    echo "\n❌ FAILED\n";
}

curl_close($ch);
?>
