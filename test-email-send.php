<?php
/**
 * Test Email Sending Script
 * Use this to test if email functionality is working
 */

// Include email sender
require_once __DIR__ . '/includes/email-sender.php';

// Test email address - Change this to your actual email
$test_email = 'your-email@example.com'; // UPDATE THIS!

// Initialize email sender
$emailSender = getEmailSender();

echo "Vision Engine - Email Test Script\n";
echo "=================================\n\n";

// Test 1: Basic email sending
echo "Test 1: Sending basic test email...\n";
$result1 = $emailSender->send(
    $test_email,
    'Vision Engine - Test Email',
    "This is a test email from Vision Engine.\n\nIf you receive this, email sending is working correctly!\n\nTime: " . date('Y-m-d H:i:s')
);
echo "Result: " . ($result1 ? "SUCCESS" : "FAILED") . "\n\n";

// Test 2: Japanese email
echo "Test 2: Sending Japanese test email...\n";
$result2 = $emailSender->send(
    $test_email,
    'Vision Engine - 日本語テストメール',
    "これはVision Engineからのテストメールです。\n\n日本語のメールが正しく送信されているか確認してください。\n\n送信時刻: " . date('Y年m月d日 H:i:s')
);
echo "Result: " . ($result2 ? "SUCCESS" : "FAILED") . "\n\n";

// Test 3: Contact form simulation
echo "Test 3: Simulating contact form submission...\n";
$formData = [
    'name' => 'テスト太郎',
    'email' => $test_email,
    'subject' => 'テストお問い合わせ',
    'message' => 'これはコンタクトフォームのテストメッセージです。'
];

// Send admin notification
echo "  - Sending admin notification...\n";
$result3a = $emailSender->sendContactNotification($formData);
echo "    Result: " . ($result3a ? "SUCCESS" : "FAILED") . "\n";

// Send auto-reply
echo "  - Sending auto-reply...\n";
$result3b = $emailSender->sendAutoReply($formData);
echo "    Result: " . ($result3b ? "SUCCESS" : "FAILED") . "\n\n";

// Summary
echo "Summary:\n";
echo "--------\n";
echo "Basic email: " . ($result1 ? "✓" : "✗") . "\n";
echo "Japanese email: " . ($result2 ? "✓" : "✗") . "\n";
echo "Admin notification: " . ($result3a ? "✓" : "✗") . "\n";
echo "Auto-reply: " . ($result3b ? "✓" : "✗") . "\n\n";

// Check logs
$logDir = __DIR__ . '/logs';
if (file_exists($logDir)) {
    $logFiles = glob($logDir . '/email_log_*.txt');
    if (!empty($logFiles)) {
        echo "Email logs are being created at:\n";
        foreach ($logFiles as $logFile) {
            echo "  - " . basename($logFile) . "\n";
        }
    }
}

echo "\nIMPORTANT: Remember to update email addresses in includes/email-sender.php!\n";
echo "- from_email: Currently set to 'info@vision-engine.com'\n";
echo "- admin_email: Currently set to 'admin@vision-engine.com'\n";
?>