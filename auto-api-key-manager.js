const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AutoAPIKeyManager {
  constructor() {
    this.logFile = 'api-key-log.json';
    this.logs = [];
  }

  // ログを記録
  log(message, type = 'info') {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    this.logs.push(entry);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // API Keyをマスク表示
  maskApiKey(key) {
    if (!key || key.length < 20) return key;
    return key.substring(0, 10) + '...' + key.substring(key.length - 4);
  }

  // クリップボードにコピー（macOS）
  async copyToClipboard(text) {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      const proc = exec('pbcopy');
      proc.stdin.write(text);
      proc.stdin.end();
      proc.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Failed to copy to clipboard'));
      });
    });
  }

  // API Key取得とコピー
  async getAndCopyAPIKey() {
    this.log('🚀 API Key自動取得を開始します');
    
    const browser = await chromium.launch({
      headless: false,
      slowMo: 500
    });
    
    const page = await browser.newPage();
    let apiKey = null;
    
    try {
      // Anthropicコンソールにアクセス
      this.log('📍 Anthropicコンソールにアクセス中...');
      await page.goto('https://console.anthropic.com/settings/keys');
      
      // ログインが必要な場合
      if (page.url().includes('login')) {
        this.log('🔐 ログインが必要です');
        
        // ログインフォームを埋める
        try {
          await page.fill('input[type="email"]', 'your-email@example.com');
          this.log('メールアドレスを入力しました');
          
          // パスワードフィールドで待機（ユーザーが入力）
          this.log('⏳ パスワードの入力を待っています...');
          await page.waitForURL('**/console.anthropic.com/**', { timeout: 300000 });
          this.log('✅ ログイン成功！');
        } catch (e) {
          this.log('ログインプロセスでエラー: ' + e.message, 'error');
        }
      }
      
      // API Keysページで既存のキーを探す
      await page.waitForLoadState('networkidle');
      this.log('🔍 既存のAPIキーを探しています...');
      
      // "Show"ボタンを探してクリック
      const showButtons = await page.locator('button:has-text("Show")').all();
      
      if (showButtons.length > 0) {
        this.log(`📋 ${showButtons.length}個のAPIキーが見つかりました`);
        
        // 最初のキーを表示
        await showButtons[0].click();
        await page.waitForTimeout(1000);
        
        // 表示されたキーを取得
        const keyInputs = await page.locator('input[type="text"][readonly], input[type="password"][readonly]').all();
        for (const input of keyInputs) {
          const value = await input.inputValue();
          if (value && value.startsWith('sk-ant-')) {
            apiKey = value;
            this.log(`✅ APIキーを取得しました: ${this.maskApiKey(apiKey)}`);
            break;
          }
        }
      }
      
      // キーが見つからない場合は新規作成
      if (!apiKey) {
        this.log('🆕 新しいAPIキーを作成します...');
        
        const createButton = await page.locator('button:has-text("Create Key")').first();
        if (await createButton.isVisible()) {
          await createButton.click();
          await page.waitForTimeout(1000);
          
          // キー名を入力
          await page.fill('input[placeholder*="name"]', `AutoClaude-${Date.now()}`);
          
          // 作成ボタンをクリック
          await page.click('button:has-text("Create"):last-of-type');
          await page.waitForTimeout(2000);
          
          // 新しく作成されたキーを取得
          const newKeyInput = await page.locator('input[readonly]').last();
          apiKey = await newKeyInput.inputValue();
          
          if (apiKey && apiKey.startsWith('sk-ant-')) {
            this.log(`✅ 新しいAPIキーを作成しました: ${this.maskApiKey(apiKey)}`);
          }
        }
      }
      
      if (apiKey) {
        // クリップボードにコピー
        await this.copyToClipboard(apiKey);
        this.log('📋 APIキーをクリップボードにコピーしました', 'success');
        
        // .envファイルに保存
        const envContent = `ANTHROPIC_API_KEY=${apiKey}\n`;
        fs.writeFileSync('.env', envContent);
        this.log('💾 .envファイルに保存しました', 'success');
        
        // セキュアなログを保存
        this.saveSecureLog(apiKey);
        
        // 結果を表示
        console.log('\n' + '='.repeat(60));
        console.log('✅ API Key取得完了！');
        console.log('='.repeat(60));
        console.log('📋 クリップボードにコピー済み（Cmd+Vで貼り付け可能）');
        console.log(`🔑 マスク表示: ${this.maskApiKey(apiKey)}`);
        console.log('💾 保存先: .env ファイル');
        console.log('='.repeat(60) + '\n');
        
        return apiKey;
      }
      
    } catch (error) {
      this.log(`エラーが発生しました: ${error.message}`, 'error');
      await page.screenshot({ path: 'api-key-error.png' });
    } finally {
      await browser.close();
    }
    
    return null;
  }
  
  // セキュアなログを保存
  saveSecureLog(apiKey) {
    const logData = {
      timestamp: new Date().toISOString(),
      maskedKey: this.maskApiKey(apiKey),
      keyLength: apiKey.length,
      logs: this.logs
    };
    
    fs.writeFileSync(this.logFile, JSON.stringify(logData, null, 2));
    this.log(`📝 ログを ${this.logFile} に保存しました`);
  }
  
  // ログビューアーを生成
  generateLogViewer() {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>API Key Manager - ログビューアー</title>
  <style>
    body {
      font-family: -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #007AFF;
      padding-bottom: 10px;
    }
    .log-entry {
      margin: 10px 0;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
    }
    .info { background: #E3F2FD; color: #1565C0; }
    .success { background: #E8F5E9; color: #2E7D32; }
    .error { background: #FFEBEE; color: #C62828; }
    .timestamp {
      color: #666;
      font-size: 0.9em;
    }
    .api-key-info {
      background: #FFF3E0;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .warning {
      color: #F57C00;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔑 API Key Manager - ログビューアー</h1>
    
    <div class="api-key-info">
      <h2>API Key情報</h2>
      <p><strong>取得日時:</strong> <span class="timestamp">${new Date().toLocaleString()}</span></p>
      <p><strong>マスク表示:</strong> <code>sk-ant-api03-****...****</code></p>
      <p class="warning">⚠️ API Keyは.envファイルに保存されています。絶対に公開しないでください。</p>
    </div>
    
    <h2>📊 実行ログ</h2>
    <div id="logs">
      ${this.logs.map(log => `
        <div class="log-entry ${log.type}">
          <span class="timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
          ${log.message}
        </div>
      `).join('')}
    </div>
    
    <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 5px;">
      <h3>次のステップ</h3>
      <ol>
        <li>Claude Codeのチャット画面で <code>Cmd+V</code> を押してAPI Keyを貼り付け</li>
        <li>または <code>.env</code> ファイルから直接使用</li>
        <li>テスト実行: <code>node test-vision.js</code></li>
      </ol>
    </div>
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync('api-key-log.html', html);
    this.log('📄 ログビューアーを api-key-log.html に生成しました');
  }
}

// 実行
async function main() {
  const manager = new AutoAPIKeyManager();
  const apiKey = await manager.getAndCopyAPIKey();
  
  if (apiKey) {
    manager.generateLogViewer();
    console.log('\n🌐 ログビューアーを開く: open api-key-log.html');
  }
}

main();