<?php
/**
 * 売上レポートのテスト
 * 設定に基づいてメール内容がどう変わるか確認
 */

// process-sales.phpをインクルード
require_once __DIR__ . '/server/process-sales.php';

// テスト用の売上データ
$salesData = [
    'total_sales' => 45000,  // 現在の売上
    'total_items' => 120,
    'top_products' => [
        ['name' => 'アロハシャツ', 'quantity' => 5, 'amount' => 5000],
        ['name' => '本の花束', 'quantity' => 2, 'amount' => 3800],
        ['name' => 'ザクロ', 'quantity' => 5, 'amount' => 3190],
        ['name' => 'チャイシロップ', 'quantity' => 3, 'amount' => 4446],
        ['name' => 'チキンビリヤニ', 'quantity' => 3, 'amount' => 3240]
    ]
];

// 設定パターン1: デフォルト設定
echo "=== パターン1: デフォルト設定（目標: 80,000円）===\n";
$settings1 = [
    'daily_target' => 80000,
    'hourly_targets' => [
        '10' => 10000,
        '11' => 22000,
        '12' => 37000,
        '13' => 52000,
        '14' => 60000,
        '15' => 68000,
        '16' => 74000,
        '17' => 78000,
        '18' => 80000
    ]
];
echo generateSalesReport($salesData, $settings1);
echo "\n\n";

// 設定パターン2: 低めの目標
echo "=== パターン2: 低めの目標（目標: 50,000円）===\n";
$settings2 = [
    'daily_target' => 50000,
    'hourly_targets' => [
        '10' => 5000,
        '11' => 12000,
        '12' => 20000,
        '13' => 30000,
        '14' => 38000,
        '15' => 44000,
        '16' => 48000,
        '17' => 49000,
        '18' => 50000
    ]
];
echo generateSalesReport($salesData, $settings2);
echo "\n\n";

// 現在の時間に応じた時間帯別目標も表示
$currentHour = intval(date('H'));
if ($currentHour >= 10 && $currentHour <= 18) {
    echo "=== 現在時刻（{$currentHour}時）の時間帯別比較 ===\n";
    echo "設定1の{$currentHour}時までの目標: ¥" . number_format($settings1['hourly_targets'][$currentHour] ?? 0) . "\n";
    echo "設定2の{$currentHour}時までの目標: ¥" . number_format($settings2['hourly_targets'][$currentHour] ?? 0) . "\n";
    echo "現在の売上: ¥" . number_format($salesData['total_sales']) . "\n";
}