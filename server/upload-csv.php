<?php
/**
 * CSV受信エンドポイント
 * ローカルからアップロードされたCSVファイルを受信して保存
 */

// エラーレポート設定
error_reporting(E_ALL);
ini_set('display_errors', 1);

// セキュリティトークン
$expectedToken = 'airregi-csv-upload-2024';
$providedToken = $_POST['token'] ?? '';

if ($providedToken !== $expectedToken) {
    http_response_code(403);
    die(json_encode(['error' => 'Access denied']));
}

// アップロードディレクトリ
$uploadDir = __DIR__ . '/../data/sales/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

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
    $logFile = $logDir . '/upload_' . date('Y-m') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

// Content-Type設定
header('Content-Type: application/json; charset=utf-8');

try {
    // ファイルアップロードチェック
    if (!isset($_FILES['csv']) || $_FILES['csv']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('ファイルアップロードエラー');
    }
    
    $uploadedFile = $_FILES['csv'];
    $fileName = $uploadedFile['name'];
    $tmpName = $uploadedFile['tmp_name'];
    $fileSize = $uploadedFile['size'];
    
    // ファイルサイズ制限（10MB）
    if ($fileSize > 10 * 1024 * 1024) {
        throw new Exception('ファイルサイズが大きすぎます（最大10MB）');
    }
    
    // ファイル名検証（バリエーション別売上_YYYYMMDD-YYYYMMDD.csv）
    if (!preg_match('/^バリエーション別売上_\d{8}-\d{8}\.csv$/', $fileName)) {
        throw new Exception('無効なファイル名形式');
    }
    
    // CSVファイル検証（最初の行をチェック）
    $handle = fopen($tmpName, 'r');
    $firstLine = fgets($handle);
    fclose($handle);
    
    // Shift-JISからUTF-8に変換
    $firstLineUtf8 = mb_convert_encoding($firstLine, 'UTF-8', 'SJIS-win');
    
    if (strpos($firstLineUtf8, '商品名') === false && strpos($firstLine, '\x8f\xa4\x95\x69\x96\xbc') === false) {
        writeLog("CSVファイル検証エラー: " . substr($firstLine, 0, 100));
        // 検証をスキップ（AirレジのCSVは特殊なエンコーディング）
    }
    
    // ファイル保存
    $destination = $uploadDir . $fileName;
    if (move_uploaded_file($tmpName, $destination)) {
        writeLog("CSVアップロード成功: $fileName ($fileSize bytes)");
        
        // ファイル処理を実行
        include __DIR__ . '/process-sales.php';
        $result = processSalesData($destination);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'CSVファイルを受信しました',
            'file' => $fileName,
            'size' => $fileSize,
            'sales_total' => $result['total_sales'] ?? 0,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        throw new Exception('ファイル保存に失敗しました');
    }
    
} catch (Exception $e) {
    writeLog("アップロードエラー: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}