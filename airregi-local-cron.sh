#!/bin/bash
# Airレジ自動化のローカル定期実行スクリプト

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

# 環境変数をエクスポート（.envファイルから読み込み）
export $(grep -v '^#' .env | xargs)

# 実行時刻をログ出力
echo ""
echo "=========================================="
echo "🚀 Airレジ自動化実行開始: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# Node.jsが利用可能か確認
if ! command -v node &> /dev/null; then
    echo "❌ エラー: Node.jsが見つかりません"
    exit 1
fi

# AutoClaude Vision版を実行（ローカル環境では問題なく動作するはず）
echo "📍 AutoClaude Vision版を実行中..."
node airregi-autoclaude-scheduled.js

# 実行結果を保存
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ 実行成功 ($(date '+%Y-%m-%d %H:%M:%S'))"
else
    echo "❌ 実行失敗 (終了コード: $EXIT_CODE) ($(date '+%Y-%m-%d %H:%M:%S'))"
    
    # 失敗した場合はPlaywright直接版も試す
    echo "📍 Playwright直接版を試行中..."
    node airregi-playwright-direct.js
    
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Playwright版で成功 ($(date '+%Y-%m-%d %H:%M:%S'))"
    else
        echo "❌ 両方の方法で失敗しました ($(date '+%Y-%m-%d %H:%M:%S'))"
    fi
fi

echo "=========================================="
echo ""

exit $EXIT_CODE