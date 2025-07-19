require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');
const fs = require('fs');
const path = require('path');

class AirregiCompleteAutomation {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.autoVision = new AutoClaudeVision(this.apiKey);
    this.downloadPath = null;
    this.stepCount = 0;
  }

  async log(message, type = 'info') {
    this.stepCount++;
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📍';
    console.log(`[${timestamp}] ${prefix} Step ${this.stepCount}: ${message}`);
  }

  async screenshot(name) {
    const filename = `airregi-${name}-${Date.now()}.png`;
    await this.autoVision.screenshot(filename);
    this.log(`スクリーンショット保存: ${filename}`, 'info');
  }

  async run() {
    console.log('🚀 Airレジ完全自動化（AI Vision版）\n');
    console.log('このスクリプトは以下を自動実行します:');
    console.log('1. ログイン');
    console.log('2. 商品別売上データ取得');
    console.log('3. CSVダウンロード');
    console.log('4. FTPアップロード\n');

    try {
      // ブラウザ起動
      await this.autoVision.launch({ 
        slowMo: 1000,
        contextOptions: { acceptDownloads: true }
      });

      // Step 1: ログイン
      await this.login();

      // Step 2: 商品別売上ページへ
      await this.navigateToSalesPage();

      // Step 3: 日付設定
      await this.setDateRange();

      // Step 4: CSVダウンロード
      await this.downloadCSV();

      // Step 5: FTPアップロード
      await this.uploadToFTP();

      console.log('\n' + '='.repeat(60));
      console.log('🎉 完全自動化成功！');
      console.log('='.repeat(60));
      console.log('✅ ログイン → 商品別売上 → CSV → FTPアップロード');
      console.log('すべてAI Visionで自動実行しました！');

    } catch (error) {
      await this.log(`エラー: ${error.message}`, 'error');
      await this.screenshot('error');
    }

    console.log('\n📌 ブラウザは開いたままです');
    await new Promise(() => {});
  }

  async login() {
    await this.log('ログインプロセス開始');
    
    // 売上ページ経由でログイン（自動的にログインページへリダイレクト）
    await this.autoVision.goto('https://airregi.jp/CLP/view/salesList/');
    await this.autoVision.page.waitForTimeout(3000);

    // ログインページかチェック
    const pageText = await this.autoVision.readScreen();
    
    if (pageText.includes('ログイン') || pageText.includes('パスワード')) {
      await this.log('ログインページを検出');
      
      // ユーザー名入力
      const usernameFilled = await this.autoVision.fill(
        'ユーザー名またはメールアドレスの入力欄',
        'rsc_yamaguchi@yamatech.co.jp'
      );
      if (usernameFilled) await this.log('ユーザー名入力完了', 'success');

      // パスワード入力
      const passwordFilled = await this.autoVision.fill(
        'パスワードの入力欄',
        'openmart1120'
      );
      if (passwordFilled) await this.log('パスワード入力完了', 'success');

      // ログインボタンクリック
      const loginClicked = await this.autoVision.click('ログインボタンまたは送信ボタン');
      if (loginClicked) {
        await this.log('ログインボタンクリック', 'success');
      } else {
        // Enterキーでログイン
        await this.autoVision.page.keyboard.press('Enter');
        await this.log('Enterキーでログイン', 'success');
      }

      // ログイン完了を待つ
      await this.autoVision.page.waitForTimeout(5000);
      await this.screenshot('after-login');
    }

    // 店舗選択が必要かチェック
    const afterLoginText = await this.autoVision.readScreen();
    if (afterLoginText.includes('店舗') && afterLoginText.includes('選択')) {
      await this.log('店舗選択画面を検出');
      const storeClicked = await this.autoVision.click('オープンマートという店舗名');
      if (storeClicked) {
        await this.log('店舗選択完了', 'success');
        await this.autoVision.page.waitForTimeout(3000);
      }
    }
  }

  async navigateToSalesPage() {
    await this.log('商品別売上ページへ移動');
    
    // 商品別売上メニューをクリック
    const menuClicked = await this.autoVision.click('商品別売上のメニューまたはリンク');
    
    if (!menuClicked) {
      // 直接URLで移動
      await this.log('直接URLで商品別売上ページへ');
      await this.autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
    }
    
    await this.autoVision.page.waitForTimeout(3000);
    await this.screenshot('sales-page');
    await this.log('商品別売上ページ到達', 'success');
  }

  async setDateRange() {
    await this.log('日付範囲を昨日に設定');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // 日付範囲ボタンがある場合はクリック
    await this.autoVision.click('日付範囲のボタンまたは日付設定');
    await this.autoVision.page.waitForTimeout(1000);

    // 開始日設定
    const startDateSet = await this.autoVision.fill('開始日の入力欄または最初の日付欄', dateStr);
    if (startDateSet) await this.log(`開始日設定: ${dateStr}`, 'success');

    // 終了日設定
    const endDateSet = await this.autoVision.fill('終了日の入力欄または2番目の日付欄', dateStr);
    if (endDateSet) await this.log(`終了日設定: ${dateStr}`, 'success');

    // 検索・適用ボタンをクリック
    const searchClicked = await this.autoVision.click('検索ボタンまたは適用ボタンまたは実行ボタン');
    if (searchClicked) {
      await this.log('検索実行', 'success');
      await this.autoVision.page.waitForTimeout(3000);
    }
  }

  async downloadCSV() {
    await this.log('CSVダウンロード開始');
    await this.screenshot('before-download');

    // ダウンロードの準備
    const downloadPromise = this.autoVision.page.waitForEvent('download');

    // CSVダウンロードリンクをクリック
    const downloadClicked = await this.autoVision.click('CSVダウンロードリンクまたはCSVボタン');
    
    if (downloadClicked) {
      await this.log('CSVダウンロードリンクをクリック', 'success');
      
      try {
        // ダウンロード完了を待つ
        const download = await downloadPromise;
        this.downloadPath = await download.path();
        await this.log(`CSVダウンロード完了: ${this.downloadPath}`, 'success');
      } catch (e) {
        await this.log('ダウンロード検出に失敗', 'error');
      }
    }

    await this.autoVision.page.waitForTimeout(3000);
  }

  async uploadToFTP() {
    if (!this.downloadPath) {
      await this.log('ダウンロードファイルがありません', 'error');
      return;
    }

    await this.log('FTPアップロード開始');
    
    // FTPサイトへ移動
    await this.autoVision.goto('https://partner.openmart.jp/saleslist_bymenu/upload/');
    await this.autoVision.page.waitForTimeout(3000);

    // パスワード入力が必要かチェック
    const ftpPageText = await this.autoVision.readScreen();
    if (ftpPageText.includes('パスワード')) {
      await this.log('FTPサイトのパスワード入力');
      const pwFilled = await this.autoVision.fill('パスワードの入力欄', '0000');
      if (pwFilled) {
        await this.autoVision.page.keyboard.press('Enter');
        await this.log('パスワード入力完了', 'success');
        await this.autoVision.page.waitForTimeout(2000);
      }
    }

    // ファイルアップロード
    await this.log('ファイルアップロード処理');
    
    // ファイル選択ボタンをクリック
    const fileInputClicked = await this.autoVision.click('ファイルを選択ボタンまたはファイル選択');
    
    if (fileInputClicked) {
      // PlaywrightのsetInputFilesを使用
      await this.autoVision.page.setInputFiles('input[type="file"]', this.downloadPath);
      await this.log('ファイル選択完了', 'success');
      
      // アップロードボタンをクリック
      const uploadClicked = await this.autoVision.click('アップロードボタンまたは送信ボタン');
      if (uploadClicked) {
        await this.log('アップロード実行', 'success');
        await this.autoVision.page.waitForTimeout(3000);
        await this.screenshot('upload-complete');
      }
    }
  }
}

// 実行
const automation = new AirregiCompleteAutomation();
automation.run();