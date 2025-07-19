#\!/bin/bash
# Airレジ自動化のcron設定スクリプト

echo "📍 Airレジ自動化のcron設定を開始します..."

# 現在のcrontabを一時ファイルに保存
TEMP_CRON="/tmp/current_cron_$$"
crontab -l > "$TEMP_CRON" 2>/dev/null || true

# 新しいcronジョブの定義
CRON_JOB="0 10-23 * * * /bin/bash /Users/apple/Projects/mothership/vision-engine/airregi-local-cron.sh >> /Users/apple/Projects/mothership/vision-engine/logs/airregi-cron.log 2>&1"

# 既に同じジョブが存在するか確認
if grep -F "airregi-local-cron.sh" "$TEMP_CRON" > /dev/null 2>&1; then
    echo "⚠️  既にAirレジ自動化のcronジョブが存在します"
    echo "既存のエントリ:"
    grep "airregi-local-cron.sh" "$TEMP_CRON"
    echo ""
    read -p "既存のエントリを置き換えますか？ (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 既存のエントリを削除
        grep -v "airregi-local-cron.sh" "$TEMP_CRON" > "${TEMP_CRON}.new"
        mv "${TEMP_CRON}.new" "$TEMP_CRON"
    else
        echo "❌ 設定をキャンセルしました"
        rm "$TEMP_CRON"
        exit 0
    fi
fi

# 新しいジョブを追加
echo "$CRON_JOB" >> "$TEMP_CRON"

# crontabを更新
crontab "$TEMP_CRON"

# 一時ファイルを削除
rm "$TEMP_CRON"

echo "✅ crontabに追加しました:"
echo "$CRON_JOB"
echo ""
echo "📋 現在のcrontab:"
crontab -l | grep "airregi-local-cron.sh"
echo ""
echo "🕐 実行スケジュール: 毎日10時〜23時の毎時0分"
echo "📝 ログファイル: /Users/apple/Projects/mothership/vision-engine/logs/airregi-cron.log"
echo ""
echo "💡 手動でテストする場合:"
echo "   ./airregi-local-cron.sh"
echo ""
echo "💡 crontabを編集する場合:"
echo "   crontab -e"
echo ""
echo "💡 cronジョブを削除する場合:"
echo "   crontab -l | grep -v \"airregi-local-cron.sh\" | crontab -"
