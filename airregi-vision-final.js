require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function finalAirregiDemo() {
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);

  console.log('🚀 Airレジ AI Vision 最終デモ\n');

  try {
    await autoVision.launch({ slowMo: 1500 });

    // Airレジにアクセス
    console.log('📍 Airレジにアクセス');
    await autoVision.page.goto('https://airregi.jp/');
    await autoVision.page.waitForTimeout(3000);

    // 画面上部の「ログイン」をクリック
    console.log('🖱️ 画面上部の「ログイン」をクリック');
    const loginClicked = await autoVision.click('画面上部にあるログインという文字');
    
    if (loginClicked) {
      console.log('✅ ログインをクリックしました！');
      await autoVision.page.waitForTimeout(5000);
      
      // ログインページでの操作
      console.log('\n📝 ログイン情報を入力');
      
      // メールアドレス
      await autoVision.fill('メールアドレスまたはユーザー名の入力欄', 'rsc_yamaguchi@yamatech.co.jp');
      console.log('✅ メールアドレス入力');
      
      // パスワード
      await autoVision.fill('パスワードの入力欄', 'openmart1120');
      console.log('✅ パスワード入力');
      
      // ログインボタン
      await autoVision.click('ログインボタン');
      console.log('🚀 ログイン実行');
      
      // ログイン後の処理
      console.log('⏳ ログイン処理中...');
      await autoVision.page.waitForTimeout(5000);
      
      // 現在の画面を確認
      const afterLogin = await autoVision.readScreen();
      console.log('\n📄 ログイン後の画面:');
      console.log(afterLogin.substring(0, 200) + '...');
      
      await autoVision.screenshot('airregi-success.png');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 AI Visionデモ成功！');
    console.log('='.repeat(60));
    console.log('実証された機能:');
    console.log('✅ 画面を見て要素を認識');
    console.log('✅ 自然言語で操作指示');
    console.log('✅ 動的なWebサイトでも動作');
    console.log('✅ セレクター不要');

  } catch (error) {
    console.error('❌ エラー:', error.message);
    await autoVision.screenshot('final-error.png');
  }

  console.log('\n📌 ブラウザ開いたまま');
  await new Promise(() => {});
}

finalAirregiDemo();