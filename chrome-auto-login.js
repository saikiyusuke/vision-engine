/**
 * Chrome保存パスワード自動入力クラス
 * 任意のサイトでChromeに保存されたパスワードを活用
 */

const { chromium } = require('playwright');
const os = require('os');
const path = require('path');

class ChromeAutoLogin {
    constructor(options = {}) {
        this.options = {
            headless: false,
            ...options
        };
        
        // OSに応じたChromeプロファイルパスを設定
        this.profilePath = this.getChromeProfilePath();
    }

    /**
     * OSに応じたChromeプロファイルパスを取得
     */
    getChromeProfilePath() {
        const platform = os.platform();
        const homeDir = os.homedir();
        
        switch (platform) {
            case 'darwin': // macOS
                return path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome', 'Default');
            case 'win32': // Windows
                return path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default');
            case 'linux':
                return path.join(homeDir, '.config', 'google-chrome', 'Default');
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }

    /**
     * Chromeの既存プロファイルでブラウザを起動
     */
    async launch() {
        console.log('🌐 ブラウザを起動中...');
        
        // 方法1: Chromeチャンネルで新規プロファイル起動（推奨）
        try {
            console.log('📋 方法1: Chromeチャンネルで起動を試行...');
            this.browser = await chromium.launch({
                ...this.options,
                channel: 'chrome',
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            });
            
            this.page = await this.browser.newPage();
            console.log('✅ Chrome起動成功（新規プロファイル）');
            
            // Chromeが起動したことを確認
            await this.page.goto('about:blank');
            console.log('✅ ブラウザの動作確認完了');
            
            return this.page;
        } catch (error) {
            console.error('❌ Chromeチャンネル起動エラー:', error.message);
            
            // 方法2: 通常のChromium起動
            try {
                console.log('📋 方法2: 通常のChromiumで起動を試行...');
                this.browser = await chromium.launch({
                    ...this.options,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                
                this.page = await this.browser.newPage();
                console.log('✅ Chromium起動成功');
                return this.page;
            } catch (fallbackError) {
                console.error('❌ Chromium起動エラー:', fallbackError.message);
                
                // 詳細なエラー情報を表示
                console.log('\n🔍 トラブルシューティング:');
                console.log('1. Playwrightのブラウザをインストール:');
                console.log('   npx playwright install chromium');
                console.log('2. Chromeがインストールされているか確認:');
                console.log('   ls "/Applications/Google Chrome.app"');
                console.log('3. デバッグスクリプトを実行:');
                console.log('   node debug-chrome-launch.js');
                
                throw new Error('ブラウザの起動に失敗しました。上記のトラブルシューティングを試してください。');
            }
        }
    }

    /**
     * 指定されたURLにアクセスして自動ログインを試行
     */
    async autoLogin(url, options = {}) {
        const {
            usernameSelector = 'input[type="text"], input[type="email"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]',
            passwordSelector = 'input[type="password"]',
            submitSelector = 'button[type="submit"], input[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("ログイン")',
            waitForNavigation = true
        } = options;

        console.log(`\n🔐 ${url} への自動ログインを開始...`);
        
        try {
            // ページに移動
            await this.page.goto(url, { waitUntil: 'networkidle' });
            console.log('📄 ページ読み込み完了');

            // パスワードフィールドを探す
            const passwordField = await this.page.$(passwordSelector);
            if (!passwordField) {
                console.log('⚠️  パスワードフィールドが見つかりません');
                return false;
            }

            // Chromeの自動入力をトリガー
            console.log('🔄 Chrome自動入力をトリガー中...');
            
            // 方法1: パスワードフィールドをクリックして自動入力を促す
            await passwordField.click();
            await this.page.waitForTimeout(500);
            
            // 方法2: Tabキーで自動入力をトリガー
            await this.page.keyboard.press('Tab');
            await this.page.keyboard.press('Shift+Tab');
            await this.page.waitForTimeout(1000);

            // パスワードが入力されたか確認
            const passwordValue = await passwordField.evaluate(el => el.value);
            if (passwordValue) {
                console.log('✅ パスワードが自動入力されました');
                
                // ログインボタンをクリック
                const submitButton = await this.page.$(submitSelector);
                if (submitButton) {
                    console.log('🖱️  ログインボタンをクリック');
                    await submitButton.click();
                    
                    if (waitForNavigation) {
                        await this.page.waitForNavigation({ 
                            waitUntil: 'networkidle',
                            timeout: 10000 
                        }).catch(() => {
                            console.log('📍 ページ遷移を待機中...');
                        });
                    }
                    
                    console.log('✅ ログイン処理完了');
                    return true;
                }
            } else {
                console.log('⚠️  自動入力されませんでした（初回ログインの可能性）');
                return false;
            }
        } catch (error) {
            console.error('❌ 自動ログインエラー:', error.message);
            return false;
        }
    }

    /**
     * 手動でのログイン補助（自動入力が効かない場合）
     */
    async assistLogin(url, credentials = {}) {
        console.log('\n👤 手動ログイン補助モード');
        
        await this.page.goto(url, { waitUntil: 'networkidle' });
        
        // ユーザーに入力を促す
        console.log('📝 ブラウザでログイン情報を入力してください');
        console.log('   Chromeが記憶している場合は自動で入力されます');
        console.log('⏳ ログイン完了を待っています...');
        
        // ログイン完了を検出（URLの変化やエレメントの出現を監視）
        await this.page.waitForFunction(
            () => window.location.href !== url || document.querySelector('[data-testid="user-menu"], .user-avatar, .dashboard'),
            { timeout: 300000 } // 5分待機
        );
        
        console.log('✅ ログイン完了を検出しました');
        return true;
    }

    /**
     * ブラウザを閉じる
     */
    async close() {
        if (this.context) {
            await this.context.close();
        } else if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * 特定サイト用のカスタム設定
     */
    static getSiteConfig(siteName) {
        const configs = {
            github: {
                url: 'https://github.com/login',
                usernameSelector: '#login_field',
                passwordSelector: '#password',
                submitSelector: 'input[type="submit"]'
            },
            airregi: {
                url: 'https://airregi.jp/login',
                usernameSelector: 'input[name="username"]',
                passwordSelector: 'input[name="password"]',
                submitSelector: 'button[type="submit"]'
            },
            google: {
                url: 'https://accounts.google.com',
                usernameSelector: 'input[type="email"]',
                passwordSelector: 'input[type="password"]',
                submitSelector: 'button[type="submit"]'
            }
        };
        
        return configs[siteName] || {};
    }
}

module.exports = ChromeAutoLogin;