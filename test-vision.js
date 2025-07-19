require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function testVision() {
  // APIキーの確認
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ 環境変数 ANTHROPIC_API_KEY を設定してください');
    console.log('\n使い方:');
    console.log('export ANTHROPIC_API_KEY="sk-ant-api03-xxxxx"');
    console.log('node test-vision.js');
    return;
  }

  console.log('🧪 AutoClaude Vision テストを開始します...\n');

  const autoVision = new AutoClaudeVision(apiKey);

  try {
    // ブラウザ起動
    await autoVision.launch({ slowMo: 1000 });

    // Googleでテスト
    console.log('📍 Googleで検索テスト');
    await autoVision.goto('https://www.google.com');
    
    // 検索ボックスに入力
    const filled = await autoVision.fill('検索ボックス', 'AutoClaude Vision test');
    if (filled) {
      console.log('✅ 検索ボックスに入力成功');
    }

    // 検索ボタンをクリック
    const clicked = await autoVision.click('Google 検索ボタン');
    if (clicked) {
      console.log('✅ 検索ボタンクリック成功');
    }

    // 結果を待つ
    await autoVision.waitFor('検索結果', 10000);

    // スクリーンショット
    await autoVision.screenshot('google-search-result.png');
    console.log('📸 検索結果のスクリーンショットを保存しました');

    // 画面のテキストを読み取る
    const screenText = await autoVision.readScreen();
    console.log('\n📄 画面のテキスト（最初の200文字）:');
    console.log(screenText.substring(0, 200) + '...');

    console.log('\n✅ テスト完了！');

  } catch (error) {
    console.error('❌ エラー:', error.message);
    await autoVision.screenshot('test-error.png');
  }

  console.log('\n🔍 ブラウザは開いたままです。確認後、Ctrl+Cで終了してください。');
  
  // ブラウザを開いたままにする
  await new Promise(() => {});
}

// テスト実行
testVision();