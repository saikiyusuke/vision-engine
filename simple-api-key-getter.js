const { chromium } = require('playwright');

async function getAPIKey() {
  console.log('🔑 Anthropic API Key取得を開始します...\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    // Anthropicコンソールにアクセス
    console.log('📍 Anthropicコンソールにアクセス中...');
    await page.goto('https://console.anthropic.com/');
    
    console.log('⏳ ページ読み込みを待っています...');
    await page.waitForTimeout(3000);
    
    // 現在のURLを確認
    const currentUrl = page.url();
    console.log('📍 現在のURL:', currentUrl);
    
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      console.log('\n🔐 ログインが必要です');
      console.log('以下の手順でログインしてください:');
      console.log('1. メールアドレスを入力');
      console.log('2. パスワードを入力（Chromeのパスワードマネージャーが使えます）');
      console.log('3. ログインボタンをクリック');
      console.log('\nログイン後、APIキーページに移動します...');
      
      // ログイン完了を待つ
      await page.waitForURL('**/console.anthropic.com/**', { 
        timeout: 300000 // 5分待つ
      });
      console.log('✅ ログイン成功！');
    }
    
    // API Keysページに移動
    console.log('\n📍 API Keysページに移動中...');
    await page.goto('https://console.anthropic.com/settings/keys');
    await page.waitForLoadState('networkidle');
    
    console.log('\n📋 APIキーを確認してください');
    console.log('既存のキーがある場合:');
    console.log('  1. "Show"ボタンをクリック');
    console.log('  2. 表示されたキーをコピー');
    console.log('\n新しいキーを作成する場合:');
    console.log('  1. "Create Key"ボタンをクリック');
    console.log('  2. キー名を入力（例: AutoClaude Vision）');
    console.log('  3. "Create"をクリック');
    console.log('  4. 表示されたキーをコピー');
    
    console.log('\n⚠️ 重要: APIキーは一度しか表示されません！');
    console.log('必ずコピーして安全な場所に保存してください。');
    
    // ユーザーがキーをコピーするまで待つ
    console.log('\n⏳ キーをコピーしたら、ターミナルでEnterキーを押してください...');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await page.screenshot({ path: 'api-key-error.png' });
  }
  
  // ブラウザは開いたままにする
  console.log('\n📌 ブラウザは開いたままです。確認後、手動で閉じてください。');
  await new Promise(() => {});
}

// 実行
getAPIKey();