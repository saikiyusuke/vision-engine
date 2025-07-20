#!/usr/bin/env node
/**
 * Gmail経由でメール送信
 * 要: Googleアプリパスワード
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendEmailViaGmail(subject, message, attachmentPath = null) {
  // Gmail設定（.envファイルから読み込み）
  const gmailUser = process.env.GMAIL_USER || 'your-email@gmail.com';
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || 'your-app-password';
  
  if (!gmailUser || !gmailAppPassword || gmailAppPassword === 'your-app-password') {
    console.log('⚠️  Gmail設定が見つかりません');
    console.log('📝 .envファイルに以下を追加してください:');
    console.log('GMAIL_USER=あなたのGmailアドレス');
    console.log('GMAIL_APP_PASSWORD=Googleアプリパスワード');
    console.log('\nアプリパスワードの取得方法:');
    console.log('1. Googleアカウントの2段階認証を有効化');
    console.log('2. https://myaccount.google.com/apppasswords にアクセス');
    console.log('3. アプリパスワードを生成');
    return false;
  }

  // トランスポーター作成
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    }
  });

  // メールオプション
  const mailOptions = {
    from: gmailUser,
    to: process.env.EMAIL_TO || 'tuwari69@gmail.com',
    subject: subject,
    text: message,
    attachments: attachmentPath ? [{
      filename: require('path').basename(attachmentPath),
      path: attachmentPath
    }] : []
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ メール送信成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ メール送信エラー:', error.message);
    return false;
  }
}

// コマンドライン実行
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('使用方法: node send-email-gmail.js "件名" "本文" [添付ファイルパス]');
    process.exit(1);
  }
  
  const subject = args[0];
  const message = args[1];
  const attachment = args[2] || null;
  
  sendEmailViaGmail(subject, message, attachment)
    .then(result => {
      process.exit(result ? 0 : 1);
    });
}

module.exports = { sendEmailViaGmail };