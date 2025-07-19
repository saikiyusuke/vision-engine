#!/usr/bin/env node
/**
 * GitHub自動セットアップスクリプト（AutoClaude Vision版）
 * リポジトリ作成、Secrets設定、プッシュ、Actions実行まで全自動化
 */

require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');
const { execSync } = require('child_process');
const readline = require('readline');

// 設定
const CONFIG = {
    repoName: 'vision-engine',
    repoDescription: 'AutoClaude Vision - AI-powered browser automation with Airregi sync',
    isPublic: true,
    secrets: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        AIRREGI_USERNAME: 'info@openmart.jp',
        AIRREGI_PASSWORD: 'info@openmartjp2024',
        EMAIL_TO: 'tuwari69@gmail.com'
    }
};

// ユーザー入力を取得
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
    console.log('🚀 GitHub自動セットアップを開始します...\n');

    // GitHubのユーザー名とパスワードを取得
    const githubUsername = await getUserInput('GitHubユーザー名を入力してください: ');
    const githubPassword = await getUserInput('GitHubパスワードを入力してください: ');

    const autoVision = new AutoClaudeVision({
        apiKey: process.env.ANTHROPIC_API_KEY,
        headless: false, // 実行を見たい場合はfalse
        viewport: { width: 1280, height: 800 }
    });

    try {
        await autoVision.launch();

        // ステップ1: GitHubにログイン
        console.log('\n📍 ステップ1: GitHubにログイン');
        await autoVision.goto('https://github.com/login');
        await autoVision.fill('ユーザー名またはメールアドレスの入力欄', githubUsername);
        await autoVision.fill('パスワードの入力欄', githubPassword);
        await autoVision.click('Sign inボタン');
        await autoVision.waitFor('ダッシュボードまたはプロフィールページ', 10000);

        // 2要素認証が必要な場合の処理
        const has2FA = await autoVision.page.url().includes('two_factor');
        if (has2FA) {
            console.log('⚠️  2要素認証が必要です');
            const code = await getUserInput('2要素認証コードを入力してください: ');
            await autoVision.fill('認証コードの入力欄', code);
            await autoVision.click('確認ボタンまたはVerifyボタン');
            await autoVision.waitFor('ダッシュボードまたはプロフィールページ', 10000);
        }

        // ステップ2: 新しいリポジトリを作成
        console.log('\n📍 ステップ2: 新しいリポジトリを作成');
        await autoVision.goto('https://github.com/new');
        
        // リポジトリ名を入力
        await autoVision.fill('Repository nameの入力欄', CONFIG.repoName);
        
        // 説明を入力
        await autoVision.fill('Description（optional）の入力欄', CONFIG.repoDescription);
        
        // Publicを選択
        if (CONFIG.isPublic) {
            await autoVision.click('Publicのラジオボタン');
        } else {
            await autoVision.click('Privateのラジオボタン');
        }

        // リポジトリを作成
        await autoVision.click('Create repositoryボタン');
        await autoVision.waitFor('Quick setupページまたはコード画面', 10000);

        // リポジトリURLを取得
        const repoUrl = `https://github.com/${githubUsername}/${CONFIG.repoName}.git`;
        console.log(`✅ リポジトリ作成完了: ${repoUrl}`);

        // ステップ3: GitHub Secretsを設定
        console.log('\n📍 ステップ3: GitHub Secretsを設定');
        await autoVision.goto(`https://github.com/${githubUsername}/${CONFIG.repoName}/settings/secrets/actions`);

        for (const [secretName, secretValue] of Object.entries(CONFIG.secrets)) {
            console.log(`  - ${secretName}を追加中...`);
            
            // 新しいシークレットボタンをクリック
            await autoVision.click('New repository secretボタン');
            
            // シークレット名を入力
            await autoVision.fill('Nameの入力欄', secretName);
            
            // シークレット値を入力
            await autoVision.fill('Secretの入力欄またはValueの入力欄', secretValue);
            
            // 保存
            await autoVision.click('Add secretボタン');
            
            // 次のシークレットのために少し待つ
            await autoVision.page.waitForTimeout(2000);
        }

        console.log('✅ すべてのSecretsを追加しました');

        // ステップ4: ローカルからプッシュ
        console.log('\n📍 ステップ4: ローカルからプッシュ');
        try {
            execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
        } catch (e) {
            // すでにoriginが存在する場合は削除して再追加
            execSync('git remote remove origin', { stdio: 'inherit' });
            execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
        }
        
        console.log('リモートリポジトリを設定しました');
        console.log('プッシュ中...');
        execSync('git push -u origin main', { stdio: 'inherit' });
        console.log('✅ コードをプッシュしました');

        // ステップ5: GitHub Actionsを実行
        console.log('\n📍 ステップ5: GitHub Actionsを手動実行');
        await autoVision.goto(`https://github.com/${githubUsername}/${CONFIG.repoName}/actions`);
        
        // ワークフローを選択
        await autoVision.click('Airレジ自動同期（AutoClaude Vision）');
        
        // Run workflowボタンをクリック
        await autoVision.click('Run workflowボタン');
        
        // ドロップダウンが表示されたら、もう一度クリック
        await autoVision.page.waitForTimeout(1000);
        await autoVision.click('Run workflow（緑色のボタン）');

        console.log('✅ GitHub Actionsを開始しました');
        console.log('\n🎉 セットアップ完了！');
        console.log(`\n📍 以下のURLで進行状況を確認できます:`);
        console.log(`https://github.com/${githubUsername}/${CONFIG.repoName}/actions`);

    } catch (error) {
        console.error('❌ エラーが発生しました:', error.message);
        // エラー時のスクリーンショット
        await autoVision.screenshot('error-github-setup.png');
        console.log('エラー時のスクリーンショットを保存しました: error-github-setup.png');
    } finally {
        await autoVision.close();
    }
}

// 実行
main().catch(console.error);