<?php
/**
 * Email API Endpoint for Contact Form
 * Processes contact form submissions and sends emails
 */

// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set JSON response header
header('Content-Type: application/json; charset=UTF-8');

// Enable CORS if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Include email sender class
require_once dirname(__DIR__) . '/includes/email-sender.php';

// Response function
function sendResponse($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method. Only POST is allowed.');
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

// If JSON decode failed, try regular POST
if (!$input) {
    $input = $_POST;
}

// Validate required fields
$required_fields = ['name', 'email', 'subject', 'message'];
$errors = [];

foreach ($required_fields as $field) {
    if (empty($input[$field])) {
        $errors[] = ucfirst($field) . ' is required';
    }
}

// Validate email format
if (!empty($input['email']) && !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

// Check for errors
if (!empty($errors)) {
    sendResponse(false, 'Validation failed', ['errors' => $errors]);
}

// Sanitize input data
$formData = [
    'name' => htmlspecialchars(trim($input['name']), ENT_QUOTES, 'UTF-8'),
    'email' => filter_var(trim($input['email']), FILTER_SANITIZE_EMAIL),
    'subject' => htmlspecialchars(trim($input['subject']), ENT_QUOTES, 'UTF-8'),
    'message' => htmlspecialchars(trim($input['message']), ENT_QUOTES, 'UTF-8')
];

// Initialize email sender
$emailSender = getEmailSender();

// Send notification to admin
$adminEmailSent = $emailSender->sendContactNotification($formData);

// Send auto-reply to user
$autoReplySent = $emailSender->sendAutoReply($formData);

// Log the submission
$logDir = dirname(__DIR__) . '/logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0777, true);
}

$logFile = $logDir . '/contact_submissions_' . date('Y-m') . '.json';
$logEntry = [
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
    'form_data' => $formData,
    'admin_email_sent' => $adminEmailSent,
    'auto_reply_sent' => $autoReplySent
];

// Read existing log
$existingLog = [];
if (file_exists($logFile)) {
    $existingLog = json_decode(file_get_contents($logFile), true) ?: [];
}

// Add new entry
$existingLog[] = $logEntry;

// Save log
file_put_contents($logFile, json_encode($existingLog, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

// Determine success based on at least one email being sent
if ($adminEmailSent || $autoReplySent) {
    sendResponse(true, 'お問い合わせを受け付けました。確認メールをお送りしましたのでご確認ください。', [
        'admin_notified' => $adminEmailSent,
        'auto_reply_sent' => $autoReplySent
    ]);
} else {
    sendResponse(false, 'メールの送信に失敗しました。お手数ですが、時間をおいて再度お試しください。');
}
?>