<?php
/**
 * 売上データ処理
 * CSVファイルを解析して売上情報を抽出
 */

/**
 * 売上データを処理
 */
function processSalesData($csvFile) {
    $result = [
        'total_sales' => 0,
        'total_items' => 0,
        'product_sales' => [],
        'top_products' => [],
        'hourly_sales' => []
    ];
    
    if (!file_exists($csvFile)) {
        return $result;
    }
    
    // CSVファイルを読み込み
    $lines = file($csvFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $isFirstLine = true;
    
    foreach ($lines as $line) {
        if ($isFirstLine) {
            $isFirstLine = false;
            continue; // ヘッダー行をスキップ
        }
        
        // CSVパース（Shift-JISからUTF-8に変換）
        $line = mb_convert_encoding($line, 'UTF-8', 'SJIS-win');
        $data = str_getcsv($line);
        
        if (count($data) >= 10) {
            $productName = $data[0];
            $variation1 = $data[1];
            $variation2 = $data[2];
            $category = $data[3];
            $department = $data[4];
            $quantity = intval($data[5]);
            $amount = intval($data[6]);
            $taxAmount = intval($data[8]);
            
            // 合計計算
            $result['total_sales'] += $amount;
            $result['total_items'] += $quantity;
            
            // 商品別集計
            $productKey = trim($productName);
            if (!empty($variation1)) {
                $productKey .= ' ' . trim($variation1);
            }
            
            if (!isset($result['product_sales'][$productKey])) {
                $result['product_sales'][$productKey] = [
                    'name' => $productKey,
                    'category' => $category,
                    'quantity' => 0,
                    'amount' => 0
                ];
            }
            
            $result['product_sales'][$productKey]['quantity'] += $quantity;
            $result['product_sales'][$productKey]['amount'] += $amount;
        }
    }
    
    // TOP商品を抽出（売上金額順）
    $products = $result['product_sales'];
    usort($products, function($a, $b) {
        return $b['amount'] - $a['amount'];
    });
    $result['top_products'] = array_slice($products, 0, 5);
    
    // 結果を保存
    $summaryFile = dirname($csvFile) . '/latest_summary.json';
    file_put_contents($summaryFile, json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    return $result;
}

/**
 * 売上速報テキストを生成（LINE/メール用）
 */
function generateSalesReport($salesData, $settings = []) {
    // 今日の曜日を判定
    $dayOfWeek = date('w');
    $isHoliday = false; // TODO: 祝日判定ロジックを追加
    
    // 曜日のマッピング
    $dayMap = [
        0 => 'sunday',
        1 => 'monday',
        2 => 'tuesday',
        3 => 'wednesday',
        4 => 'thursday',
        5 => 'friday',
        6 => 'saturday'
    ];
    
    $dayType = $dayMap[$dayOfWeek];
    
    // 旧形式の設定に対応
    if (isset($settings['daily_target']) && !isset($settings['daily_targets'])) {
        $todayTarget = $settings['daily_target'];
    } else {
        $todayTarget = $settings['daily_targets'][$dayType] ?? 80000;
    }
    
    $totalSales = $salesData['total_sales'];
    $achievementRate = $todayTarget > 0 ? round(($totalSales / $todayTarget) * 100, 1) : 0;
    $difference = $totalSales - $todayTarget;
    
    $report = "【オープンマート売上速報】\n";
    $report .= date('Y/m/d(') . ['日','月','火','水','木','金','土'][date('w')] . ') ';
    $report .= date('H:i') . "時点\n\n";
    
    $report .= "■ 本日の売上\n";
    $report .= "売上: ¥" . number_format($totalSales) . "\n";
    $report .= "目標: ¥" . number_format($todayTarget) . " (達成率: {$achievementRate}%)\n";
    $report .= "差額: " . ($difference >= 0 ? '+' : '') . "¥" . number_format($difference) . "\n\n";
    
    // 現在時刻の時間帯別目標との比較
    $currentHour = intval(date('H'));
    
    // 旧形式の設定に対応
    if (isset($settings['hourly_targets']) && !is_array($settings['hourly_targets'][$dayType] ?? null)) {
        $hourlyTarget = $settings['hourly_targets'][$currentHour] ?? 0;
    } else {
        $hourlyTarget = $settings['hourly_targets'][$dayType][$currentHour] ?? 0;
    }
    
    if ($hourlyTarget > 0) {
        $hourlyRate = round(($totalSales / $hourlyTarget) * 100, 1);
        
        $report .= "■ {$currentHour}時までの目標\n";
        $report .= "累計目標: ¥" . number_format($hourlyTarget) . "\n";
        $report .= "進捗率: {$hourlyRate}%\n\n";
    }
    
    // 営業時間内の残り時間と必要ペースを表示
    if (isset($settings['business_hours'][$dayType])) {
        $endTime = $settings['business_hours'][$dayType]['end'];
        $endHour = intval($endTime);
        $remainingHours = max(0, $endHour - $currentHour);
        
        if ($remainingHours > 0 && $difference < 0) {
            $requiredPerHour = abs($difference) / $remainingHours;
            $report .= "■ 目標達成に必要なペース\n";
            $report .= "残り時間: {$remainingHours}時間\n";
            $report .= "必要売上/時: ¥" . number_format(ceil($requiredPerHour)) . "\n\n";
        }
    }
    
    $report .= "■ 売れ筋TOP5\n";
    $rank = 1;
    foreach ($salesData['top_products'] as $product) {
        $report .= "{$rank}. {$product['name']} ";
        $report .= "({$product['quantity']}個) ";
        $report .= "¥" . number_format($product['amount']) . "\n";
        $rank++;
    }
    
    $report .= "\n詳細: https://akichikikaku.com/vision-engine/dashboard/";
    
    return $report;
}