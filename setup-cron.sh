#!/bin/bash

# Airレジ定期実行のcron設定スクリプト

echo "🚀 Airレジ定期実行のcron設定"
echo "================================"
echo ""
echo "以下のコマンドを実行してcrontabを編集してください:"
echo ""
echo "crontab -e"
echo ""
echo "そして、以下の行を追加してください:"
echo ""
echo "# Airレジ売上データ自動取得（毎日10:00-23:00、毎時0分）"
echo "0 10-23 * * * /usr/local/bin/node /Users/apple/Projects/mothership/vision-engine/airregi-scheduled-upload.js >> /Users/apple/Projects/mothership/vision-engine/logs/airregi-cron.log 2>&1"
echo ""
echo "================================"
echo ""
echo "ログファイルの確認方法:"
echo "tail -f /Users/apple/Projects/mothership/vision-engine/logs/airregi-cron.log"
echo ""

# ログディレクトリの作成
mkdir -p /Users/apple/Projects/mothership/vision-engine/logs
echo "✅ ログディレクトリを作成しました: logs/"
echo ""

# 権限設定
chmod +x /Users/apple/Projects/mothership/vision-engine/airregi-scheduled-upload.js
echo "✅ 実行権限を設定しました"
echo ""

# 現在のcron設定を表示
echo "現在のcron設定:"
crontab -l 2>/dev/null || echo "（設定なし）"