require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function completeAirregiAutomation() {
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
  
  console.log('🚀 Airレジ完全自動化 v2\n');
  
  try {
    await autoVision.launch({ slowMo: 1500 });
    
    // Step 1: Airレジ売上ページへ
    console.log('📍 Step 1: 売上ページへアクセス');
    await autoVision.goto('https://airregi.jp/CLP/view/salesList/');
    await autoVision.page.waitForTimeout(3000);
    
    // Step 2: AirIDログイン
    console.log('\n📍 Step 2: AirIDログイン');
    let currentScreen = await autoVision.readScreen();
    
    if (currentScreen.includes('AirID')) {
      console.log('AirIDログイン画面を検出');
      
      // メールアドレスが既に入力されている場合があるので、パスワードを探す
      const hasPassword = await autoVision.click('パスワード入力欄');
      
      if (!hasPassword) {
        // メールアドレスから入力
        await autoVision.fill('AirIDまたはメールアドレスの入力欄', 'rsc_yamaguchi@yamatech.co.jp');
        await autoVision.page.waitForTimeout(1000);
        
        // 次へボタンをクリック（メールアドレス入力後）
        const nextClicked = await autoVision.click('次へボタン');
        if (nextClicked) {
          console.log('✅ 次へボタンクリック');
          await autoVision.page.waitForTimeout(3000);
        }
      }
      
      // パスワード入力
      await autoVision.fill('パスワード入力欄', 'openmart1120');
      await autoVision.page.waitForTimeout(1000);
      
      // ログインボタンを探す（様々なパターンで）
      const loginPatterns = [
        'ログインボタン',
        '青いログインボタン',
        '送信ボタン',
        'サインインボタン'
      ];
      
      let loginSuccess = false;
      for (const pattern of loginPatterns) {
        if (await autoVision.click(pattern)) {
          console.log(`✅ ${pattern}をクリック`);
          loginSuccess = true;
          break;
        }
      }
      
      if (!loginSuccess) {
        // Enterキーで送信
        await autoVision.page.keyboard.press('Enter');
        console.log('✅ Enterキーでログイン');
      }
      
      await autoVision.page.waitForTimeout(8000);
    }
    
    // Step 3: 店舗選択（必要な場合）
    currentScreen = await autoVision.readScreen();
    if (currentScreen.includes('店舗') && !currentScreen.includes('商品別売上')) {
      console.log('\n📍 Step 3: 店舗選択');
      await autoVision.click('オープンマート');
      await autoVision.page.waitForTimeout(5000);
    }
    
    // Step 4: 商品別売上ページへ
    console.log('\n📍 Step 4: 商品別売上ページへ移動');
    currentScreen = await autoVision.readScreen();
    
    if (!currentScreen.includes('商品別売上')) {
      // メニューから選択を試みる
      const menuClicked = await autoVision.click('売上メニュー');
      if (menuClicked) {
        await autoVision.page.waitForTimeout(2000);
        await autoVision.click('商品別売上');
        await autoVision.page.waitForTimeout(3000);
      } else {
        // 直接URLでアクセス
        await autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
        await autoVision.page.waitForTimeout(5000);
      }
    }
    
    // 現在の状態を確認
    currentScreen = await autoVision.readScreen();
    console.log('\n📄 現在の画面状態:');
    console.log(currentScreen.substring(0, 200) + '...');
    
    // Step 5: 日付設定（商品別売上ページにいる場合）
    if (currentScreen.includes('商品別売上') || currentScreen.includes('期間')) {
      console.log('\n📍 Step 5: 日付設定');
      
      // 昨日の日付を生成
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit'
      }).replace(/\//g, '-');
      
      console.log(`日付: ${dateStr}`);
      
      // 日付入力フィールドをクリック
      const dateClicked = await autoVision.click('期間または日付の入力欄');
      if (dateClicked) {
        await autoVision.page.waitForTimeout(1000);
        
        // カレンダーから昨日を選択
        await autoVision.click('昨日の日付');
        await autoVision.page.waitForTimeout(1000);
      }
      
      // 検索/表示ボタンをクリック
      const searchClicked = await autoVision.click('検索または表示または絞り込みボタン');
      if (searchClicked) {
        console.log('✅ 検索実行');
        await autoVision.page.waitForTimeout(5000);
      }
      
      // Step 6: CSVダウンロード
      console.log('\n📍 Step 6: CSVダウンロード');
      const csvClicked = await autoVision.click('CSVまたはダウンロード');
      if (csvClicked) {
        console.log('✅ CSVダウンロード開始');
        await autoVision.page.waitForTimeout(5000);
      }
    }
    
    // 最終状態のスクリーンショット
    await autoVision.screenshot('airregi-final.png');
    console.log('\n📸 最終状態を保存しました');
    
    // 成功メッセージ
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Airレジ自動化完了！');
    console.log('='.repeat(60));
    console.log('✅ AI Visionにより以下を実現:');
    console.log('  - 自然言語での要素検索');
    console.log('  - 動的なJavaScript要素の操作');
    console.log('  - 画面状態の理解と適応');
    
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    await autoVision.screenshot('error-state.png');
  }
  
  console.log('\n📌 ブラウザは開いたままです');
  await new Promise(() => {});
}

completeAirregiAutomation();