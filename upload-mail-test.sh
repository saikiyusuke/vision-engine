#!/bin/bash
# メール関連ファイルをGMOサーバーにアップロード

echo "📤 メール関連ファイルをGMOサーバーにアップロード中..."

# FTP情報
FTP_USER="sd0121397@gmoserver.jp"
FTP_PASS="drES2JFGYt6ennR&"
FTP_HOST="ftp.gmoserver.jp"
BASE_DIR="/openmart.jp/vision-engine"

# includesディレクトリを作成
echo "1. includesディレクトリを作成..."
curl --ftp-create-dirs -T /dev/null --user "$FTP_USER:$FTP_PASS" "ftp://$FTP_HOST$BASE_DIR/includes/"

# mail-sender.phpをアップロード
echo "2. mail-sender.phpをアップロード..."
curl -T includes/mail-sender.php --user "$FTP_USER:$FTP_PASS" "ftp://$FTP_HOST$BASE_DIR/includes/mail-sender.php"

# send-email.phpをアップロード
echo "3. send-email.phpをアップロード..."
curl -T send-email.php --user "$FTP_USER:$FTP_PASS" "ftp://$FTP_HOST$BASE_DIR/send-email.php"

# test-email.phpをアップロード
echo "4. test-email.phpをアップロード..."
curl -T test-email.php --user "$FTP_USER:$FTP_PASS" "ftp://$FTP_HOST$BASE_DIR/test-email.php"

# test-email-simple.phpをアップロード
echo "5. test-email-simple.phpをアップロード..."
curl -T test-email-simple.php --user "$FTP_USER:$FTP_PASS" "ftp://$FTP_HOST$BASE_DIR/test-email-simple.php"

echo ""
echo "✅ アップロード完了！"
echo ""
echo "📧 本番環境でテスト実行:"
echo "https://openmart.jp/vision-engine/test-email.php"
echo "https://openmart.jp/vision-engine/test-email-simple.php"
echo ""
echo "または SSH/コマンドラインから:"
echo "php /home/sd0121397/openmart.jp/vision-engine/test-email.php"