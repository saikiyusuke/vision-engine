#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

class APIKeyHelper {
  constructor() {
    this.envPath = path.join(process.cwd(), '.env');
  }

  // インタラクティブなプロンプト
  async prompt(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close();
        resolve(answer);
      });
    });
  }

  // API Keyの検証
  validateAPIKey(key) {
    return key && key.startsWith('sk-ant-api03-') && key.length > 50;
  }

  // クリップボードから読み取り（macOS）
  async readFromClipboard() {
    return new Promise((resolve, reject) => {
      exec('pbpaste', (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout.trim());
      });
    });
  }

  // メインの実行フロー
  async run() {
    console.log('🔑 AutoClaude API Key Helper\n');
    console.log('このツールはAPI Keyの設定を支援します。\n');

    // 既存の.envをチェック
    if (fs.existsSync(this.envPath)) {
      const content = fs.readFileSync(this.envPath, 'utf8');
      if (content.includes('ANTHROPIC_API_KEY=sk-ant-api03-')) {
        console.log('✅ 既にAPI Keyが設定されています。');
        const override = await this.prompt('上書きしますか？ (y/N): ');
        if (override.toLowerCase() !== 'y') {
          console.log('キャンセルしました。');
          return;
        }
      }
    }

    console.log('API Keyの取得方法を選択してください:\n');
    console.log('1. クリップボードから自動取得（推奨）');
    console.log('2. 手動で入力');
    console.log('3. Anthropicコンソールを開く\n');

    const choice = await this.prompt('選択 (1-3): ');

    let apiKey = null;

    switch (choice) {
      case '1':
        // クリップボードから取得
        console.log('\n📋 クリップボードから読み取り中...');
        try {
          apiKey = await this.readFromClipboard();
          if (this.validateAPIKey(apiKey)) {
            console.log('✅ 有効なAPI Keyを検出しました！');
          } else {
            console.log('❌ クリップボードに有効なAPI Keyが見つかりません。');
            console.log('💡 ヒント: Anthropicコンソールでキーをコピーしてください。');
          }
        } catch (e) {
          console.log('❌ クリップボードの読み取りに失敗しました。');
        }
        break;

      case '2':
        // 手動入力
        console.log('\nAPI Keyを入力してください:');
        console.log('（sk-ant-api03- で始まる文字列）\n');
        apiKey = await this.prompt('API Key: ');
        break;

      case '3':
        // ブラウザを開く
        console.log('\n🌐 Anthropicコンソールを開いています...');
        exec('open https://console.anthropic.com/settings/keys');
        console.log('\n手順:');
        console.log('1. ログインする');
        console.log('2. "Show"ボタンをクリック、または"Create Key"で新規作成');
        console.log('3. 表示されたキーをコピー');
        console.log('4. このツールを再実行して選択肢1を選ぶ\n');
        return;

      default:
        console.log('無効な選択です。');
        return;
    }

    // API Keyの検証と保存
    if (apiKey && this.validateAPIKey(apiKey)) {
      // .envファイルに保存
      const envContent = `# Anthropic API Key\nANTHROPIC_API_KEY=${apiKey}\n`;
      fs.writeFileSync(this.envPath, envContent);
      
      console.log('\n✅ API Keyを.envファイルに保存しました！');
      console.log(`📁 保存先: ${this.envPath}`);
      
      // .gitignoreに追加
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignoreContent.includes('.env')) {
          fs.appendFileSync(gitignorePath, '\n.env\n');
          console.log('📝 .gitignoreに.envを追加しました');
        }
      }

      // 使い方を表示
      console.log('\n🎉 セットアップ完了！\n');
      console.log('次のコマンドでテストできます:');
      console.log('  node test-vision.js');
      console.log('  node airregi-vision.js\n');
      
    } else {
      console.log('\n❌ 有効なAPI Keyではありません。');
      console.log('API Keyは "sk-ant-api03-" で始まる必要があります。');
    }
  }
}

// コマンドとして実行
if (require.main === module) {
  const helper = new APIKeyHelper();
  helper.run().catch(console.error);
}

module.exports = APIKeyHelper;