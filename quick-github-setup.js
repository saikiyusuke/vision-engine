#!/usr/bin/env node
/**
 * GitHubクイックセットアップ
 * 最小限の入力で全自動セットアップ
 */

console.log(`
🚀 GitHub Actions 自動セットアップ
================================

このスクリプトは以下を自動で行います：
1. GitHubリポジトリの作成
2. Secretsの設定
3. コードのアップロード
4. 自動実行の開始

必要なもの：
- GitHubアカウント
- インターネット接続
`);

console.log(`
実行方法：
---------
1. 自動セットアップ（AutoClaude Vision）:
   node github-auto-setup.js

2. 手動セットアップ:
   - GitHubで "vision-engine" リポジトリを作成
   - 以下のコマンドを実行:
     git remote add origin https://github.com/YOUR_USERNAME/vision-engine.git
     git push -u origin main
   - GitHub Secretsを設定（詳細はREADME-GITHUB-ACTIONS.md参照）

詳細な手順は README-GITHUB-ACTIONS.md を参照してください。
`);

// ユーザーに選択させる
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\n自動セットアップを開始しますか？ (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
        console.log('\n自動セットアップを開始します...\n');
        require('./github-auto-setup.js');
    } else {
        console.log('\n手動セットアップの手順は README-GITHUB-ACTIONS.md を参照してください。');
        console.log('https://github.com/new でリポジトリを作成してください。\n');
    }
    rl.close();
});