#!/usr/bin/env node
/**
 * 手動で記録した操作を再実行するスクリプト
 * あなたの操作を完全に再現します
 */

require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// 設定
const CONFIG = {
  airregi: {
    username: process.env.AIRREGI_USERNAME || 'info@openmart.jp',
    password: process.env.AIRREGI_PASSWORD || 'info@openmartjp2024'
  }
};

async function playbackRecordedActions() {
  console.log('🚀 記録された操作を再実行開始...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo'
  });

  const page = await context.newPage();

  try {
    // 1. Airレジトップページへアクセス
    console.log('📍 Airレジを開いています...');
    await page.goto('https://airregi.jp/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 2. ログインボタンをクリック
    console.log('🖱️  ログインボタンをクリック');
    await page.click('text=ログイン');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 3. メールアドレス入力
    console.log('⌨️  メールアドレスを入力');
    await page.fill('input#account', CONFIG.airregi.username);
    await page.waitForTimeout(500);

    // 4. パスワード入力
    console.log('⌨️  パスワードを入力');
    await page.fill('input#password', CONFIG.airregi.password);
    await page.waitForTimeout(500);

    // 5. ログインボタンクリック
    console.log('🖱️  ログイン実行');
    // 実際のログインボタンセレクタ
    try {
      await page.click('input[type="submit"]');
    } catch (e) {
      // 別のセレクタを試す
      await page.click('button[type="submit"]');
    }
    
    // ログイン後のページ遷移を待つ
    await page.waitForURL('**/choose-store**', { timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('✅ ログイン成功、店舗選択画面に到達');

    // 6. 店舗選択（オープンマート）
    console.log('🏪 店舗を選択: オープンマート');
    await page.click('text=オープンマート');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 7. 商品別売上をクリック
    console.log('📊 商品別売上ページへ移動');
    await page.click('text=商品別売上');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 8. ソート条件を設定（オプション）
    console.log('🔄 ソート条件を設定');
    try {
      // セレクトボックスをクリック
      await page.click('select[name="searchOrderBy"]');
      await page.waitForTimeout(500);
      
      // オプションを選択
      await page.selectOption('select[name="searchOrderBy"]', '1');
      await page.waitForTimeout(500);
      
      // 表示するボタンをクリック
      await page.click('text=表示する');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('⚠️  ソート設定をスキップ');
    }

    // 9. CSVダウンロード
    console.log('💾 CSVダウンロードを実行');
    
    // ダウンロードディレクトリ設定
    const downloadDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // ダウンロードハンドラー設定
    const downloadPromise = page.waitForEvent('download');
    
    // CSVダウンロードボタンをクリック
    try {
      // より具体的なテキストを試す
      await page.click('text=CSV');
    } catch (e) {
      // リンクテキストを含む要素を探す
      await page.click('a:has-text("ダウンロード")');
    }
    
    // ダウンロード完了を待つ
    const download = await downloadPromise;
    const fileName = `airregi_sales_${new Date().toISOString().split('T')[0]}.csv`;
    const downloadPath = path.join(downloadDir, fileName);
    
    await download.saveAs(downloadPath);
    console.log(`✅ CSVファイルをダウンロードしました: ${fileName}`);

    // 10. メール送信（オプション）
    if (process.env.SEND_EMAIL === 'true') {
      console.log('📧 メール送信処理を実行...');
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);

      const phpScript = path.join(__dirname, 'send-email.php');
      const emailTo = process.env.EMAIL_TO || 'tuwari69@gmail.com';
      const command = `php ${phpScript} "${downloadPath}" "${emailTo}"`;
      
      try {
        await execPromise(command);
        console.log('✅ メール送信完了');
      } catch (error) {
        console.log('⚠️  メール送信はスキップされました');
      }
    }

    console.log('\n✅ すべての操作が完了しました！');

  } catch (error) {
    console.error('❌ エラー:', error.message);
    
    // エラー時のスクリーンショット
    await page.screenshot({ path: 'playback-error.png' });
    console.log('📸 エラー時のスクリーンショットを保存しました');
    
    throw error;
  } finally {
    // ブラウザを閉じる（5秒後）
    console.log('\n🔚 5秒後にブラウザを閉じます...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// 実行
console.log('🎯 Airレジ自動操作 - 手動記録版');
console.log('================================\n');

playbackRecordedActions().catch(error => {
  console.error('\n❌ 実行エラー:', error);
  process.exit(1);
});