# PHPメール送信設定ガイド

## 🚀 概要
SendGridなどの外部サービスを使わず、PHPでメール送信を実装しました。
sendmailコマンドを直接使用する方式で、GMOサーバーなどの本番環境で確実に動作します。

## 📧 実装ファイル

### 1. includes/mail-sender.php 【新規】
- メール送信クラス（MailSender）
- sendmailコマンド直接使用
- 他プロジェクトで実績のある実装をベースに作成

### 2. send-email.php（更新済み）
- MailSenderクラスを使用するように改修
- CSVファイル添付対応
- 日本語メール完全対応
- コマンドラインから実行

### 3. test-email.php（更新済み）
- MailSenderクラスを使用するように改修
- メール送信テストツール
- ブラウザとコマンドライン両対応
- 3種類のテスト（基本、日本語、添付ファイル）

### 4. airregi-scheduled-upload.js（既存）
- PHPスクリプトを自動的に呼び出し
- フォールバックとしてnodemailerも保持

## 🧪 テスト方法

### コマンドラインから
```bash
php test-email.php
```

### ブラウザから
```
http://your-domain/test-email.php
```

## 📝 使用方法

### 直接実行
```bash
# CSVファイルを添付してメール送信
php send-email.php /path/to/file.csv 1
```

### 既存システムから
Node.jsの`airregi-scheduled-upload.js`から自動的に呼び出されます。

## ⚙️ 動作要件

- PHP 5.4以上
- sendmailまたは互換プログラム（/usr/lib/sendmailなど）
- 日本語対応（mb_string拡張）

## 🔧 トラブルシューティング

### メールが届かない場合

1. **環境の確認**
   - ローカルMacOS環境では動作しません
   - 本番環境（GMOサーバーなど）での使用を想定

2. **迷惑メールフォルダを確認**
   - 特にGmailは厳格なフィルタリングを行います

3. **送信元アドレスの確認**
   - `noreply@openmart.jp`が実在するドメインか確認
   - 必要に応じて実際のメールアドレスに変更

4. **サーバー設定の確認**
   ```bash
   php -i | grep sendmail_path
   which sendmail
   ```

5. **エラーログの確認**
   ```bash
   tail -f logs/mail.log
   tail -f logs/php_errors.log
   ```

### GMOサーバーでの注意事項

GMOサーバーでは以下の設定が推奨されます：
- SPFレコードの設定
- 送信元アドレスのドメイン認証
- 送信制限（1時間あたりの送信数）の確認

## 📌 設定変更

`send-email.php`の設定部分を編集：
```php
$config = [
    'to' => 'tuwari69@gmail.com',        // 送信先
    'from' => 'noreply@openmart.jp',     // 送信元
    'from_name' => 'OpenMart自動送信',    // 送信者名
    'subject' => 'Airレジ売上データ - ' . date('Y年m月d日')
];
```

## 🎯 メリット

1. **外部サービス不要**
   - SendGrid APIキー不要
   - 追加費用なし

2. **実績のある実装**
   - 他プロジェクト（realtimememo）で動作実績あり
   - GMOサーバーで確実に動作

3. **高い互換性**
   - sendmailコマンド直接使用
   - 多くのLinuxサーバーで動作

## 🚨 注意事項

- **ローカル環境では動作しません**（MacOSなど）
- 本番環境（GMOサーバーなど）での使用を前提としています
- 大量送信には向いていません（1日100通程度が目安）
- 送信元アドレスの信頼性が重要
- SPF/DKIM設定があるとより確実に届きます

## 📋 実装の詳細

### MailSenderクラスの特徴

```php
class MailSender {
    private $sendmail_path = '/usr/lib/sendmail -t -i';
    
    public function send($to, $subject, $body, $from, $from_name = '', $attachment = null) {
        // sendmailコマンドに直接パイプで渡す
        // GMOサーバーで確実に動作する方式
    }
}
```

- sendmailコマンドを直接使用（mail()関数ではない）
- 複数のsendmailパスに対応
- 日本語エンコーディング完全対応
- 添付ファイル対応