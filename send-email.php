<?php
/**
 * Airレジ売上データメール送信スクリプト
 * 
 * 使用方法:
 * php send-email.php [CSVファイルパス] [アップロード成功フラグ(0/1)]
 */

// MailSenderクラスを読み込み
require_once __DIR__ . '/includes/mail-sender.php';

// 設定
$config = [
    'to' => 'tuwari69@gmail.com',
    'from' => 'noreply@openmart.jp',
    'from_name' => 'OpenMart自動送信',
    'subject' => 'Airレジ売上データ - ' . date('Y年m月d日')
];

// コマンドライン引数を取得
$csvPath = isset($argv[1]) ? $argv[1] : null;
$uploadSuccess = isset($argv[2]) ? (bool)$argv[2] : false;

// メイン処理
if ($csvPath && file_exists($csvPath)) {
    $result = sendEmailWithAttachment($csvPath, $uploadSuccess, $config);
    
    if ($result) {
        echo "✅ メール送信成功: {$config['to']}\n";
        exit(0);
    } else {
        echo "❌ メール送信失敗\n";
        exit(1);
    }
} else {
    echo "❌ エラー: CSVファイルが見つかりません\n";
    echo "使用方法: php send-email.php [CSVファイルパス] [アップロード成功フラグ]\n";
    exit(1);
}

/**
 * CSVファイル添付でメール送信
 */
function sendEmailWithAttachment($csvPath, $uploadSuccess, $config) {
    // ファイル情報を取得
    $fileName = basename($csvPath);
    $fileSize = filesize($csvPath);
    $fileContent = file_get_contents($csvPath);
    
    // 現在時刻
    $now = new DateTime('now', new DateTimeZone('Asia/Tokyo'));
    $dateStr = $now->format('Y年m月d日');
    $timeStr = $now->format('H:i:s');
    
    // メール本文
    $body = "Airレジ売上データ自動取得レポート
================================

実行日時: {$dateStr} {$timeStr}
対象データ: 昨日の売上データ
ファイル名: {$fileName}
ファイルサイズ: {$fileSize} bytes

処理結果:
- Airレジログイン: ✅ 成功
- CSVダウンロード: ✅ 成功
- OpenMartアップロード: " . ($uploadSuccess ? "✅ 成功" : "❌ 失敗") . "

※CSVファイルを添付しています。

--
このメールは自動送信されています。";

    // MailSenderクラスを使用してメール送信
    $mailSender = new MailSender();
    
    // 添付ファイル情報
    $attachment = [
        'content' => $fileContent,
        'name' => $fileName,
        'type' => 'text/csv'
    ];
    
    // メール送信
    $result = $mailSender->send(
        $config['to'],
        $config['subject'],
        $body,
        $config['from'],
        $config['from_name'],
        $attachment
    );
    
    return $result;
}
?>