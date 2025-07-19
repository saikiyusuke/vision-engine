# 🚀 セットアップガイド

## 📋 プロジェクト概要

**AutoClaude Vision + Airレジ自動化 + GitHub Actions**

このプロジェクトは、以下の機能を提供します：
- 🤖 自然言語でブラウザを操作（AutoClaude Vision）
- 📊 Airレジから売上データを自動取得
- 📧 OpenMartへの自動アップロードとメール送信
- ⏰ 24時間365日自動実行（GitHub Actions）

## 🛠️ セットアップ方法

### 前提条件
- Node.js 18以上
- GitHub アカウント
- Anthropic API Key

### 方法1: GitHub CLI使用（推奨） ✅

```bash
# 1. GitHub CLIをインストール
brew install gh

# 2. 依存関係をインストール
cd /Users/apple/Projects/mothership/vision-engine
npm install

# 3. Playwrightブラウザをインストール
npx playwright install chromium

# 4. .envファイルを確認
# ANTHROPIC_API_KEY=your-api-key-here

# 5. セットアップスクリプトを実行
node github-setup-simple.js
```

### 方法2: 手動セットアップ

1. **GitHubでリポジトリ作成**
   - https://github.com/new
   - リポジトリ名: vision-engine
   - Public設定

2. **コードをプッシュ**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/vision-engine.git
   git push -u origin main
   ```

3. **GitHub Secretsを設定**
   - Settings → Secrets and variables → Actions
   - 以下を追加:
     - `ANTHROPIC_API_KEY`
     - `AIRREGI_USERNAME` = info@openmart.jp
     - `AIRREGI_PASSWORD` = info@openmartjp2024
     - `EMAIL_TO` = tuwari69@gmail.com

4. **GitHub Actionsを実行**
   - Actions → Run workflow

## 🧪 動作テスト

### ローカルテスト

```bash
# AutoClaude Visionのテスト
node test-vision.js

# Airレジ自動化のテスト（ローカル）
node airregi-vision.js

# Chrome起動のデバッグ
node debug-chrome-launch.js
```

### GitHub Actionsテスト

1. GitHub → Actions タブを開く
2. "Airレジ自動同期" ワークフローを選択
3. "Run workflow" をクリック
4. 実行結果を確認

## 📁 ファイル構成

```
vision-engine/
├── .github/
│   └── workflows/
│       └── airregi-autoclaude.yml    # 定期実行設定
├── autoclaude-vision.js              # 自然言語ブラウザ操作
├── airregi-autoclaude-scheduled.js   # Airレジ自動化
├── chrome-auto-login.js              # Chrome自動ログイン
├── github-setup-simple.js            # 簡単セットアップ
├── debug-chrome-launch.js            # デバッグツール
├── send-email.php                    # メール送信（PHP）
├── test-email.php                    # メールテスト
├── .env                              # API Key設定
├── TROUBLESHOOTING.md                # トラブルシューティング
└── SETUP_GUIDE.md                    # このファイル
```

## ⏰ 実行スケジュール

GitHub Actionsで以下のスケジュールで自動実行：
- 毎日10時〜23時の毎時0分（日本時間）
- PCの電源OFF OK
- 完全無料（パブリックリポジトリ）

## 🔧 カスタマイズ

### 実行時間の変更

`.github/workflows/airregi-autoclaude.yml` を編集：
```yaml
schedule:
  - cron: '0 1-14 * * *'  # UTC時間（日本時間-9時間）
```

### メール送信先の変更

GitHub Secrets で `EMAIL_TO` を更新

### Airレジ認証情報の変更

GitHub Secrets で以下を更新：
- `AIRREGI_USERNAME`
- `AIRREGI_PASSWORD`

## 🚨 トラブルシューティング

### Chromeが起動しない
```bash
# デバッグスクリプトを実行
node debug-chrome-launch.js

# Playwrightを再インストール
npm install playwright
npx playwright install chromium
```

### GitHub Actionsが失敗する
- Secretsが正しく設定されているか確認
- ワークフローのログを確認
- 手動実行でテスト

### メールが届かない
- 本番環境（GMOサーバー）でのみ動作
- 迷惑メールフォルダを確認
- 送信元ドメインのSPF設定を確認

## 📞 サポート

詳細なトラブルシューティングは `TROUBLESHOOTING.md` を参照してください。

---

最終更新: 2025-01-19
作成者: Claude Code + AutoClaude Vision