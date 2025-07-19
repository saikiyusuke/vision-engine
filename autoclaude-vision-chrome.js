/**
 * AutoClaude Vision Chrome統合版
 * Chrome保存パスワードとの連携機能を追加
 */

const AutoClaudeVision = require('./autoclaude-vision');
const ChromeAutoLogin = require('./chrome-auto-login');

class AutoClaudeVisionChrome extends AutoClaudeVision {
    constructor(options = {}) {
        super(options);
        this.chromeLogin = new ChromeAutoLogin({
            headless: options.headless || false
        });
        this.useChromeProfile = options.useChromeProfile !== false;
    }

    /**
     * Chrome プロファイルを使用してブラウザを起動
     */
    async launch() {
        if (this.useChromeProfile) {
            console.log('🔧 Chrome統合モードで起動');
            this.page = await this.chromeLogin.launch();
            this.browser = this.page.context();
        } else {
            // 通常のAutoClaudeVision起動
            await super.launch();
        }
    }

    /**
     * Chrome自動ログイン機能付きナビゲーション
     */
    async gotoWithAutoLogin(url, siteConfig = {}) {
        // 自動ログインを試行
        const loginSuccess = await this.chromeLogin.autoLogin(url, siteConfig);
        
        if (!loginSuccess) {
            console.log('🔄 AutoClaude Visionでログイン処理を継続...');
            // 自動入力が失敗した場合は、AutoClaudeVisionの機能を使用
            return await super.goto(url);
        }
        
        return loginSuccess;
    }

    /**
     * 汎用的なサイトログイン（自然言語 + Chrome自動入力）
     */
    async loginToSite(siteName, options = {}) {
        const siteConfig = ChromeAutoLogin.getSiteConfig(siteName);
        const url = options.url || siteConfig.url;
        
        if (!url) {
            throw new Error(`サイト ${siteName} のURLが設定されていません`);
        }

        console.log(`\n🌐 ${siteName} にログイン中...`);
        
        // まずChrome自動入力を試す
        const autoLoginSuccess = await this.chromeLogin.autoLogin(url, siteConfig);
        
        if (autoLoginSuccess) {
            console.log('✅ Chrome自動入力でログイン成功');
            return true;
        }

        // 自動入力が失敗した場合、AutoClaudeVisionで処理
        console.log('🤖 AutoClaudeVisionでログイン処理...');
        
        // 自然言語でログインフォームを検出して入力
        const steps = [
            { action: 'fill', target: 'ユーザー名またはメールアドレスの入力欄', value: options.username },
            { action: 'fill', target: 'パスワードの入力欄', value: options.password },
            { action: 'click', target: 'ログインボタンまたはSign inボタン' }
        ];

        try {
            await this.executeSteps(steps);
            console.log('✅ ログイン成功');
            return true;
        } catch (error) {
            console.error('❌ ログイン失敗:', error.message);
            
            // 最後の手段：手動ログイン補助
            if (options.allowManual) {
                return await this.chromeLogin.assistLogin(url);
            }
            
            return false;
        }
    }

    /**
     * GitHub専用ログイン（2要素認証対応）
     */
    async loginToGitHub(options = {}) {
        console.log('🐙 GitHubにログイン中...');
        
        // GitHubログインページへ
        await this.goto('https://github.com/login');
        
        // Chrome自動入力を試す
        const autoFilled = await this.triggerChromeAutofill();
        
        if (!autoFilled && options.username && options.password) {
            // 手動で入力
            await this.fill('Username or email addressの入力欄', options.username);
            await this.fill('Passwordの入力欄', options.password);
        }
        
        // ログインボタンをクリック
        await this.click('Sign inボタン');
        
        // 2要素認証の確認
        try {
            await this.waitFor('2要素認証のページまたは認証コード入力欄', 5000);
            console.log('🔐 2要素認証が必要です');
            
            if (options.twoFactorCode) {
                await this.fill('認証コードの入力欄', options.twoFactorCode);
                await this.click('Verifyボタンまたは確認ボタン');
            } else {
                console.log('⏳ 認証コードの入力を待っています...');
                await this.page.waitForNavigation({ timeout: 120000 });
            }
        } catch {
            // 2要素認証なし
            console.log('✅ 2要素認証なしでログイン完了');
        }
        
        return true;
    }

    /**
     * Chrome自動入力をトリガー
     */
    async triggerChromeAutofill() {
        try {
            // パスワードフィールドを探す
            const passwordField = await this.page.$('input[type="password"]');
            if (!passwordField) return false;
            
            // 自動入力をトリガー
            await passwordField.click();
            await this.page.waitForTimeout(500);
            await this.page.keyboard.press('Tab');
            await this.page.keyboard.press('Shift+Tab');
            await this.page.waitForTimeout(1000);
            
            // 値が入力されたか確認
            const value = await passwordField.evaluate(el => el.value);
            return !!value;
        } catch {
            return false;
        }
    }

    /**
     * ブラウザを閉じる
     */
    async close() {
        if (this.useChromeProfile) {
            await this.chromeLogin.close();
        } else {
            await super.close();
        }
    }
}

module.exports = AutoClaudeVisionChrome;