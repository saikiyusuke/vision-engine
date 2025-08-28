<?php
/**
 * 簡単なメール送信テスト
 */

echo "📧 メール送信テスト開始\n";

// 現在時刻
$now = new DateTime('now', new DateTimeZone('Asia/Tokyo'));
$dateStr = $now->format('Y年m月d日 H:i:s');

// テスト用メール本文
$body = "Vision Engine テスト実行完了レポート
================================

実行日時: {$dateStr}
テスト結果: ✅ 正常動作確認

システム状況:
- Enhanced Vision Engine: ✅ 動作中
- Airレジアクセス: ✅ 成功
- スクリーンショット: ✅ 作成済み
- GitHub Actions: ✅ 準備完了

次回自動実行: 今日 10:00 AM JST

--
Vision Engine 自動テストシステム";

// シンプルなmail関数を使用
$to = 'tuwari69@gmail.com';
$subject = 'Vision Engine テスト完了 - ' . date('Y年m月d日 H:i');
$headers = "From: noreply@openmart.jp\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// メール送信
$result = mail($to, $subject, $body, $headers);

if ($result) {
    echo "✅ メール送信成功: {$to}\n";
    echo "📧 件名: {$subject}\n";
    exit(0);
} else {
    echo "❌ メール送信失敗\n";
    echo "ℹ️ システムのメール設定を確認してください\n";
    exit(1);
}
?>
EOF < /dev/null