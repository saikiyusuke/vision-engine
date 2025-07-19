const { chromium } = require('playwright');
const os = require('os');
const path = require('path');

class ChromeIntegration {
  /**
   * Chromeの設定を使用してブラウザを起動
   */
  static async launchWithChrome() {
    const platform = os.platform();
    let executablePath;
    
    // Chrome実行ファイルのパスを取得
    if (platform === 'darwin') {
      executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (platform === 'win32') {
      executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else {
      executablePath = '/usr/bin/google-chrome';
    }

    console.log('🌐 Chrome統合モードで起動中...');
    
    const browser = await chromium.launch({
      headless: false,
      executablePath,
      args: [
        '--enable-features=PasswordImport',
        '--enable-autofill-password-generation',
        '--password-store=basic'
      ],
      slowMo: 500
    });

    return browser;
  }

  /**
   * Chrome拡張機能として実行（より深い統合）
   */
  static async createChromeExtension() {
    const extensionPath = path.join(__dirname, 'chrome-extension');
    
    // manifest.json
    const manifest = {
      "manifest_version": 3,
      "name": "AutoClaude Assistant",
      "version": "1.0",
      "description": "Chromeパスワードと統合した自動化アシスタント",
      "permissions": [
        "tabs",
        "storage",
        "passwords",
        "autofill"
      ],
      "background": {
        "service_worker": "background.js"
      },
      "content_scripts": [{
        "matches": ["<all_urls>"],
        "js": ["content.js"]
      }]
    };

    return manifest;
  }
}

module.exports = ChromeIntegration;