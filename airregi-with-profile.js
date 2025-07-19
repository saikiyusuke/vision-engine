require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');
const os = require('os');
const path = require('path');

async function airregiWithChromeProfile() {
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
  
  console.log('🚀 Airレジ自動化（Chromeプロファイル版）\n');
  console.log('📌 Chromeのログイン情報を使用して自動化します\n');
  
  try {
    // Chromeのユーザーデータディレクトリを設定
    const homeDir = os.homedir();
    const chromeUserData = path.join(homeDir, 'Library/Application Support/Google/Chrome');
    
    // プロファイルを指定してブラウザを起動
    await autoVision.launch({ 
      slowMo: 1000,
      browserOptions: {
        channel: 'chrome',
        args: [
          `--user-data-dir=${chromeUserData}`,
          '--profile-directory=Profile 1', // ユーザー1のプロファイル
          '--no-sandbox'
        ]
      }
    });
    
    console.log('✅ Chromeプロファイルで起動しました');
    
    // Airレジにアクセス
    console.log('\n📍 Airレジにアクセス...');
    await autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await autoVision.page.waitForTimeout(5000);
    
    // 現在の画面を確認
    const currentScreen = await autoVision.readScreen();
    console.log('\n📄 現在の画面:');
    console.log(currentScreen.substring(0, 200) + '...');
    
    // ログイン済みかチェック
    if (currentScreen.includes('ログイン') || currentScreen.includes('AirID')) {
      console.log('\n⚠️  ログインが必要です');
      console.log('Chromeで事前にログインしておくか、手動でログインしてください');
    } else if (currentScreen.includes('商品別売上')) {
      console.log('\n✅ 商品別売上ページに到達！');
      
      // 自動化処理を続行
      console.log('\n📍 日付設定と CSVダウンロードを実行...');
      
      // 昨日の日付でフィルタ
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toLocaleDateString('ja-JP');
      console.log(`日付: ${dateStr}`);
      
      // 日付フィールドをクリック
      await autoVision.click('日付または期間の選択');
      await autoVision.page.waitForTimeout(2000);
      
      // 昨日を選択
      await autoVision.click('昨日');
      await autoVision.page.waitForTimeout(1000);
      
      // 検索実行
      await autoVision.click('検索または表示');
      await autoVision.page.waitForTimeout(5000);
      
      // CSVダウンロード
      const csvClicked = await autoVision.click('CSV');
      if (csvClicked) {
        console.log('✅ CSVダウンロードを開始');
        await autoVision.page.waitForTimeout(5000);
      }
    }
    
    // スクリーンショット保存
    await autoVision.screenshot('airregi-profile-result.png');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 処理完了！');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    
    if (error.message.includes('Failed to create Chrome')) {
      console.log('\n💡 ヒント:');
      console.log('1. Chromeが起動している場合は終了してください');
      console.log('2. または通常のChromiumブラウザで実行してください');
    }
  }
  
  console.log('\n📌 ブラウザは開いたままです');
  await new Promise(() => {});
}

airregiWithChromeProfile();