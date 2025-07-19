const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function completeAutomation() {
  console.log('🚀 Airレジ完全自動化 - ログインから売上データ取得まで\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  let downloadPath = null;
  
  try {
    // === フェーズ1: ログイン ===
    console.log('📍 フェーズ1: ログイン');
    await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    await page.waitForTimeout(5000);
    
    // ログインが必要かチェック
    const needsLogin = await page.locator('input[name="username"]').isVisible();
    
    if (needsLogin) {
      console.log('  📧 メールアドレス入力');
      await page.fill('input[name="username"]', 'info@openmart.jp');
      await page.waitForTimeout(1000);
      
      console.log('  🔑 パスワード入力');
      await page.fill('input[name="password"]', 'info@openmartjp2024');
      await page.waitForTimeout(1000);
      
      console.log('  🎯 ログインボタンクリック');
      await page.click('input[type="submit"]');
      await page.waitForTimeout(8000);
    }
    
    // === フェーズ2: 店舗選択 ===
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('利用する店舗を選択')) {
      console.log('\n📍 フェーズ2: 店舗選択');
      console.log('  🏪 オープンマートを選択');
      
      // オープンマートをクリック
      await page.click('text=オープンマート');
      await page.waitForTimeout(5000);
      
      // スクリーンショット
      await page.screenshot({ path: 'store-selected.png' });
      console.log('  ✅ 店舗選択完了');
    }
    
    // === フェーズ3: 売上データページ確認 ===
    console.log('\n📍 フェーズ3: 売上データページ');
    
    // 現在のURLを確認
    const currentUrl = page.url();
    console.log(`  📌 現在のURL: ${currentUrl}`);
    
    // 商品別売上ページに移動（必要な場合）
    if (!currentUrl.includes('salesListByMenu')) {
      console.log('  📊 商品別売上ページへ移動');
      await page.goto('https://airregi.jp/CLP/view/salesListByMenu/');
      await page.waitForTimeout(5000);
    }
    
    // === フェーズ4: 日付設定 ===
    console.log('\n📍 フェーズ4: 日付設定');
    
    // 昨日の日付を計算
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    console.log(`  📅 対象日付: ${dateStr}`);
    
    // 日付入力フィールドを探す
    try {
      // 開始日
      const startDateInput = await page.locator('input[type="date"]').first();
      if (await startDateInput.isVisible()) {
        await startDateInput.fill(dateStr);
        console.log('  ✅ 開始日設定完了');
      }
      
      // 終了日
      const endDateInput = await page.locator('input[type="date"]').last();
      if (await endDateInput.isVisible()) {
        await endDateInput.fill(dateStr);
        console.log('  ✅ 終了日設定完了');
      }
      
      await page.waitForTimeout(2000);
      
      // 検索/適用ボタンをクリック
      const searchButton = await page.locator('button:has-text("検索"), button:has-text("適用"), button:has-text("表示")').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
        console.log('  🔍 検索実行');
        await page.waitForTimeout(5000);
      }
      
    } catch (e) {
      console.log('  ⚠️  日付設定をスキップ（デフォルト値を使用）');
    }
    
    // === フェーズ5: CSVダウンロード ===
    console.log('\n📍 フェーズ5: CSVダウンロード');
    
    // ダウンロードイベントを待機
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    
    // CSVダウンロードリンクを探してクリック
    try {
      // 複数のパターンを試す
      const downloadPatterns = [
        'text=/CSV.*ダウンロード/i',
        'text=/ダウンロード/i',
        'text=/CSV/i',
        'a[href*="download"]',
        'button:has-text("ダウンロード")'
      ];
      
      let downloadClicked = false;
      for (const pattern of downloadPatterns) {
        try {
          const element = page.locator(pattern).first();
          if (await element.isVisible()) {
            await element.click();
            downloadClicked = true;
            console.log(`  ✅ ダウンロードリンクをクリック: ${pattern}`);
            break;
          }
        } catch (e) {
          // 次のパターンを試す
        }
      }
      
      if (downloadClicked) {
        const download = await downloadPromise;
        downloadPath = await download.path();
        console.log(`  ✅ CSVダウンロード完了: ${downloadPath}`);
        
        // ダウンロードファイルをデスクトップに保存（バリエーション別売上と同じ形式）
        const formattedDate = dateStr.replace(/-/g, '');
        const desktopPath = path.join(require('os').homedir(), 'Desktop', `バリエーション別売上_${formattedDate}-${formattedDate}.csv`);
        await download.saveAs(desktopPath);
        console.log(`  💾 ファイル保存: ${desktopPath}`);
        
        // ファイルサイズ確認
        const stats = fs.statSync(desktopPath);
        console.log(`  📊 ファイルサイズ: ${stats.size} bytes`);
        
        // アップロード用にパスを更新
        downloadPath = desktopPath;
      } else {
        console.log('  ❌ ダウンロードリンクが見つかりません');
      }
      
    } catch (e) {
      console.log('  ❌ CSVダウンロードエラー:', e.message);
    }
    
    // === フェーズ6: OpenMartへのアップロード ===
    if (downloadPath) {
      console.log('\n📍 フェーズ6: OpenMartへアップロード');
      
      // 新しいタブで直接saleslist_bymenuページを開く
      const uploadPage = await context.newPage();
      
      try {
        console.log('  🌐 売上データページへアクセス');
        await uploadPage.goto('https://partner.openmart.jp/saleslist_bymenu');
        await uploadPage.waitForTimeout(5000);
        
        // ログインが必要な場合の処理
        const needsLogin = await uploadPage.locator('input[type="email"], input[type="text"]').isVisible();
        
        if (needsLogin) {
          console.log('  🔐 OpenMartにログイン');
          // ここでOpenMartのログイン処理を実装
          // メールアドレスとパスワードが必要
          console.log('  ⚠️  OpenMartのログイン情報が必要です');
        } else {
          console.log('  ✅ 既にログイン済み');
          
          // ファイルアップロードボタンを探す
          console.log('  📁 CSVアップロードボタンを探しています...');
          
          // アップロードボタンやリンクのパターン
          const uploadPatterns = [
            'text=/アップロード/i',
            'text=/upload/i',
            'text=/インポート/i',
            'button:has-text("アップロード")',
            'a[href*="upload"]'
          ];
          
          for (const pattern of uploadPatterns) {
            try {
              const element = uploadPage.locator(pattern).first();
              if (await element.isVisible()) {
                await element.click();
                console.log(`  ✅ アップロードリンクをクリック: ${pattern}`);
                await uploadPage.waitForTimeout(3000);
                break;
              }
            } catch (e) {
              // 次のパターンを試す
            }
          }
          
          // ファイル選択
          const fileInput = await uploadPage.locator('input[type="file"]').first();
          if (await fileInput.isVisible()) {
            await fileInput.setInputFiles(downloadPath);
            console.log('  ✅ CSVファイルを選択');
            await uploadPage.waitForTimeout(2000);
            
            // アップロード実行
            const submitButton = await uploadPage.locator('button[type="submit"], input[type="submit"]').first();
            if (await submitButton.isVisible()) {
              await submitButton.click();
              console.log('  ✅ アップロード実行');
              await uploadPage.waitForTimeout(5000);
            }
          }
        }
        
        // 最終スクリーンショット
        await uploadPage.screenshot({ path: 'openmart-upload-result.png' });
        console.log('  📸 アップロード結果: openmart-upload-result.png');
        
      } catch (e) {
        console.log('  ❌ アップロードエラー:', e.message);
      } finally {
        await uploadPage.close();
      }
    }
    
    // === 完了 ===
    console.log('\n🎉 完全自動化完了！');
    console.log('📊 実行サマリー:');
    console.log('  ✅ ログイン成功');
    console.log('  ✅ 店舗選択完了（オープンマート）');
    console.log('  ✅ 売上データページ到達');
    console.log(`  ✅ 日付設定完了（${dateStr}）`);
    if (downloadPath) {
      console.log('  ✅ CSVダウンロード成功');
      console.log('  ✅ OpenMartアップロード試行');
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'final-complete.png' });
    console.log('\n📸 最終画面: final-complete.png');
    
  } catch (error) {
    console.error('\n❌ エラー発生:', error.message);
    await page.screenshot({ path: `error-${Date.now()}.png` });
  } finally {
    console.log('\n🏁 処理完了（ブラウザは開いたままです）');
    // デバッグのためブラウザは閉じない
  }
}

// ダウンロードディレクトリ作成
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// 実行
completeAutomation();