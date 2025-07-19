#!/usr/bin/env node
/**
 * Chrome起動デバッグスクリプト
 * Playwrightで様々なパターンのブラウザ起動をテスト
 */

const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function debugChromeLaunch() {
    console.log('🔍 Chrome起動デバッグ開始\n');
    console.log('環境情報:');
    console.log('- OS:', os.platform(), os.release());
    console.log('- Node.js:', process.version);
    console.log('- Playwright:', require('playwright/package.json').version);
    console.log('');

    // 1. 通常のChromium起動テスト
    console.log('📋 テスト1: 通常のChromium起動');
    try {
        const browser = await chromium.launch({ 
            headless: false,
            timeout: 10000 
        });
        console.log('✅ 成功: Chromiumブラウザが起動しました');
        const page = await browser.newPage();
        await page.goto('https://github.com');
        console.log('✅ GitHubページにアクセス成功');
        await page.waitForTimeout(2000);
        await browser.close();
    } catch (error) {
        console.error('❌ 失敗:', error.message);
        console.error('詳細:', error);
    }
    console.log('');

    // 2. Chromeチャンネル起動テスト
    console.log('📋 テスト2: Chromeチャンネル起動');
    try {
        // Chromeの実行ファイルを確認
        const chromePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
            '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
        ];
        
        let chromeFound = false;
        for (const chromePath of chromePaths) {
            if (fs.existsSync(chromePath)) {
                console.log(`✅ Chrome検出: ${chromePath}`);
                chromeFound = true;
            }
        }
        
        if (!chromeFound) {
            console.log('⚠️  Chromeがインストールされていない可能性があります');
        }

        const browser = await chromium.launch({ 
            headless: false, 
            channel: 'chrome',
            timeout: 10000 
        });
        console.log('✅ 成功: Chromeブラウザが起動しました');
        const page = await browser.newPage();
        await page.goto('https://github.com/login');
        console.log('✅ GitHubログインページにアクセス成功');
        await page.waitForTimeout(2000);
        await browser.close();
    } catch (error) {
        console.error('❌ 失敗:', error.message);
        if (error.message.includes('channel')) {
            console.log('💡 ヒント: Chromeがインストールされているか確認してください');
        }
    }
    console.log('');

    // 3. プロファイル読み込みテスト（一時ディレクトリ）
    console.log('📋 テスト3: プロファイル読み込み（一時ディレクトリ）');
    try {
        const tmpProfile = path.join(os.tmpdir(), 'playwright-test-profile');
        console.log(`📁 一時プロファイルパス: ${tmpProfile}`);
        
        const context = await chromium.launchPersistentContext(
            tmpProfile,
            { 
                headless: false,
                timeout: 10000
            }
        );
        console.log('✅ 成功: プロファイル読み込み成功');
        const page = context.pages()[0] || await context.newPage();
        await page.goto('https://github.com');
        console.log('✅ GitHubページにアクセス成功');
        await page.waitForTimeout(2000);
        await context.close();
    } catch (error) {
        console.error('❌ 失敗:', error.message);
    }
    console.log('');

    // 4. Chromeプロファイル読み込みテスト
    console.log('📋 テスト4: 実際のChromeプロファイル読み込み');
    try {
        const chromeProfile = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'Default');
        console.log(`📁 Chromeプロファイルパス: ${chromeProfile}`);
        
        if (!fs.existsSync(chromeProfile)) {
            console.log('⚠️  Chromeプロファイルが見つかりません');
        } else {
            console.log('✅ Chromeプロファイルが存在します');
            
            // プロファイルのアクセス権限を確認
            try {
                fs.accessSync(chromeProfile, fs.constants.R_OK);
                console.log('✅ 読み取り権限あり');
            } catch {
                console.log('❌ 読み取り権限なし');
            }
        }
        
        const context = await chromium.launchPersistentContext(
            chromeProfile,
            { 
                headless: false,
                channel: 'chrome',
                args: ['--disable-blink-features=AutomationControlled'],
                timeout: 10000
            }
        );
        console.log('✅ 成功: Chromeプロファイル読み込み成功');
        const page = context.pages()[0] || await context.newPage();
        await page.goto('https://github.com/login');
        console.log('✅ GitHubログインページにアクセス成功');
        await page.waitForTimeout(3000);
        await context.close();
    } catch (error) {
        console.error('❌ 失敗:', error.message);
        if (error.message.includes('permission')) {
            console.log('💡 ヒント: macOSのセキュリティ設定でアクセス許可が必要です');
        }
        if (error.message.includes('already running')) {
            console.log('💡 ヒント: Chromeを完全に終了してから再試行してください');
        }
    }
    
    console.log('\n🏁 デバッグ完了');
    console.log('\n💡 推奨事項:');
    console.log('1. Chromeがインストールされていることを確認');
    console.log('2. Chromeを完全に終了してから実行');
    console.log('3. macOSのセキュリティ設定でフルディスクアクセスを許可');
    console.log('4. 必要に応じてPlaywrightを再インストール: npm install playwright');
}

// 実行
debugChromeLaunch().catch(console.error);