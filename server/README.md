# Airレジ自動化システム - サーバー設定ガイド

## 🚀 概要
このシステムは、Airレジから売上データを自動的にダウンロードし、FTPにアップロードして、メール通知を送信します。

## 📦 ファイル構成

### PHPファイル（サーバー側）
- `test.php` - メール送信テストページ
- `status.php` - 実行ログ確認ページ
- `run-automation.php` - 簡易版自動化（デモ用）
- `full-automation.php` - 完全版自動化（Node.js連携）
- `.htaccess` - セキュリティ設定

### Node.jsファイル（ローカルまたはサーバー）
- `airregi-full-automation.js` - Playwright自動化スクリプト
- `ftp-upload-curl.js` - FTPアップロードモジュール
- `send-airregi-email.php` - メール送信補助

## 🔧 セットアップ手順

### 1. サーバーへのアップロード
```bash
./server-upload.sh
```

### 2. アクセスURL
- メールテスト: https://akichikikaku.com/vision-engine/test.php
- ステータス確認: https://akichikikaku.com/vision-engine/status.php
- 手動実行: https://akichikikaku.com/vision-engine/run-automation.php?token=airregi-auto-2024-secure-token

### 3. Cron設定（毎日9時実行）
```bash
0 9 * * * curl -s "https://akichikikaku.com/vision-engine/run-automation.php?token=airregi-auto-2024-secure-token"
```

## 🔐 セキュリティ
- アクセストークン: `airregi-auto-2024-secure-token`
- ログファイルへの直接アクセスは禁止
- エラーログは表示せず、ファイルに記録

## 📧 メール設定
- 送信先: tuwari69@gmail.com
- 送信元: noreply@akichikikaku.com
- 日本語対応（mb_send_mail使用）

## 🛠️ トラブルシューティング

### メールが届かない場合
1. test.phpでテストメール送信を確認
2. サーバーのメール送信設定を確認
3. 迷惑メールフォルダを確認

### FTPアップロードが失敗する場合
1. FTP認証情報を確認
2. アップロード先ディレクトリの権限を確認
3. ファイルサイズ制限を確認

### 自動化が動作しない場合
1. status.phpでログを確認
2. トークンが正しいか確認
3. サーバーのPHPバージョンを確認（7.4以上推奨）

## 📝 カスタマイズ

### メールアドレスの変更
`run-automation.php`の以下の部分を編集：
```php
'email' => [
    'to' => 'your-email@example.com',
    'from' => 'noreply@yourdomain.com'
]
```

### トークンの変更
`$expectedToken`の値を変更し、URLのトークンパラメータも更新

## 🚨 注意事項
- 本番環境では`display_errors`を必ずOFFに設定
- 定期的にログファイルのサイズを確認
- FTPパスワードは環境変数で管理することを推奨