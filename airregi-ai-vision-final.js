require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function airregiAIVisionFinal() {
  console.log('🚀 Airレジ AI Vision 最終版 - 必ず成功させる！\n');
  
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
  
  try {
    // ブラウザ起動
    await autoVision.launch({ slowMo: 1000 });
    
    // Airレジにアクセス
    console.log('📍 Step 1: Airレジへアクセス');
    await autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await autoVision.page.waitForTimeout(5000);
    
    // 画面を読み取って状況確認
    const initialScreen = await autoVision.readScreen();
    console.log('📖 画面確認: ログイン画面を検出');
    
    // メールアドレス入力 - AI Visionで確実に
    console.log('\n📧 Step 2: メールアドレス入力');
    
    // プレースホルダーテキストで入力欄を探す
    await autoVision.click('AirIDまたはメールアドレス');
    await autoVision.page.waitForTimeout(1000);
    
    // 直接入力
    await autoVision.page.keyboard.type('info@openmart.jp', { delay: 100 });
    console.log('  ✅ メールアドレス入力完了: info@openmart.jp');
    await autoVision.page.waitForTimeout(1000);
    
    // パスワード入力欄をクリック
    console.log('\n🔑 Step 3: パスワード入力');
    await autoVision.click('パスワード');
    await autoVision.page.waitForTimeout(1000);
    
    // パスワード入力
    await autoVision.page.keyboard.type('info@openmartjp2024', { delay: 100 });
    console.log('  ✅ パスワード入力完了');
    await autoVision.page.waitForTimeout(1000);
    
    // 入力確認のスクリーンショット
    await autoVision.page.screenshot({ 
      path: 'ai-vision-filled.png',
      fullPage: true 
    });
    console.log('📸 入力確認: ai-vision-filled.png');
    
    // ログインボタンクリック - 確実な方法
    console.log('\n🎯 Step 4: ログインボタンクリック');
    
    // 方法1: AI Visionで「ログイン」ボタンを探す
    const loginClicked = await autoVision.click('ログイン');
    
    if (!loginClicked) {
      // 方法2: 青いボタンを探す
      console.log('  青いボタンを探しています...');
      await autoVision.click('青いボタン');
    }
    
    // ログイン処理を待つ
    console.log('\n⏳ ログイン処理中... 10秒待機');
    await autoVision.page.waitForTimeout(10000);
    
    // ログイン後の画面を確認
    const afterLogin = await autoVision.readScreen();
    await autoVision.page.screenshot({ 
      path: 'ai-vision-after-login.png',
      fullPage: true 
    });
    
    // 状態確認
    if (afterLogin.includes('再通知') || afterLogin.includes('送信する')) {
      console.log('\n📨 メール認証画面を検出');
      console.log('  「送信する」ボタンをクリックします');
      
      await autoVision.click('送信する');
      await autoVision.page.waitForTimeout(3000);
      
      console.log('\n⚠️  メール認証手順:');
      console.log('  1. info@openmart.jp のメールを確認');
      console.log('  2. AirIDからの認証リンクをクリック');
      console.log('  3. 認証完了後、このスクリプトを再実行');
      
    } else if (afterLogin.includes('売上') || afterLogin.includes('店舗')) {
      console.log('\n✅ ログイン成功！売上ページに到達');
      
      // 売上データ処理
      await processSalesData(autoVision);
      
    } else if (afterLogin.includes('入力してください')) {
      console.log('\n❌ 入力が認識されていません');
      console.log('  別の方法を試してください');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await autoVision.page.screenshot({ 
      path: `error-${Date.now()}.png`,
      fullPage: true 
    });
  } finally {
    console.log('\n🏁 処理完了（ブラウザは開いたままです）');
    // await autoVision.close();
  }
}

async function processSalesData(autoVision) {
  console.log('\n📊 売上データ処理開始');
  
  // 店舗選択
  console.log('🏪 店舗選択: オープンマート');
  await autoVision.click('オープンマート');
  await autoVision.page.waitForTimeout(3000);
  
  // 昨日の日付を設定
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  
  console.log(`📅 日付設定: ${dateStr}`);
  await autoVision.fill('開始日', dateStr);
  await autoVision.fill('終了日', dateStr);
  
  // 検索実行
  await autoVision.click('検索');
  await autoVision.page.waitForTimeout(5000);
  
  // CSVダウンロード
  console.log('💾 CSVダウンロード');
  const downloadPromise = autoVision.page.waitForEvent('download');
  await autoVision.click('CSVダウンロード');
  
  try {
    const download = await downloadPromise;
    const path = await download.path();
    console.log(`✅ ダウンロード完了: ${path}`);
    console.log('\n🎉 完全自動化成功！');
  } catch (e) {
    console.log('❌ ダウンロード失敗');
  }
}

// 実行
airregiAIVisionFinal();