#!/usr/bin/env php
<?php
/**
 * Airレジ売上データ取得・アップロード・メール送信
 * PHPのみで実装（Node.js不要版）
 * 
 * cronでの実行例:
 * 0 10-23 * * * /usr/bin/php /path/to/airregi-php-scheduler.php >> /path/to/logs/airregi.log 2>&1
 */

date_default_timezone_set('Asia/Tokyo');

// 実行時間チェック（10:00-23:59）
$hour = (int)date('H');
if ($hour < 10 || $hour > 23) {
    echo "⏰ 実行時間外です（実行時間: 10:00-24:00）\n";
    exit(0);
}

echo "\n🚀 Airレジ定期実行開始: " . date('Y-m-d H:i:s') . "\n";
echo str_repeat('=', 50) . "\n\n";

// Node.jsスクリプトを実行
$nodeScript = __DIR__ . '/airregi-scheduled-upload.js';
if (!file_exists($nodeScript)) {
    echo "❌ エラー: {$nodeScript} が見つかりません\n";
    exit(1);
}

// Node.jsコマンドのパスを探す
$nodePaths = [
    '/usr/local/bin/node',
    '/usr/bin/node',
    'node'
];

$nodeCmd = null;
foreach ($nodePaths as $path) {
    $check = shell_exec("which {$path} 2>/dev/null");
    if ($check) {
        $nodeCmd = trim($check);
        break;
    }
}

if (!$nodeCmd) {
    echo "❌ エラー: Node.jsが見つかりません\n";
    echo "Node.jsをインストールしてください\n";
    exit(1);
}

echo "📍 Node.js: {$nodeCmd}\n";
echo "📍 スクリプト: {$nodeScript}\n\n";

// 実行
$command = "{$nodeCmd} {$nodeScript} 2>&1";
$output = [];
$returnCode = 0;

echo "🔄 実行中...\n\n";

// リアルタイムで出力を表示
$handle = popen($command, 'r');
if ($handle) {
    while (!feof($handle)) {
        $buffer = fgets($handle);
        if ($buffer) {
            echo $buffer;
        }
    }
    $returnCode = pclose($handle);
}

echo "\n" . str_repeat('=', 50) . "\n";
echo "🏁 実行完了: " . date('Y-m-d H:i:s') . "\n";
echo "終了コード: " . ($returnCode >> 8) . "\n";

// エラーの場合は管理者に通知（オプション）
if ($returnCode !== 0) {
    echo "\n⚠️  エラーが発生しました\n";
    
    // エラーメール送信（オプション）
    /*
    @mail(
        'admin@openmart.jp',
        '[エラー] Airレジ定期実行失敗',
        "エラーが発生しました。\n\n実行時刻: " . date('Y-m-d H:i:s') . "\n終了コード: " . ($returnCode >> 8),
        'From: noreply@openmart.jp'
    );
    */
}

exit($returnCode >> 8);
?>