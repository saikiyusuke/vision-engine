#!/usr/bin/env node
/**
 * Chrome自動ログインのテストスクリプト
 * 各種サイトでChrome保存パスワードが使えるかテスト
 */

const ChromeAutoLogin = require('./chrome-auto-login');

async function testChromeLogin() {
    console.log('🧪 Chrome自動ログインテスト\n');
    
    const chromeLogin = new ChromeAutoLogin({
        headless: false
    });

    try {
        await chromeLogin.launch();
        
        console.log('テストしたいサイトを選択してください:');
        console.log('1. GitHub');
        console.log('2. Google');
        console.log('3. その他（URLを入力）');
        console.log('4. 終了');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const choice = await new Promise(resolve => {
            rl.question('\n選択 (1-4): ', answer => {
                rl.close();
                resolve(answer);
            });
        });

        let testUrl;
        switch (choice) {
            case '1':
                testUrl = 'https://github.com/login';
                break;
            case '2':
                testUrl = 'https://accounts.google.com';
                break;
            case '3':
                const rl2 = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                testUrl = await new Promise(resolve => {
                    rl2.question('URLを入力: ', answer => {
                        rl2.close();
                        resolve(answer);
                    });
                });
                break;
            default:
                console.log('終了します');
                await chromeLogin.close();
                return;
        }

        console.log(`\n🌐 ${testUrl} でテスト中...\n`);
        
        const success = await chromeLogin.autoLogin(testUrl);
        
        if (success) {
            console.log('\n✅ 自動ログイン成功！');
            console.log('Chromeの保存パスワードが正常に使用されました。');
        } else {
            console.log('\n⚠️  自動ログインできませんでした');
            console.log('考えられる原因:');
            console.log('- このサイトのパスワードがChromeに保存されていない');
            console.log('- 初回ログイン');
            console.log('- サイトの構造が特殊');
            
            console.log('\n手動でログインしてください（Chromeがパスワードを記憶します）');
            await chromeLogin.assistLogin(testUrl);
        }
        
        console.log('\n🎯 今後このサイトでは自動ログインが可能になります！');
        
    } catch (error) {
        console.error('❌ エラー:', error.message);
    }
    
    console.log('\n終了するにはブラウザを閉じてください。');
}

// 実行
testChromeLogin().catch(console.error);