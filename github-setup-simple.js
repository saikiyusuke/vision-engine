#!/usr/bin/env node
/**
 * GitHub簡単セットアップスクリプト
 * GitHub CLIを使用して確実に動作するバージョン
 */

require('dotenv').config();
const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

async function getUserInput(prompt) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function checkGitHubCLI() {
    try {
        execSync('gh --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

async function checkGitHubAuth() {
    try {
        const result = execSync('gh auth status', { encoding: 'utf8' });
        return !result.includes('not logged in');
    } catch {
        return false;
    }
}

async function main() {
    console.log('🚀 GitHub簡単セットアップ\n');
    
    // GitHub CLIの確認
    if (!await checkGitHubCLI()) {
        console.error('❌ GitHub CLIがインストールされていません\n');
        console.log('以下のコマンドでインストールしてください:');
        console.log('  brew install gh\n');
        console.log('インストール後、再度このスクリプトを実行してください。');
        process.exit(1);
    }
    console.log('✅ GitHub CLI検出\n');

    // 認証状態の確認
    if (!await checkGitHubAuth()) {
        console.log('📝 GitHubへのログインが必要です\n');
        console.log('ブラウザが開きます。GitHubにログインしてください。');
        console.log('（Enterキーを押して続行）');
        await getUserInput('');
        
        try {
            execSync('gh auth login --web', { stdio: 'inherit' });
            console.log('\n✅ ログイン成功\n');
        } catch (error) {
            console.error('❌ ログインに失敗しました');
            process.exit(1);
        }
    } else {
        console.log('✅ 既にGitHubにログイン済み\n');
    }

    // リポジトリ名の確認
    const repoName = await getUserInput('リポジトリ名 (デフォルト: vision-engine): ') || 'vision-engine';
    
    // リポジトリの作成
    console.log(`\n📦 リポジトリ "${repoName}" を作成中...`);
    try {
        // 既存のリポジトリを確認
        try {
            execSync(`gh repo view ${repoName}`, { stdio: 'ignore' });
            console.log('⚠️  リポジトリは既に存在します');
            const overwrite = await getUserInput('既存のリポジトリを使用しますか？ (y/n): ');
            if (overwrite.toLowerCase() !== 'y') {
                process.exit(0);
            }
        } catch {
            // リポジトリが存在しない場合は作成
            execSync(`gh repo create ${repoName} --public --description "AutoClaude Vision - AI-powered browser automation"`, { stdio: 'inherit' });
            console.log('✅ リポジトリ作成成功');
        }
    } catch (error) {
        console.error('❌ リポジトリ作成エラー:', error.message);
        process.exit(1);
    }

    // Secretsの設定
    console.log('\n🔐 GitHub Secretsを設定中...');
    const secrets = {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        AIRREGI_USERNAME: 'info@openmart.jp',
        AIRREGI_PASSWORD: 'info@openmartjp2024',
        EMAIL_TO: 'tuwari69@gmail.com'
    };

    if (!secrets.ANTHROPIC_API_KEY) {
        console.error('❌ ANTHROPIC_API_KEYが.envファイルに設定されていません');
        console.log('\n.envファイルに以下を追加してください:');
        console.log('ANTHROPIC_API_KEY=your-api-key-here\n');
        process.exit(1);
    }

    for (const [key, value] of Object.entries(secrets)) {
        console.log(`  - ${key}を設定中...`);
        try {
            execSync(`gh secret set ${key} --repo ${repoName} --body "${value}"`, { stdio: 'ignore' });
            console.log(`    ✅ ${key} 設定完了`);
        } catch (error) {
            console.error(`    ❌ ${key} 設定失敗:`, error.message);
        }
    }

    // Git設定とプッシュ
    console.log('\n📤 コードをGitHubにプッシュ中...');
    try {
        // リモートの設定
        const username = execSync('gh api user --jq .login', { encoding: 'utf8' }).trim();
        const repoUrl = `https://github.com/${username}/${repoName}.git`;
        
        try {
            execSync('git remote remove origin', { stdio: 'ignore' });
        } catch {
            // originが存在しない場合は無視
        }
        
        execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
        console.log('✅ リモートリポジトリを設定');
        
        // プッシュ
        console.log('プッシュ中...');
        execSync('git push -u origin main', { stdio: 'inherit' });
        console.log('✅ コードをプッシュしました');
    } catch (error) {
        console.error('❌ プッシュエラー:', error.message);
        console.log('\n手動でプッシュする場合:');
        console.log('  git push -u origin main');
    }

    // 完了
    console.log('\n🎉 セットアップ完了！\n');
    console.log('📋 次のステップ:');
    console.log(`1. GitHub Actionsを確認: https://github.com/${username}/${repoName}/actions`);
    console.log('2. 手動でワークフローを実行してテスト');
    console.log('3. 毎日10-23時に自動実行されます');
    console.log('4. PCの電源を切っても問題ありません！\n');
}

// 実行
main().catch(console.error);