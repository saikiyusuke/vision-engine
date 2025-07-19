const { chromium } = require('playwright');
const os = require('os');
const path = require('path');
const fs = require('fs');

class SetupAssistant {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Chromeのユーザーデータを使用してブラウザを起動
   */
  async launchWithChromeProfile() {
    console.log('🌐 Chromeプロファイルを使用してブラウザを起動中...');
    
    // Chromeのユーザーデータディレクトリを検出
    let userDataDir;
    const platform = os.platform();
    
    if (platform === 'darwin') {
      // macOS
      userDataDir = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');
    } else if (platform === 'win32') {
      // Windows
      userDataDir = path.join(os.homedir(), 'AppData/Local/Google/Chrome/User Data');
    } else {
      // Linux
      userDataDir = path.join(os.homedir(), '.config/google-chrome');
    }

    console.log('📁 Chromeプロファイル:', userDataDir);

    try {
      // Chromeプロファイルを使用してブラウザを起動
      this.browser = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        channel: 'chrome',
        slowMo: 500,
        viewport: { width: 1280, height: 800 }
      });
      
      this.page = await this.browser.newPage();
      console.log('✅ Chromeプロファイルでブラウザを起動しました');
      return true;
    } catch (error) {
      console.log('⚠️ Chromeプロファイルの使用に失敗しました:', error.message);
      console.log('通常のブラウザを起動します...');
      
      // 通常のブラウザを起動
      this.browser = await chromium.launch({
        headless: false,
        slowMo: 500
      });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
      return false;
    }
  }

  /**
   * Anthropic API Keyを取得
   */
  async getAnthropicAPIKey() {
    console.log('\n🔑 Anthropic API Key取得を開始します...\n');

    const hasChrome = await this.launchWithChromeProfile();
    
    try {
      // 1. Anthropicコンソールにアクセス
      console.log('📍 Anthropicコンソールにアクセス中...');
      await this.page.goto('https://console.anthropic.com/settings/keys');
      
      // ログインが必要な場合
      if (this.page.url().includes('login') || this.page.url().includes('auth')) {
        console.log('🔐 ログインが必要です...');
        
        if (hasChrome) {
          console.log('💡 Chromeに保存されたパスワードを使用できます');
          console.log('ログインフォームでパスワードマネージャーが表示されるはずです');
        }
        
        // ログイン完了を待つ
        console.log('⏳ ログインを待っています...');
        await this.page.waitForURL('**/console.anthropic.com/**', { timeout: 120000 });
        console.log('✅ ログイン成功！');
      }

      // API Keys ページに移動
      await this.page.goto('https://console.anthropic.com/settings/keys');
      await this.page.waitForLoadState('networkidle');

      // 既存のAPIキーを探す
      console.log('🔍 既存のAPIキーを探しています...');
      
      // APIキーの表示ボタンを探す
      const showKeyButtons = await this.page.locator('button:has-text("Show")').all();
      
      if (showKeyButtons.length > 0) {
        console.log(`📋 ${showKeyButtons.length}個のAPIキーが見つかりました`);
        
        // 最初のキーを表示
        await showKeyButtons[0].click();
        await this.page.waitForTimeout(1000);
        
        // キーをコピー
        const keyElement = await this.page.locator('input[type="password"], input[readonly]').first();
        const apiKey = await keyElement.inputValue();
        
        if (apiKey && apiKey.startsWith('sk-ant-')) {
          console.log('✅ APIキーを取得しました！');
          return apiKey;
        }
      }

      // 新しいAPIキーを作成
      console.log('🆕 新しいAPIキーを作成します...');
      
      const createButton = await this.page.locator('button:has-text("Create Key")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await this.page.waitForTimeout(2000);
        
        // キー名を入力
        const nameInput = await this.page.locator('input[placeholder*="name"]').first();
        await nameInput.fill('AutoClaude Vision');
        
        // 作成ボタンをクリック
        const confirmButton = await this.page.locator('button:has-text("Create")').last();
        await confirmButton.click();
        
        // 新しいキーが表示されるのを待つ
        await this.page.waitForTimeout(3000);
        
        // キーをコピー
        const newKeyElement = await this.page.locator('input[readonly]').first();
        const newApiKey = await newKeyElement.inputValue();
        
        if (newApiKey && newApiKey.startsWith('sk-ant-')) {
          console.log('✅ 新しいAPIキーを作成しました！');
          return newApiKey;
        }
      }

    } catch (error) {
      console.error('❌ エラーが発生しました:', error.message);
      await this.page.screenshot({ path: 'setup-error.png' });
    }

    return null;
  }

  /**
   * 環境変数ファイルに保存
   */
  async saveToEnvFile(apiKey) {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = `ANTHROPIC_API_KEY=${apiKey}\n`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('💾 .envファイルに保存しました');
    
    // .gitignoreに追加
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('.env')) {
        fs.appendFileSync(gitignorePath, '\n.env\n');
        console.log('📝 .gitignoreに.envを追加しました');
      }
    }
  }

  /**
   * セットアップ実行
   */
  async setup() {
    console.log('🚀 AutoClaude Vision セットアップを開始します\n');
    
    const apiKey = await this.getAnthropicAPIKey();
    
    if (apiKey) {
      await this.saveToEnvFile(apiKey);
      
      console.log('\n✅ セットアップ完了！');
      console.log('\n使い方:');
      console.log('node test-vision.js');
      console.log('node airregi-vision.js');
    } else {
      console.log('\n❌ APIキーの取得に失敗しました');
      console.log('手動で設定してください:');
      console.log('export ANTHROPIC_API_KEY="your-api-key"');
    }

    await this.browser.close();
  }
}

// 実行
const assistant = new SetupAssistant();
assistant.setup();