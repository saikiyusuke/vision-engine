const { chromium } = require('playwright');

async function downloadAirregiReport() {
  console.log('🚀 Airレジ売上レポート自動化を開始します...');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // 動作を見やすく
  });

  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();

  try {
    // 1. Airレジにアクセス
    console.log('📍 Airレジにアクセス中...');
    await page.goto('https://airregi.jp/');
    await page.waitForLoadState('networkidle');

    // 2. ログイン
    console.log('🔐 ログイン中...');
    await page.fill('input[name="username"]', 'rsc_yamaguchi@yamatech.co.jp');
    await page.fill('input[name="password"]', 'openmart1120');
    await page.click('input[type="submit"]');
    
    // ログイン後の遷移を待つ
    await page.waitForTimeout(3000);
    console.log('📍 現在のURL:', page.url());

    // 店舗選択ページの場合
    if (page.url().includes('choose-store')) {
      console.log('🏪 店舗を選択中...');
      await page.click('text=オープンマート');
      await page.waitForTimeout(2000);
    }

    // メインページへ移動
    console.log('📍 売上ページへアクセス...');
    await page.goto('https://airregi.jp/CLP/view/salesList/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 商品別売上へ移動
    console.log('📊 商品別売上ページへ移動中...');
    try {
      // まず商品別売上のタブやリンクを探す
      const productSalesLink = await page.locator('a:has-text("商品別売上")').first();
      if (await productSalesLink.isVisible()) {
        await productSalesLink.click();
      } else {
        // 直接URLで移動
        await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
      }
      await page.waitForLoadState('networkidle');
      console.log('✅ 商品別売上ページに到達');
    } catch (e) {
      console.log('⚠️ 商品別売上ページへの移動に失敗。直接URLで移動します。');
      await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    }

    // 日付設定（昨日）
    console.log('📅 日付を設定中...');
    await page.waitForTimeout(2000);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // 日付範囲の設定ボタンをクリック
    const dateRangeButton = await page.locator('button:has-text("日付範囲")').first();
    if (await dateRangeButton.isVisible()) {
      await dateRangeButton.click();
      await page.waitForTimeout(1000);
    }

    // 開始日と終了日を設定
    try {
      await page.fill('input[type="date"]:first-of-type', dateStr);
      await page.fill('input[type="date"]:last-of-type', dateStr);
    } catch (e) {
      // 別の方法で日付入力を試みる
      const dateInputs = await page.locator('input[type="date"]').all();
      if (dateInputs.length >= 2) {
        await dateInputs[0].fill(dateStr);
        await dateInputs[1].fill(dateStr);
      }
    }

    // 適用ボタンをクリック
    await page.click('button:has-text("適用")');
    await page.waitForTimeout(3000);

    // バリエーション表示（必要な場合）
    console.log('🔄 表示設定を確認中...');
    const variationButton = await page.locator('button:has-text("バリエーション")').first();
    if (await variationButton.isVisible()) {
      await variationButton.click();
      await page.waitForTimeout(2000);
    }

    // CSVダウンロード
    console.log('💾 CSVをダウンロード中...');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('a:has-text("CSV")')
    ]);

    const downloadPath = await download.path();
    console.log('✅ ダウンロード完了:', downloadPath);

    // FTPサイトへアップロード
    console.log('☁️ FTPサイトへアップロード中...');
    await page.goto('https://partner.openmart.jp/saleslist_bymenu/upload/');
    await page.waitForLoadState('networkidle');

    // パスワード入力（必要な場合）
    const passwordField = await page.locator('input[type="password"]').first();
    if (await passwordField.isVisible()) {
      await passwordField.fill('0000');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }

    // ファイルアップロード
    await page.setInputFiles('input[type="file"]', downloadPath);
    await page.click('button:has-text("アップロード")');
    await page.waitForTimeout(3000);

    console.log('🎉 完了！売上データが正常にアップロードされました。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    // スクリーンショットを保存
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 エラー時のスクリーンショットを保存しました: error-screenshot.png');
  } finally {
    await browser.close();
  }
}

// 実行
downloadAirregiReport();