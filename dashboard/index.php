<?php
/**
 * Airレジ売上ダッシュボード
 */

// 設定読み込み
$settingsFile = __DIR__ . '/../data/settings.json';
$settings = file_exists($settingsFile) ? json_decode(file_get_contents($settingsFile), true) : [];

// 最新の売上データを読み込み
$salesDir = __DIR__ . '/../data/sales/';
$latestFile = null;
$latestTime = 0;

if (is_dir($salesDir)) {
    foreach (glob($salesDir . '*.csv') as $file) {
        $mtime = filemtime($file);
        if ($mtime > $latestTime) {
            $latestTime = $mtime;
            $latestFile = $file;
        }
    }
}

// 売上データ解析
$salesData = [];
$totalSales = 0;
$productSales = [];

if ($latestFile && file_exists($latestFile)) {
    $lines = file($latestFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $isFirstLine = true;
    
    foreach ($lines as $line) {
        if ($isFirstLine) {
            $isFirstLine = false;
            continue; // ヘッダー行をスキップ
        }
        
        $data = str_getcsv($line);
        if (count($data) >= 10) {
            $productName = $data[0];
            $quantity = intval($data[5]);
            $amount = intval($data[6]);
            
            $totalSales += $amount;
            
            if (!isset($productSales[$productName])) {
                $productSales[$productName] = [
                    'quantity' => 0,
                    'amount' => 0
                ];
            }
            
            $productSales[$productName]['quantity'] += $quantity;
            $productSales[$productName]['amount'] += $amount;
        }
    }
}

// 売上TOP5を取得
arsort($productSales);
$top5Products = array_slice($productSales, 0, 5, true);

// 現在の時間帯
$currentHour = date('H');
$todayTarget = $settings['daily_target'] ?? 80000;
$hourlyTarget = $settings['hourly_targets'][$currentHour] ?? ($todayTarget / 10);

// 達成率計算
$achievementRate = $todayTarget > 0 ? round(($totalSales / $todayTarget) * 100, 1) : 0;
$difference = $totalSales - $todayTarget;
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>売上ダッシュボード - オープンマート</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 24px;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .last-update {
            color: #666;
            font-size: 14px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .card h2 {
            font-size: 18px;
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }
        
        .sales-summary {
            text-align: center;
        }
        
        .sales-amount {
            font-size: 36px;
            font-weight: bold;
            color: #27ae60;
            margin: 10px 0;
        }
        
        .target-info {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .achievement {
            font-size: 24px;
            font-weight: bold;
            color: <?php echo $achievementRate >= 100 ? '#27ae60' : '#e74c3c'; ?>;
        }
        
        .difference {
            font-size: 18px;
            color: <?php echo $difference >= 0 ? '#27ae60' : '#e74c3c'; ?>;
            margin-top: 5px;
        }
        
        .product-list {
            list-style: none;
        }
        
        .product-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .product-name {
            flex: 1;
            font-weight: 500;
        }
        
        .product-stats {
            text-align: right;
            color: #666;
        }
        
        .product-amount {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        
        .btn:hover {
            background: #2980b9;
        }
        
        .btn-secondary {
            background: #95a5a6;
        }
        
        .btn-secondary:hover {
            background: #7f8c8d;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .grid {
                grid-template-columns: 1fr;
            }
            
            .sales-amount {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 売上ダッシュボード - オープンマート</h1>
            <p class="last-update">
                最終更新: <?php echo $latestFile ? date('Y年m月d日 H:i', $latestTime) : '---'; ?>
            </p>
        </div>
        
        <div class="grid">
            <div class="card sales-summary">
                <h2>本日の売上</h2>
                <div class="sales-amount">¥<?php echo number_format($totalSales); ?></div>
                <div class="target-info">
                    目標: ¥<?php echo number_format($todayTarget); ?>
                </div>
                <div class="achievement"><?php echo $achievementRate; ?>%</div>
                <div class="difference">
                    <?php echo $difference >= 0 ? '+' : ''; ?>¥<?php echo number_format($difference); ?>
                </div>
            </div>
            
            <div class="card">
                <h2>売れ筋TOP5</h2>
                <ul class="product-list">
                    <?php 
                    $rank = 1;
                    foreach ($top5Products as $name => $data): 
                    ?>
                    <li class="product-item">
                        <span class="product-name"><?php echo $rank++; ?>. <?php echo htmlspecialchars($name); ?></span>
                        <div class="product-stats">
                            <span><?php echo $data['quantity']; ?>個</span>
                            <span class="product-amount">¥<?php echo number_format($data['amount']); ?></span>
                        </div>
                    </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>
        
        <div class="actions">
            <a href="settings.php" class="btn">⚙️ 設定</a>
            <a href="javascript:location.reload()" class="btn btn-secondary">🔄 更新</a>
        </div>
    </div>
    
    <script>
        // 1分ごとに自動更新
        setTimeout(function() {
            location.reload();
        }, 60000);
    </script>
</body>
</html>