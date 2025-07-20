#!/bin/bash
# サーバーにアップロードして実行するスクリプト

echo "📤 vision-engineをサーバーにアップロード"

# FTP設定
FTP_HOST="ftp.gmoserver.jp"
FTP_USER="sd0121397@gmoserver.jp"
FTP_PASS="drES2JFGYt6ennR&"
REMOTE_DIR="/akichikikaku.com/vision-engine/"

# 必要なファイルをアップロード
echo "アップロード中..."

# PHPファイル
curl -T "send-airregi-email.php" \
  --user "$FTP_USER:$FTP_PASS" \
  "ftp://$FTP_HOST$REMOTE_DIR" \
  --ftp-create-dirs

# 設定ファイルサンプル
curl -T ".env.example" \
  --user "$FTP_USER:$FTP_PASS" \
  "ftp://$FTP_HOST$REMOTE_DIR"

echo "✅ アップロード完了"
echo ""
echo "🌐 本番サーバーでの使用方法:"
echo "1. https://akichikikaku.com/vision-engine/ にアクセス"
echo "2. send-airregi-email.php を実行"
echo ""
echo "または、Node.jsスクリプトから:"
echo 'exec("curl https://akichikikaku.com/vision-engine/send-airregi-email.php")'