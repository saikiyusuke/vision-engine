<?php
/**
 * ステータス確認ページ
 */

// ログディレクトリ
$logDir = __DIR__ . '/logs';
$logs = [];

// 今月のログファイルを読み込み
$currentLogFile = $logDir . '/automation_' . date('Y-m') . '.log';
if (file_exists($currentLogFile)) {
    $logContent = file_get_contents($currentLogFile);
    $lines = explode("\n", trim($logContent));
    foreach ($lines as $line) {
        if (!empty($line)) {
            $logs[] = $line;
        }
    }
}

// 最新10件のログを取得
$recentLogs = array_slice(array_reverse($logs), 0, 10);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>実行ステータス - Airレジ自動化</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
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
            border-bottom: 2px solid #2196F3;
            padding-bottom: 10px;
        }
        .log-container {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin-top: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        .log-entry {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
            font-family: monospace;
            font-size: 14px;
        }
        .log-entry:last-child {
            border-bottom: none;
        }
        .success {
            color: #4CAF50;
        }
        .error {
            color: #f44336;
        }
        .info-box {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .action-buttons {
            margin-top: 20px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            margin-right: 10px;
            background-color: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #1976D2;
        }
        .button.test {
            background-color: #4CAF50;
        }
        .button.test:hover {
            background-color: #45a049;
        }
        .timestamp {
            color: #666;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 実行ステータス</h1>
        
        <div class="info-box">
            <strong>現在時刻:</strong> <?php echo date('Y年m月d日 H:i:s'); ?><br>
            <strong>サーバー:</strong> <?php echo $_SERVER['SERVER_NAME']; ?><br>
            <strong>ログファイル:</strong> <?php echo basename($currentLogFile); ?>
        </div>
        
        <h2>最近の実行ログ（最新10件）</h2>
        <div class="log-container">
            <?php if (empty($recentLogs)): ?>
                <p style="color: #666;">まだログがありません。</p>
            <?php else: ?>
                <?php foreach ($recentLogs as $log): ?>
                    <?php
                    $class = '';
                    if (strpos($log, '成功') !== false) {
                        $class = 'success';
                    } elseif (strpos($log, '失敗') !== false || strpos($log, 'エラー') !== false) {
                        $class = 'error';
                    }
                    
                    // タイムスタンプを強調表示
                    $log = preg_replace('/^\[(.*?)\]/', '<span class="timestamp">[$1]</span>', $log);
                    ?>
                    <div class="log-entry <?php echo $class; ?>">
                        <?php echo $log; ?>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        
        <div class="action-buttons">
            <a href="test.php" class="button test">📧 メールテスト</a>
            <a href="run-automation.php?token=airregi-auto-2024-secure-token" class="button" onclick="return confirm('自動化を実行しますか？')">🚀 手動実行</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3>⏰ Cron設定例</h3>
            <p>毎日午前9時に自動実行する場合：</p>
            <code style="background: #f0f0f0; padding: 10px; display: block; margin: 10px 0;">
                0 9 * * * curl -s "https://<?php echo $_SERVER['SERVER_NAME']; ?>/vision-engine/run-automation.php?token=airregi-auto-2024-secure-token" > /dev/null 2>&1
            </code>
        </div>
    </div>
    
    <script>
        // 30秒ごとに自動更新
        setTimeout(function() {
            location.reload();
        }, 30000);
    </script>
</body>
</html>