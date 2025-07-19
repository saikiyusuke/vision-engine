# GitHub Actions セットアップガイド

## 🚀 概要

このガイドでは、Airレジ自動同期をGitHub Actionsで実行するための設定方法を説明します。
設定が完了すると、**PCの電源を切っても**毎日10時〜23時の毎時0分に自動実行されます。

## 📋 前提条件

- GitHubアカウント
- このリポジトリへのアクセス権限
- Anthropic API Key（Claude API）

## 🔧 セットアップ手順

### 1. リポジトリをGitHubにプッシュ

まだGitHubにプッシュしていない場合：

```bash
# リポジトリを初期化
git init

# GitHubでリポジトリを作成後
git remote add origin https://github.com/YOUR_USERNAME/vision-engine.git

# ファイルをコミット
git add .
git commit -m "Initial commit"

# プッシュ
git push -u origin main
```

### 2. GitHub Secrets の設定

GitHubリポジトリで以下のSecretsを設定します：

1. リポジトリページで `Settings` タブをクリック
2. 左メニューから `Secrets and variables` → `Actions` を選択
3. `New repository secret` ボタンをクリック
4. 以下の4つのSecretを追加：

#### 必須のSecrets

| Name | Value | 説明 |
|------|-------|------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Claude APIキー |
| `AIRREGI_USERNAME` | `info@openmart.jp` | Airレジのユーザー名 |
| `AIRREGI_PASSWORD` | `パスワード` | Airレジのパスワード |
| `EMAIL_TO` | `tuwari69@gmail.com` | 通知メールの送信先 |

### 3. Actions の有効化

1. リポジトリの `Actions` タブをクリック
2. 「I understand my workflows, go ahead and enable them」をクリック

### 4. 手動実行でテスト

1. `Actions` タブを開く
2. 左メニューから `Airレジ自動同期（AutoClaude Vision）` を選択
3. 右側の `Run workflow` ボタンをクリック
4. `Run workflow` を再度クリックして実行

### 5. 実行結果の確認

- 実行中は黄色い●が表示されます
- 成功すると緑色の✅になります
- 失敗すると赤色の❌になります

クリックすると詳細ログを確認できます。

## 📅 自動実行スケジュール

設定されているスケジュール：
- **毎日10:00〜23:00の毎時0分**に自動実行
- 例：10:00, 11:00, 12:00, ..., 22:00, 23:00

## 🔍 トラブルシューティング

### エラーが発生した場合

1. Actions タブで失敗したワークフローをクリック
2. エラーログを確認
3. `debug-screenshots` アーティファクトをダウンロードしてスクリーンショットを確認

### よくあるエラー

- **ANTHROPIC_API_KEY が無効**: APIキーを確認
- **ログイン失敗**: ユーザー名/パスワードを確認
- **タイムアウト**: ネットワークの問題か、Airレジ側の問題

## 💰 コストについて

### GitHub Actions 無料枠
- **パブリックリポジトリ**: 完全無料
- **プライベートリポジトリ**: 月2,000分まで無料

1日14回実行 × 5分 = 70分/日 = 2,100分/月
→ プライベートリポジトリでもギリギリ無料枠内

### Claude API
- 画面認識のたびにAPIを使用
- 1回の実行で約10-20回のAPI呼び出し
- 月額$20程度の使用量（目安）

## 🛠️ カスタマイズ

### 実行時間を変更したい場合

`.github/workflows/airregi-autoclaude.yml` の cron 設定を編集：

```yaml
schedule:
  - cron: '0 1-14 * * *'  # UTC時間
```

### 日本時間との対応表
- 日本時間 10:00 = UTC 1:00
- 日本時間 23:00 = UTC 14:00

## 📝 メンテナンス

### ログの確認方法
1. Actions タブを開く
2. 実行履歴から確認したい実行をクリック
3. 各ステップをクリックして詳細ログを表示

### CSVファイルの取得
成功した実行では、CSVファイルがアーティファクトとして30日間保存されます。
Actions → 該当の実行 → Artifacts からダウンロード可能です。

## 🎯 まとめ

設定が完了すれば：
- ✅ PCを切っても自動実行
- ✅ 毎日決まった時間に実行
- ✅ エラー時は自動でスクリーンショット保存
- ✅ メールで結果通知

これで24時間365日、自動でAirレジのデータを取得できます！