require('dotenv').config();
const { chromium } = require('playwright');

async function finalWorkingVersion() {
  console.log('🎯 Airレジ最終動作版 - 確実に動くシンプル版\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000  // ゆっくり動作
  });
  
  const page = await browser.newPage();
  
  try {
    // Airレジにアクセス
    console.log('📍 Airレジにアクセス');
    await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    console.log('⏳ ページ読み込み待機... 5秒');
    await page.waitForTimeout(5000);
    
    // スクリーンショット保存
    await page.screenshot({ path: '01-initial.png' });
    console.log('📸 初期画面: 01-initial.png');
    
    // メールアドレス入力 - より確実な方法
    console.log('\n📧 メールアドレス入力');
    try {
      // すべての入力フィールドを取得
      const inputs = await page.locator('input').all();
      console.log(`  検出された入力フィールド数: ${inputs.length}`);
      
      // 最初の入力フィールド（メールアドレス）
      if (inputs.length > 0) {
        await inputs[0].click();
        await inputs[0].fill('info@openmart.jp');
        console.log('  ✅ メールアドレス入力完了');
      }
    } catch (e) {
      console.log('  ❌ メールアドレス入力失敗');
    }
    
    await page.waitForTimeout(2000);
    
    // パスワード入力
    console.log('\n🔑 パスワード入力');
    try {
      // パスワードフィールドを探す
      const passwordField = await page.locator('input[type="password"]').first();
      await passwordField.click();
      await passwordField.fill('info@openmartjp2024');
      console.log('  ✅ パスワード入力完了');
    } catch (e) {
      console.log('  ❌ パスワード入力失敗');
    }
    
    await page.waitForTimeout(2000);
    
    // 入力後のスクリーンショット
    await page.screenshot({ path: '02-filled.png' });
    console.log('📸 入力完了: 02-filled.png');
    
    // ログインボタンを探してクリック - 複数の方法
    console.log('\n🎯 ログインボタンクリック試行');
    
    let loginClicked = false;
    
    // 方法1: テキストで検索
    try {
      console.log('  方法1: テキスト「ログイン」で検索');
      await page.getByText('ログイン', { exact: true }).click();
      loginClicked = true;
      console.log('  ✅ クリック成功！');
    } catch (e) {
      console.log('  × 失敗');
    }
    
    // 方法2: ボタンタグで検索
    if (!loginClicked) {
      try {
        console.log('  方法2: buttonタグで検索');
        const buttons = await page.locator('button').all();
        console.log(`  検出されたボタン数: ${buttons.length}`);
        for (const button of buttons) {
          const text = await button.textContent();
          console.log(`    ボタンテキスト: "${text}"`);
          if (text && text.includes('ログイン')) {
            await button.click();
            loginClicked = true;
            console.log('  ✅ ログインボタンクリック成功！');
            break;
          }
        }
      } catch (e) {
        console.log('  × 失敗');
      }
    }
    
    // 方法3: 座標クリック
    if (!loginClicked) {
      try {
        console.log('  方法3: 座標クリック (640, 505)');
        await page.mouse.click(640, 505);
        console.log('  ✅ 座標クリック実行');
      } catch (e) {
        console.log('  × 失敗');
      }
    }
    
    // 方法4: Enterキー
    if (!loginClicked) {
      try {
        console.log('  方法4: Enterキー送信');
        await page.keyboard.press('Enter');
        console.log('  ✅ Enter送信');
      } catch (e) {
        console.log('  × 失敗');
      }
    }
    
    // ログイン処理を待つ
    console.log('\n⏳ ログイン処理待機... 10秒');
    await page.waitForTimeout(10000);
    
    // ログイン後のスクリーンショット
    await page.screenshot({ path: '03-after-login.png' });
    console.log('📸 ログイン後: 03-after-login.png');
    
    // 現在のURLとページ内容を確認
    const currentUrl = page.url();
    const pageTitle = await page.title();
    const pageText = await page.locator('body').textContent();
    
    console.log(`\n📍 現在のURL: ${currentUrl}`);
    console.log(`📄 ページタイトル: ${pageTitle}`);
    
    // ログイン成功判定
    if (pageText.includes('再通知') || pageText.includes('送信する')) {
      console.log('\n📨 メール認証画面を検出');
      console.log('⚠️  メール認証が必要です');
      console.log('  1. info@openmart.jp のメールを確認');
      console.log('  2. 認証リンクをクリック');
      console.log('  3. その後再実行してください');
    } else if (pageText.includes('売上') || pageText.includes('店舗') || !currentUrl.includes('login')) {
      console.log('\n✅ ログイン成功！売上ページに到達');
      console.log('🎉 Airレジ自動化完了！');
    } else {
      console.log('\n❓ 状態不明');
      console.log('スクリーンショットを確認してください');
    }
    
  } catch (error) {
    console.error('\n❌ エラー発生:', error.message);
    await page.screenshot({ path: `error-${Date.now()}.png` });
  } finally {
    console.log('\n🏁 処理完了（ブラウザは開いたままです）');
    // デバッグのためブラウザは閉じない
  }
}

// 実行
finalWorkingVersion();