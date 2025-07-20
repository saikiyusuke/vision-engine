<?php
/**
 * メール送信テストページ
 */

// エラーレポート設定
error_reporting(E_ALL);
ini_set('display_errors', 1);

$result = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $to = $_POST['email'] ?? 'tuwari69@gmail.com';
    $subject = 'Airレジ自動化システム - テストメール';
    $message = "これはテストメールです。\n\n";
    $message .= "送信日時: " . date('Y年m月d日 H:i:s') . "\n";
    $message .= "サーバー: " . $_SERVER['SERVER_NAME'] . "\n";
    $message .= "PHP Version: " . phpversion() . "\n\n";
    $message .= "メール送信機能が正常に動作しています。";
    
    $headers = "From: noreply@akichikikaku.com\r\n";
    $headers .= "Reply-To: noreply@akichikikaku.com\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // 日本語対応
    if (function_exists('mb_send_mail')) {
        mb_language("Japanese");
        mb_internal_encoding("UTF-8");
        $success = mb_send_mail($to, $subject, $message, $headers);
    } else {
        $success = mail($to, $subject, $message, $headers);
    }
    
    if ($success) {
        $result = '<div style="color: green; padding: 10px; border: 1px solid green; margin: 10px 0;">✅ メール送信成功！送信先: ' . htmlspecialchars($to) . '</div>';
    } else {
        $result = '<div style="color: red; padding: 10px; border: 1px solid red; margin: 10px 0;">❌ メール送信失敗</div>';
    }
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>メール送信テスト - Airレジ自動化</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        form {
            margin-top: 20px;
        }
        input[type="email"] {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-sizing: border-box;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #45a049;
        }
        .info {
            background-color: #e7f3ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📧 メール送信テスト</h1>
        
        <?php echo $result; ?>
        
        <div class="info">
            <strong>サーバー情報:</strong><br>
            PHP Version: <?php echo phpversion(); ?><br>
            mb_send_mail: <?php echo function_exists('mb_send_mail') ? '利用可能' : '利用不可'; ?><br>
            Server: <?php echo $_SERVER['SERVER_NAME']; ?>
        </div>
        
        <form method="post">
            <label for="email">送信先メールアドレス:</label>
            <input type="email" id="email" name="email" value="tuwari69@gmail.com" required>
            <button type="submit">テストメール送信</button>
        </form>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3>🚀 自動化実行</h3>
            <p>以下のURLで自動化を実行できます：</p>
            <code style="background: #f0f0f0; padding: 10px; display: block; margin: 10px 0;">
                https://<?php echo $_SERVER['SERVER_NAME']; ?>/vision-engine/run-automation.php?token=airregi-auto-2024-secure-token
            </code>
        </div>
    </div>
</body>
</html>