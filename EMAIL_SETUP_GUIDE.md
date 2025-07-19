# Vision Engine Email Setup Guide

このガイドでは、Vision Engineのメール送信機能の設定方法を説明します。

## 🚀 クイックスタート

### 1. メールアドレスの設定

`config/email-config.php` ファイルを編集して、実際のメールアドレスに更新してください：

```php
return [
    // 送信者情報
    'from_email' => 'info@your-domain.com',    // あなたの送信用メールアドレス
    'from_name' => 'Your Company Name',        // あなたの会社名
    
    // 管理者メール（お問い合わせ通知を受信）
    'admin_email' => 'admin@your-domain.com',  // 管理者のメールアドレス
];
```

### 2. メール送信テスト

以下のコマンドでメール送信をテストできます：

```bash
php test-email-send.php
```

**注意**: `test-email-send.php` の中の `$test_email` 変数を実際のメールアドレスに更新してください。

### 3. お問い合わせフォームの確認

ブラウザで `contact.php` にアクセスして、お問い合わせフォームが正しく動作するか確認してください。

## 📁 ファイル構成

```
vision-engine/
├── config/
│   └── email-config.php        # メール設定ファイル
├── includes/
│   └── email-sender.php        # メール送信クラス
├── api/
│   └── send-email.php          # メール送信APIエンドポイント
├── logs/                       # メール送信ログ（自動生成）
├── contact.php                 # お問い合わせフォーム
├── test-email-send.php         # メール送信テストスクリプト
└── EMAIL_SETUP_GUIDE.md        # このファイル
```

## 🔧 実装の特徴

### 1. 複数の送信方法

このシステムは以下の順序でメール送信を試みます：

1. **sendmail コマンド** (プライマリ)
2. **PHP mail() 関数** (フォールバック)
3. **mb_send_mail() 関数** (日本語対応)

### 2. 日本語対応

- UTF-8エンコーディング完全対応
- 日本語件名の適切なエンコード
- `mb_language("japanese")` 設定

### 3. エラーハンドリング

- 送信失敗時の自動フォールバック
- 詳細なエラーログ記録
- ユーザーフレンドリーなエラーメッセージ

### 4. セキュリティ

- 入力データのサニタイゼーション
- XSS対策
- メールヘッダーインジェクション対策

## 📧 メール機能

### 自動送信されるメール

1. **管理者への通知メール**
   - お問い合わせ内容の詳細
   - 送信者情報
   - 送信日時

2. **ユーザーへの自動返信メール**
   - お問い合わせ受付確認
   - お問い合わせ内容のコピー
   - 返信までの目安時間

## 🐛 トラブルシューティング

### メールが送信されない場合

1. **サーバー設定を確認**
   ```bash
   which sendmail
   # 通常は /usr/sbin/sendmail または /usr/lib/sendmail
   ```

2. **PHPの設定を確認**
   ```php
   <?php
   phpinfo();
   // mail configuration セクションを確認
   ?>
   ```

3. **ログファイルを確認**
   - `logs/email_log_YYYY-MM.txt` をチェック
   - `logs/contact_submissions_YYYY-MM.json` で送信履歴を確認

### 日本語が文字化けする場合

1. ファイルのエンコーディングがUTF-8であることを確認
2. PHPの内部エンコーディング設定を確認：
   ```php
   echo mb_internal_encoding(); // UTF-8 であるべき
   ```

## 🔐 本番環境での推奨事項

1. **専用のSMTPサーバーを使用**
   - SendGrid、Amazon SES、またはMailgunの使用を推奨
   - より高い配信率と信頼性

2. **SPF/DKIM/DMARC設定**
   - DNSレコードに適切な設定を追加
   - メールの信頼性向上

3. **レート制限の実装**
   - スパム防止のため送信回数制限を追加

4. **SSL/TLS証明書**
   - HTTPSでフォームを提供

## 📝 カスタマイズ

### メールテンプレートの変更

`includes/email-sender.php` の以下のメソッドを編集：

- `sendContactNotification()` - 管理者通知メール
- `sendAutoReply()` - 自動返信メール

### 新しいメールタイプの追加

```php
public function sendCustomEmail($data) {
    $subject = "カスタムメールの件名";
    $message = "メール本文をここに記述";
    return $this->send($data['email'], $subject, $message);
}
```

## 🆘 サポート

問題が解決しない場合は、以下の情報を準備してサポートに連絡してください：

1. エラーログ（`logs/` ディレクトリ内）
2. PHPバージョン（`php -v`）
3. サーバー環境（共有ホスティング、VPS、など）
4. 実行したテストの結果

---

**注意**: 本番環境では必ず実際のメールアドレスに更新し、テスト送信を行ってから公開してください。