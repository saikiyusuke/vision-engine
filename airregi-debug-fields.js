const { chromium } = require('playwright');

async function debugFields() {
  console.log('🔍 Airレジ入力フィールドデバッグ\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📍 Airレジにアクセス');
    await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await page.waitForTimeout(5000);
    
    // すべての入力フィールドを調査
    console.log('\n🔍 入力フィールドを調査中...\n');
    
    const inputs = await page.locator('input').all();
    console.log(`検出された入力フィールド数: ${inputs.length}\n`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      try {
        const type = await input.getAttribute('type') || 'text';
        const name = await input.getAttribute('name') || '';
        const placeholder = await input.getAttribute('placeholder') || '';
        const isVisible = await input.isVisible();
        const value = await input.inputValue();
        
        console.log(`フィールド ${i + 1}:`);
        console.log(`  Type: ${type}`);
        console.log(`  Name: ${name}`);
        console.log(`  Placeholder: ${placeholder}`);
        console.log(`  Visible: ${isVisible}`);
        console.log(`  Value: ${value}`);
        console.log('---');
      } catch (e) {
        console.log(`フィールド ${i + 1}: エラー`);
        console.log('---');
      }
    }
    
    // 可視の入力フィールドだけを取得
    console.log('\n📌 可視フィールドのみで入力を試行\n');
    
    const visibleInputs = await page.locator('input:visible').all();
    console.log(`可視フィールド数: ${visibleInputs.length}\n`);
    
    if (visibleInputs.length >= 2) {
      // 最初の可視フィールドにメールアドレス
      console.log('📧 メールアドレス入力');
      await visibleInputs[0].fill('info@openmart.jp');
      await page.waitForTimeout(1000);
      
      // パスワードフィールドを探す
      const passwordField = await page.locator('input[type="password"]:visible').first();
      console.log('🔑 パスワード入力');
      await passwordField.fill('info@openmartjp2024');
      await page.waitForTimeout(1000);
      
      // スクリーンショット
      await page.screenshot({ path: 'debug-filled.png' });
      console.log('\n📸 入力確認: debug-filled.png');
      
      // ログインボタンを探す
      console.log('\n🎯 ログインボタンを探しています...');
      const buttons = await page.locator('button:visible').all();
      console.log(`可視ボタン数: ${buttons.length}`);
      
      for (const button of buttons) {
        const text = await button.textContent();
        if (text && text.includes('ログイン')) {
          console.log(`  ✅ ログインボタン発見: "${text}"`);
          await button.click();
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
  }
  
  console.log('\n🏁 デバッグ完了（ブラウザは開いたままです）');
}

// 実行
debugFields();