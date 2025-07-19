const { chromium } = require('playwright');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

class ChromePasswordExtractor {
  constructor() {
    this.platform = os.platform();
    this.chromeDataPath = this.getChromeDataPath();
  }

  // Chromeのデータパスを取得
  getChromeDataPath() {
    if (this.platform === 'darwin') {
      // macOS
      return path.join(os.homedir(), 'Library/Application Support/Google/Chrome');
    } else if (this.platform === 'win32') {
      // Windows
      return path.join(os.homedir(), 'AppData/Local/Google/Chrome/User Data');
    } else {
      // Linux
      return path.join(os.homedir(), '.config/google-chrome');
    }
  }

  // Chrome保存パスワードを使用してブラウザを起動
  async launchWithChromePasswords() {
    console.log('🔐 Chrome統合モードで起動中...');
    console.log(`📁 Chromeプロファイル: ${this.chromeDataPath}`);

    try {
      // Chrome実行可能ファイルのパス
      let executablePath;
      if (this.platform === 'darwin') {
        executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      } else if (this.platform === 'win32') {
        executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      }

      // Chromeプロファイルを使用してブラウザを起動
      const browser = await chromium.launch({
        headless: false,
        executablePath,
        args: [
          `--user-data-dir=${this.chromeDataPath}`,
          '--profile-directory=Default', // または 'Profile 1' など
          '--enable-automation',
          '--no-sandbox'
        ],
        slowMo: 500
      });

      return browser;
    } catch (error) {
      console.log('⚠️ Chrome統合モードの起動に失敗しました:', error.message);
      
      // 代替方法: 通常のChromiumでChromeのCookieをインポート
      return await this.launchWithImportedCookies();
    }
  }

  // Chromeのクッキーをインポートして起動
  async launchWithImportedCookies() {
    console.log('🍪 ChromeのCookieをインポートしています...');
    
    const browser = await chromium.launch({
      headless: false,
      channel: 'chrome', // システムのChromeを使用
      slowMo: 500
    });

    const context = await browser.newContext();
    
    // ChromeのCookieをコピー
    try {
      const cookies = await this.extractChromeCookies('console.anthropic.com');
      if (cookies.length > 0) {
        await context.addCookies(cookies);
        console.log(`✅ ${cookies.length}個のCookieをインポートしました`);
      }
    } catch (e) {
      console.log('⚠️ Cookieのインポートに失敗:', e.message);
    }

    return browser;
  }

  // ChromeのCookieデータベースから抽出
  async extractChromeCookies(domain) {
    const cookiesPath = path.join(this.chromeDataPath, 'Default', 'Cookies');
    const cookies = [];

    return new Promise((resolve) => {
      // 一時的にコピー（ロックを避けるため）
      const tempPath = path.join(os.tmpdir(), 'chrome_cookies_temp.db');
      fs.copyFileSync(cookiesPath, tempPath);

      const db = new sqlite3.Database(tempPath, sqlite3.OPEN_READONLY);
      
      db.all(
        `SELECT * FROM cookies WHERE host_key LIKE '%${domain}%'`,
        (err, rows) => {
          if (err) {
            console.error('Cookie読み取りエラー:', err);
            resolve([]);
            return;
          }

          for (const row of rows) {
            cookies.push({
              name: row.name,
              value: row.value,
              domain: row.host_key,
              path: row.path,
              expires: row.expires_utc,
              httpOnly: row.is_httponly,
              secure: row.is_secure,
              sameSite: 'Lax'
            });
          }

          db.close();
          fs.unlinkSync(tempPath);
          resolve(cookies);
        }
      );
    });
  }

  // パスワード自動入力を活用したログイン
  async loginWithChromePasswords(page, url) {
    console.log('🔐 Chromeの保存パスワードを使用してログインします...');
    
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    // パスワードフィールドを探す
    const passwordField = await page.locator('input[type="password"]').first();
    if (await passwordField.isVisible()) {
      // パスワードフィールドにフォーカス
      await passwordField.click();
      
      // Chromeのパスワード自動入力を待つ
      console.log('⏳ Chromeのパスワード候補が表示されるのを待っています...');
      await page.waitForTimeout(2000);

      // もしパスワードマネージャーのポップアップが表示されたら
      // ユーザーがクリックするのを待つ
      const hasValue = await passwordField.evaluate(el => el.value.length > 0);
      
      if (!hasValue) {
        console.log('💡 パスワードマネージャーから選択してください');
        
        // パスワードが入力されるまで待つ
        await page.waitForFunction(
          () => document.querySelector('input[type="password"]').value.length > 0,
          { timeout: 60000 }
        );
      }

      console.log('✅ パスワードが入力されました');
      
      // ログインボタンをクリック
      const submitButton = await page.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('🚀 ログインを実行しました');
      }
    }
  }
}

// 実際に使用する統合スクリプト
async function autoLoginAndGetAPIKey() {
  const extractor = new ChromePasswordExtractor();
  
  console.log('🚀 Chrome統合ログイン & API Key取得\n');
  
  // Chromeパスワードを使用してブラウザを起動
  const browser = await extractor.launchWithChromePasswords();
  const page = await browser.pages()[0] || await browser.newPage();
  
  try {
    // Anthropicコンソールにアクセス
    await page.goto('https://console.anthropic.com/settings/keys');
    
    // ログインが必要な場合
    if (page.url().includes('login')) {
      console.log('🔐 ログインが必要です');
      
      // Chromeの保存パスワードでログイン
      await extractor.loginWithChromePasswords(page, page.url());
      
      // ログイン完了を待つ
      await page.waitForURL('**/console.anthropic.com/**', { timeout: 60000 });
      console.log('✅ ログイン成功！');
      
      // API Keysページに再度移動
      await page.goto('https://console.anthropic.com/settings/keys');
    }
    
    // API Key取得処理...
    console.log('🔍 API Keyを探しています...');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await page.screenshot({ path: 'chrome-integration-error.png' });
  }
  
  console.log('\n📌 ブラウザは開いたままです');
  await new Promise(() => {});
}

// 実行
if (require.main === module) {
  autoLoginAndGetAPIKey();
}

module.exports = ChromePasswordExtractor;