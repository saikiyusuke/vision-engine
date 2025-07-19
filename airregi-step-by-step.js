require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function stepByStepAirregi() {
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
  
  console.log('🚀 Airレジ ステップバイステップ実行\n');
  console.log('各ステップで一時停止して確認します\n');
  
  try {
    await autoVision.launch({ slowMo: 2000 });
    
    // Step 1: Airレジへアクセス
    console.log('📍 Step 1: Airレジへアクセス');
    await autoVision.goto('https://airregi.jp/');
    await autoVision.page.waitForTimeout(5000);
    
    // 現在の画面を読み取り
    console.log('\n📄 現在の画面:');
    const screen1 = await autoVision.readScreen();
    console.log(screen1.substring(0, 300));
    console.log('...\n');
    
    // Step 2: ログインページへ
    console.log('📍 Step 2: ログインリンクを探す');
    const loginClicked = await autoVision.click('ログイン') || 
                         await autoVision.click('管理画面') ||
                         await autoVision.click('売上管理');
    
    if (loginClicked) {
      console.log('✅ ログインリンクをクリック');
      await autoVision.page.waitForTimeout(5000);
    } else {
      // 直接ログインページへ
      console.log('📍 直接ログインページへ移動');
      await autoVision.goto('https://airregi.jp/login');
      await autoVision.page.waitForTimeout(5000);
    }
    
    // Step 3: AirIDログイン画面の確認
    console.log('\n📍 Step 3: ログイン画面の確認');
    const screen2 = await autoVision.readScreen();
    console.log(screen2.substring(0, 300));
    console.log('...\n');
    
    // Step 4: メールアドレス入力
    console.log('📍 Step 4: メールアドレス入力');
    const emailFilled = await autoVision.fill(
      'メールアドレスまたはAirIDの入力欄',
      'rsc_yamaguchi@yamatech.co.jp'
    );
    
    if (emailFilled) {
      console.log('✅ メールアドレス入力成功');
      await autoVision.page.waitForTimeout(3000);
      
      // スクリーンショット
      await autoVision.screenshot('after-email-input.png');
      console.log('📸 スクリーンショット保存');
    }
    
    // Step 5: パスワード入力欄を探す
    console.log('\n📍 Step 5: パスワード入力欄の確認');
    
    // 現在の画面にパスワード欄があるか確認
    const hasPasswordField = await autoVision.click('パスワード入力欄');
    
    if (!hasPasswordField) {
      // 「次へ」ボタンを探す
      console.log('📍 「次へ」ボタンを探す');
      const nextClicked = await autoVision.click('次へ') ||
                          await autoVision.click('続行') ||
                          await autoVision.click('青いボタン');
      
      if (!nextClicked) {
        // Enterキーで進む
        console.log('📍 Enterキーで次へ');
        await autoVision.page.keyboard.press('Enter');
      }
      
      await autoVision.page.waitForTimeout(5000);
    }
    
    // Step 6: パスワード入力
    console.log('\n📍 Step 6: パスワード入力');
    const passwordFilled = await autoVision.fill(
      'パスワード',
      'openmart1120'
    );
    
    if (passwordFilled) {
      console.log('✅ パスワード入力成功');
      await autoVision.page.waitForTimeout(2000);
    }
    
    // Step 7: ログインボタンを探してクリック
    console.log('\n📍 Step 7: ログインボタンをクリック');
    
    // 現在の画面を再度確認
    const loginScreen = await autoVision.readScreen();
    console.log('現在の画面内容（一部）:');
    console.log(loginScreen.substring(0, 200));
    
    // 青いボタンを直接クリック（座標指定も試す）
    const loginClicked2 = await autoVision.click('ログイン') ||
                          await autoVision.click('青いログインボタン') ||
                          await autoVision.click('ログインボタン');
    
    if (loginClicked2) {
      console.log('✅ ログインボタンクリック成功');
    } else {
      // Enterキーでログイン
      console.log('📍 Enterキーでログイン実行');
      await autoVision.page.keyboard.press('Enter');
    }
    
    // ログイン処理を待つ
    console.log('\n⏳ ログイン処理中... 10秒待機');
    await autoVision.page.waitForTimeout(10000);
    
    // Step 8: ログイン後の確認
    console.log('\n📍 Step 8: ログイン後の画面確認');
    const afterLogin = await autoVision.readScreen();
    console.log(afterLogin.substring(0, 300));
    
    await autoVision.screenshot('final-state.png');
    console.log('\n📸 最終状態のスクリーンショット保存');
    
    // ログイン成功の判定
    if (afterLogin.includes('売上') || afterLogin.includes('店舗') || afterLogin.includes('管理')) {
      console.log('\n🎉 ログイン成功！');
    } else if (afterLogin.includes('パスワード') || afterLogin.includes('ログイン')) {
      console.log('\n❌ まだログイン画面にいます');
      console.log('パスワードまたはメールアドレスを確認してください');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await autoVision.screenshot('error-state.png');
  }
  
  console.log('\n📌 ブラウザは開いたままです');
  console.log('手動で続きの操作を確認できます');
  await new Promise(() => {});
}

// 実行
stepByStepAirregi().catch(console.error);