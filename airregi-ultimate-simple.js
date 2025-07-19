const { chromium } = require('playwright');

async function ultimateSimple() {
  console.log('🎯 Airレジ究極シンプル版 - 必ず動作する！\n');
  console.log('正しい認証情報:');
  console.log('  ID: info@openmart.jp');
  console.log('  PW: info@openmartjp2024\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    // Airレジにアクセス
    console.log('📍 Airレジにアクセス');
    await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await page.waitForTimeout(5000);
    
    // メールアドレス入力 - 最もシンプルな方法
    console.log('\n📧 メールアドレス入力');
    await page.fill('input:nth-of-type(1)', 'info@openmart.jp');
    console.log('  ✅ 入力完了');
    await page.waitForTimeout(2000);
    
    // パスワード入力
    console.log('\n🔑 パスワード入力');
    await page.fill('input[type="password"]', 'info@openmartjp2024');
    console.log('  ✅ 入力完了');
    await page.waitForTimeout(2000);
    
    // スクリーンショット
    await page.screenshot({ path: 'ultimate-filled.png' });
    console.log('\n📸 入力確認: ultimate-filled.png');
    
    // ログインボタンクリック - CSS セレクター
    console.log('\n🎯 ログインボタンクリック');
    await page.click('button[type="submit"], button.btn-primary, button:has-text("ログイン")');
    console.log('  ✅ クリック完了');
    
    // ログイン処理を待つ
    console.log('\n⏳ ログイン処理中... 15秒待機');
    await page.waitForTimeout(15000);
    
    // 結果確認
    const url = page.url();
    const content = await page.textContent('body');
    
    await page.screenshot({ path: 'ultimate-result.png' });
    console.log('\n📸 結果画面: ultimate-result.png');
    
    if (content.includes('再通知') || content.includes('送信する')) {
      console.log('\n📨 メール認証が必要です');
      console.log('  1. info@openmart.jp のメールを確認');
      console.log('  2. 認証リンクをクリック');
    } else if (content.includes('売上') || content.includes('店舗')) {
      console.log('\n✅ ログイン成功！');
      console.log('🎉 Airレジ自動化完了！');
    } else {
      console.log('\n❓ 現在のURL:', url);
    }
    
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
  }
  
  console.log('\n🏁 完了（ブラウザは開いたままです）');
}

// 実行
ultimateSimple();