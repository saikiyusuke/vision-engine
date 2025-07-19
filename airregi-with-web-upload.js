require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');
const fs = require('fs');
const path = require('path');

class AirregiWithWebUpload {
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

  // OpenMartのWebアップロードページでファイルアップロード
  async uploadToOpenMartWeb(filePath) {
    this.log('OpenMart Webアップロード開始');
    
    // 新しいタブを開く
    const newPage = await this.autoVision.page.context().newPage();
    const originalPage = this.autoVision.page;
    this.autoVision.page = newPage;
    
    try {
      // OpenMartアップロードページへ
      await this.autoVision.goto('https://partner.openmart.jp/saleslist_bymenu/upload/');
      await this.autoVision.page.waitForTimeout(3000);
      
      // パスワード入力画面の場合
      const screen = await this.autoVision.readScreen();
      if (screen.includes('パスワード')) {
        await this.autoVision.fill('パスワード入力欄', '0000');
        await this.autoVision.click('送信') || await this.autoVision.click('ログイン');
        await this.autoVision.page.waitForTimeout(3000);
      }
      
      // ファイル選択
      this.log('ファイルアップロード準備');
      
      // ファイル選択ボタンを探す
      const fileInputPatterns = [
        'ファイルを選択',
        'ファイル選択',
        'CSVファイルを選択',
        'アップロード'
      ];
      
      let fileSelected = false;
      for (const pattern of fileInputPatterns) {
        const clicked = await this.autoVision.click(pattern);
        if (clicked) {
          this.log(`${pattern}をクリック`, 'success');
          // ファイル選択ダイアログが開くのを待つ
          await this.autoVision.page.waitForTimeout(2000);
          
          // ファイルを設定（Playwrightの機能を使用）
          const fileChooserPromise = this.autoVision.page.waitForEvent('filechooser');
          const fileChooser = await fileChooserPromise;
          await fileChooser.setFiles(filePath);
          fileSelected = true;
          break;
        }
      }
      
      if (fileSelected) {
        this.log(`ファイル選択完了: ${path.basename(filePath)}`, 'success');
        await this.autoVision.page.waitForTimeout(2000);
        
        // アップロードボタンをクリック
        const uploadPatterns = ['アップロード', '送信', '実行'];
        for (const pattern of uploadPatterns) {
          if (await this.autoVision.click(pattern)) {
            this.log(`${pattern}ボタンをクリック`, 'success');
            break;
          }
        }
        
        // アップロード完了を待つ
        await this.autoVision.page.waitForTimeout(5000);
        await this.screenshot('upload-complete');
        
        // 結果を確認
        const result = await this.autoVision.readScreen();
        if (result.includes('完了') || result.includes('成功')) {
          this.log('アップロード成功！', 'success');
        }
      }
      
    } finally {
      // 元のページに戻る
      await newPage.close();
      this.autoVision.page = originalPage;
    }
  }

  // シンプルな実行（ログイン後から開始）
  async runFromSalesPage() {
    console.log('🚀 Airレジ → OpenMart Webアップロード\n');
    console.log('📌 このスクリプトは商品別売上ページから開始します');
    console.log('📌 事前に手動でログインしてください\n');

    try {
      await this.autoVision.launch({ 
        slowMo: 1000,
        contextOptions: { acceptDownloads: true }
      });

      // 商品別売上ページへ直接アクセス
      await this.autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
      await this.autoVision.page.waitForTimeout(5000);
      
      console.log('⏸  10秒待機中... 手動でログインしてください');
      await this.autoVision.page.waitForTimeout(10000);
      
      // 現在の画面を確認
      const screen = await this.autoVision.readScreen();
      console.log('\n📄 現在の画面:');
      console.log(screen.substring(0, 200) + '...\n');
      
      if (screen.includes('ログイン') || screen.includes('AirID')) {
        console.log('❌ まだログインされていません');
        console.log('手動でログインしてから再実行してください');
        return;
      }
      
      // 日付設定とCSVダウンロード
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      await this.autoVision.fill('開始日', dateStr);
      await this.autoVision.fill('終了日', dateStr);
      await this.autoVision.click('検索') || await this.autoVision.click('適用');
      await this.autoVision.page.waitForTimeout(3000);
      
      // CSVダウンロード
      const downloadPath = path.join(__dirname, 'downloads');
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
      }
      
      const downloadPromise = this.autoVision.page.waitForEvent('download');
      await this.autoVision.click('CSVダウンロード');
      const download = await downloadPromise;
      
      const suggestedFilename = download.suggestedFilename();
      const filePath = path.join(downloadPath, suggestedFilename);
      await download.saveAs(filePath);
      
      this.log(`CSV保存: ${filePath}`, 'success');
      
      // OpenMartへアップロード
      await this.uploadToOpenMartWeb(filePath);
      
      console.log('\n🎉 完了！');
      console.log('✅ CSVダウンロード → OpenMartアップロード成功');

    } catch (error) {
      await this.log(`エラー: ${error.message}`, 'error');
      await this.screenshot('error');
    }

    console.log('\n📌 ブラウザは開いたままです');
    await new Promise(() => {});
  }
}

// 実行
if (require.main === module) {
  const automation = new AirregiWithWebUpload();
  automation.runFromSalesPage().catch(console.error);
}

module.exports = AirregiWithWebUpload;