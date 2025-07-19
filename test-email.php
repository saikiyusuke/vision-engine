<?php
/**
 * メール送信テストスクリプト
 * 
 * 使用方法:
 * - ブラウザから: http://your-domain/test-email.php
 * - コマンドラインから: php test-email.php
 */

// タイムゾーン設定
date_default_timezone_set('Asia/Tokyo');

// MailSenderクラスをインクルード
require_once __DIR__ . '/includes/mail-sender.php';

// メール設定
$testConfig = [
    'to' => 'tuwari69@gmail.com',
    'from' => 'noreply@openmart.jp',
    'from_name' => 'OpenMart自動送信（テスト）'
];

// CLIかWebかを判定
$isCLI = php_sapi_name() === 'cli';

// ヘッダー出力（Web時のみ）
if (!$isCLI) {
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>メール送信テスト</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .info { background: #f8f9fa; padding: 10px; border-left: 4px solid #007bff; margin: 10px 0; }
        pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>📧 PHPメール送信テスト（MailSenderクラス使用）</h1>';
}

// システム情報を表示
echo $isCLI ? "\n📧 PHPメール送信テスト（MailSenderクラス使用）\n" . str_repeat('=', 50) . "\n\n" : '<div class="info">';
echo "システム情報:\n";
echo "- PHPバージョン: " . PHP_VERSION . "\n";
echo "- サーバー: " . php_uname('s') . " " . php_uname('r') . "\n";
echo "- sendmail_path: " . ini_get('sendmail_path') . "\n";
echo "- MailSenderクラス: " . (class_exists('MailSender') ? '利用可能' : '利用不可') . "\n";
echo $isCLI ? "\n" : '</div>';

// MailSenderインスタンスを作成
$mailSender = new MailSender();

// テスト1: 基本的なメール送信
echo $isCLI ? "\n🧪 テスト1: 基本的なメール送信\n" : '<h2>🧪 テスト1: 基本的なメール送信</h2>';

$subject1 = 'テストメール（基本）- ' . date('Y-m-d H:i:s');
$body1 = "これはMailSenderクラスを使用した基本的なテストメールです。\n\n送信日時: " . date('Y年m月d日 H:i:s');

$result1 = $mailSender->send(
    $testConfig['to'],
    $subject1,
    $body1,
    $testConfig['from'],
    $testConfig['from_name']
);

if ($result1) {
    echo $isCLI ? "✅ 成功: 基本メール送信完了\n" : '<p class="success">✅ 成功: 基本メール送信完了</p>';
} else {
    echo $isCLI ? "❌ 失敗: 基本メール送信失敗\n" : '<p class="error">❌ 失敗: 基本メール送信失敗</p>';
}

// テスト2: 日本語を含むメール
echo $isCLI ? "\n🧪 テスト2: 日本語メール送信\n" : '<h2>🧪 テスト2: 日本語メール送信</h2>';

$subject2 = '【テスト】日本語メール - ' . date('Y年m月d日');
$body2 = "日本語を含むメールのテストです。

送信元: {$testConfig['from_name']}
送信日時: " . date('Y年m月d日 H時i分s秒') . "

特殊文字テスト: ①②③ ★☆♪ 🎉📧

以上";

$result2 = $mailSender->send(
    $testConfig['to'],
    $subject2,
    $body2,
    $testConfig['from'],
    $testConfig['from_name']
);

if ($result2) {
    echo $isCLI ? "✅ 成功: 日本語メール送信完了\n" : '<p class="success">✅ 成功: 日本語メール送信完了</p>';
} else {
    echo $isCLI ? "❌ 失敗: 日本語メール送信失敗\n" : '<p class="error">❌ 失敗: 日本語メール送信失敗</p>';
}

// テスト3: ファイル添付テスト
echo $isCLI ? "\n🧪 テスト3: ファイル添付メール送信\n" : '<h2>🧪 テスト3: ファイル添付メール送信</h2>';

// テスト用CSVファイルを作成
$testCsvPath = sys_get_temp_dir() . '/test_' . date('Ymd_His') . '.csv';
$testCsvContent = "商品名,数量,金額\nテスト商品A,10,1000\nテスト商品B,20,2000\n";
file_put_contents($testCsvPath, $testCsvContent);

// 添付ファイル情報
$attachment = [
    'content' => $testCsvContent,
    'name' => 'test_sales_' . date('Y-m-d') . '.csv',
    'type' => 'text/csv'
];

$subject3 = 'テストメール（添付ファイル付き）- ' . date('Y-m-d H:i:s');
$body3 = "CSVファイルが添付されたテストメールです。\n\n添付ファイル: test_sales_" . date('Y-m-d') . ".csv";

$result3 = $mailSender->send(
    $testConfig['to'],
    $subject3,
    $body3,
    $testConfig['from'],
    $testConfig['from_name'],
    $attachment
);

if ($result3) {
    echo $isCLI ? "✅ 成功: 添付ファイル付きメール送信完了\n" : '<p class="success">✅ 成功: 添付ファイル付きメール送信完了</p>';
} else {
    echo $isCLI ? "❌ 失敗: 添付ファイル付きメール送信失敗\n" : '<p class="error">❌ 失敗: 添付ファイル付きメール送信失敗</p>';
}

// テストファイルを削除
@unlink($testCsvPath);

// 結果サマリー
echo $isCLI ? "\n" . str_repeat('=', 50) . "\n" : '<hr>';
echo $isCLI ? "📊 テスト結果サマリー\n" : '<h2>📊 テスト結果サマリー</h2>';
echo $isCLI ? "" : '<ul>';
echo ($isCLI ? "- " : '<li>') . "送信先: {$testConfig['to']}" . ($isCLI ? "\n" : '</li>');
echo ($isCLI ? "- " : '<li>') . "送信元: {$testConfig['from']}" . ($isCLI ? "\n" : '</li>');
echo ($isCLI ? "- " : '<li>') . "実行時刻: " . date('Y-m-d H:i:s') . ($isCLI ? "\n" : '</li>');
echo ($isCLI ? "- " : '<li>') . "送信方式: sendmailコマンド直接使用" . ($isCLI ? "\n" : '</li>');
echo $isCLI ? "" : '</ul>';

echo $isCLI ? "\n⚠️  注意事項:\n" : '<div class="info"><h3>⚠️ 注意事項</h3><ul>';
echo ($isCLI ? "- " : '<li>') . "ローカル環境では動作しない可能性があります" . ($isCLI ? "\n" : '</li>');
echo ($isCLI ? "- " : '<li>') . "GMOサーバーなど本番環境での動作を想定しています" . ($isCLI ? "\n" : '</li>');
echo ($isCLI ? "- " : '<li>') . "メールが届かない場合は迷惑メールフォルダを確認してください" . ($isCLI ? "\n" : '</li>');
echo $isCLI ? "" : '</ul></div>';

// フッター（Web時のみ）
if (!$isCLI) {
    echo '</body></html>';
}
?>