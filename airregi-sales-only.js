require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function salesPageAutomation() {
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
  
  console.log('🚀 Airレジ売上ページ自動化\n');
  console.log('📌 このスクリプトは手動ログイン後の売上ページ操作を自動化します\n');
  
  try {
    await autoVision.launch({ slowMo: 1000 });
    
    // 手動ログインを促す
    console.log('👤 手動操作が必要です:');
    console.log('1. ブラウザでAirレジにログインしてください');
    console.log('2. 商品別売上ページまで移動してください');
    console.log('3. 準備ができたらEnterキーを押してください\n');
    
    await autoVision.goto('https://airregi.jp/');
    
    // ユーザーの入力を待つ
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise(resolve => {
      readline.question('準備ができたらEnterキーを押してください...', () => {
        readline.close();
        resolve();
      });
    });
    
    console.log('\n📍 自動化を開始します...\n');
    
    // 現在の画面を確認
    let currentScreen = await autoVision.readScreen();
    console.log('📄 現在の画面を確認中...');
    
    // 商品別売上ページかチェック
    if (!currentScreen.includes('商品別売上')) {
      console.log('⚠️  商品別売上ページではないようです');
      console.log('商品別売上ページへ移動します...');
      await autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
      await autoVision.page.waitForTimeout(3000);
    }
    
    // Step 1: 日付設定
    console.log('\n📍 Step 1: 昨日の日付を設定');
    
    // 日付選択をクリック
    const dateFieldClicked = await autoVision.click('日付選択フィールドまたは期間選択');
    if (dateFieldClicked) {
      console.log('✅ 日付フィールドをクリック');
      await autoVision.page.waitForTimeout(2000);
      
      // カレンダーが表示されたら昨日を選択
      const yesterdayClicked = await autoVision.click('昨日の日付または前日');
      if (yesterdayClicked) {
        console.log('✅ 昨日の日付を選択');
      }
    }
    
    // 検索実行
    const searchClicked = await autoVision.click('検索または表示または実行ボタン');
    if (searchClicked) {
      console.log('✅ 検索を実行');
      await autoVision.page.waitForTimeout(5000);
    }
    
    // Step 2: CSVダウンロード
    console.log('\n📍 Step 2: CSVダウンロード');
    await autoVision.screenshot('before-csv-download.png');
    
    // CSVダウンロードリンクを探す
    const csvPatterns = [
      'CSVダウンロード',
      'CSV出力',
      'CSVエクスポート',
      'ダウンロード（CSV）',
      'エクスポート'
    ];
    
    let csvDownloaded = false;
    for (const pattern of csvPatterns) {
      if (await autoVision.click(pattern)) {
        console.log(`✅ ${pattern}をクリック`);
        csvDownloaded = true;
        break;
      }
    }
    
    if (csvDownloaded) {
      console.log('⏳ ダウンロード完了を待機中...');
      await autoVision.page.waitForTimeout(5000);
      console.log('✅ CSVダウンロード完了（推定）');
    } else {
      console.log('❌ CSVダウンロードリンクが見つかりませんでした');
    }
    
    // Step 3: FTPアップロード準備
    console.log('\n📍 Step 3: FTPアップロード（手動）');
    console.log('📁 ダウンロードフォルダを確認してください');
    console.log('🔗 FTPアップロード先: https://partner.openmart.jp/saleslist_bymenu/upload/');
    console.log('🔑 パスワード: 0000');
    
    // 最終スクリーンショット
    await autoVision.screenshot('final-state.png');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 売上ページの自動化が完了しました！');
    console.log('='.repeat(60));
    console.log('📋 実行された操作:');
    console.log('  1. 日付設定（昨日）');
    console.log('  2. CSVダウンロード');
    console.log('\n📋 残りの手動作業:');
    console.log('  1. ダウンロードしたCSVファイルの確認');
    console.log('  2. FTPサイトへのアップロード');
    
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    await autoVision.screenshot('error.png');
  }
  
  console.log('\n📌 ブラウザは開いたままです');
  await new Promise(() => {});
}

salesPageAutomation();