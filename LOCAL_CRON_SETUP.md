# 🕐 Airレジ自動化 - ローカルcron設定ガイド

## ✅ 設定完了

ローカル環境でのAirレジ自動化の定期実行設定が完了しました。

## 📋 設定内容

### crontabエントリ
```bash
0 10-23 * * * /bin/bash /Users/apple/Projects/mothership/vision-engine/airregi-local-cron.sh >> /Users/apple/Projects/mothership/vision-engine/logs/airregi-cron.log 2>&1
```

### 実行スケジュール
- **実行時間**: 毎日10時〜23時の毎時0分（計14回/日）
- **実行時刻**: 10:00, 11:00, 12:00, ..., 22:00, 23:00

### ファイル構成
- **実行スクリプト**: `airregi-local-cron.sh`
- **ログファイル**: `logs/airregi-cron.log`
- **CSVダウンロード先**: `downloads/`

## 🔧 管理コマンド

### ログを確認
```bash
# 最新のログを確認
tail -f logs/airregi-cron.log

# 今日のログを確認
grep "$(date '+%Y-%m-%d')" logs/airregi-cron.log
```

### 手動実行
```bash
./airregi-local-cron.sh
```

### cron設定を確認
```bash
crontab -l | grep airregi
```

### cron設定を編集
```bash
crontab -e
```

### cron設定を削除
```bash
crontab -l | grep -v 'airregi-local-cron.sh' | crontab -
```

## ⚠️ 注意事項

### PCの電源管理
- **スリープ防止**: システム環境設定 > 省エネルギー で設定
- **自動スリープを無効化**: 電源接続時のスリープを「しない」に設定
- **ディスプレイスリープ**: ディスプレイはスリープしてもOK

### ログインセッション
- ログアウトするとcronが実行されません
- ユーザーがログインした状態を維持してください

### トラブルシューティング

#### cronが実行されない場合
1. crontabの権限を確認
   ```bash
   ls -la /usr/bin/crontab
   ```

2. cronデーモンの状態を確認
   ```bash
   sudo launchctl list | grep cron
   ```

3. システムログを確認
   ```bash
   log show --predicate 'process == "cron"' --last 1h
   ```

#### ログインに失敗する場合
- `error-state.png` を確認して画面の状態を把握
- 手動で一度ログインして、Cookieを保存させる

## 📊 実行結果の確認方法

### 成功時のログ
```
==========================================
🚀 Airレジ自動化実行開始: 2025-07-19 10:00:00
==========================================
📍 AutoClaude Vision版を実行中...
[2025/7/19 10:00:05] 📍 Airレジ自動化処理を開始します（AutoClaude Vision版）
...
[2025/7/19 10:01:30] ✅ メール送信成功
✅ 実行成功 (2025-07-19 10:01:30)
==========================================
```

### エラー時の対処
1. ログファイルでエラー内容を確認
2. `error-state.png` でブラウザの状態を確認
3. 手動実行でデバッグ

## 🚀 GitHub Actionsとの違い

| 項目 | ローカルcron | GitHub Actions |
|------|-------------|----------------|
| 実行環境 | あなたのMac | GitHub のサーバー |
| ログイン成功率 | 高い（ローカルIP） | 低い（データセンターIP） |
| 実行条件 | PCが起動している必要 | 24時間365日自動実行 |
| コスト | 無料（電気代のみ） | 無料（パブリックリポジトリ） |
| メンテナンス | 自分で管理 | GitHub が管理 |

## 📝 次のステップ

1. **動作確認**: 次の正時（XX:00）に自動実行されるのを待つ
2. **ログ監視**: 実行結果をログで確認
3. **メール確認**: CSVファイルがメール送信されることを確認

---

最終更新: 2025-07-19
作成者: Claude Code