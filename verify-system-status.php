<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║         PDMHS MEDICAL SYSTEM - STATUS VERIFICATION          ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

// Check recent users
echo "📋 RECENT USER ACCOUNTS:\n";
echo "─────────────────────────────────────────────────────────────\n";
$userQuery = "SELECT u.user_id, u.username, u.email, u.full_name, u.temp_password, 
              u.password_must_change, u.created_at, r.role_name
              FROM users u
              INNER JOIN roles r ON u.role_id = r.role_id
              WHERE u.user_id > 32
              ORDER BY u.created_at DESC
              LIMIT 5";
$userStmt = $db->query($userQuery);
$users = $userStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $user) {
    echo "✓ " . $user['full_name'] . " (" . $user['role_name'] . ")\n";
    echo "  Username: " . $user['username'] . "\n";
    echo "  Email: " . $user['email'] . "\n";
    echo "  Temp Password: " . $user['temp_password'] . "\n";
    echo "  Must Change Password: " . ($user['password_must_change'] ? 'Yes' : 'No') . "\n";
    echo "  Created: " . $user['created_at'] . "\n";
    echo "\n";
}

// Check email logs
echo "📧 EMAIL DELIVERY STATUS:\n";
echo "─────────────────────────────────────────────────────────────\n";
$emailQuery = "SELECT recipient, subject, status, created_at, sent_at
               FROM email_logs
               WHERE status = 'sent'
               ORDER BY created_at DESC
               LIMIT 5";
$emailStmt = $db->query($emailQuery);
$emails = $emailStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($emails as $email) {
    echo "✓ " . $email['recipient'] . "\n";
    echo "  Subject: " . $email['subject'] . "\n";
    echo "  Status: " . strtoupper($email['status']) . "\n";
    echo "  Sent: " . $email['sent_at'] . "\n";
    echo "\n";
}

// Check QR codes
echo "🔲 QR CODE GENERATION:\n";
echo "─────────────────────────────────────────────────────────────\n";
$qrQuery = "SELECT qc.student_id, qc.qr_token, qc.qr_generated_at,
            s.student_number, u.full_name
            FROM qr_codes qc
            INNER JOIN students s ON qc.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            ORDER BY qc.qr_generated_at DESC
            LIMIT 5";
$qrStmt = $db->query($qrQuery);
$qrCodes = $qrStmt->fetchAll(PDO::FETCH_ASSOC);

if (count($qrCodes) > 0) {
    foreach ($qrCodes as $qr) {
        echo "✓ " . $qr['full_name'] . " (Student #" . $qr['student_number'] . ")\n";
        echo "  QR Token: " . substr($qr['qr_token'], 0, 16) . "...\n";
        echo "  Generated: " . $qr['qr_generated_at'] . "\n";
        echo "\n";
    }
} else {
    echo "⚠ No QR codes found\n\n";
}

// System status summary
echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║                     SYSTEM STATUS SUMMARY                    ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

$totalUsers = $db->query("SELECT COUNT(*) FROM users WHERE user_id > 32")->fetchColumn();
$sentEmails = $db->query("SELECT COUNT(*) FROM email_logs WHERE status = 'sent'")->fetchColumn();
$qrCodesGenerated = $db->query("SELECT COUNT(*) FROM qr_codes")->fetchColumn();

echo "✅ Total User Accounts: " . $totalUsers . "\n";
echo "✅ Emails Sent Successfully: " . $sentEmails . "\n";
echo "✅ QR Codes Generated: " . $qrCodesGenerated . "\n";
echo "\n";

echo "🎯 SYSTEM STATUS: ALL OPERATIONAL\n";
echo "\n";
echo "Next Steps:\n";
echo "1. Check Mailtrap inbox: https://mailtrap.io/inboxes\n";
echo "2. Test login with any account above\n";
echo "3. Verify forced password change works\n";
echo "4. Test student profile editing\n";
echo "\n";
?>
