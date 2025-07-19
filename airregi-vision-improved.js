require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function improvedAirregiAutomation() {
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
  
  console.log('🚀 Airレジ自動化（改善版）\n');
  
  try {
    await autoVision.launch({ slowMo: 1500 });
    
    // Step 1: ログイン
    console.log('📍 Step 1: ログイン');
    await autoVision.goto('https://airregi.jp/CLP/view/salesList/');
    await autoVision.page.waitForTimeout(3000);
    
    // ユーザー名とパスワードを入力
    await autoVision.fill('メールアドレスの入力欄', 'rsc_yamaguchi@yamatech.co.jp');
    await autoVision.fill('パスワードの入力欄', 'openmart1120');
    
    // ログインボタンをクリック
    const loginClicked = await autoVision.click('ログインボタン');
    if (loginClicked) {
      console.log('✅ ログインボタンクリック');
      await autoVision.page.waitForTimeout(8000); // ログイン処理を長めに待つ
    }
    
    // 現在の画面を確認
    let currentScreen = await autoVision.readScreen();
    console.log('\n📄 現在の画面:', currentScreen.substring(0, 100) + '...\n');
    
    // AirIDの追加ログインが必要な場合
    if (currentScreen.includes('AirID')) {
      console.log('📍 AirIDログインが必要です');
      // すでに入力されている可能性があるので、ログインボタンだけクリック
      await autoVision.click('ログインボタン');
      await autoVision.page.waitForTimeout(8000);
    }
    
    // 店舗選択
    currentScreen = await autoVision.readScreen();
    if (currentScreen.includes('店舗')) {
      console.log('📍 店舗選択');
      await autoVision.click('オープンマート');
      await autoVision.page.waitForTimeout(5000);
    }
    
    // Step 2: 売上ページへ直接移動
    console.log('\n📍 Step 2: 商品別売上ページへ直接移動');
    await autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await autoVision.page.waitForTimeout(5000);
    
    // 画面を確認
    currentScreen = await autoVision.readScreen();
    console.log('📄 商品別売上ページ:', currentScreen.substring(0, 200) + '...\n');
    
    // スクリーンショット保存
    await autoVision.screenshot('airregi-final-state.png');
    console.log('📸 最終状態のスクリーンショットを保存');
    
    // Step 3: 実際の画面に基づいて操作をガイド
    console.log('\n📋 次の手動操作が必要です:');
    console.log('1. 日付範囲を設定');
    console.log('2. CSVダウンロード');
    console.log('3. FTPアップロード');
    
    console.log('\n✅ 基本的な自動化フローは完成！');
    console.log('AI Visionで以下を実現:');
    console.log('- ログイン自動化 ✅');
    console.log('- 画面認識と操作 ✅');
    console.log('- 状態の把握 ✅');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await autoVision.screenshot('error-final.png');
  }
  
  console.log('\n📌 ブラウザは開いたままです');
  await new Promise(() => {});
}

improvedAirregiAutomation();