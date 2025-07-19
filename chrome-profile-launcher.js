const { chromium } = require('playwright');
const os = require('os');
const path = require('path');
const fs = require('fs');

class ChromeProfileLauncher {
  constructor() {
    this.profiles = this.detectChromeProfiles();
  }

  // 利用可能なChromeプロファイルを検出
  detectChromeProfiles() {
    const profiles = [];
    const chromeUserData = this.getChromeUserDataDir();
    
    if (fs.existsSync(chromeUserData)) {
      // デフォルトプロファイル
      profiles.push({
        name: 'Default',
        path: path.join(chromeUserData, 'Default'),
        userDataDir: chromeUserData
      });
      
      // その他のプロファイル（Profile 1, Profile 2, etc）
      const dirs = fs.readdirSync(chromeUserData);
      for (const dir of dirs) {
        if (dir.startsWith('Profile ')) {
          profiles.push({
            name: dir,
            path: path.join(chromeUserData, dir),
            userDataDir: chromeUserData
          });
        }
      }
    }
    
    return profiles;
  }

  getChromeUserDataDir() {
    const platform = os.platform();
    if (platform === 'darwin') {
      return path.join(os.homedir(), 'Library/Application Support/Google/Chrome');
    } else if (platform === 'win32') {
      return path.join(os.homedir(), 'AppData/Local/Google/Chrome/User Data');
    } else {
      return path.join(os.homedir(), '.config/google-chrome');
    }
  }

  // 特定のプロファイルでChromeを起動
  async launchWithProfile(profileName = 'Default') {
    console.log('🌐 Chrome起動オプション:\n');
    
    // 利用可能なプロファイルを表示
    console.log('利用可能なプロファイル:');
    this.profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.name}`);
    });
    
    const selectedProfile = this.profiles.find(p => p.name === profileName) || this.profiles[0];
    console.log(`\n✅ 選択されたプロファイル: ${selectedProfile.name}`);
    console.log(`📁 パス: ${selectedProfile.path}\n`);

    // Chrome実行ファイルのパス
    let chromePath;
    if (os.platform() === 'darwin') {
      chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (os.platform() === 'win32') {
      chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else {
      chromePath = 'google-chrome';
    }

    // まず、システムのChromeで起動を試みる
    try {
      console.log('🚀 システムのChromeで起動を試みています...');
      
      const browser = await chromium.launch({
        headless: false,
        channel: 'chrome',
        args: [
          `--user-data-dir=${selectedProfile.userDataDir}`,
          `--profile-directory=${selectedProfile.name}`,
          '--enable-automation',
          '--disable-blink-features=AutomationControlled'
        ],
        slowMo: 500
      });
      
      console.log('✅ Chromeプロファイルで起動成功！');
      console.log('🔐 保存されたパスワードが利用可能です\n');
      
      return browser;
      
    } catch (error) {
      console.log('⚠️ プロファイル起動に失敗:', error.message);
      
      // フォールバック: CDP（Chrome DevTools Protocol）を使用
      return await this.launchWithCDP();
    }
  }

  // Chrome DevTools Protocolを使用した接続
  async launchWithCDP() {
    console.log('\n🔧 CDP（Chrome DevTools Protocol）モードで接続を試みます...');
    
    try {
      // 既存のChromeインスタンスに接続
      const browser = await chromium.connectOverCDP('http://localhost:9222');
      console.log('✅ 既存のChromeに接続しました');
      return browser;
      
    } catch (e) {
      console.log('⚠️ CDP接続に失敗。通常のブラウザを起動します。');
      
      // 通常のブラウザを起動
      return await chromium.launch({
        headless: false,
        slowMo: 500
      });
    }
  }

  // 完全自動ログインフロー
  async autoLoginFlow() {
    console.log('🤖 Chrome完全自動ログインフロー\n');
    console.log('このフローは以下を実行します:');
    console.log('1. Chromeプロファイルを使用してブラウザ起動');
    console.log('2. 保存されたパスワードで自動ログイン');
    console.log('3. API Key取得\n');

    const browser = await this.launchWithProfile();
    const page = await browser.newPage();
    
    try {
      // Anthropicコンソールにアクセス
      console.log('📍 Anthropicコンソールにアクセス中...');
      await page.goto('https://console.anthropic.com/settings/keys');
      
      // ログインページの場合
      if (page.url().includes('login')) {
        console.log('🔐 ログインページを検出');
        
        // パスワード自動入力のヒントを表示
        await page.evaluate(() => {
          // ユーザーへのガイドをページに挿入
          const guide = document.createElement('div');
          guide.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: -apple-system, sans-serif;
            max-width: 350px;
            animation: slideIn 0.5s ease-out;
          `;
          
          guide.innerHTML = `
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">
              🔐 Chrome自動ログイン
            </h3>
            <p style="margin: 10px 0; line-height: 1.6;">
              Chromeに保存されたパスワードを使用できます：
            </p>
            <ol style="margin: 15px 0; padding-left: 20px;">
              <li>メールアドレス欄をクリック</li>
              <li>保存された認証情報を選択</li>
              <li>自動的にログイン</li>
            </ol>
            <div style="
              background: rgba(255,255,255,0.2);
              padding: 10px;
              border-radius: 8px;
              margin-top: 15px;
            ">
              💡 パスワードが表示されない場合は、<br>
              パスワード欄をクリックしてください
            </div>
          `;
          
          document.body.appendChild(guide);
          
          // アニメーション
          const style = document.createElement('style');
          style.textContent = `
            @keyframes slideIn {
              from { transform: translateX(400px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `;
          document.head.appendChild(style);
        });
        
        // パスワードフィールドにフォーカスしてChromeの自動入力を促す
        const emailField = await page.locator('input[type="email"], input[type="text"][name*="email"], input[type="text"][name*="username"]').first();
        if (await emailField.isVisible()) {
          await emailField.click();
          await page.waitForTimeout(1000);
        }
        
        const passwordField = await page.locator('input[type="password"]').first();
        if (await passwordField.isVisible()) {
          await passwordField.click();
          console.log('⏳ Chromeのパスワード候補を待っています...');
          await page.waitForTimeout(2000);
        }
        
        // ログイン完了を待つ
        console.log('⏳ ログインを待っています...');
        await page.waitForURL('**/console.anthropic.com/**', { timeout: 120000 });
        console.log('✅ ログイン成功！');
      }
      
      // API Key取得処理
      await page.waitForLoadState('networkidle');
      console.log('🔍 API Keyページを確認中...');
      
      // 成功メッセージ
      console.log('\n' + '='.repeat(60));
      console.log('✅ 準備完了！');
      console.log('='.repeat(60));
      console.log('ブラウザでAPI Keyをコピーしてください:');
      console.log('1. "Show"ボタンをクリック');
      console.log('2. 表示されたキーをコピー');
      console.log('3. Claude Codeに貼り付け');
      console.log('='.repeat(60) + '\n');
      
    } catch (error) {
      console.error('❌ エラー:', error.message);
      await page.screenshot({ path: 'chrome-profile-error.png' });
    }
    
    // ブラウザは開いたままにする
    console.log('📌 ブラウザは開いたままです');
    await new Promise(() => {});
  }
}

// 実行
if (require.main === module) {
  const launcher = new ChromeProfileLauncher();
  launcher.autoLoginFlow();
}

module.exports = ChromeProfileLauncher;