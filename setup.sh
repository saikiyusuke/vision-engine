#!/bin/bash

echo "🚀 AutoClaude Vision セットアップスクリプト"
echo "========================================"
echo ""

# Node.jsがインストールされているか確認
if ! command -v node &> /dev/null; then
    echo "❌ Node.jsがインストールされていません"
    echo "https://nodejs.org/ からインストールしてください"
    exit 1
fi

echo "✅ Node.js $(node -v) が検出されました"

# npmパッケージをインストール
echo ""
echo "📦 必要なパッケージをインストール中..."
npm install

# .envファイルが存在しない場合は作成
if [ ! -f .env ]; then
    echo ""
    echo "📝 .envファイルを作成します..."
    cp .env.example .env
    echo "⚠️  .envファイルにAPI Keyを設定してください"
fi

# Chromeがインストールされているか確認
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -d "/Applications/Google Chrome.app" ]; then
        echo "✅ Google Chromeが検出されました"
    else
        echo "⚠️  Google Chromeがインストールされていません"
        echo "Chromeパスワード統合機能を使用するにはChromeが必要です"
    fi
fi

echo ""
echo "🎯 セットアップ完了！"
echo ""
echo "次のステップ:"
echo "1. API Keyを自動取得: node integrated-setup.js"
echo "2. テストを実行: node test-vision.js"
echo "3. Airレジ自動化: node airregi-vision.js"
echo ""
echo "詳細はREADME.mdを参照してください"