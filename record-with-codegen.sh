#!/bin/bash
# Playwright codegenを使った操作記録

echo "🎬 Playwright Codegen で Airレジ操作を記録"
echo "========================================="
echo ""
echo "📝 使い方:"
echo "1. ブラウザとPlaywright Inspectorが開きます"
echo "2. ブラウザでAirレジの操作を行ってください"
echo "3. Playwright Inspectorにコードが自動生成されます"
echo "4. 完了したら、生成されたコードをコピーしてください"
echo ""
echo "🚀 起動中..."
echo ""

# Playwright codegenを起動（日本語環境で）
npx playwright codegen \
  --target javascript \
  --output airregi-codegen.js \
  --viewport-size "1280,720" \
  --timezone "Asia/Tokyo" \
  --lang "ja-JP" \
  https://airregi.jp/

echo ""
echo "✅ 記録が完了しました"
echo "📄 生成されたコード: airregi-codegen.js"