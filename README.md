# AutoClaude Vision Engine

AI Vision（Claude）を使用した次世代Web自動化ツール

## 特徴

- 🎯 **セレクター不要** - 自然言語で要素を指定
- 🔄 **動的要素対応** - JavaScript生成要素も操作可能
- 👁️ **画面認識** - 実際の画面を見て判断
- 🌐 **汎用性** - どんなWebサイトでも対応

## セットアップ

```bash
cd vision-engine
npm install
```

## 環境変数の設定

```bash
export ANTHROPIC_API_KEY="your-claude-api-key"
```

## 使い方

### 基本的な使用例

```javascript
const AutoClaudeVision = require('./autoclaude-vision');

const autoVision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);

// ブラウザ起動
await autoVision.launch();

// Webサイトにアクセス
await autoVision.goto('https://example.com');

// 自然言語でクリック
await autoVision.click('ログインボタン');

// 自然言語で入力
await autoVision.fill('ユーザー名の入力欄', 'myusername');
await autoVision.fill('パスワードの入力欄', 'mypassword');

// 要素の出現を待つ
await autoVision.waitFor('ダッシュボードのタイトル');

// スクリーンショット
await autoVision.screenshot('dashboard.png');

// ブラウザを閉じる
await autoVision.close();
```

### Airレジ自動化の例

```bash
npm run airregi
```

## 対応可能なケース

✅ 通常のHTML要素
✅ JavaScript動的生成要素
✅ React/Vue/Angularコンポーネント
✅ Shadow DOM
✅ Canvas要素
✅ 遅延ロードコンテンツ
✅ iframe内の要素

## API

### `click(description)`
自然言語で指定した要素をクリック

### `fill(description, text)`
自然言語で指定した入力欄にテキストを入力

### `waitFor(description, timeout)`
自然言語で指定した要素が表示されるまで待機

### `readScreen(region)`
画面のテキストを読み取る

### `executeSteps(steps)`
複数の操作を順番に実行

## 注意事項

- Claude API の利用料金が発生します
- 画面キャプチャのため、ヘッドレスモードでは動作しません
- 複雑な操作の場合、処理時間がかかることがあります