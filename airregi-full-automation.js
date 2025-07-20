#!/usr/bin/env node
/**
 * Airレジ完全自動化 - CSVダウンロード → FTPアップロード → メール送信
 */

require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { uploadWithCurl } = require('./ftp-upload-curl');
const { logUploadResult } = require('./log-upload-result');
const { sendEmailViaGmail } = require('./send-email-gmail');

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

async function runFullAutomation() {
  console.log('🚀 Airレジ完全自動化を開始します...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo'
  });

  const page = await context.newPage();
  let downloadedFile = null;

  try {
    // === フェーズ1: CSVダウンロード ===
    console.log('📍 フェーズ1: Airレジからデータ取得');
    
    // 1. Airレジトップページへアクセス
    await page.goto('https://airregi.jp/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 2. ログインボタンをクリック
    await page.click('text=ログイン');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 3. ログイン情報入力
    await page.fill('input#account', CONFIG.airregi.username);
    await page.fill('input#password', CONFIG.airregi.password);
    
    // 4. ログイン実行
    await page.click('input[type="submit"]');
    await page.waitForURL('**/choose-store**', { timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('✅ ログイン成功');

    // 5. 店舗選択（オープンマート）
    await page.click('text=オープンマート');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 6. 商品別売上をクリック
    await page.click('text=商品別売上');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 6.5 バリエーション単位で表示をクリック
    console.log('📊 バリエーション単位で表示を選択');
    await page.click('text=バリエーション単位で表示');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 7. CSVダウンロード
    // デスクトップに保存
    const desktopPath = path.join(require('os').homedir(), 'Desktop');
    
    // 今日の日付を取得
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD形式
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=CSV');
    
    const download = await downloadPromise;
    const fileName = `バリエーション別売上_${dateStr}-${dateStr}.csv`;
    downloadedFile = path.join(desktopPath, fileName);
    
    await download.saveAs(downloadedFile);
    console.log(`✅ CSVダウンロード完了: ${fileName}`);
    console.log(`📁 保存先: ${downloadedFile}\n`);

    // === フェーズ2: FTPアップロード ===
    console.log('📍 フェーズ2: FTPアップロード (cURL使用)');
    console.log('アップロード先: /partner.openmart.jp/saleslist_bymenu/');
    
    const uploadResult = await uploadWithCurl(downloadedFile);
    
    if (uploadResult.success) {
      console.log('✅ FTPアップロード成功\n');
    } else {
      throw new Error(`FTPアップロード失敗: ${uploadResult.error}`);
    }

    // === フェーズ3: サーバーにCSVアップロード ===
    console.log('📍 フェーズ3: サーバーに売上データ送信');
    
    // ログファイルに記録
    logUploadResult(fileName, uploadResult.remotePath, true);
    
    // サーバーにCSVファイルをアップロード
    console.log('📤 サーバーにCSVファイルをアップロード中...');
    const FormData = require('form-data');
    const axios = require('axios');
    
    try {
      const form = new FormData();
      form.append('csv', fs.createReadStream(downloadedFile));
      form.append('token', 'airregi-csv-upload-2024');
      
      const response = await axios.post(
        'https://akichikikaku.com/vision-engine/upload-csv.php',
        form,
        {
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      if (response.data.status === 'success') {
        console.log('✅ サーバーアップロード成功');
        console.log(`📊 売上合計: ¥${response.data.sales_total?.toLocaleString() || 0}`);
        
        // サーバー側で処理とメール送信を実行
        const processResponse = await axios.get(
          'https://akichikikaku.com/vision-engine/run-automation.php',
          {
            params: {
              token: 'airregi-auto-2024-secure-token',
              use_latest: 'true'
            }
          }
        );
        
        console.log('📧 メール送信結果:', processResponse.data.message);
      } else {
        throw new Error(response.data.message || 'サーバーエラー');
      }
    } catch (error) {
      console.log('⚠️  サーバー連携エラー:', error.message);
      
      // フォールバック: ローカルで通知
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      if (process.platform === 'darwin') {
        const notifyCommand = `osascript -e 'display notification "エラー: ${error.message}" with title "Airレジアップロード" sound name "Basso"'`;
        await execPromise(notifyCommand).catch(() => {});
      }
    }
    
    // 代替: ローカル通知（Mac限定）
    if (process.platform === 'darwin') {
      const notifyCommand = `osascript -e 'display notification "ファイル: ${fileName}" with title "Airレジアップロード完了" sound name "Glass"'`;
      try {
        await execPromise(notifyCommand);
        console.log('✅ デスクトップ通知を送信しました');
      } catch (e) {
        // 通知エラーは無視
      }
    }

    // === 完了報告 ===
    console.log('\n🎉 すべての処理が完了しました！');
    console.log('=====================================');
    console.log(`📊 ダウンロード: ${fileName}`);
    console.log(`📤 FTPアップロード: /partner.openmart.jp/saleslist_bymenu/${uploadResult.fileName}`);
    console.log(`📧 メール送信先: ${CONFIG.email.to}`);
    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ エラー:', error.message);
    
    // エラー時のスクリーンショット
    await page.screenshot({ path: 'automation-error.png' });
    console.log('📸 エラー時のスクリーンショットを保存しました');
    
    throw error;
  } finally {
    // ブラウザを閉じる（5秒後）
    console.log('🔚 5秒後にブラウザを閉じます...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// 実行
console.log('🎯 Airレジ完全自動化システム');
console.log('================================');
console.log('1. CSVダウンロード');
console.log('2. FTPアップロード (/partner.openmart.jp/saleslist_bymenu/)');
console.log('3. メール送信\n');

runFullAutomation().catch(error => {
  console.error('\n❌ 実行エラー:', error);
  process.exit(1);
});