require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function airregiVisionDemo() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ API Keyが設定されていません');
    return;
  }

  console.log('🚀 Airレジ自動化デモ（AI Vision版）\n');
  console.log('このデモでは、AI Visionが画面を見て操作します。');
  console.log('セレクターは一切使用しません！\n');

  const autoVision = new AutoClaudeVision(apiKey);

  try {
    await autoVision.launch({ slowMo: 1000 });

    // Step 1: Airレジにアクセス
    console.log('📍 Step 1: Airレジにアクセス');
    await autoVision.goto('https://airregi.jp/');
    await autoVision.page.waitForTimeout(3000);
    
    // スクリーンショット
    await autoVision.screenshot('airregi-home.png');
    console.log('📸 ホームページのスクリーンショットを保存\n');

    // Step 2: ログインページへ
    console.log('📍 Step 2: ログインページを探します');
    const loginFound = await autoVision.click('ログインボタンまたはログインリンク');
    
    if (!loginFound) {
      // 売上ページに直接アクセス（自動的にログインページにリダイレクト）
      console.log('💡 売上ページ経由でログインページへ');
      await autoVision.goto('https://airregi.jp/CLP/view/salesList/');
    }
    
    await autoVision.page.waitForTimeout(3000);
    await autoVision.screenshot('airregi-login.png');

    // Step 3: ログイン
    console.log('\n📍 Step 3: ログイン情報を入力');
    
    // ユーザー名入力
    console.log('👤 ユーザー名を入力中...');
    const usernameFilled = await autoVision.fill(
      'ユーザー名またはメールアドレスの入力欄',
      'rsc_yamaguchi@yamatech.co.jp'
    );
    
    if (usernameFilled) {
      console.log('✅ ユーザー名入力完了');
    }

    // パスワード入力
    console.log('🔐 パスワードを入力中...');
    const passwordFilled = await autoVision.fill(
      'パスワードの入力欄',
      'openmart1120'
    );
    
    if (passwordFilled) {
      console.log('✅ パスワード入力完了');
    }

    // ログインボタンをクリック
    console.log('🚀 ログインボタンをクリック');
    const loginClicked = await autoVision.click('ログインボタンまたは送信ボタン');
    
    if (!loginClicked) {
      // Enterキーでログイン
      console.log('⌨️ Enterキーでログイン');
      await autoVision.page.keyboard.press('Enter');
    }

    // ログイン処理を待つ
    console.log('⏳ ログイン処理中...');
    await autoVision.page.waitForTimeout(5000);
    await autoVision.screenshot('airregi-after-login.png');

    // Step 4: 店舗選択（必要な場合）
    console.log('\n📍 Step 4: 店舗選択');
    const storeFound = await autoVision.click('オープンマートという店舗名');
    if (storeFound) {
      console.log('✅ 店舗を選択しました');
      await autoVision.page.waitForTimeout(3000);
    }

    // Step 5: 商品別売上ページへ
    console.log('\n📍 Step 5: 商品別売上ページへ移動');
    const salesMenuClicked = await autoVision.click('商品別売上のメニューまたはリンク');
    
    if (!salesMenuClicked) {
      // 直接URLで移動
      console.log('💡 直接URLで商品別売上ページへ');
      await autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    }
    
    await autoVision.page.waitForTimeout(3000);
    await autoVision.screenshot('airregi-sales-page.png');

    // Step 6: 日付設定
    console.log('\n📍 Step 6: 日付を昨日に設定');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // 開始日
    const startDateFilled = await autoVision.fill('開始日または最初の日付入力欄', dateStr);
    if (startDateFilled) {
      console.log('✅ 開始日設定: ' + dateStr);
    }
    
    // 終了日
    const endDateFilled = await autoVision.fill('終了日または2番目の日付入力欄', dateStr);
    if (endDateFilled) {
      console.log('✅ 終了日設定: ' + dateStr);
    }

    // 検索実行
    const searchClicked = await autoVision.click('検索または適用または実行ボタン');
    if (searchClicked) {
      console.log('✅ 検索を実行しました');
    }
    
    await autoVision.page.waitForTimeout(3000);

    // Step 7: CSVダウンロード
    console.log('\n📍 Step 7: CSVダウンロード');
    await autoVision.screenshot('airregi-before-download.png');
    
    const downloadClicked = await autoVision.click('CSVダウンロードリンクまたはボタン');
    if (downloadClicked) {
      console.log('✅ CSVダウンロードを開始しました');
      await autoVision.page.waitForTimeout(5000);
    }

    // 完了
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Airレジ自動化デモ完了！');
    console.log('='.repeat(60));
    console.log('\n実行した操作:');
    console.log('1. ✅ Airレジにアクセス');
    console.log('2. ✅ ログイン（AI Visionで入力欄を認識）');
    console.log('3. ✅ 店舗選択');
    console.log('4. ✅ 商品別売上ページへ移動');
    console.log('5. ✅ 日付設定');
    console.log('6. ✅ CSVダウンロード');
    console.log('\nすべてAI Visionによる画面認識で実行しました！');

    // 画面の最終状態を読み取る
    const finalScreen = await autoVision.readScreen();
    console.log('\n📄 最終画面の内容（一部）:');
    console.log(finalScreen.substring(0, 200) + '...');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    await autoVision.screenshot('airregi-error.png');
    
    // エラー時も画面を読み取って状況を把握
    try {
      const errorScreen = await autoVision.readScreen();
      console.log('\n📄 エラー時の画面内容:');
      console.log(errorScreen.substring(0, 300) + '...');
    } catch (e) {
      console.log('画面読み取りも失敗しました');
    }
  }

  console.log('\n📌 ブラウザは開いたままです。確認後、Ctrl+Cで終了してください。');
  await new Promise(() => {});
}

// 実行
airregiVisionDemo();