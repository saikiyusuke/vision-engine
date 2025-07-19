require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');
const Client = require('ftp');
const fs = require('fs');
const path = require('path');

class AirregiFinalAutomation {
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

  // リトライ機能付き実行
  async withRetry(fn, name, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        this.log(`${name} 実行中... (試行 ${i + 1}/${maxRetries})`);
        const result = await fn();
        this.log(`${name} 成功`, 'success');
        return result;
      } catch (error) {
        this.log(`${name} 失敗: ${error.message}`, 'error');
        if (i === maxRetries - 1) throw error;
        await this.autoVision.page.waitForTimeout(5000);
      }
    }
  }

  // AirID 2段階ログイン
  async airIdLogin() {
    this.log('AirID 2段階ログイン開始');
    
    // Step 1: メールアドレス入力
    const emailFilled = await this.autoVision.fill(
      'AirIDまたはメールアドレスの入力欄',
      'rsc_yamaguchi@yamatech.co.jp'
    );
    if (emailFilled) {
      this.log('メールアドレス入力完了', 'success');
      await this.autoVision.page.waitForTimeout(2000);
    }
    
    // Step 2: 次へボタンをクリック（重要！）
    const nextPatterns = ['次へ', '次へボタン', '青いボタン', '続行'];
    let nextClicked = false;
    
    for (const pattern of nextPatterns) {
      if (await this.autoVision.click(pattern)) {
        this.log(`${pattern}をクリック`, 'success');
        nextClicked = true;
        break;
      }
    }
    
    if (!nextClicked) {
      // Enterキーで進む
      await this.autoVision.page.keyboard.press('Enter');
      this.log('Enterキーで次へ', 'success');
    }
    
    // パスワード画面への遷移を待つ
    await this.autoVision.page.waitForTimeout(5000);
    await this.screenshot('after-email');
    
    // Step 3: パスワード入力
    const passwordFilled = await this.autoVision.fill(
      'パスワード入力欄',
      'openmart1120'
    );
    if (passwordFilled) {
      this.log('パスワード入力完了', 'success');
      await this.autoVision.page.waitForTimeout(2000);
    }
    
    // Step 4: ログインボタンクリック
    const loginPatterns = ['ログイン', 'ログインボタン', '送信', 'サインイン'];
    let loginClicked = false;
    
    for (const pattern of loginPatterns) {
      if (await this.autoVision.click(pattern)) {
        this.log(`${pattern}をクリック`, 'success');
        loginClicked = true;
        break;
      }
    }
    
    if (!loginClicked) {
      await this.autoVision.page.keyboard.press('Enter');
      this.log('Enterキーでログイン', 'success');
    }
    
    // ログイン完了を待つ
    await this.autoVision.page.waitForTimeout(8000);
    await this.screenshot('after-login');
  }

  // 昨日の日付を設定
  async setYesterdayDate() {
    this.log('日付設定（昨日のデータ）');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // 開始日設定
    const startDateFilled = await this.autoVision.fill('開始日', dateStr);
    if (startDateFilled) {
      this.log(`開始日: ${dateStr}`, 'success');
    }
    
    await this.autoVision.page.waitForTimeout(1000);
    
    // 終了日設定
    const endDateFilled = await this.autoVision.fill('終了日', dateStr);
    if (endDateFilled) {
      this.log(`終了日: ${dateStr}`, 'success');
    }
    
    await this.autoVision.page.waitForTimeout(1000);
    
    // 検索ボタンクリック
    const searchPatterns = ['検索', '適用', '表示', '絞り込み'];
    for (const pattern of searchPatterns) {
      if (await this.autoVision.click(pattern)) {
        this.log(`${pattern}ボタンをクリック`, 'success');
        break;
      }
    }
    
    await this.autoVision.page.waitForTimeout(3000);
  }

  // CSVダウンロード
  async downloadCSV() {
    this.log('CSVダウンロード開始');
    
    // ダウンロードフォルダを設定
    const downloadPath = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath);
    }
    
    // ダウンロードイベントを待機
    const downloadPromise = this.autoVision.page.waitForEvent('download', { timeout: 30000 });
    
    // CSVダウンロードリンクをクリック
    const downloadPatterns = ['CSVダウンロード', 'CSV', 'ダウンロード', 'エクスポート'];
    let downloadClicked = false;
    
    for (const pattern of downloadPatterns) {
      if (await this.autoVision.click(pattern)) {
        this.log(`${pattern}をクリック`, 'success');
        downloadClicked = true;
        break;
      }
    }
    
    if (!downloadClicked) {
      throw new Error('CSVダウンロードリンクが見つかりません');
    }
    
    // ダウンロード完了を待つ
    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();
    const filePath = path.join(downloadPath, suggestedFilename);
    await download.saveAs(filePath);
    
    this.log(`CSV保存完了: ${filePath}`, 'success');
    this.downloadPath = filePath;
    return filePath;
  }

  // FTPアップロード
  async uploadToFTP(filePath) {
    this.log('FTPアップロード開始');
    
    return new Promise((resolve, reject) => {
      const ftp = new Client();
      
      ftp.on('ready', () => {
        this.log('FTP接続成功', 'success');
        
        // ファイル名を生成（日付付き）
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const remoteFile = `/saleslist_bymenu/airregi_${dateStr}.csv`;
        
        // アップロード実行
        ftp.put(filePath, remoteFile, (err) => {
          if (err) {
            this.log(`FTPアップロード失敗: ${err.message}`, 'error');
            ftp.end();
            reject(err);
          } else {
            this.log(`FTPアップロード完了: ${remoteFile}`, 'success');
            ftp.end();
            resolve();
          }
        });
      });
      
      ftp.on('error', (err) => {
        this.log(`FTP接続エラー: ${err.message}`, 'error');
        reject(err);
      });
      
      // FTP接続（OpenMartのダミー設定）
      ftp.connect({
        host: 'partner.openmart.jp',
        user: 'your_username', // 実際のユーザー名に変更
        password: 'your_password' // 実際のパスワードに変更
      });
    });
  }

  // メイン実行
  async run() {
    console.log('🚀 Airレジ完全自動化（最終版）\n');
    console.log('='.repeat(60));
    console.log('📋 実行内容:');
    console.log('1. AirID 2段階ログイン');
    console.log('2. 商品別売上ページへ移動');
    console.log('3. 昨日の日付でデータ取得');
    console.log('4. CSVダウンロード');
    console.log('5. FTPアップロード');
    console.log('='.repeat(60) + '\n');

    try {
      // ブラウザ起動
      await this.autoVision.launch({ 
        slowMo: 1000,
        contextOptions: { 
          acceptDownloads: true,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      // Step 1: ログイン
      await this.withRetry(
        async () => {
          await this.autoVision.goto('https://airregi.jp/CLP/view/salesList/');
          await this.autoVision.page.waitForTimeout(3000);
          await this.airIdLogin();
        },
        'ログイン'
      );

      // Step 2: 店舗選択（必要な場合）
      const currentScreen = await this.autoVision.readScreen();
      if (currentScreen.includes('店舗') && currentScreen.includes('選択')) {
        await this.withRetry(
          async () => {
            await this.autoVision.click('オープンマート');
            await this.autoVision.page.waitForTimeout(5000);
          },
          '店舗選択'
        );
      }

      // Step 3: 商品別売上ページへ
      await this.withRetry(
        async () => {
          const screen = await this.autoVision.readScreen();
          if (!screen.includes('商品別売上')) {
            // 直接URLでアクセス
            await this.autoVision.goto('https://airregi.jp/CLP/view/salesListByMenu/');
            await this.autoVision.page.waitForTimeout(5000);
          }
        },
        '商品別売上ページへ移動'
      );

      // Step 4: 日付設定
      await this.withRetry(
        async () => await this.setYesterdayDate(),
        '日付設定'
      );

      // Step 5: CSVダウンロード
      const csvPath = await this.withRetry(
        async () => await this.downloadCSV(),
        'CSVダウンロード'
      );

      // Step 6: FTPアップロード（実際の認証情報が必要）
      console.log('\n⚠️  FTPアップロードはテストモードです');
      console.log('実際のアップロードには認証情報の設定が必要です');
      // await this.uploadToFTP(csvPath);

      // 完了
      console.log('\n' + '='.repeat(60));
      console.log('🎉 完全自動化成功！');
      console.log('='.repeat(60));
      console.log('✅ ログイン → 商品別売上 → CSV取得 完了');
      console.log(`📄 CSVファイル: ${csvPath}`);
      console.log('📤 FTPアップロード: 認証情報設定後に有効化');

    } catch (error) {
      await this.log(`致命的エラー: ${error.message}`, 'error');
      await this.screenshot('fatal-error');
    }

    console.log('\n📌 ブラウザは開いたままです（デバッグ用）');
    await new Promise(() => {}); // ブラウザを開いたままにする
  }
}

// 実行
if (require.main === module) {
  const automation = new AirregiFinalAutomation();
  automation.run().catch(console.error);
}

module.exports = AirregiFinalAutomation;