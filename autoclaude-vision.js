const { chromium } = require('playwright');
const VisionAnalyzer = require('./vision-analyzer');

class AutoClaudeVision {
  constructor(apiKey) {
    this.vision = new VisionAnalyzer(apiKey);
    this.browser = null;
    this.page = null;
  }

  /**
   * ブラウザを起動
   */
  async launch(options = {}) {
    this.browser = await chromium.launch({
      headless: false,
      slowMo: options.slowMo || 500,
      ...options
    });
    
    const context = await this.browser.newContext({
      acceptDownloads: true,
      ...options.contextOptions
    });
    
    this.page = await context.newPage();
    return this.page;
  }

  /**
   * URLに移動
   */
  async goto(url) {
    console.log(`📍 ${url} にアクセス中...`);
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 自然言語でクリック
   */
  async click(description) {
    console.log(`🖱️ クリック: "${description}"`);
    
    const result = await this.vision.findElement(this.page, description);
    
    if (result.found) {
      console.log(`✅ 要素を発見: (${result.x}, ${result.y})`);
      await this.page.mouse.click(result.x, result.y);
      await this.page.waitForTimeout(1000);
      return true;
    } else {
      console.log(`❌ 要素が見つかりませんでした: "${description}"`);
      return false;
    }
  }

  /**
   * 自然言語で入力
   */
  async fill(description, text) {
    console.log(`⌨️ 入力: "${description}" に "${text}"`);
    
    // まず入力欄をクリック
    const clicked = await this.click(description);
    if (!clicked) return false;
    
    // クリア＆入力
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.type(text);
    return true;
  }

  /**
   * 自然言語で要素の存在確認
   */
  async waitFor(description, timeout = 30000) {
    console.log(`⏳ 待機中: "${description}"`);
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await this.vision.findElement(this.page, description);
      if (result.found) {
        console.log(`✅ 要素が表示されました: "${description}"`);
        return true;
      }
      await this.page.waitForTimeout(2000);
    }
    
    console.log(`❌ タイムアウト: "${description}" が見つかりませんでした`);
    return false;
  }

  /**
   * スクリーンショットを保存
   */
  async screenshot(path) {
    await this.page.screenshot({ path, fullPage: false });
    console.log(`📸 スクリーンショット保存: ${path}`);
  }

  /**
   * 画面のテキストを読み取る
   */
  async readScreen(region = null) {
    console.log('📖 画面のテキストを読み取り中...');
    return await this.vision.readText(this.page, region);
  }

  /**
   * 複数の操作を一度に実行
   */
  async executeSteps(steps) {
    for (const step of steps) {
      console.log(`\n🔄 ステップ: ${step.action}`);
      
      switch (step.action) {
        case 'goto':
          await this.goto(step.url);
          break;
          
        case 'click':
          await this.click(step.target);
          break;
          
        case 'fill':
          await this.fill(step.target, step.text);
          break;
          
        case 'wait':
          await this.waitFor(step.target);
          break;
          
        case 'screenshot':
          await this.screenshot(step.path);
          break;
          
        case 'wait_time':
          await this.page.waitForTimeout(step.milliseconds);
          break;
          
        default:
          console.log(`⚠️ 不明なアクション: ${step.action}`);
      }
    }
  }

  /**
   * ブラウザを閉じる
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = AutoClaudeVision;