<?php
/**
 * Airレジ完全自動化（Playwright経由）
 * Node.jsスクリプトを実行してCSVダウンロード→FTPアップロード→メール送信
 */

// エラーレポート設定
error_reporting(E_ALL);
ini_set('display_errors', 1);

// セキュリティトークン
$expectedToken = 'airregi-auto-2024-secure-token';
$providedToken = $_GET['token'] ?? $_POST['token'] ?? '';

if ($providedToken !== $expectedToken) {
    http_response_code(403);
    die('Access denied');
}

// 設定
$config = [
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
function sendNotificationEmail($result) {
    global $config;
    
    $status = $result['success'] ? 'success' : 'failed';
    $subject = $status === 'success' 
        ? "Airレジ売上データアップロード完了 - " . date('Y年m月d日')
        : "Airレジ売上データアップロード失敗 - " . date('Y年m月d日');
    
    $message = "Airレジ売上データ処理結果\n\n";
    $message .= "■ 処理情報\n";
    $message .= "━━━━━━━━━━━━━━━━━━━━━━━━\n";
    $message .= "処理日時: " . date('Y年m月d日 H:i:s') . "\n";
    
    if ($result['success']) {
        $message .= "ファイル名: " . $result['fileName'] . "\n";
        $message .= "FTPアップロード先: " . $result['ftpPath'] . "\n";
        $message .= "ステータス: ✅ 成功\n";
    } else {
        $message .= "ステータス: ❌ 失敗\n";
        $message .= "エラー内容: " . $result['error'] . "\n";
    }
    
    $message .= "━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    $message .= "このメールは自動送信されています。";
    
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
 * Node.jsスクリプト実行
 */
function runNodeScript() {
    writeLog("Node.js自動化スクリプト実行開始");
    
    // Node.jsスクリプトのパス
    $scriptPath = '/home/sd0121397/vision-engine/airregi-full-automation.js';
    
    // Node.jsコマンド（サーバーのパスに合わせて調整が必要）
    $nodeCommand = '/usr/local/bin/node';
    if (!file_exists($nodeCommand)) {
        $nodeCommand = 'node'; // PATHが通っている場合
    }
    
    // コマンド実行
    $command = "$nodeCommand $scriptPath 2>&1";
    $output = [];
    $returnCode = 0;
    
    exec($command, $output, $returnCode);
    $outputStr = implode("\n", $output);
    
    writeLog("Node.js実行結果: ReturnCode=$returnCode");
    writeLog("出力: " . substr($outputStr, 0, 500)); // 最初の500文字のみログ
    
    // 結果を解析
    if ($returnCode === 0 && strpos($outputStr, '🎉 すべての処理が完了しました') !== false) {
        // 成功パターンを抽出
        preg_match('/📊 ダウンロード: (.+)/', $outputStr, $fileMatch);
        preg_match('/📤 FTPアップロード: (.+)/', $outputStr, $ftpMatch);
        
        return [
            'success' => true,
            'fileName' => $fileMatch[1] ?? '不明',
            'ftpPath' => $ftpMatch[1] ?? '/partner.openmart.jp/saleslist_bymenu/',
            'output' => $outputStr
        ];
    } else {
        return [
            'success' => false,
            'error' => $outputStr,
            'returnCode' => $returnCode
        ];
    }
}

/**
 * メイン処理
 */
header('Content-Type: application/json; charset=utf-8');

try {
    // Node.jsスクリプトを実行
    $result = runNodeScript();
    
    if ($result['success']) {
        writeLog("自動化成功: " . $result['fileName']);
        
        // メール送信
        if (sendNotificationEmail($result)) {
            writeLog("メール送信成功");
        } else {
            writeLog("メール送信失敗");
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => '自動化処理が完了しました',
            'file' => $result['fileName'],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        writeLog("自動化失敗: " . $result['error']);
        sendNotificationEmail($result);
        
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => '自動化処理に失敗しました',
            'error' => $result['error'],
            'returnCode' => $result['returnCode']
        ]);
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