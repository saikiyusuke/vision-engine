const { chromium } = require('playwright');
const keytar = require('keytar'); // macOSのキーチェーンアクセス用

class PasswordHelper {
  /**
   * 保存されたパスワードを使用してログイン
   */
  async loginWithSavedPassword(page, url) {
    console.log('🔐 保存されたパスワードでログインを試みます...');
    
    // ページにアクセス
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    // パスワードフィールドにフォーカス
    const passwordField = await page.locator('input[type="password"]').first();
    if (await passwordField.isVisible()) {
      await passwordField.click();
      
      // Chromeのパスワードマネージャーが表示されるのを待つ
      console.log('💡 Chromeのパスワードマネージャーが表示されるはずです');
      console.log('保存されたパスワードをクリックしてください');
      
      // 自動入力を待つ
      await page.waitForTimeout(3000);
      
      // ログインボタンを探してクリック
      const loginButton = await page.locator('button[type="submit"], input[type="submit"]').first();
      if (await loginButton.isVisible()) {
        await loginButton.click();
        console.log('✅ ログインボタンをクリックしました');
      }
    }
  }

  /**
   * macOSキーチェーンからパスワードを取得（Node.js用）
   */
  async getPasswordFromKeychain(service, account) {
    try {
      const password = await keytar.getPassword(service, account);
      if (password) {
        console.log('🔑 キーチェーンからパスワードを取得しました');
        return password;
      }
    } catch (error) {
      console.log('⚠️ キーチェーンアクセスに失敗:', error.message);
    }
    return null;
  }

  /**
   * よく使うサービスの認証情報を管理
   */
  async getServiceCredentials(serviceName) {
    const services = {
      'airregi': {
        url: 'https://airregi.jp/',
        username: 'rsc_yamaguchi@yamatech.co.jp',
        keychainService: 'airregi.jp'
      },
      'anthropic': {
        url: 'https://console.anthropic.com/',
        keychainService: 'console.anthropic.com'
      },
      'openmart': {
        url: 'https://partner.openmart.jp/',
        keychainService: 'partner.openmart.jp'
      }
    };

    return services[serviceName] || null;
  }
}

module.exports = PasswordHelper;