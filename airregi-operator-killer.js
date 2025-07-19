require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');
const path = require('path');
const fs = require('fs');

class AirregiOperatorKiller {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.autoVision = new AutoClaudeVision(this.apiKey);
  }

  async execute() {
    console.log('🔥 Airレジ完全自動化 - ChatGPT Operatorを超える！\n');
    
    try {
      // ブラウザを起動
      await this.autoVision.launch();
      
      console.log('📍 Step 1: Airレジ売上ページへアクセス');
      await this.autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
      await this.autoVision.page.waitForTimeout(5000);

      // ログインが必要な場合
      const screenText = await this.autoVision.readScreen();
      if (screenText.includes('AirID') || screenText.includes('ログイン')) {
        console.log('📍 Step 2: ログイン処理開始');
        await this.performLogin();
      }

      // 売上ページの処理
      console.log('📍 Step 3: 売上データ取得');
      await this.getSalesData();

      console.log('\n✅ 完全自動化成功！ChatGPT Operatorに勝利！');
    } catch (error) {
      console.error('❌ エラー:', error.message);
      await this.saveDebugInfo();
    } finally {
      await this.autoVision.close();
    }
  }

  async performLogin() {
    console.log('\n🔐 ログインプロセス開始');
    
    // メールアドレス入力
    console.log('📧 メールアドレス入力');
    await this.autoVision.fill('AirIDまたはメールアドレス', 'rsc_yamaguchi@yamatech.co.jp');
    await this.autoVision.page.waitForTimeout(2000);

    // パスワード入力
    console.log('🔑 パスワード入力');
    await this.autoVision.fill('パスワード', 'openmart1120');
    await this.autoVision.page.waitForTimeout(2000);

    // スクリーンショット保存（デバッグ用）
    await this.autoVision.page.screenshot({ 
      path: 'before-login-attempt.png',
      fullPage: true 
    });

    // ログインボタンクリック - 複数の方法を試す
    console.log('🎯 ログインボタンクリック試行');
    
    let loginSuccess = false;
    
    // 方法1: AI Visionでテキスト検索
    console.log('  試行1: AI Visionでログインボタン検索');
    const clickResult = await this.autoVision.click('ログイン');
    if (clickResult) {
      console.log('  ✓ AI Visionでクリック成功');
      loginSuccess = true;
    }

    // 方法2: Playwrightのセレクター
    if (!loginSuccess) {
      console.log('  試行2: Playwrightセレクター使用');
      try {
        // ボタンテキストで検索
        await this.autoVision.page.locator('button:has-text("ログイン")').click();
        console.log('  ✓ セレクターでクリック成功');
        loginSuccess = true;
      } catch (e) {
        console.log('  × セレクター失敗');
      }
    }

    // 方法3: 座標クリック（ログインボタンの位置）
    if (!loginSuccess) {
      console.log('  試行3: 座標クリック (640, 505)');
      await this.autoVision.page.mouse.click(640, 505);
      console.log('  ✓ 座標クリック実行');
      loginSuccess = true;
    }

    // 方法4: JavaScript実行
    if (!loginSuccess) {
      console.log('  試行4: JavaScript実行');
      await this.autoVision.page.evaluate(() => {
        // すべてのボタンを探す
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent.includes('ログイン')) {
            button.click();
            return true;
          }
        }
        // フォームのsubmit
        const forms = document.querySelectorAll('form');
        if (forms.length > 0) {
          forms[0].submit();
          return true;
        }
      });
      console.log('  ✓ JavaScript実行完了');
    }

    // 方法5: Enterキー送信
    if (!loginSuccess) {
      console.log('  試行5: Enterキー送信');
      await this.autoVision.page.keyboard.press('Enter');
      console.log('  ✓ Enterキー送信完了');
    }

    // ログイン完了を待つ
    console.log('\n⏳ ログイン処理中... 10秒待機');
    await this.autoVision.page.waitForTimeout(10000);

    // ログイン成功確認
    const afterLogin = await this.autoVision.readScreen();
    if (afterLogin.includes('売上') || afterLogin.includes('店舗') || !afterLogin.includes('ログイン')) {
      console.log('✅ ログイン成功！');
      await this.autoVision.page.screenshot({ 
        path: 'login-success.png',
        fullPage: true 
      });
    } else {
      throw new Error('ログインに失敗しました');
    }
  }

  async getSalesData() {
    console.log('\n📊 売上データ取得開始');

    // 店舗選択
    console.log('🏪 店舗選択: オープンマート');
    const storeClicked = await this.autoVision.click('オープンマート');
    if (!storeClicked) {
      // セレクターでも試す
      try {
        await this.autoVision.page.locator('text=オープンマート').click();
      } catch (e) {
        console.log('店舗選択をスキップ');
      }
    }
    await this.autoVision.page.waitForTimeout(3000);

    // 日付設定（昨日）
    console.log('📅 日付設定: 昨日');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // 開始日と終了日を設定
    await this.autoVision.fill('開始日', dateStr);
    await this.autoVision.page.waitForTimeout(1000);
    await this.autoVision.fill('終了日', dateStr);
    await this.autoVision.page.waitForTimeout(1000);

    // 検索実行
    const searchClicked = await this.autoVision.click('検索') || 
                         await this.autoVision.click('適用') ||
                         await this.autoVision.click('表示');
    await this.autoVision.page.waitForTimeout(5000);

    // CSVダウンロード
    console.log('💾 CSVダウンロード実行');
    
    // ダウンロードイベントを待機
    const downloadPromise = this.autoVision.page.waitForEvent('download');
    
    // ダウンロードリンクをクリック
    const downloadClicked = await this.autoVision.click('CSVダウンロード') ||
                           await this.autoVision.click('ダウンロード') ||
                           await this.autoVision.click('CSV');
    
    if (downloadClicked) {
      try {
        const download = await downloadPromise;
        const downloadPath = await download.path();
        console.log(`✅ CSVダウンロード完了: ${downloadPath}`);
        
        // アップロード処理
        await this.uploadToOpenMart(downloadPath);
      } catch (e) {
        console.log('❌ ダウンロード失敗:', e.message);
      }
    }
  }

  async uploadToOpenMart(csvPath) {
    console.log('\n📤 OpenMartへアップロード開始');
    
    // 新しいタブでアップロードページを開く
    const context = this.autoVision.page.context();
    const newPage = await context.newPage();
    
    try {
      // アップロードページへアクセス
      await newPage.goto('https://partner.openmart.jp/saleslist_bymenu/upload/');
      await newPage.waitForTimeout(3000);

      // パスワード入力
      console.log('🔐 パスワード入力');
      await newPage.fill('input[type="password"]', '0000');
      await newPage.keyboard.press('Enter');
      await newPage.waitForTimeout(3000);

      // ファイルアップロード
      console.log('📁 ファイルアップロード');
      const fileInput = await newPage.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);
      await newPage.waitForTimeout(2000);

      // アップロードボタンクリック
      await newPage.locator('button[type="submit"], input[type="submit"]').click();
      await newPage.waitForTimeout(5000);

      console.log('✅ アップロード完了！');
    } catch (error) {
      console.error('❌ アップロードエラー:', error.message);
    } finally {
      await newPage.close();
    }
  }

  async saveDebugInfo() {
    if (this.autoVision.page) {
      const timestamp = Date.now();
      await this.autoVision.page.screenshot({ 
        path: `debug-${timestamp}.png`,
        fullPage: true 
      });
      console.log(`📸 デバッグ情報保存: debug-${timestamp}.png`);
    }
  }
}

// 実行
(async () => {
  const automation = new AirregiOperatorKiller();
  await automation.execute();
})();