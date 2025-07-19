#!/usr/bin/env node
/**
 * AutoClaude Vision版のローカルテスト
 * GitHub Actionsにプッシュする前にローカルで動作確認
 */

// 環境変数を設定（テスト用）
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'your-api-key-here';
process.env.AIRREGI_USERNAME = 'info@openmart.jp';
process.env.AIRREGI_PASSWORD = 'info@openmartjp2024';
process.env.EMAIL_TO = 'tuwari69@gmail.com';

// メインスクリプトを実行
require('./airregi-autoclaude-scheduled.js');