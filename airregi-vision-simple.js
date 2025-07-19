require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function simpleAirregiDemo() {
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);

  console.log('🚀 Airレジ AI Vision シンプルデモ\n');

  try {
    await autoVision.launch({ slowMo: 2000 }); // ゆっくり動作

    // 1. Airレジホームページ
    console.log('📍 Airレジにアクセス');
    await autoVision.page.goto('https://airregi.jp/', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await autoVision.page.waitForTimeout(3000);
    
    // 画面を読み取って確認
    console.log('📖 画面を確認中...');
    const homeScreen = await autoVision.readScreen();
    console.log('画面内容:', homeScreen.substring(0, 100) + '...\n');

    // 2. ログインをクリック
    console.log('🖱️ ログインボタンを探しています...');
    const loginClicked = await autoVision.click('ログインボタンまたはログインと書かれたリンク');
    
    if (loginClicked) {
      console.log('✅ ログインボタンをクリックしました！');
      await autoVision.page.waitForTimeout(5000);
      
      // ログインページの内容を確認
      const loginScreen = await autoVision.readScreen();
      console.log('\n📄 ログインページの内容:');
      console.log(loginScreen.substring(0, 200) + '...');
      
      await autoVision.screenshot('airregi-login-page-vision.png');
      console.log('📸 ログインページのスクリーンショットを保存');
    } else {
      console.log('❌ ログインボタンが見つかりませんでした');
      
      // 画面に何があるか詳しく調査
      console.log('\n🔍 画面の詳細調査:');
      const fullScreen = await autoVision.readScreen();
      console.log(fullScreen.substring(0, 500));
    }

    console.log('\n✅ デモ完了！');
    console.log('AI Visionが画面を認識して操作できることを確認しました。');

  } catch (error) {
    console.error('❌ エラー:', error.message);
    await autoVision.screenshot('simple-error.png');
  }

  console.log('\n📌 ブラウザは開いたままです');
  await new Promise(() => {});
}

simpleAirregiDemo();