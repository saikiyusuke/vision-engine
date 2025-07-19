#!/usr/bin/env node
/**
 * Airレジ自動化スクリプト（Playwright直接版）
 * AutoClaude Visionが失敗する場合の代替版
 */

require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 設定
const CONFIG = {
  airregi: {
    username: process.env.AIRREGI_USERNAME || 'info@openmart.jp',
    password: process.env.AIRREGI_PASSWORD || 'info@openmartjp2024'
  },
  email: {
    to: process.env.EMAIL_TO || 'tuwari69@gmail.com'
  }
};

// ログ関数
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleString('ja-JP');
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📍';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// メイン処理
async function main() {
  log('Airレジ自動化処理を開始します（Playwright直接版）');

  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  let browser;
  let downloadPath = null;

  try {
    // ブラウザを起動
    browser = await chromium.launch({
      headless: isCI,
      slowMo: 500
    });

    const context = await browser.newContext({
      locale: 'ja-JP',
      timezoneId: 'Asia/Tokyo'
    });

    const page = await context.newPage();

    // === フェーズ1: Airレジログイン ===
    log('フェーズ1: Airレジログイン');
    
    // ログインページへアクセス
    await page.goto('https://airregi.jp/');
    await page.waitForLoadState('networkidle');

    // スクリーンショット（デバッグ用）
    if (isCI) {
      await page.screenshot({ path: 'debug-login-page.png' });
    }

    // ログインフォームを探す
    try {
      // メールアドレス入力
      const emailInput = await page.waitForSelector('input[type="email"], input[name*="mail"], input[placeholder*="メール"], input[placeholder*="ID"]', { timeout: 5000 });
      await emailInput.fill(CONFIG.airregi.username);
      log('メールアドレスを入力しました');

      // パスワード入力
      const passwordInput = await page.waitForSelector('input[type="password"]', { timeout: 5000 });
      await passwordInput.fill(CONFIG.airregi.password);
      log('パスワードを入力しました');

      // ログインボタンをクリック
      const loginButton = await page.waitForSelector('button[type="submit"], input[type="submit"], button:has-text("ログイン")', { timeout: 5000 });
      await loginButton.click();
      log('ログインボタンをクリックしました');

      // ログイン完了を待つ
      await page.waitForNavigation({ waitUntil: 'networkidle' });
      log('ログイン完了', 'success');

    } catch (e) {
      log('ログインフォームが見つからないか、既にログイン済みです');
    }

    // === フェーズ2: 売上データページへ移動 ===
    log('フェーズ2: 売上データページへ移動');

    // 商品別売上ページへ直接移動
    await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await page.waitForLoadState('networkidle');

    // === フェーズ3: CSVダウンロード ===
    log('フェーズ3: CSVダウンロード');

    // ダウンロードディレクトリ設定
    const downloadDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // ダウンロードハンドラー設定
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // CSVダウンロードボタンを探してクリック
    try {
      // よくあるCSVダウンロードボタンのセレクタ
      const csvButton = await page.waitForSelector('a[href*="csv"], button:has-text("CSV"), a:has-text("ダウンロード"), button:has-text("ダウンロード")', { timeout: 5000 });
      await csvButton.click();
      log('CSVダウンロードボタンをクリックしました');
    } catch (e) {
      log('CSVダウンロードボタンが見つかりません', 'error');
      
      // エラー時のスクリーンショット
      if (isCI) {
        await page.screenshot({ path: 'error-no-csv-button.png' });
      }
      
      throw new Error('CSVダウンロードボタンが見つかりません');
    }

    // ダウンロード完了を待つ
    const download = await downloadPromise;
    const fileName = `airregi_sales_${new Date().toISOString().split('T')[0]}.csv`;
    downloadPath = path.join(downloadDir, fileName);
    
    await download.saveAs(downloadPath);
    log(`CSVファイルをダウンロードしました: ${fileName}`, 'success');

    // === フェーズ4: メール送信 ===
    log('フェーズ4: メール送信処理');

    const phpScript = path.join(__dirname, 'send-email.php');
    const command = `php ${phpScript} "${downloadPath}" "${CONFIG.email.to}"`;
    
    try {
      const { stdout, stderr } = await execPromise(command);
      
      if (stderr) {
        log(`PHPエラー: ${stderr}`, 'error');
      }
      
      if (stdout.includes('メール送信完了') || stdout.includes('成功')) {
        log('メール送信成功', 'success');
      } else {
        log(`メール送信結果: ${stdout}`);
      }
    } catch (error) {
      log(`メール送信エラー: ${error.message}`, 'error');
      
      // CI環境では警告のみ
      if (!isCI) {
        throw error;
      }
    }

    log('Airレジ自動化処理が完了しました', 'success');

  } catch (error) {
    log(`エラーが発生しました: ${error.message}`, 'error');
    
    // エラー時のスクリーンショット
    if (browser) {
      const pages = browser.contexts()[0]?.pages();
      if (pages && pages.length > 0) {
        await pages[0].screenshot({ path: 'error-state.png' });
      }
    }
    
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 実行
main().catch(console.error);