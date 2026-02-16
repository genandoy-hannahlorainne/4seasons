<?php
require_once 'backend/config/database.php';

$db = (new Database())->getConnection();

// Update clearance to pending
$db->prepare('UPDATE medical_clearances SET status = "pending" WHERE student_id = 25')->execute();
echo "Updated clearance to PENDING for testing\n";

// Test QR scan again
$url = "http://localhost/4seasons/backend/api/get-student-by-qr.php?student_id=25";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if ($data && $data['success'] && isset($data['student']['clearance'])) {
    $clearance = $data['student']['clearance'];
    echo "\n🔍 PENDING CLEARANCE TEST:\n";
    echo "   Status: {$clearance['status']}\n";
    echo "   Level: {$clearance['level']}\n";
    echo "   Message: {$clearance['message']}\n";
    
    if ($clearance['level'] === 'red' && $clearance['status'] === 'HOLD') {
        echo "\n🚨 SUCCESS: System correctly shows RED ALERT for pending clearance!\n";
        echo "🚨 Student would be HELD BACK from field trip!\n";
    } else {
        echo "\n❌ System not working correctly for pending clearance\n";
    }
} else {
    echo "❌ Failed to test pending clearance\n";
}
?>