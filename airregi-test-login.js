const { chromium } = require('playwright');

async function testAirregiLogin() {
  console.log('🔍 Airレジログインページを探索中...');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const page = await browser.newPage();

  try {
    // いくつかのURLパターンを試す
    const urls = [
      'https://airregi.jp/',
      'https://airregi.jp/CLP/',
      'https://connect.airregi.jp/',
      'https://connect.airregi.jp/view/login',
      'https://airregi.jp/login',
      'https://airregi.jp/CLP/view/salesList/'
    ];

    for (const url of urls) {
      console.log(`\n📍 試行中: ${url}`);
      try {
        await page.goto(url, { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        console.log(`  → 実際のURL: ${currentUrl}`);
        
        // ログインフォームを探す
        const hasUsername = await page.locator('input[name="username"]').count() > 0;
        const hasEmail = await page.locator('input[type="email"]').count() > 0;
        const hasPassword = await page.locator('input[type="password"]').count() > 0;
        
        console.log(`  → ユーザー名フィールド: ${hasUsername ? '✅' : '❌'}`);
        console.log(`  → メールフィールド: ${hasEmail ? '✅' : '❌'}`);
        console.log(`  → パスワードフィールド: ${hasPassword ? '✅' : '❌'}`);
        
        if ((hasUsername || hasEmail) && hasPassword) {
          console.log('  🎯 ログインページを発見！');
          
          // スクリーンショットを保存
          await page.screenshot({ path: `login-page-${urls.indexOf(url)}.png` });
          console.log(`  📸 スクリーンショット保存: login-page-${urls.indexOf(url)}.png`);
          
          // 実際にログインしてみる
          if (hasUsername) {
            await page.fill('input[name="username"]', 'rsc_yamaguchi@yamatech.co.jp');
          } else if (hasEmail) {
            await page.fill('input[type="email"]', 'rsc_yamaguchi@yamatech.co.jp');
          }
          await page.fill('input[type="password"]', 'openmart1120');
          
          console.log('  ✅ 認証情報を入力しました');
          break;
        }
      } catch (e) {
        console.log(`  ❌ エラー: ${e.message}`);
      }
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }

  console.log('\n⏸️ ブラウザは開いたままです。手動で確認してください。');
  console.log('確認後、Ctrl+Cで終了してください。');
  
  // ブラウザを開いたままにする
  await new Promise(() => {});
}

testAirregiLogin();