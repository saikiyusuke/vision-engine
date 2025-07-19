# SendGrid メール設定ガイド

## 🚀 クイックスタート（5分で完了）

### 1. SendGridアカウント作成
1. https://sendgrid.com/ にアクセス
2. 「Start For Free」をクリック
3. 必要情報を入力してアカウント作成
   - 無料プランで月間100通まで送信可能

### 2. APIキーの生成
1. ログイン後、左メニューから「Settings」→「API Keys」
2. 「Create API Key」ボタンをクリック
3. API Key Nameに「AirRegi-Automation」など分かりやすい名前を入力
4. 「Full Access」を選択
5. 「Create & View」をクリック
6. **表示されるAPIキーをコピー（この画面でしか表示されません！）**

### 3. email-config.js の設定
```javascript
// コピーしたAPIキーを設定
sendgrid: {
  host: 'smtp.sendgrid.net',
  port: 587,  
  auth: {
    user: 'apikey',
    pass: 'SG.xxxxxxxxxxxxxx' // ← ここにコピーしたAPIキーを貼り付け
  }
}
```

### 4. 送信元メールアドレスの認証（重要）
SendGridでは送信元アドレスの認証が必要です：

1. SendGridダッシュボードで「Settings」→「Sender Authentication」
2. 「Single Sender Verification」を選択（簡単な方法）
3. 送信元情報を入力：
   - From Email: noreply@openmart.jp（または実際に使用するアドレス）
   - From Name: OpenMart自動送信
4. 確認メールが届くので、リンクをクリックして認証完了

## 📧 テスト実行

```bash
# テストスクリプトを実行
node test-scheduled-upload.js
```

## 🔧 トラブルシューティング

### エラー: "The from address does not match a verified Sender Identity"
→ 送信元アドレスの認証が必要です。上記の手順4を実行してください。

### エラー: "Invalid API Key"
→ APIキーが正しくコピーされているか確認してください。

### メールが届かない
→ 迷惑メールフォルダを確認してください。

## 🌟 代替オプション

SendGrid以外のオプション：

### 1. さくらのメールサーバー（日本のサービス）
```javascript
// email-config.js で japanese_smtp.sakura を使用
const transporter = nodemailer.createTransport(emailConfig.japanese_smtp.sakura);
```

### 2. GMOのメールサーバー
```javascript
// email-config.js で japanese_smtp.gmo を使用
const transporter = nodemailer.createTransport(emailConfig.japanese_smtp.gmo);
```

## 📝 注意事項

- SendGridの無料プランは月100通まで
- 大量送信が必要な場合は有料プランへのアップグレードを検討
- APIキーは秘密情報なので、Gitにコミットしないよう注意