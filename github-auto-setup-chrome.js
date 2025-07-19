#!/usr/bin/env node
/**
 * GitHub自動セットアップ - Chrome自動ログイン版
 * Chrome保存パスワードを活用して完全自動化
 */

require('dotenv').config();
const AutoClaudeVisionChrome = require('./autoclaude-vision-chrome');
const { execSync } = require('child_process');
const readline = require('readline');

// 設定
const CONFIG = {
    repoName: 'vision-engine',
    repoDescription: 'AutoClaude Vision - AI-powered browser automation with Airregi sync',
    isPublic: true,
    secrets: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        AIRREGI_USERNAME: 'info@openmart.jp',
        AIRREGI_PASSWORD: 'info@openmartjp2024',
        EMAIL_TO: 'tuwari69@gmail.com'
    }
};

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

async function main() {
    console.log('🚀 GitHub自動セットアップ（Chrome統合版）を開始します...\n');
    console.log('📌 Chromeに保存されたユーザー名とパスワードを自動使用します\n');
    console.log('✨ 入力は一切不要です！\n');

    // APIキーの確認（.envから自動取得）
    if (!CONFIG.secrets.ANTHROPIC_API_KEY) {
        console.error('❌ Anthropic API Keyが.envファイルに設定されていません');
        console.log('以下の内容で.envファイルを作成してください:');
        console.log('ANTHROPIC_API_KEY=your-api-key-here\n');
        process.exit(1);
    }

    let githubUsername = null;

    const autoVision = new AutoClaudeVisionChrome({
        apiKey: CONFIG.secrets.ANTHROPIC_API_KEY,
        headless: false,
        useChromeProfile: true,
        viewport: { width: 1280, height: 800 }
    });

    try {
        await autoVision.launch();

        // ステップ1: GitHubにChrome自動ログイン
        console.log('\n📍 ステップ1: GitHubにログイン（Chrome自動入力）');
        
        const loginSuccess = await autoVision.loginToGitHub({
            username: githubUsername,
            allowManual: true // 自動入力が失敗した場合は手動入力を許可
        });

        if (!loginSuccess) {
            console.log('❌ ログインに失敗しました');
            return;
        }

        console.log('✅ ログイン成功');

        // ステップ2: 新しいリポジトリを作成
        console.log('\n📍 ステップ2: 新しいリポジトリを作成');
        await autoVision.goto('https://github.com/new');
        
        // リポジトリ作成フォームを入力
        await autoVision.fill('Repository nameの入力欄', CONFIG.repoName);
        await autoVision.fill('Description（optional）の入力欄', CONFIG.repoDescription);
        
        if (CONFIG.isPublic) {
            await autoVision.click('Publicのラジオボタン');
        } else {
            await autoVision.click('Privateのラジオボタン');
        }

        await autoVision.click('Create repositoryボタン');
        await autoVision.waitFor('Quick setupページまたはコード画面', 10000);

        const repoUrl = `https://github.com/${githubUsername}/${CONFIG.repoName}.git`;
        console.log(`✅ リポジトリ作成完了: ${repoUrl}`);

        // ステップ3: GitHub Secretsを設定
        console.log('\n📍 ステップ3: GitHub Secretsを設定');
        await autoVision.goto(`https://github.com/${githubUsername}/${CONFIG.repoName}/settings/secrets/actions`);

        for (const [secretName, secretValue] of Object.entries(CONFIG.secrets)) {
            if (!secretValue) {
                console.log(`  - ${secretName}をスキップ（値が空）`);
                continue;
            }

            console.log(`  - ${secretName}を追加中...`);
            
            await autoVision.click('New repository secretボタン');
            await autoVision.fill('Nameの入力欄', secretName);
            await autoVision.fill('Secretの入力欄またはValueの入力欄', secretValue);
            await autoVision.click('Add secretボタン');
            
            await autoVision.page.waitForTimeout(2000);
        }

        console.log('✅ すべてのSecretsを追加しました');

        // ステップ4: ローカルからプッシュ
        console.log('\n📍 ステップ4: ローカルからプッシュ');
        try {
            // 既存のremoteを削除
            try {
                execSync('git remote remove origin', { stdio: 'ignore' });
            } catch (e) {
                // originが存在しない場合は無視
            }
            
            execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
            console.log('リモートリポジトリを設定しました');
            
            console.log('プッシュ中...');
            execSync('git push -u origin main', { stdio: 'inherit' });
            console.log('✅ コードをプッシュしました');
        } catch (error) {
            console.error('❌ プッシュエラー:', error.message);
            console.log('手動でプッシュしてください:');
            console.log(`  git remote add origin ${repoUrl}`);
            console.log('  git push -u origin main');
        }

        // ステップ5: GitHub Actionsを実行
        console.log('\n📍 ステップ5: GitHub Actionsを手動実行');
        await autoVision.goto(`https://github.com/${githubUsername}/${CONFIG.repoName}/actions`);
        
        // ワークフローが表示されるまで待つ
        await autoVision.page.waitForTimeout(3000);
        
        try {
            await autoVision.click('Airレジ自動同期（AutoClaude Vision）');
            await autoVision.click('Run workflowボタン');
            await autoVision.page.waitForTimeout(1000);
            await autoVision.click('Run workflow（緑色のボタン）');
            
            console.log('✅ GitHub Actionsを開始しました');
        } catch (error) {
            console.log('⚠️  Actions実行は手動で行ってください');
            console.log(`   URL: https://github.com/${githubUsername}/${CONFIG.repoName}/actions`);
        }

        console.log('\n🎉 セットアップ完了！');
        console.log('\n📋 次のステップ:');
        console.log('1. GitHub Actionsの実行状況を確認:');
        console.log(`   https://github.com/${githubUsername}/${CONFIG.repoName}/actions`);
        console.log('2. 毎日10-23時に自動実行されます');
        console.log('3. PCの電源を切っても問題ありません！');

    } catch (error) {
        console.error('\n❌ エラーが発生しました:', error.message);
        await autoVision.screenshot('error-github-setup-chrome.png');
        console.log('エラー時のスクリーンショットを保存しました: error-github-setup-chrome.png');
    } finally {
        // ブラウザは開いたままにする（確認のため）
        console.log('\n🌐 ブラウザは開いたままです。確認後、手動で閉じてください。');
    }
}

// 実行
main().catch(console.error);