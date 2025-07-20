<?php
/**
 * Airレジ自動化実行スクリプト（サーバー版）
 * FTPアップロードとメール送信を実行
 */

// エラーレポート設定
error_reporting(E_ALL);
ini_set('display_errors', 1);

// セキュリティトークン（不正アクセス防止）
$expectedToken = 'airregi-auto-2024-secure-token';
$providedToken = $_GET['token'] ?? $_POST['token'] ?? '';

if ($providedToken !== $expectedToken) {
    http_response_code(403);
    die('Access denied');
}

// 設定
$config = [
    'ftp' => [
        'host' => 'ftp.gmoserver.jp',
        'user' => 'sd0121397@gmoserver.jp',
        'password' => 'drES2JFGYt6ennR&',
        'remotePath' => '/partner.openmart.jp/saleslist_bymenu/'
    ],
    'email' => [
        'to' => 'tuwari69@gmail.com',
        'from' => 'noreply@akichikikaku.com'
    ]
];

// ログディレクトリ
$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}

/**
 * ログ記録
 */
function writeLog($message) {
    global $logDir;
    $logFile = $logDir . '/automation_' . date('Y-m') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

/**
 * メール送信
 */
function sendNotificationEmail($fileName, $ftpPath, $status = 'success', $error = '') {
    global $config;
    
    // 売上データを取得
    $salesData = [];
    $settings = [];
    
    // 売上サマリーを読み込み
    $summaryFile = __DIR__ . '/../data/sales/latest_summary.json';
    if (file_exists($summaryFile)) {
        $salesData = json_decode(file_get_contents($summaryFile), true);
    }
    
    // 設定を読み込み
    $settingsFile = __DIR__ . '/../data/settings.json';
    if (file_exists($settingsFile)) {
        $settings = json_decode(file_get_contents($settingsFile), true);
    }
    
    // process-sales.phpをインクルード
    require_once __DIR__ . '/process-sales.php';
    
    // 売上速報を生成
    $message = generateSalesReport($salesData, $settings);
    
    $subject = $status === 'success' 
        ? "【売上速報】" . date('Y年m月d日 H時') . "時点"
        : "Airレジ売上データアップロード失敗 - " . date('Y年m月d日');
    
    if ($error) {
        $message .= "\n\nエラー内容: $error\n";
    }
    
    $headers = "From: " . $config['email']['from'] . "\r\n";
    $headers .= "Reply-To: " . $config['email']['from'] . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // 日本語対応
    if (function_exists('mb_send_mail')) {
        mb_language("Japanese");
        mb_internal_encoding("UTF-8");
        return mb_send_mail($config['email']['to'], $subject, $message, $headers);
    } else {
        return mail($config['email']['to'], $subject, $message, $headers);
    }
}

/**
 * メイン処理
 */
function runAutomation() {
    global $config;
    
    writeLog("自動化処理開始");
    
    try {
        // 最新のCSVファイルを使用するかチェック
        $useLatest = isset($_GET['use_latest']) && $_GET['use_latest'] === 'true';
        
        if ($useLatest) {
            // 最新のアップロードされたCSVを使用
            $salesDir = __DIR__ . '/../data/sales/';
            $latestFile = null;
            $latestTime = 0;
            
            foreach (glob($salesDir . '*.csv') as $file) {
                $mtime = filemtime($file);
                if ($mtime > $latestTime) {
                    $latestTime = $mtime;
                    $latestFile = $file;
                }
            }
            
            if (!$latestFile) {
                throw new Exception('CSVファイルが見つかりません');
            }
            
            $localFile = $latestFile;
            $fileName = basename($localFile);
            writeLog("最新ファイル使用: $fileName");
        } else {
            // 今日の日付でファイル名を生成
            $dateStr = date('Ymd');
            $fileName = "バリエーション別売上_{$dateStr}-{$dateStr}.csv";
            
            // デモ用: 仮のCSVファイルを作成
            $localFile = "/tmp/{$fileName}";
            $demoContent = "商品名,数量,金額\nテスト商品,10,5000\n";
            file_put_contents($localFile, $demoContent);
        }
        
        // FTPアップロード（cURL使用）
        $ftpUrl = "ftp://{$config['ftp']['host']}{$config['ftp']['remotePath']}{$fileName}";
        $curlCommand = sprintf(
            'curl -T "%s" --user "%s:%s" "%s" --ftp-create-dirs 2>&1',
            $localFile,
            $config['ftp']['user'],
            $config['ftp']['password'],
            $ftpUrl
        );
        
        $output = [];
        $returnCode = 0;
        exec($curlCommand, $output, $returnCode);
        
        if ($returnCode === 0) {
            writeLog("FTPアップロード成功: $fileName");
            
            // メール送信
            $ftpPath = $config['ftp']['remotePath'] . $fileName;
            if (sendNotificationEmail($fileName, $ftpPath, 'success')) {
                writeLog("メール送信成功");
                echo json_encode([
                    'status' => 'success',
                    'message' => 'アップロードとメール送信が完了しました',
                    'file' => $fileName,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            } else {
                writeLog("メール送信失敗");
                echo json_encode([
                    'status' => 'warning',
                    'message' => 'アップロードは成功しましたが、メール送信に失敗しました',
                    'file' => $fileName,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
        } else {
            $errorMsg = implode("\n", $output);
            writeLog("FTPアップロード失敗: $errorMsg");
            sendNotificationEmail($fileName, '', 'failed', $errorMsg);
            
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'FTPアップロードに失敗しました',
                'error' => $errorMsg
            ]);
        }
        
        // 一時ファイル削除
        if (file_exists($localFile)) {
            unlink($localFile);
        }
        
    } catch (Exception $e) {
        writeLog("エラー発生: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'システムエラーが発生しました',
            'error' => $e->getMessage()
        ]);
    }
}

// Content-Type設定
header('Content-Type: application/json; charset=utf-8');

// 実行
runAutomation();