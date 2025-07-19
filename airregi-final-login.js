require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function finalLoginAttempt() {
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
  
  console.log('🚀 Airレジ最終ログイン試行\n');
  console.log('📌 このスクリプトはAI Visionで確実にログインを完了させます\n');
  
  try {
    await autoVision.launch({ 
      slowMo: 2000,
      contextOptions: { 
        acceptDownloads: true,
        viewport: { width: 1280, height: 800 }
      }
    });
    
    // Step 1: 売上ページへアクセス（ログイン画面へリダイレクトされる）
    console.log('📍 Step 1: Airレジ売上ページへアクセス');
    await autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await autoVision.page.waitForTimeout(5000);
    
    // 現在の画面を確認
    const initialScreen = await autoVision.readScreen();
    console.log('📄 初期画面確認完了\n');
    
    if (initialScreen.includes('ログイン') || initialScreen.includes('AirID')) {
      console.log('🔐 AirIDログイン画面を検出\n');
      
      // Step 2: メールアドレス入力
      console.log('📍 Step 2: メールアドレス入力');
      
      // 入力欄をクリックしてからタイプ
      const emailClicked = await autoVision.click('AirIDまたはメールアドレスと書かれた入力欄');
      if (emailClicked) {
        console.log('✅ メールアドレス入力欄をクリック');
        await autoVision.page.waitForTimeout(1000);
        
        // キーボードで直接入力
        await autoVision.page.keyboard.type('rsc_yamaguchi@yamatech.co.jp');
        console.log('✅ メールアドレスを入力');
        await autoVision.page.waitForTimeout(2000);
      }
      
      // Step 3: パスワード入力
      console.log('\n📍 Step 3: パスワード入力');
      
      // パスワード入力欄をクリック
      const passwordClicked = await autoVision.click('パスワードと書かれた入力欄');
      if (passwordClicked) {
        console.log('✅ パスワード入力欄をクリック');
        await autoVision.page.waitForTimeout(1000);
        
        // パスワードを入力
        await autoVision.page.keyboard.type('openmart1120');
        console.log('✅ パスワードを入力');
        await autoVision.page.waitForTimeout(2000);
      }
      
      // スクリーンショットで確認
      await autoVision.screenshot('before-login-click.png');
      console.log('📸 ログイン前の状態を保存\n');
      
      // Step 4: ログインボタンをクリック
      console.log('📍 Step 4: ログインボタンをクリック');
      
      // 青いログインボタンをクリック
      const loginClicked = await autoVision.click('青いログインボタン');
      if (loginClicked) {
        console.log('✅ ログインボタンをクリック成功');
      } else {
        // 座標でクリックを試みる
        console.log('📍 画面中央下部の青いボタンをクリック');
        await autoVision.page.mouse.click(640, 505); // ログインボタンの推定座標
        console.log('✅ 座標クリック実行');
      }
      
      // ログイン処理を待つ
      console.log('\n⏳ ログイン処理中... 15秒待機');
      await autoVision.page.waitForTimeout(15000);
      
      // Step 5: ログイン後の確認
      console.log('\n📍 Step 5: ログイン結果確認');
      const afterLogin = await autoVision.readScreen();
      await autoVision.screenshot('after-login-final.png');
      
      if (afterLogin.includes('売上') || afterLogin.includes('商品') || afterLogin.includes('店舗')) {
        console.log('\n🎉 ログイン成功！');
        console.log('売上管理画面に到達しました');
        
        // 店舗選択が必要な場合
        if (afterLogin.includes('店舗') && afterLogin.includes('選択')) {
          console.log('\n📍 店舗選択画面を検出');
          const storeClicked = await autoVision.click('オープンマート');
          if (storeClicked) {
            console.log('✅ オープンマートを選択');
            await autoVision.page.waitForTimeout(5000);
          }
        }
        
        // 商品別売上へ移動
        console.log('\n📍 商品別売上ページへ移動');
        const salesClicked = await autoVision.click('商品別売上') || 
                             await autoVision.click('商品別');
        
        if (!salesClicked) {
          // 直接URLでアクセス
          await autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
          await autoVision.page.waitForTimeout(5000);
        }
        
        // 最終画面の確認
        const finalScreen = await autoVision.readScreen();
        await autoVision.screenshot('sales-page-final.png');
        console.log('\n📸 最終画面を保存');
        
        if (finalScreen.includes('CSV') || finalScreen.includes('ダウンロード')) {
          console.log('\n✅ CSVダウンロード可能な画面に到達！');
          console.log('次のステップ: 日付設定とCSVダウンロード');
        }
        
      } else {
        console.log('\n❌ ログインに失敗しました');
        console.log('画面内容:');
        console.log(afterLogin.substring(0, 400));
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await autoVision.screenshot('error-final.png');
  }
  
  console.log('\n📌 ブラウザは開いたままです');
  console.log('📌 手動で操作を続けることができます');
  console.log('\n💡 ヒント: ログインが成功したら、以下を実行してください:');
  console.log('1. 日付範囲を昨日に設定');
  console.log('2. CSVダウンロードボタンをクリック');
  console.log('3. ダウンロードしたファイルをOpenMartにアップロード');
  
  await new Promise(() => {});
}

// 実行
finalLoginAttempt().catch(console.error);