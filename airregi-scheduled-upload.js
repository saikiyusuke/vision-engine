const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// 設定
const CONFIG = {
  airregi: {
    username: 'info@openmart.jp',
    password: 'info@openmartjp2024'
  },
  openmart: {
    // OpenMartのログイン情報が必要な場合はここに追加
    username: '',
    password: ''
  },
  email: {
    to: 'tuwari69@gmail.com',
    from: 'noreply@openmart.jp', // SendGridで認証されたメールアドレスに変更が必要な場合があります
    subject: 'Airレジ売上データ - '
  }
};

// メイン処理
async function scheduledUpload() {
  const startTime = new Date();
  console.log(`\n🚀 定期実行開始: ${startTime.toLocaleString('ja-JP')}\n`);
  
  const browser = await chromium.launch({
    headless: true, // 定期実行時はヘッドレスモード
    slowMo: 500
  });
  
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  let downloadPath = null;
  let uploadSuccess = false;
  
  try {
    // === フェーズ1: Airレジログイン ===
    console.log('📍 フェーズ1: Airレジログイン');
    await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await page.waitForTimeout(5000);
    
    const needsLogin = await page.locator('input[name="username"]').isVisible();
    
    if (needsLogin) {
      await page.fill('input[name="username"]', CONFIG.airregi.username);
      await page.fill('input[name="password"]', CONFIG.airregi.password);
      await page.click('input[type="submit"]');
      await page.waitForTimeout(8000);
      console.log('  ✅ ログイン成功');
    }
    
    // === フェーズ2: 店舗選択 ===
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('利用する店舗を選択')) {
      console.log('📍 フェーズ2: 店舗選択');
      await page.click('text=オープンマート');
      await page.waitForTimeout(5000);
      console.log('  ✅ オープンマート選択完了');
    }
    
    // === フェーズ3: 売上データ取得 ===
    console.log('📍 フェーズ3: 売上データ取得');
    
    // 昨日の日付を設定
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    const formattedDate = dateStr.replace(/-/g, '');
    
    console.log(`  📅 対象日付: ${dateStr}`);
    
    // 日付設定
    try {
      const startDateInput = await page.locator('input[type="date"]').first();
      if (await startDateInput.isVisible()) {
        await startDateInput.fill(dateStr);
      }
      
      const endDateInput = await page.locator('input[type="date"]').last();
      if (await endDateInput.isVisible()) {
        await endDateInput.fill(dateStr);
      }
      
      await page.waitForTimeout(2000);
      
      const searchButton = await page.locator('button:has-text("検索"), button:has-text("適用"), button:has-text("表示")').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(5000);
        console.log('  ✅ 検索実行完了');
      }
    } catch (e) {
      console.log('  ⚠️  日付設定をスキップ');
    }
    
    // === フェーズ4: CSVダウンロード ===
    console.log('📍 フェーズ4: CSVダウンロード');
    
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    
    try {
      const downloadPatterns = [
        'text=/CSV.*ダウンロード/i',
        'text=/ダウンロード/i',
        'text=/CSV/i'
      ];
      
      for (const pattern of downloadPatterns) {
        try {
          const element = page.locator(pattern).first();
          if (await element.isVisible()) {
            await element.click();
            console.log(`  ✅ ダウンロードリンクをクリック`);
            break;
          }
        } catch (e) {
          // 次のパターンを試す
        }
      }
      
      const download = await downloadPromise;
      const tempPath = await download.path();
      
      // デスクトップに保存
      const desktopPath = path.join(require('os').homedir(), 'Desktop', `バリエーション別売上_${formattedDate}-${formattedDate}.csv`);
      await download.saveAs(desktopPath);
      downloadPath = desktopPath;
      
      console.log(`  ✅ CSV保存完了: ${downloadPath}`);
      
    } catch (e) {
      console.log('  ❌ CSVダウンロードエラー:', e.message);
    }
    
    // === フェーズ5: OpenMartアップロード ===
    if (downloadPath) {
      console.log('📍 フェーズ5: OpenMartアップロード');
      
      const uploadPage = await context.newPage();
      
      try {
        await uploadPage.goto('https://partner.openmart.jp/saleslist_bymenu');
        await uploadPage.waitForTimeout(5000);
        
        // アップロード処理
        // TODO: 実際のOpenMartのUIに応じて実装を調整
        const fileInput = await uploadPage.locator('input[type="file"]').first();
        if (await fileInput.isVisible()) {
          await fileInput.setInputFiles(downloadPath);
          console.log('  ✅ ファイル選択完了');
          
          // アップロードボタンを探してクリック
          const uploadButton = await uploadPage.locator('button[type="submit"], input[type="submit"], button:has-text("アップロード")').first();
          if (await uploadButton.isVisible()) {
            await uploadButton.click();
            await uploadPage.waitForTimeout(5000);
            uploadSuccess = true;
            console.log('  ✅ アップロード完了');
          }
        } else {
          console.log('  ⚠️  ファイル入力欄が見つかりません');
        }
        
      } catch (e) {
        console.log('  ❌ アップロードエラー:', e.message);
      } finally {
        await uploadPage.close();
      }
    }
    
    // === フェーズ6: メール送信 ===
    if (downloadPath) {
      console.log('📍 フェーズ6: メール送信');
      await sendEmail(downloadPath, uploadSuccess);
    }
    
  } catch (error) {
    console.error('❌ エラー発生:', error.message);
  } finally {
    await browser.close();
    
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    console.log(`\n🏁 定期実行完了: ${endTime.toLocaleString('ja-JP')}`);
    console.log(`⏱️  実行時間: ${duration}秒\n`);
  }
}

// メール送信関数（PHPスクリプトを使用）
async function sendEmail(csvPath, uploadSuccess) {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // PHPスクリプトのパス
    const phpScriptPath = path.join(__dirname, 'send-email.php');
    
    // PHPコマンド実行
    const uploadFlag = uploadSuccess ? '1' : '0';
    const command = `php "${phpScriptPath}" "${csvPath}" ${uploadFlag}`;
    
    console.log('  📧 PHPメール送信スクリプトを実行中...');
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.log(`  ⚠️  PHP警告: ${stderr}`);
    }
    
    if (stdout.includes('メール送信成功')) {
      console.log(`  ✅ メール送信完了: ${CONFIG.email.to}`);
    } else {
      console.log(`  ❌ メール送信失敗: ${stdout}`);
    }
    
  } catch (error) {
    console.log(`  ❌ メール送信エラー: ${error.message}`);
    
    // フォールバック: nodemailerを使用（PHPが失敗した場合）
    try {
      console.log('  🔄 フォールバック: nodemailerでメール送信を試行');
      
      // メール設定を読み込む
      const emailConfig = require('./email-config');
      const transporter = nodemailer.createTransport(emailConfig.sendgrid);
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('ja-JP');
      
      const mailOptions = {
        from: CONFIG.email.from,
        to: CONFIG.email.to,
        subject: CONFIG.email.subject + dateStr,
        text: `Airレジ売上データを取得しました。\n\nファイル: ${path.basename(csvPath)}\nアップロード: ${uploadSuccess ? '成功' : '失敗'}\n\n※PHPメール送信に失敗したため、nodemailerで送信しています。`,
        attachments: [
          {
            filename: path.basename(csvPath),
            path: csvPath
          }
        ]
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`  ✅ フォールバックメール送信完了`);
      
    } catch (fallbackError) {
      console.log(`  ❌ フォールバックも失敗: ${fallbackError.message}`);
    }
  }
}

// 実行時間チェック（10:00-24:00のみ実行）
function shouldRun() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 10 && hour <= 23;
}

// メイン実行
if (require.main === module) {
  if (shouldRun()) {
    scheduledUpload().catch(console.error);
  } else {
    console.log('⏰ 実行時間外です（実行時間: 10:00-24:00）');
  }
}

module.exports = { scheduledUpload };

// メール設定の確認
if (require.main === module) {
  console.log('\n📧 メール設定の確認');
  console.log('================');
  console.log('送信先: ' + CONFIG.email.to);
  console.log('送信元: ' + CONFIG.email.from);
  console.log('\n⚠️  重要: SendGrid APIキーを設定してください');
  console.log('1. email-config.js でAPIキーを設定');
  console.log('2. または環境変数 SENDGRID_API_KEY を設定');
  console.log('\n詳細は email-config.js を参照してください\n');
}