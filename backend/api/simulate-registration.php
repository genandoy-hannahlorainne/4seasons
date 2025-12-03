<?php
// This script simulates what the frontend sends to test the registration endpoint

header("Content-Type: application/json; charset=UTF-8");

// Simulate the exact data structure from the frontend
$testCases = [
    [
        'name' => 'Student Registration',
        'data' => [
            'studentNumber' => '2023-99999-TG-0',
            'firstName' => 'Test',
            'middleName' => 'Middle',
            'lastName' => 'Student',
            'gender' => 'male',
            'birthday' => '2000-01-01',
            'contactNumber' => '09123456789',
            'email' => 'test.student@example.com',
            'password' => 'password123',
            'role' => 'student'
        ]
    ],
    [
        'name' => 'Adviser Registration',
        'data' => [
            'firstName' => 'Test',
            'middleName' => '',
            'lastName' => 'Adviser',
            'email' => 'test.adviser@example.com',
            'contactNumber' => '09123456789',
            'password' => 'password123',
            'role' => 'adviser'
        ]
    ],
    [
        'name' => 'Clinic Staff Registration',
        'data' => [
            'firstName' => 'Test',
            'middleName' => '',
            'lastName' => 'Staff',
            'email' => 'test.staff@example.com',
            'contactNumber' => '09123456789',
            'password' => 'password123',
            'role' => 'clinic-staff'
        ]
    ]
];

echo "Testing Registration Endpoint\n";
echo "==============================\n\n";

foreach ($testCases as $test) {
    echo "Test: " . $test['name'] . "\n";
    echo "Data: " . json_encode($test['data'], JSON_PRETTY_PRINT) . "\n";
    
    // Make POST request to register.php
    $ch = curl_init('http://localhost:8000/register.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($test['data']));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Origin: http://localhost:4200'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: " . $httpCode . "\n";
    echo "Response: " . $response . "\n";
    echo "---\n\n";
}
?>
