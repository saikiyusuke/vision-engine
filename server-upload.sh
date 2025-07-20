#!/bin/bash
# 本番サーバーにアップロードするスクリプト

echo "🚀 Airレジ自動化システムを本番サーバーにデプロイ"
echo "================================================"

# FTP設定
FTP_HOST="ftp.gmoserver.jp"
FTP_USER="sd0121397@gmoserver.jp"
FTP_PASS="drES2JFGYt6ennR&"
REMOTE_DIR="/akichikikaku.com/vision-engine/"

# カラー出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📤 ファイルアップロード開始...${NC}"

# PHPファイルをアップロード
echo "  • run-automation.php"
curl -T "server/run-automation.php" \
  --user "$FTP_USER:$FTP_PASS" \
  "ftp://$FTP_HOST$REMOTE_DIR" \
  --ftp-create-dirs --silent

echo "  • test.php"
curl -T "server/test.php" \
  --user "$FTP_USER:$FTP_PASS" \
  "ftp://$FTP_HOST$REMOTE_DIR" \
  --silent

echo "  • status.php"
curl -T "server/status.php" \
  --user "$FTP_USER:$FTP_PASS" \
  "ftp://$FTP_HOST$REMOTE_DIR" \
  --silent

echo "  • .htaccess"
curl -T "server/.htaccess" \
  --user "$FTP_USER:$FTP_PASS" \
  "ftp://$FTP_HOST$REMOTE_DIR" \
  --silent

# 既存のメール送信PHPもアップロード
echo "  • send-airregi-email.php"
curl -T "send-airregi-email.php" \
  --user "$FTP_USER:$FTP_PASS" \
  "ftp://$FTP_HOST$REMOTE_DIR" \
  --silent

# logsディレクトリ作成用のダミーファイル
echo "ログディレクトリ用ダミーファイル" > logs_dummy.txt
curl -T "logs_dummy.txt" \
  --user "$FTP_USER:$FTP_PASS" \
  "ftp://$FTP_HOST${REMOTE_DIR}logs/" \
  --ftp-create-dirs --silent
rm logs_dummy.txt

echo -e "${GREEN}✅ アップロード完了！${NC}"
echo ""
echo "================================================"
echo "🌐 本番サーバーURL:"
echo ""
echo "📧 メールテスト:"
echo "   https://akichikikaku.com/vision-engine/test.php"
echo ""
echo "📊 ステータス確認:"
echo "   https://akichikikaku.com/vision-engine/status.php"
echo ""
echo "🚀 手動実行:"
echo "   https://akichikikaku.com/vision-engine/run-automation.php?token=airregi-auto-2024-secure-token"
echo ""
echo "⏰ Cron設定（毎日9時実行）:"
echo "   0 9 * * * curl -s \"https://akichikikaku.com/vision-engine/run-automation.php?token=airregi-auto-2024-secure-token\""
echo ""
echo "================================================"