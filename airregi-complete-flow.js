require('dotenv').config();
const { chromium } = require('playwright');

async function completeAirregiFlow() {
  console.log('🚀 Airレジ完全自動化フロー - メール認証対応版\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    acceptDownloads: true
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Airレジにアクセス
    console.log('📍 Step 1: Airレジへアクセス');
    await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await page.waitForTimeout(5000);
    
    // Step 2: ログイン情報入力
    console.log('📧 Step 2: ログイン情報入力');
    
    // メールアドレス入力
    console.log('  - メールアドレス: info@openmart.jp');
    const emailInput = page.locator('input[placeholder*="AirID"]').first();
    await emailInput.click();
    await emailInput.clear();
    await emailInput.type('info@openmart.jp', { delay: 100 });
    await page.waitForTimeout(1000);
    
    // パスワード入力
    console.log('  - パスワード: ****');
    const passwordInput = page.locator('input[placeholder*="パスワード"]').first();
    await passwordInput.click();
    await passwordInput.clear();
    await passwordInput.type('info@openmartjp2024', { delay: 100 });
    await page.waitForTimeout(1000);
    
    // ログインボタンクリック
    console.log('🎯 Step 3: ログインボタンクリック');
    await page.locator('button:has-text("ログイン")').click();
    await page.waitForTimeout(5000);
    
    // Step 4: メール認証画面の処理
    const pageContent = await page.content();
    if (pageContent.includes('再通知') || pageContent.includes('送信する')) {
      console.log('📨 Step 4: メール認証画面を検出');
      console.log('  「送信する」ボタンをクリック');
      
      try {
        await page.locator('button:has-text("送信する")').click();
        console.log('✅ メール送信完了');
        await page.waitForTimeout(3000);
        
        // ここでメール認証を待つ必要があるかもしれません
        console.log('\n⚠️  メール認証が必要です:');
        console.log('1. info@openmart.jp のメールを確認してください');
        console.log('2. AirIDからの認証メールのリンクをクリックしてください');
        console.log('3. その後、このスクリプトを再実行してください\n');
        
        // デバッグ用にブラウザを開いたままにする
        console.log('ブラウザを開いたままにしています...');
        return;
      } catch (e) {
        console.log('❌ 送信ボタンのクリックに失敗');
      }
    }
    
    // Step 5: ログイン成功後の処理
    const currentUrl = page.url();
    if (!currentUrl.includes('login')) {
      console.log('✅ ログイン成功！売上ページに到達');
      
      // 店舗選択
      try {
        console.log('\n🏪 店舗選択: オープンマート');
        await page.locator('text=オープンマート').click();
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log('  店舗選択をスキップ（既に選択済みの可能性）');
      }
      
      // 日付設定（昨日）
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      console.log(`📅 日付設定: ${dateStr}`);
      
      // 日付入力フィールドを探す
      try {
        const dateInputs = await page.locator('input[type="date"]').all();
        if (dateInputs.length >= 2) {
          await dateInputs[0].fill(dateStr); // 開始日
          await dateInputs[1].fill(dateStr); // 終了日
          console.log('✅ 日付設定完了');
        }
      } catch (e) {
        console.log('❌ 日付設定に失敗');
      }
      
      // 検索/適用ボタンをクリック
      try {
        await page.locator('button:has-text("検索"), button:has-text("適用")').first().click();
        await page.waitForTimeout(5000);
        console.log('✅ 検索実行');
      } catch (e) {
        console.log('❌ 検索ボタンが見つかりません');
      }
      
      // CSVダウンロード
      console.log('\n💾 CSVダウンロードを実行');
      const downloadPromise = page.waitForEvent('download');
      
      try {
        await page.locator('text=/CSV|ダウンロード/i').click();
        const download = await downloadPromise;
        const path = await download.path();
        console.log(`✅ CSVダウンロード完了: ${path}`);
        
        // 成功画面のスクリーンショット
        await page.screenshot({ 
          path: 'airregi-success-final.png',
          fullPage: true 
        });
        
        console.log('\n🎉 完全自動化成功！');
        console.log('次のステップ: OpenMartへのアップロード');
        
      } catch (e) {
        console.log('❌ CSVダウンロードに失敗:', e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await page.screenshot({ 
      path: `error-${Date.now()}.png`,
      fullPage: true 
    });
  } finally {
    console.log('\n処理完了（ブラウザは開いたままです）');
    // await browser.close();
  }
}

// 実行
completeAirregiFlow();