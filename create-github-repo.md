# GitHubリポジトリ作成手順

## 1. GitHubでリポジトリを作成

1. https://github.com にアクセス
2. 右上の「+」ボタン → 「New repository」をクリック
3. 以下の設定で作成：
   - **Repository name**: `vision-engine` または好きな名前
   - **Description**: "AutoClaude Vision - AI-powered browser automation with Airregi sync"
   - **Public/Private**: どちらでもOK（Publicなら完全無料）
   - **他のオプションはチェックしない**（README等は既にあるため）

4. 「Create repository」をクリック

## 2. ローカルリポジトリをGitHubに接続

作成後に表示されるコマンドから、以下をターミナルで実行：

```bash
# GitHubのリポジトリURLを設定（YOUR_USERNAMEを自分のユーザー名に変更）
git remote add origin https://github.com/YOUR_USERNAME/vision-engine.git

# mainブランチに変更
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

## 3. GitHub Secretsを設定

1. GitHubのリポジトリページで「Settings」タブをクリック
2. 左メニューから「Secrets and variables」→「Actions」を選択
3. 「New repository secret」をクリックして以下を追加：

### 必須のSecrets

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | あなたのClaude APIキー |
| `AIRREGI_USERNAME` | `info@openmart.jp` |
| `AIRREGI_PASSWORD` | `info@openmartjp2024` |
| `EMAIL_TO` | `tuwari69@gmail.com` |

## 4. Actionsを有効化してテスト

1. 「Actions」タブをクリック
2. 「I understand my workflows, go ahead and enable them」をクリック
3. 左メニューから「Airレジ自動同期（AutoClaude Vision）」を選択
4. 「Run workflow」ボタンをクリック → もう一度「Run workflow」

## 5. 実行結果を確認

- 緑のチェックマーク✅ = 成功
- 赤のX ❌ = 失敗（クリックしてログを確認）
- 黄色の● = 実行中

## 完了！

これで毎日10-23時の毎時0分に自動実行されます。
PCの電源を切っても大丈夫です！