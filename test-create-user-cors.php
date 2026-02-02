<?php
/**
 * Test create-user.php CORS
 */

echo "=== Testing create-user.php CORS ===\n\n";

// Test 1: Check file exists
$file = 'backend/api/admin/create-user.php';
if (file_exists($file)) {
    echo "✓ File exists\n";
} else {
    echo "✗ File not found\n";
    exit(1);
}

// Test 2: Check for syntax errors
exec("php -l $file 2>&1", $output, $return);
if ($return === 0) {
    echo "✓ No syntax errors\n";
} else {
    echo "✗ Syntax errors found:\n";
    echo implode("\n", $output) . "\n";
    exit(1);
}

// Test 3: Check CORS headers are present
$content = file_get_contents($file);
$checks = [
    'Access-Control-Allow-Origin' => strpos($content, 'Access-Control-Allow-Origin') !== false,
    'Access-Control-Allow-Methods' => strpos($content, 'Access-Control-Allow-Methods') !== false,
    'Access-Control-Allow-Headers' => strpos($content, 'Access-Control-Allow-Headers') !== false,
    'OPTIONS handling' => strpos($content, "REQUEST_METHOD'] === 'OPTIONS'") !== false,
];

foreach ($checks as $check => $result) {
    echo ($result ? '✓' : '✗') . " $check\n";
}

// Test 4: Check for BOM or whitespace before <?php
$firstBytes = substr($content, 0, 10);
if (substr($content, 0, 5) === '<?php') {
    echo "✓ No BOM or whitespace before <?php\n";
} else {
    echo "✗ WARNING: File may have BOM or whitespace before <?php\n";
    echo "First bytes: " . bin2hex($firstBytes) . "\n";
}

// Test 5: Try OPTIONS request
echo "\n=== Testing OPTIONS Request ===\n";
$url = 'http://localhost/4seasons/backend/api/admin/create-user.php';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'OPTIONS');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";

if ($httpCode === 200) {
    echo "✓ OPTIONS request successful\n";
    
    // Check headers in response
    if (strpos($response, 'Access-Control-Allow-Origin') !== false) {
        echo "✓ CORS headers present in response\n";
    } else {
        echo "✗ CORS headers NOT in response\n";
        echo "Response headers:\n";
        $headers = substr($response, 0, strpos($response, "\r\n\r\n"));
        echo $headers . "\n";
    }
} else {
    echo "✗ OPTIONS request failed\n";
    echo "Response:\n$response\n";
}

echo "\n=== Test Complete ===\n";
?>
