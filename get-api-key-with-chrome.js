const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');

async function getAPIKeyWithChrome() {
  console.log('🔑 Chrome統合API Key取得ツール\n');
  
  // Step 1: Chromeを起動
  console.log('📌 Step 1: Chromeでコンソールを開きます...');
  
  // macOSでProfile 1（ユーザー1）を使用してChromeを起動
  exec(`open -a "Google Chrome" --args --profile-directory="Profile 1" "https://console.anthropic.com/settings/keys"`);
  
  console.log('✅ Chromeを起動しました（Profile 1 - ユーザー1）\n');
  
  console.log('📋 次の手順に従ってください:\n');
  console.log('1. ログインが必要な場合:');
  console.log('   • メールアドレス欄をクリック');
  console.log('   • Chromeの保存パスワードから選択（自動入力）');
  console.log('   • ログインボタンは自動的にクリックされるはず\n');
  
  console.log('2. API Keysページで:');
  console.log('   • 既存のキーがある場合: "Show"ボタンをクリック');
  console.log('   • 新規作成する場合: "Create Key" → 名前入力 → "Create"');
  console.log('   • 表示されたキーを全選択してコピー（Cmd+A → Cmd+C）\n');
  
  console.log('3. コピーしたら、このターミナルに戻ってください\n');
  
  console.log('─'.repeat(60));
  console.log('⏳ API Keyをコピーしたら、Enterキーを押してください...');
  console.log('─'.repeat(60) + '\n');
  
  // Enterキーを待つ
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  await new Promise(resolve => {
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
  
  // Step 2: クリップボードから読み取り
  console.log('\n📋 クリップボードから読み取り中...');
  
  const clipboardContent = await new Promise((resolve, reject) => {
    exec('pbpaste', (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
  
  // API Keyの検証
  if (clipboardContent.startsWith('sk-ant-api03-') && clipboardContent.length > 50) {
    console.log('✅ 有効なAPI Keyを検出しました！\n');
    
    // .envファイルに保存
    const envContent = `# Anthropic API Key\nANTHROPIC_API_KEY=${clipboardContent}\n`;
    fs.writeFileSync('.env', envContent);
    
    console.log('💾 .envファイルに保存しました');
    console.log(`🔑 API Key: ${clipboardContent.substring(0, 20)}...${clipboardContent.substring(clipboardContent.length - 4)}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 セットアップ完了！');
    console.log('='.repeat(60));
    console.log('\n次のコマンドでテストを実行できます:');
    console.log('  node test-vision.js');
    console.log('  node airregi-vision.js\n');
    
  } else {
    console.log('❌ クリップボードに有効なAPI Keyが見つかりません\n');
    console.log('確認事項:');
    console.log('• API Keyは "sk-ant-api03-" で始まっていますか？');
    console.log('• キー全体をコピーしましたか？');
    console.log('• 余分なスペースや改行が含まれていませんか？\n');
  }
}

// 実行
getAPIKeyWithChrome();