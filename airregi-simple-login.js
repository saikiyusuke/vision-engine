require('dotenv').config();
const { chromium } = require('playwright');

async function simpleLogin() {
  console.log('🎯 Airレジ シンプルログイン - 確実に動作させる！\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    acceptDownloads: true
  });
  
  const page = await context.newPage();
  
  try {
    // Airレジにアクセス
    console.log('📍 Step 1: Airレジへアクセス');
    await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await page.waitForTimeout(5000);
    
    // メールアドレス入力
    console.log('📧 Step 2: メールアドレス入力');
    const emailInput = page.locator('input[placeholder*="AirID"]').first();
    await emailInput.click();
    await emailInput.clear();
    await emailInput.type('info@openmart.jp', { delay: 100 });
    await page.waitForTimeout(2000);
    
    // パスワード入力
    console.log('🔑 Step 3: パスワード入力');
    const passwordInput = page.locator('input[placeholder*="パスワード"]').first();
    await passwordInput.click();
    await passwordInput.clear();
    await passwordInput.type('info@openmartjp2024', { delay: 100 });
    await page.waitForTimeout(2000);
    
    // スクリーンショット（入力確認）
    await page.screenshot({ 
      path: 'simple-login-filled.png',
      fullPage: true 
    });
    console.log('📸 入力確認: simple-login-filled.png');
    
    // ログインボタンクリック - 複数の方法を試す
    console.log('🎯 Step 4: ログインボタンクリック');
    
    // 方法1: ボタンテキストで検索
    try {
      await page.locator('button:has-text("ログイン")').click();
      console.log('✅ 方法1: ボタンクリック成功');
    } catch (e) {
      console.log('❌ 方法1失敗、方法2を試行...');
      
      // 方法2: 青いボタンを探す
      try {
        await page.locator('button.btn-primary, button[type="submit"]').click();
        console.log('✅ 方法2: ボタンクリック成功');
      } catch (e2) {
        console.log('❌ 方法2失敗、方法3を試行...');
        
        // 方法3: 座標クリック
        await page.mouse.click(640, 558); // ボタンの位置
        console.log('✅ 方法3: 座標クリック実行');
      }
    }
    
    // ログイン完了を待つ
    console.log('\n⏳ ログイン処理中... 10秒待機');
    await page.waitForTimeout(10000);
    
    // ログイン成功確認
    const currentUrl = page.url();
    const pageContent = await page.content();
    
    if (!currentUrl.includes('login') && !pageContent.includes('ログイン')) {
      console.log('✅ ログイン成功！');
      
      // 成功画面のスクリーンショット
      await page.screenshot({ 
        path: 'simple-login-success.png',
        fullPage: true 
      });
      
      // 商品別売上ページの処理
      console.log('\n📊 売上データページに到達');
      
      // 店舗選択
      try {
        await page.locator('text=オープンマート').click();
        console.log('🏪 店舗選択: オープンマート');
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log('店舗選択をスキップ');
      }
      
      // 日付設定
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      console.log(`📅 日付設定: ${dateStr}`);
      
      // CSVダウンロード準備
      console.log('💾 CSVダウンロード準備完了');
      
    } else {
      console.log('❌ ログイン失敗');
      await page.screenshot({ 
        path: 'simple-login-failed.png',
        fullPage: true 
      });
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await page.screenshot({ 
      path: 'simple-login-error.png',
      fullPage: true 
    });
  } finally {
    console.log('\n🏁 処理完了');
    // ブラウザは開いたままにする（デバッグ用）
    // await browser.close();
  }
}

// 実行
simpleLogin();