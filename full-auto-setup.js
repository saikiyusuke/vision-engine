const { chromium } = require('playwright');
const fs = require('fs');
const { exec } = require('child_process');

class FullAutoSetup {
  constructor() {
    this.apiKey = null;
    this.logs = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    this.logs.push({ timestamp, message });
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  // macOSの通知を表示
  async showNotification(title, message) {
    return new Promise((resolve) => {
      exec(`osascript -e 'display notification "${message}" with title "${title}"'`, resolve);
    });
  }

  // クリップボードにコピー
  async copyToClipboard(text) {
    return new Promise((resolve, reject) => {
      const proc = exec('pbcopy');
      proc.stdin.write(text);
      proc.stdin.end();
      proc.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Failed to copy'));
      });
    });
  }

  async run() {
    console.log('🚀 AutoClaude完全自動セットアップ\n');
    console.log('このスクリプトは以下を自動で行います:');
    console.log('1. Anthropicコンソールを開く');
    console.log('2. API Keyを取得');
    console.log('3. クリップボードにコピー');
    console.log('4. 使い方を案内\n');

    const browser = await chromium.launch({
      headless: false,
      slowMo: 1000
    });

    const page = await browser.newPage();

    try {
      // ステップ1: Anthropicコンソールにアクセス
      this.log('📍 Anthropicコンソールを開いています...');
      await page.goto('https://console.anthropic.com/settings/keys');
      
      // ログインが必要な場合の処理
      if (page.url().includes('login')) {
        this.log('🔐 ログインページが検出されました');
        
        // ここで視覚的なガイドを表示
        await page.evaluate(() => {
          const guide = document.createElement('div');
          guide.innerHTML = `
            <div style="
              position: fixed;
              top: 20px;
              right: 20px;
              background: #007AFF;
              color: white;
              padding: 20px;
              border-radius: 10px;
              z-index: 10000;
              font-family: -apple-system, sans-serif;
              box-shadow: 0 4px 20px rgba(0,0,0,0.3);
              max-width: 300px;
            ">
              <h3 style="margin: 0 0 10px 0;">🤖 AutoClaude Assistant</h3>
              <p>ログインしてください:</p>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>メールアドレスを入力</li>
                <li>パスワードを入力</li>
                <li>ログインボタンをクリック</li>
              </ol>
              <p style="margin-top: 10px; font-size: 0.9em;">
                💡 Chromeのパスワードマネージャーが使えます
              </p>
            </div>
          `;
          document.body.appendChild(guide);
        });

        // ログイン完了を待つ
        this.log('⏳ ログインを待っています...');
        await page.waitForURL('**/console.anthropic.com/**', { timeout: 300000 });
        this.log('✅ ログイン成功！');
      }

      // ステップ2: API Keyを探す
      await page.waitForLoadState('networkidle');
      this.log('🔍 API Keyを探しています...');

      // 既存のキーを表示
      let foundKey = false;
      const showButtons = await page.locator('button:has-text("Show")').all();
      
      if (showButtons.length > 0) {
        this.log(`📋 ${showButtons.length}個のAPI Keyが見つかりました`);
        await showButtons[0].click();
        await page.waitForTimeout(1000);

        // キーを選択してコピー
        const keyInput = await page.locator('input[readonly]').first();
        await keyInput.click();
        await page.keyboard.press('Meta+A'); // 全選択
        await page.keyboard.press('Meta+C'); // コピー
        
        // JavaScriptでも値を取得
        this.apiKey = await keyInput.inputValue();
        foundKey = true;
      }

      // キーが見つからない場合は作成
      if (!foundKey) {
        this.log('🆕 新しいAPI Keyを作成します...');
        // ... 作成ロジック
      }

      if (this.apiKey) {
        // クリップボードにコピー（確実にするため）
        await this.copyToClipboard(this.apiKey);
        
        // .envに保存
        fs.writeFileSync('.env', `ANTHROPIC_API_KEY=${this.apiKey}\n`);
        
        // 成功メッセージ
        await this.showNotification('AutoClaude', 'API Keyをコピーしました！');
        
        // ブラウザに完了メッセージを表示
        await page.evaluate((key) => {
          const message = document.createElement('div');
          message.innerHTML = `
            <div style="
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: #4CAF50;
              color: white;
              padding: 40px;
              border-radius: 20px;
              z-index: 10000;
              font-family: -apple-system, sans-serif;
              text-align: center;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            ">
              <h1 style="margin: 0 0 20px 0; font-size: 48px;">✅</h1>
              <h2 style="margin: 0 0 20px 0;">API Key取得完了！</h2>
              <p style="font-size: 18px; margin: 10px 0;">
                クリップボードにコピーされました
              </p>
              <div style="
                background: rgba(255,255,255,0.2);
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                font-family: monospace;
                word-break: break-all;
              ">
                ${key.substring(0, 20)}...${key.substring(key.length - 4)}
              </div>
              <p style="margin-top: 20px;">
                <strong>次のステップ:</strong><br>
                Claude Codeのチャット画面で<br>
                <kbd style="
                  background: white;
                  color: #4CAF50;
                  padding: 5px 10px;
                  border-radius: 5px;
                  font-weight: bold;
                ">Cmd + V</kbd>
                を押して貼り付け
              </p>
            </div>
          `;
          document.body.appendChild(message);
        }, this.apiKey);

        // 最終案内
        console.log('\n' + '='.repeat(60));
        console.log('🎉 セットアップ完了！');
        console.log('='.repeat(60));
        console.log('✅ API Keyがクリップボードにコピーされました');
        console.log('📋 次の操作:');
        console.log('   1. Claude Codeのチャット画面に戻る');
        console.log('   2. Cmd+V で貼り付け');
        console.log('   3. API Keyが自動設定されます');
        console.log('='.repeat(60) + '\n');
      }

    } catch (error) {
      this.log(`❌ エラー: ${error.message}`);
      await page.screenshot({ path: 'setup-error.png' });
    }

    // ブラウザは開いたままにする（確認用）
    this.log('📌 ブラウザは開いたままです。確認後閉じてください。');
    await new Promise(() => {});
  }
}

// 実行
const setup = new FullAutoSetup();
setup.run();