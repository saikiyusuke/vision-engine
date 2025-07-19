# 🚀 GitHub ログインガイド

## 現在の状況

GitHub CLIがインストールされましたが、GitHubへのログインが必要です。

## ログイン手順

### 1. ターミナルで以下のコマンドを実行

```bash
gh auth login
```

### 2. 以下の選択肢が表示されます

```
? What account do you want to log into?
> GitHub.com
  GitHub Enterprise Server

→ GitHub.com を選択（Enter）
```

```
? What is your preferred protocol for Git operations?
> HTTPS
  SSH

→ HTTPS を選択（Enter）
```

```
? Authenticate Git with your GitHub credentials?
> Yes
  No

→ Yes を選択（Enter）
```

```
? How would you like to authenticate GitHub CLI?
> Login with a web browser
  Paste an authentication token

→ Login with a web browser を選択（Enter）
```

### 3. ワンタイムコードが表示されます

```
! First copy your one-time code: XXXX-XXXX
Press Enter to open github.com in your browser...
```

- コードをコピー
- Enterを押してブラウザを開く
- GitHubでコードを入力
- 認証を承認

### 4. 認証完了後

```bash
# 認証状態を確認
gh auth status

# セットアップスクリプトを再実行
node github-setup-simple.js
```

## 代替方法: Personal Access Token

ブラウザ認証が使えない場合：

1. https://github.com/settings/tokens にアクセス
2. "Generate new token" → "Generate new token (classic)"
3. 以下の権限を選択:
   - repo（すべて）
   - workflow
   - admin:org → read:org
4. トークンを生成してコピー
5. `gh auth login` で "Paste an authentication token" を選択
6. トークンを貼り付け

## 🎯 次のステップ

ログイン完了後、以下のコマンドでセットアップを続行：

```bash
node github-setup-simple.js
```

これにより：
- リポジトリが自動作成される
- GitHub Secretsが設定される
- コードがプッシュされる
- GitHub Actionsが有効になる
- 24時間365日の自動実行が開始される

---

準備ができたら、上記の手順でGitHubにログインしてください。