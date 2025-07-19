#!/bin/bash

echo "🌐 Chromeを起動してAnthropicコンソールを開きます..."
echo ""
echo "Chromeに保存されたパスワードが使用可能です！"
echo ""

# macOS用のChromeコマンド
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Profile 1を使用（ユーザー1）
    open -a "Google Chrome" --args \
        --profile-directory="Profile 1" \
        "https://console.anthropic.com/settings/keys"
    
    echo "✅ Chrome（プロファイル1）でAnthropicコンソールを開きました"
    echo ""
    echo "手順:"
    echo "1. ログインページが表示されたら:"
    echo "   - メールアドレス欄をクリック"
    echo "   - Chromeが保存したパスワードを選択"
    echo "2. API Keysページで:"
    echo "   - 'Show'ボタンをクリック"
    echo "   - 表示されたキーをコピー（Cmd+C）"
    echo "3. このターミナルに戻って貼り付け（Cmd+V）"
    echo ""
fi