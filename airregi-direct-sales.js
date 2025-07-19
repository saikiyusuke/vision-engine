require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');
const path = require('path');
const fs = require('fs');

async function directSalesAccess() {
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
  
  console.log('🚀 Airレジ売上ページ直接アクセス\n');
  
  try {
    // ブラウザ起動（ヘッドレスモードを無効化）
    await autoVision.launch({ 
      slowMo: 1500,
      contextOptions: { 
        acceptDownloads: true,
        viewport: { width: 1280, height: 800 }
      }
    });
    
    // 直接商品別売上ページへ
    console.log('📍 商品別売上ページへ直接アクセス');
    await autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    
    // ページ読み込みを待つ
    console.log('⏳ ページ読み込み中... 8秒待機');
    await autoVision.page.waitForTimeout(8000);
    
    // 現在の画面を確認
    console.log('\n📄 現在の画面を確認中...');
    const currentScreen = await autoVision.readScreen();
    console.log('画面内容（最初の300文字）:');
    console.log(currentScreen.substring(0, 300));
    console.log('...\n');
    
    // スクリーンショット保存
    await autoVision.screenshot('initial-page.png');
    console.log('📸 初期画面のスクリーンショット保存\n');
    
    // ログイン画面の場合
    if (currentScreen.includes('ログイン') || currentScreen.includes('AirID')) {
      console.log('🔐 ログインが必要です\n');
      
      // AirIDログイン処理
      console.log('📍 AirIDログイン開始');
      
      // メールアドレス入力
      console.log('1️⃣ メールアドレスを入力');
      const emailFilled = await autoVision.fill(
        'メールアドレス入力欄',
        'rsc_yamaguchi@yamatech.co.jp'
      );
      
      if (emailFilled) {
        console.log('✅ メールアドレス入力完了');
        await autoVision.page.waitForTimeout(2000);
        
        // 現在の画面を再確認
        const afterEmail = await autoVision.readScreen();
        
        // パスワード欄が既にある場合
        if (afterEmail.includes('パスワード')) {
          console.log('📍 パスワード欄が表示されています');
        } else {
          // 次へボタンをクリック
          console.log('2️⃣ 次へボタンをクリック');
          const nextClicked = await autoVision.click('次へ') || 
                              await autoVision.click('続ける');
          
          if (nextClicked) {
            console.log('✅ 次へボタンクリック完了');
            await autoVision.page.waitForTimeout(5000);
          }
        }
        
        // パスワード入力
        console.log('3️⃣ パスワードを入力');
        const passwordFilled = await autoVision.fill(
          'パスワード',
          'openmart1120'
        );
        
        if (passwordFilled) {
          console.log('✅ パスワード入力完了');
          await autoVision.page.waitForTimeout(2000);
        }
        
        // ログインボタンをクリック
        console.log('4️⃣ ログインボタンをクリック');
        const loginClicked = await autoVision.click('ログイン');
        
        if (loginClicked) {
          console.log('✅ ログインボタンクリック完了');
        } else {
          console.log('📍 Enterキーでログイン');
          await autoVision.page.keyboard.press('Enter');
        }
        
        console.log('\n⏳ ログイン処理中... 10秒待機');
        await autoVision.page.waitForTimeout(10000);
        
        // ログイン後の画面確認
        const afterLogin = await autoVision.readScreen();
        await autoVision.screenshot('after-login.png');
        console.log('📸 ログイン後のスクリーンショット保存');
        
        if (afterLogin.includes('売上') || afterLogin.includes('商品')) {
          console.log('\n🎉 ログイン成功！売上ページに到達しました');
        } else {
          console.log('\n⚠️ ログイン後の画面:');
          console.log(afterLogin.substring(0, 300));
        }
      }
    } else if (currentScreen.includes('商品別売上') || currentScreen.includes('売上')) {
      console.log('✅ 既に売上ページにいます！\n');
      
      // 日付設定とCSVダウンロードを試みる
      console.log('📍 日付設定を開始');
      
      // 昨日の日付を設定
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      console.log(`日付: ${dateStr}`);
      
      // 日付入力欄を探す
      const dateInputPatterns = ['開始日', '期間', '日付', 'from', 'to'];
      for (const pattern of dateInputPatterns) {
        const clicked = await autoVision.click(pattern);
        if (clicked) {
          console.log(`✅ ${pattern}をクリック`);
          await autoVision.page.keyboard.type(dateStr);
          break;
        }
      }
      
      // CSVダウンロードボタンを探す
      console.log('\n📍 CSVダウンロードボタンを探す');
      const csvPatterns = ['CSV', 'ダウンロード', 'エクスポート', 'Export'];
      
      for (const pattern of csvPatterns) {
        const found = await autoVision.click(pattern);
        if (found) {
          console.log(`✅ ${pattern}ボタンを発見してクリック`);
          break;
        }
      }
    }
    
    // 最終状態のスクリーンショット
    await autoVision.screenshot('final-state.png');
    console.log('\n📸 最終状態のスクリーンショット保存');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await autoVision.screenshot('error.png');
  }
  
  console.log('\n📌 ブラウザは開いたままです');
  console.log('手動で操作を続けることができます');
  await new Promise(() => {});
}

// 実行
directSalesAccess().catch(console.error);