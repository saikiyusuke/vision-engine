const { chromium } = require('playwright');

async function downloadAirregiReport() {
  console.log('🚀 Airレジ売上レポート自動化を開始します...');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();

  try {
    // 1. 売上ページにアクセス（自動的にログインページにリダイレクトされる）
    console.log('📍 Airレジにアクセス中...');
    await page.goto('https://airregi.jp/CLP/view/salesList/');
    await page.waitForLoadState('networkidle');
    
    // ログインページにリダイレクトされるのを待つ
    console.log('🔐 ログインページで認証中...');
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    // 2. ログイン
    await page.fill('input[name="username"]', 'rsc_yamaguchi@yamatech.co.jp');
    
    // 可視のパスワードフィールドを選択
    const visiblePasswordField = await page.locator('input[type="password"]:visible').first();
    await visiblePasswordField.fill('openmart1120');
    
    // ログインボタンをクリック
    await page.click('input[type="submit"]');
    
    // ログイン後の遷移を待つ
    console.log('⏳ ログイン処理中...');
    await page.waitForTimeout(5000);
    
    // 店舗選択ページの確認
    if (page.url().includes('choose-store')) {
      console.log('🏪 店舗を選択中...');
      await page.click('text=オープンマート');
      await page.waitForTimeout(3000);
    }
    
    // 売上ページに到達するまで待つ
    await page.waitForURL('**/CLP/**', { timeout: 10000 });
    console.log('✅ Airレジメインページに到達');
    
    // 3. 商品別売上へ移動
    console.log('📊 商品別売上ページへ移動中...');
    // 直接URLで移動（最も確実な方法）
    await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await page.waitForLoadState('networkidle');
    console.log('✅ 商品別売上ページに到達');
    
    // 4. 日付設定
    console.log('📅 日付を設定中...');
    await page.waitForTimeout(2000);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // 日付入力フィールドを探して入力
    const dateInputs = await page.locator('input[type="date"]').all();
    if (dateInputs.length >= 2) {
      await dateInputs[0].fill(dateStr);
      await dateInputs[1].fill(dateStr);
      console.log('✅ 日付を設定しました:', dateStr);
    }
    
    // 検索または適用ボタンをクリック
    try {
      await page.click('button:has-text("検索")', { timeout: 3000 });
    } catch {
      try {
        await page.click('button:has-text("適用")', { timeout: 3000 });
      } catch {
        console.log('⚠️ 検索/適用ボタンが見つかりませんでした');
      }
    }
    
    await page.waitForTimeout(3000);
    
    // 5. CSVダウンロード
    console.log('💾 CSVをダウンロード中...');
    
    // ダウンロードリンクを探す
    let downloadPath;
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        page.click('a:has-text("CSV")')
      ]);
      downloadPath = await download.path();
      console.log('✅ ダウンロード完了:', downloadPath);
    } catch (e) {
      console.log('❌ CSVダウンロードに失敗しました:', e.message);
      throw e;
    }
    
    // 6. FTPサイトへアップロード
    console.log('☁️ FTPサイトへアップロード中...');
    await page.goto('https://partner.openmart.jp/saleslist_bymenu/upload/');
    await page.waitForLoadState('networkidle');
    
    // パスワード入力（必要な場合）
    try {
      const passwordField = await page.locator('input[type="password"]').first();
      if (await passwordField.isVisible({ timeout: 3000 })) {
        console.log('🔐 アップロードサイトのパスワード入力中...');
        await passwordField.fill('0000');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
      }
    } catch {
      console.log('ℹ️ パスワード入力は不要でした');
    }
    
    // ファイルアップロード
    console.log('📁 ファイルをアップロード中...');
    await page.setInputFiles('input[type="file"]', downloadPath);
    
    // アップロードボタンをクリック
    try {
      await page.click('button:has-text("アップロード")');
    } catch {
      await page.click('input[type="submit"]');
    }
    
    await page.waitForTimeout(3000);
    
    console.log('🎉 完了！売上データが正常にアップロードされました。');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 エラー時のスクリーンショットを保存しました');
  } finally {
    // ブラウザは開いたままにする（デバッグ用）
    console.log('\n📌 ブラウザは開いたままです。確認後、手動で閉じてください。');
  }
}

// 実行
downloadAirregiReport();