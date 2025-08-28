#!/usr/bin/env node
/**
 * 簡略化版Airレジテスト
 */

require('dotenv').config();
const EnhancedAutoClaude = require('./enhanced-autoclaude-vision');

async function testAirRegi() {
  console.log('🧪 簡略化版Airレジテスト開始');
  
  const vision = new EnhancedAutoClaude(process.env.ANTHROPIC_API_KEY);
  
  try {
    await vision.launch({ headless: false });
    
    // Airレジサイトにアクセス
    console.log('🌐 Airレジサイトにアクセス中...');
    await vision.goto('https://airregi.jp/');
    
    // 5秒待機してページを確認
    await vision.page.waitForTimeout(5000);
    
    // スクリーンショット撮影
    await vision.page.screenshot({ path: 'test-airregi-access.png' });
    console.log('📸 スクリーンショット保存: test-airregi-access.png');
    
    // ページタイトルを取得
    const title = await vision.page.title();
    console.log('📄 ページタイトル:', title);
    
    // ログインページかどうか確認
    const url = vision.page.url();
    console.log('🔗 現在のURL:', url);
    
    if (url.includes('login') || title.includes('ログイン')) {
      console.log('✅ ログインページに到達');
    } else {
      console.log('ℹ️ ログインページではありません');
    }
    
    await vision.close();
    console.log('✅ テスト完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
    await vision.close();
  }
}

testAirRegi();