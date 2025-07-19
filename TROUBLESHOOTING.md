# 🔧 トラブルシューティングガイド

## 📋 概要

このドキュメントは、AutoClaude Vision + GitHub Actions自動セットアップで発生した問題と解決策をまとめたものです。

## 🚨 問題: Chromeブラウザが開かない

### 症状
- `node github-auto-setup-chrome.js` を実行してもChromeブラウザが開かない
- エラーメッセージが表示されない
- プロセスが停止する

### 原因
1. **PlaywrightとChromeプロファイルの非互換性**
   - PlaywrightはChromiumベースで動作し、実際のGoogle Chromeプロファイルとの直接的な互換性に制限がある
   - `chromium.launchPersistentContext`でChromeプロファイルを読み込む際にエラーが発生

2. **macOSセキュリティ制限**
   - Chromeプロファイルへのアクセスには特別な権限が必要
   - フルディスクアクセスが許可されていない可能性

3. **Chromeプロセスの競合**
   - 既にChromeが起動している場合、プロファイルがロックされる
   - 複数のChromeインスタンスが同じプロファイルにアクセスできない

## 🛠️ 解決策

### 方法1: デバッグスクリプトで問題を特定

```bash
node debug-chrome-launch.js
```

このスクリプトは以下をテストします：
- 通常のChromium起動
- Chromeチャンネル起動
- プロファイル読み込み
- 実際のChromeプロファイルアクセス

### 方法2: GitHub CLIを使用（推奨）

```bash
# GitHub CLIのインストール
brew install gh

# 簡単セットアップスクリプトの実行
node github-setup-simple.js
```

**メリット:**
- Chrome自動ログインに依存しない
- 確実に動作する
- GitHub公式ツールを使用

### 方法3: 手動セットアップ

1. **GitHubでリポジトリ作成**
   ```bash
   gh repo create vision-engine --public
   ```

2. **Secretsの設定**
   ```bash
   gh secret set ANTHROPIC_API_KEY --body "your-api-key"
   gh secret set AIRREGI_USERNAME --body "info@openmart.jp"
   gh secret set AIRREGI_PASSWORD --body "info@openmartjp2024"
   gh secret set EMAIL_TO --body "tuwari69@gmail.com"
   ```

3. **コードのプッシュ**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/vision-engine.git
   git push -u origin main
   ```

## 🔍 Chrome自動ログインの今後の実装方針

### 現在の制限事項
- PlaywrightでChromeプロファイルを直接使用することは技術的に困難
- macOSのセキュリティ制限により追加の権限設定が必要

### 推奨アプローチ

1. **Puppeteerの使用**
   ```javascript
   const puppeteer = require('puppeteer');
   const browser = await puppeteer.launch({
       executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
       userDataDir: '/Users/apple/Library/Application Support/Google/Chrome/Default',
       headless: false
   });
   ```

2. **Chrome拡張機能の開発**
   - パスワードマネージャーAPIにアクセス
   - 自動入力を制御

3. **セキュアな資格情報管理**
   - macOS Keychainの使用
   - 環境変数での管理
   - GitHub Secretsの活用

## 📝 引き継ぎメモ

### 完成している機能
- ✅ AutoClaude Vision基本機能
- ✅ GitHub Actions ワークフロー
- ✅ Airレジ自動化スクリプト
- ✅ メール送信機能（PHPベース）

### 未解決の課題
- ⚠️ Chrome自動ログイン機能の完全な実装
- ⚠️ 2要素認証の自動処理

### 推奨される次のステップ
1. `github-setup-simple.js`でGitHub Actionsをセットアップ
2. 手動でGitHubにログインしてテスト
3. 定期実行の動作確認
4. 必要に応じてChrome自動ログイン機能を改良

## 🔗 関連ファイル

- `debug-chrome-launch.js` - Chrome起動問題のデバッグツール
- `github-setup-simple.js` - GitHub CLI使用の簡単セットアップ
- `chrome-auto-login.js` - Chrome自動ログインクラス（要改善）
- `autoclaude-vision-chrome.js` - Chrome統合版AutoClaude Vision

## 📞 サポート

問題が解決しない場合：
1. `debug-chrome-launch.js`の出力を確認
2. macOSのセキュリティ設定を再確認
3. GitHub CLIベースのセットアップを使用

---

最終更新: 2025-01-19