#!/bin/bash
# FTPアップロードテストスクリプト

echo "🔍 FTPアップロードテスト"
echo "========================="

# テストファイルを作成
TEST_FILE="test-upload-$(date +%Y%m%d-%H%M%S).txt"
echo "これはテストファイルです。作成日時: $(date)" > "$TEST_FILE"

echo "📝 テストファイル作成: $TEST_FILE"

# FTP設定
FTP_HOST="ftp.gmoserver.jp"
FTP_USER="sd0121397@gmoserver.jp"
FTP_PASS="drES2JFGYt6ennR&"
FTP_PATH="/partner.openmart.jp/saleslist_bymenu/"

echo "📤 FTPアップロード開始..."

# curlでアップロード
curl -T "$TEST_FILE" \
  --user "$FTP_USER:$FTP_PASS" \
  "ftp://$FTP_HOST$FTP_PATH$TEST_FILE" \
  --ftp-create-dirs \
  -v 2>&1 | grep -E "(< 226|< 550|< 530|Failed)"

# 結果確認
if [ $? -eq 0 ]; then
  echo "✅ アップロード成功！"
  echo "📍 場所: $FTP_PATH$TEST_FILE"
else
  echo "❌ アップロード失敗"
fi

# FTPでファイル一覧を確認
echo ""
echo "📋 FTPディレクトリ内容確認:"
curl -s --user "$FTP_USER:$FTP_PASS" "ftp://$FTP_HOST$FTP_PATH" | tail -10

# テストファイルを削除
rm -f "$TEST_FILE"

echo ""
echo "テスト完了"