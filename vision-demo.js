require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function visionDemo() {
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
  
  console.log('🎯 AI Vision デモンストレーション\n');
  console.log('このデモでは、AI Visionの機能を実演します：');
  console.log('1. 自然言語での要素検索');
  console.log('2. 動的コンテンツの認識');
  console.log('3. 画面内容の理解\n');
  
  try {
    await autoVision.launch({ slowMo: 1000 });
    
    // デモ1: Google検索
    console.log('📍 デモ1: Google検索');
    await autoVision.goto('https://www.google.com');
    await autoVision.page.waitForTimeout(2000);
    
    // 検索ボックスに入力
    const searchFilled = await autoVision.fill('検索ボックス', 'AI Vision 自動化');
    if (searchFilled) {
      console.log('✅ 検索ボックスに入力成功');
    }
    
    // 検索実行
    await autoVision.page.keyboard.press('Enter');
    await autoVision.page.waitForTimeout(3000);
    
    // 画面内容を読み取り
    const searchResults = await autoVision.readScreen();
    console.log('\n📄 検索結果の一部:');
    console.log(searchResults.substring(0, 300) + '...\n');
    
    // デモ2: 要素の座標検出
    console.log('📍 デモ2: 要素の座標検出');
    const vision = autoVision.vision;
    const result = await vision.findElement(autoVision.page, '最初の検索結果リンク');
    
    if (result.found) {
      console.log(`✅ 要素を発見: 座標(${result.x}, ${result.y})`);
      console.log(`   説明: ${result.description}`);
    }
    
    // スクリーンショット保存
    await autoVision.screenshot('vision-demo-result.png');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 AI Vision デモ完了！');
    console.log('='.repeat(60));
    console.log('\n主な機能:');
    console.log('✅ 自然言語での要素指定');
    console.log('✅ JavaScript動的要素の検出');
    console.log('✅ 画面内容の理解と分析');
    console.log('✅ セレクタ不要の操作');
    
    console.log('\n💡 応用例:');
    console.log('- 複雑なWebアプリケーションの自動化');
    console.log('- 動的に変化するUIの操作');
    console.log('- 画像認識による要素検出');
    console.log('- マルチ言語サイトの自動化');
    
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
  }
  
  console.log('\n📌 ブラウザは開いたままです');
  await new Promise(() => {});
}

visionDemo();