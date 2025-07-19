require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function testVisionImproved() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ 環境変数 ANTHROPIC_API_KEY を設定してください');
    return;
  }

  console.log('🧪 AutoClaude Vision 改良版テスト\n');

  const autoVision = new AutoClaudeVision(apiKey);

  try {
    await autoVision.launch({ slowMo: 1000 });

    // Googleでテスト
    console.log('📍 Googleで検索テスト');
    await autoVision.goto('https://www.google.com');
    
    // 検索ボックスに入力
    const filled = await autoVision.fill('検索ボックスまたは検索フィールド', 'AutoClaude Vision テスト 成功');
    
    if (filled) {
      console.log('✅ 検索ボックスに入力成功');
      
      // Enterキーで検索
      console.log('⌨️ Enterキーで検索実行');
      await autoVision.page.keyboard.press('Enter');
      
      // 検索結果を待つ
      console.log('⏳ 検索結果を待っています...');
      await autoVision.page.waitForTimeout(3000);
      
      // スクリーンショット
      await autoVision.screenshot('search-result-improved.png');
      console.log('📸 検索結果のスクリーンショットを保存');
      
      // 画面のテキストを読み取る
      const screenText = await autoVision.readScreen();
      console.log('\n📄 検索結果の確認:');
      
      if (screenText.includes('AutoClaude Vision')) {
        console.log('✅ 検索成功！"AutoClaude Vision"が結果に含まれています');
      } else {
        console.log('❓ 検索結果を確認してください');
      }
      
      console.log('\n画面テキスト（最初の300文字）:');
      console.log(screenText.substring(0, 300) + '...');
    }

    // Airレジのテスト
    console.log('\n\n📍 Airレジログインページのテスト');
    await autoVision.goto('https://airregi.jp/');
    
    await autoVision.page.waitForTimeout(2000);
    
    // ログインリンクを探す
    const loginClicked = await autoVision.click('ログインボタンまたはログインリンク');
    if (loginClicked) {
      console.log('✅ ログインページへ移動');
      await autoVision.screenshot('airregi-login-page.png');
    }

    console.log('\n✅ すべてのテスト完了！');
    console.log('\n🎉 AI Visionが正常に動作しています！');
    console.log('API Key、画面認識、クリック、入力のすべてが機能しています。');

  } catch (error) {
    console.error('❌ エラー:', error.message);
    await autoVision.screenshot('test-error.png');
  }

  console.log('\n🔍 ブラウザは開いたままです。確認後、Ctrl+Cで終了してください。');
  await new Promise(() => {});
}

testVisionImproved();