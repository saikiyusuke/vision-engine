#!/bin/bash
# GitHub自動セットアップスクリプト
# 対話的な入力を自動化

echo "🚀 GitHub自動セットアップを実行中..."

# デフォルト値でgithub-setup-simple.jsを実行
# リポジトリ名は空行を送信（デフォルトのvision-engineを使用）
echo "" | node github-setup-simple.js

echo "✅ セットアップ完了"