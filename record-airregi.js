#!/usr/bin/env node
/**
 * Airレジ操作記録ツール
 * あなたの操作を記録して、自動実行可能なコードを生成します
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 設定
const CONFIG = {
  airregi: {
    username: process.env.AIRREGI_USERNAME || 'info@openmart.jp',
    password: process.env.AIRREGI_PASSWORD || 'info@openmartjp2024'
  }
};

console.log('🎥 Airレジ操作記録ツール');
console.log('=======================');
console.log('');
console.log('📝 使い方:');
console.log('1. ブラウザが開きます');
console.log('2. Airレジにログインして、CSVダウンロードまでの操作を行ってください');
console.log('3. 操作が完了したら、ブラウザを閉じてください');
console.log('4. 記録された操作が airregi-recorded-actions.json に保存されます');
console.log('');
console.log('⚠️  注意:');
console.log('- ゆっくりと操作してください（各アクション間に1-2秒の間隔を空ける）');
console.log('- パスワードは自動的にマスクされます');
console.log('');

async function recordActions() {
  // 記録する操作のリスト
  const recordedActions = [];
  
  // ブラウザを起動
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    // ビデオ録画も有効化
    recordVideo: {
      dir: './recordings',
      size: { width: 1280, height: 720 }
    }
  });

  // イベントリスナーを設定
  context.on('page', page => {
    // ページナビゲーション
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        recordedActions.push({
          type: 'navigate',
          url: frame.url(),
          timestamp: new Date().toISOString()
        });
        console.log(`📍 ページ遷移: ${frame.url()}`);
      }
    });

    // クリックイベント
    page.on('click', async (selector) => {
      console.log(`🖱️  クリック検出を設定中...`);
    });
  });

  const page = await context.newPage();

  // クリックイベントを記録
  await page.exposeFunction('recordClick', async (data) => {
    recordedActions.push({
      type: 'click',
      selector: data.selector,
      text: data.text,
      position: { x: data.x, y: data.y },
      timestamp: new Date().toISOString()
    });
    console.log(`🖱️  クリック: ${data.text || data.selector}`);
  });

  // 入力イベントを記録
  await page.exposeFunction('recordInput', async (data) => {
    // パスワードフィールドの場合はマスク
    const value = data.type === 'password' ? '***' : data.value;
    recordedActions.push({
      type: 'fill',
      selector: data.selector,
      value: data.type === 'password' ? CONFIG.airregi.password : data.value,
      inputType: data.type,
      timestamp: new Date().toISOString()
    });
    console.log(`⌨️  入力: ${data.selector} = ${value}`);
  });

  // ページにイベントリスナーを注入
  await page.addInitScript(() => {
    // クリックイベント
    document.addEventListener('click', (e) => {
      const target = e.target;
      const selector = target.tagName.toLowerCase() + 
        (target.id ? `#${target.id}` : '') +
        (target.className ? `.${target.className.split(' ').join('.')}` : '');
      
      window.recordClick({
        selector: selector,
        text: target.textContent?.trim().substring(0, 50),
        x: e.pageX,
        y: e.pageY
      });
    }, true);

    // 入力イベント
    document.addEventListener('change', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const target = e.target;
        const selector = target.tagName.toLowerCase() + 
          (target.id ? `#${target.id}` : '') +
          (target.name ? `[name="${target.name}"]` : '');
        
        window.recordInput({
          selector: selector,
          value: target.value,
          type: target.type || 'text'
        });
      }
    }, true);
  });

  // Airレジのログインページを開く
  console.log('🌐 Airレジを開いています...');
  await page.goto('https://airregi.jp/');

  // ユーザーが操作を完了するまで待つ
  console.log('');
  console.log('👤 ブラウザで操作を行ってください...');
  console.log('   完了したらブラウザを閉じてください');
  console.log('');

  // ブラウザが閉じられるまで待つ
  await new Promise((resolve) => {
    browser.on('disconnected', resolve);
  });

  // 記録を保存
  const outputPath = path.join(__dirname, 'airregi-recorded-actions.json');
  await fs.writeFile(
    outputPath,
    JSON.stringify(recordedActions, null, 2),
    'utf8'
  );

  console.log('');
  console.log(`✅ 操作の記録が完了しました`);
  console.log(`📁 保存先: ${outputPath}`);
  console.log(`📊 記録されたアクション数: ${recordedActions.length}`);

  // 実行可能なスクリプトも生成
  await generateExecutableScript(recordedActions);
}

// 記録から実行可能なスクリプトを生成
async function generateExecutableScript(actions) {
  const script = `#!/usr/bin/env node
/**
 * 記録された操作を再実行するスクリプト
 * 自動生成日時: ${new Date().toISOString()}
 */

const { chromium } = require('playwright');
const path = require('path');

async function runRecordedActions() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo'
  });

  const page = await context.newPage();

  try {
    console.log('🚀 記録された操作を実行開始...');
    
${actions.map(action => {
  switch (action.type) {
    case 'navigate':
      return `    // ページ遷移: ${action.url}
    await page.goto('${action.url}');
    await page.waitForLoadState('networkidle');
    console.log('📍 ページ: ${action.url}');`;
    
    case 'click':
      return `    // クリック: ${action.text || action.selector}
    await page.click('${action.selector}');
    await page.waitForTimeout(1000);
    console.log('🖱️  クリック: ${action.text || action.selector}');`;
    
    case 'fill':
      const value = action.inputType === 'password' ? 
        '${CONFIG.airregi.password}' : 
        `'${action.value}'`;
      return `    // 入力: ${action.selector}
    await page.fill('${action.selector}', ${value});
    await page.waitForTimeout(500);
    console.log('⌨️  入力: ${action.selector}');`;
    
    default:
      return `    // 不明なアクション: ${action.type}`;
  }
}).join('\n\n')}

    console.log('✅ すべての操作が完了しました');

  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    await browser.close();
  }
}

// 設定
const CONFIG = {
  airregi: {
    username: process.env.AIRREGI_USERNAME || 'info@openmart.jp',
    password: process.env.AIRREGI_PASSWORD || 'info@openmartjp2024'
  }
};

// 実行
runRecordedActions().catch(console.error);
`;

  const scriptPath = path.join(__dirname, 'airregi-playback.js');
  await fs.writeFile(scriptPath, script, 'utf8');
  await fs.chmod(scriptPath, '755');

  console.log(`📄 実行スクリプトも生成しました: ${scriptPath}`);
  console.log('');
  console.log('🎯 次のステップ:');
  console.log('1. 記録を確認: cat airregi-recorded-actions.json');
  console.log('2. 再実行: node airregi-playback.js');
}

// メイン実行
recordActions().catch(error => {
  console.error('❌ エラー:', error);
  process.exit(1);
});