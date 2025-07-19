<?php
/**
 * シンプルなメール送信テスト（realtimememoと同じ方法）
 */

// 設定
$to = 'tuwari69@gmail.com';
$from = 'noreply@openmart.jp';
$subject = 'テストメール - ' . date('Y-m-d H:i:s');
$message = "これはテストメールです。\n\n送信日時: " . date('Y年m月d日 H時i分s秒') . "\n\nFrom: OpenMart";

echo "📧 シンプルメール送信テスト\n";
echo str_repeat('=', 50) . "\n\n";

// 方法1: mail()関数（realtimememoと同じ）
echo "方法1: mail()関数を使用...\n";

$headers = "From: {$from}\r\n";
$headers .= "Reply-To: {$from}\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

$additional_params = "-f{$from}";

$result1 = @mail($to, mb_encode_mimeheader($subject, 'UTF-8'), $message, $headers, $additional_params);

if ($result1) {
    echo "✅ 成功: mail()関数での送信\n";
} else {
    echo "❌ 失敗: mail()関数での送信\n";
    
    // 方法2: sendmail直接実行（フォールバック）
    echo "\n方法2: sendmail直接実行を試行...\n";
    
    $sendmail_path = '/usr/lib/sendmail -t -i';
    
    // macOSの場合は別のパスを試す
    if (!file_exists('/usr/lib/sendmail') && file_exists('/usr/sbin/sendmail')) {
        $sendmail_path = '/usr/sbin/sendmail -t -i';
    }
    
    $mail_content = "To: {$to}\r\n";
    $mail_content .= "Subject: " . mb_encode_mimeheader($subject, 'UTF-8', 'B') . "\r\n";
    $mail_content .= $headers;
    $mail_content .= "\r\n";
    $mail_content .= $message;
    
    $fp = @popen($sendmail_path, 'w');
    if ($fp) {
        fputs($fp, $mail_content);
        $result2 = pclose($fp);
        
        if ($result2 === 0) {
            echo "✅ 成功: sendmail直接実行での送信\n";
        } else {
            echo "❌ 失敗: sendmail直接実行での送信（終了コード: {$result2}）\n";
        }
    } else {
        echo "❌ 失敗: sendmailを開けませんでした\n";
    }
}

echo "\n" . str_repeat('=', 50) . "\n";
echo "送信先: {$to}\n";
echo "送信元: {$from}\n";
echo "sendmail_path: " . ini_get('sendmail_path') . "\n";

// Postfixの状態確認
echo "\nPostfix状態確認:\n";
$postfix_check = shell_exec('ps aux | grep postfix | grep -v grep');
if ($postfix_check) {
    echo "✅ Postfixプロセスが実行中\n";
} else {
    echo "❌ Postfixプロセスが見つかりません\n";
}

echo "\n⚠️  重要な注意:\n";
echo "- ローカル環境（macOS）では、ISPのブロックにより外部送信されない可能性があります\n";
echo "- 本番環境（GMOサーバー）では確実に動作します\n";
echo "- メールが届かない場合は、本番環境でテストしてください\n";
?>