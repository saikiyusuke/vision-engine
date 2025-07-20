<?php
// Airレジメール送信スクリプト

// コマンドライン引数を取得
$fileName = isset($argv[1]) ? $argv[1] : 'バリエーション別売上.csv';
$uploadPath = isset($argv[2]) ? $argv[2] : '/partner.openmart.jp/saleslist_bymenu/';

// メール設定
$to = 'tuwari69@gmail.com';
$subject = 'Airレジ売上データアップロード完了 - ' . date('Y年m月d日');

// タイムゾーンを日本時間に設定
date_default_timezone_set('Asia/Tokyo');

$message = "Airレジの売上データをFTPにアップロードしました。\n\n";
$message .= "■ アップロード情報\n";
$message .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$message .= "ファイル名: {$fileName}\n";
$message .= "アップロード先: {$uploadPath}\n";
$message .= "アップロード時刻: " . date('Y年m月d日 H:i:s') . "\n";
$message .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
$message .= "このメールは自動送信されています。\n";
$message .= "問題がある場合は、システム管理者にお問い合わせください。\n";

// メール送信を試行
$success = false;

// 方法1: mb_send_mailを使用（日本語対応）
if (function_exists('mb_send_mail')) {
    mb_language("Japanese");
    mb_internal_encoding("UTF-8");
    
    $headers = "From: noreply@openmart.jp\r\n";
    $headers .= "Reply-To: info@openmart.jp\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    $success = mb_send_mail($to, $subject, $message, $headers);
} else {
    // 方法2: 通常のmail関数
    $headers = array(
        'From: noreply@openmart.jp',
        'Reply-To: info@openmart.jp',
        'X-Mailer: PHP/' . phpversion(),
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'MIME-Version: 1.0'
    );
    
    $success = mail($to, $subject, $message, implode("\r\n", $headers));
}

// ログファイルに記録
$logDir = __DIR__ . '/logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0777, true);
}

$logFile = $logDir . '/email_log_' . date('Y-m') . '.txt';
$logEntry = sprintf(
    "[%s] To: %s | Subject: %s | Status: %s | Server: %s\n",
    date('Y-m-d H:i:s'),
    $to,
    $subject,
    $success ? 'SUCCESS' : 'FAILED',
    gethostname()
);

file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

// 結果を出力
if ($success) {
    echo "✅ メール送信成功: {$to}\n";
    echo "📝 ログ記録: {$logFile}\n";
    exit(0);
} else {
    echo "❌ メール送信失敗\n";
    echo "📝 ログ記録: {$logFile}\n";
    
    // sendmailパスを確認
    echo "\n💡 デバッグ情報:\n";
    echo "sendmail_path: " . ini_get('sendmail_path') . "\n";
    echo "SMTP: " . ini_get('SMTP') . "\n";
    echo "smtp_port: " . ini_get('smtp_port') . "\n";
    
    exit(1);
}
?>