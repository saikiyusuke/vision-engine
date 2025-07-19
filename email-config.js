// メール設定ファイル
// 実際の設定値に変更してください

module.exports = {
  // SendGrid を使用（推奨）
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY || 'SG.YOUR_API_KEY_HERE' // 環境変数または直接設定
    }
  },
  
  // 一般的な日本のメールサービス
  japanese_smtp: {
    // さくらインターネット
    sakura: {
      host: 'YOUR_DOMAIN.sakura.ne.jp',
      port: 587,
      secure: false,
      auth: {
        user: 'your-email@YOUR_DOMAIN',
        pass: 'your-password'
      }
    },
    
    // GMOクラウド（お名前.com）
    gmo: {
      host: 'smtp.onamae.ne.jp',
      port: 587,
      secure: false,
      auth: {
        user: 'your-email@your-domain.jp',
        pass: 'your-password'
      }
    }
  },
  
  // OpenMart独自のSMTPサーバー（ある場合）
  openmart: {
    host: 'mail.openmart.jp',
    port: 587,
    secure: false,
    auth: {
      user: 'noreply@openmart.jp',
      pass: 'your-password'
    }
  }
};

/* 
設定方法:

推奨: SendGrid の設定手順
============================
1. SendGridアカウントを作成（無料プランあり）
   https://sendgrid.com/
   
2. APIキーを生成
   - Settings > API Keys
   - 「Create API Key」をクリック
   - Full Access を選択
   - 生成されたキーをコピー
   
3. 環境変数またはこのファイルに設定
   - 環境変数: export SENDGRID_API_KEY="SG.xxxxx"
   - または上記の 'SG.YOUR_API_KEY_HERE' を置き換え

4. airregi-scheduled-upload.js を更新（次の手順で実行）


その他のオプション
==================
- 日本のSMTPサービス（さくら、GMO等）も利用可能
- OpenMart独自のメールサーバーがある場合は openmart 設定を使用
*/