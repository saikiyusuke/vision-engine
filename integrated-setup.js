const SetupAssistant = require('./setup-assistant');
const AutoClaudeVision = require('./autoclaude-vision');
const ChromeIntegration = require('./chrome-integration');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function integratedSetup() {
  console.log('🚀 AutoClaude統合セットアップを開始します\n');
  console.log('このセットアップでは以下を行います:');
  console.log('1. Chromeのパスワードマネージャーを活用');
  console.log('2. Anthropic API Keyを自動取得');
  console.log('3. 環境設定を完了\n');

  // API Keyが既に設定されているか確認
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('✅ API Keyは既に設定されています');
    console.log('テストを実行しますか？ (y/n)');
    
    // ここで実際にはユーザー入力を待つ必要がありますが、
    // 今回はデモとして続行します
    await testWithExistingKey();
    return;
  }

  // セットアップアシスタントを実行
  const assistant = new SetupAssistant();
  await assistant.setup();
}

async function testWithExistingKey() {
  console.log('\n🧪 既存のAPI Keyでテストを実行します...\n');
  
  const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
  
  try {
    await autoVision.launch();
    
    // Googleで簡単なテスト
    await autoVision.goto('https://www.google.com');
    await autoVision.fill('検索ボックス', 'AutoClaude Vision Chrome Integration');
    await autoVision.click('Google 検索ボタン');
    
    console.log('✅ テスト成功！');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
}

// メインメニュー
async function showMenu() {
  console.log('\n📋 AutoClaude Vision - メインメニュー\n');
  console.log('1. 初期セットアップ（API Key取得）');
  console.log('2. Airレジ自動化');
  console.log('3. カスタム自動化スクリプト作成');
  console.log('4. Chromeパスワード統合テスト');
  console.log('5. 終了\n');
  
  // 実際にはユーザー入力を待つ必要がありますが、
  // デモとして初期セットアップを実行
  await integratedSetup();
}

// 実行
showMenu();