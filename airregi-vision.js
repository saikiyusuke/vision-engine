require('dotenv').config();
const AutoClaudeVision = require('./autoclaude-vision');

async function airregiWithVision() {
  // Claude API キーを環境変数から取得
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ 環境変数 ANTHROPIC_API_KEY を設定してください');
    console.log('export ANTHROPIC_API_KEY="your-api-key"');
    return;
  }

  const autoVision = new AutoClaudeVision(apiKey);

  try {
    console.log('🚀 Airレジ自動化（AI Vision版）を開始します...\n');

    // ブラウザを起動
    await autoVision.launch({ slowMo: 1000 });

    // Airレジの操作手順
    const steps = [
      // 1. ログインページへアクセス
      {
        action: 'goto',
        url: 'https://airregi.jp/CLP/view/salesList/'
      },

      // 2. ログイン
      {
        action: 'wait',
        target: 'ユーザー名の入力欄'
      },
      {
        action: 'fill',
        target: 'ユーザー名またはメールアドレスの入力欄',
        text: 'rsc_yamaguchi@yamatech.co.jp'
      },
      {
        action: 'fill',
        target: 'パスワードの入力欄',
        text: 'openmart1120'
      },
      {
        action: 'click',
        target: 'ログインボタンまたは送信ボタン'
      },

      // 3. 店舗選択（必要な場合）
      {
        action: 'wait_time',
        milliseconds: 5000
      },
      {
        action: 'click',
        target: 'オープンマートという店舗名'
      },

      // 4. 商品別売上ページへ移動
      {
        action: 'wait_time',
        milliseconds: 3000
      },
      {
        action: 'click',
        target: '商品別売上のメニューまたはリンク'
      },

      // 5. 日付設定
      {
        action: 'wait_time',
        milliseconds: 3000
      },
      {
        action: 'click',
        target: '開始日の日付入力欄'
      },
      {
        action: 'fill',
        target: '開始日の入力欄',
        text: new Date(Date.now() - 86400000).toISOString().split('T')[0]
      },
      {
        action: 'click',
        target: '終了日の日付入力欄'
      },
      {
        action: 'fill',
        target: '終了日の入力欄',
        text: new Date(Date.now() - 86400000).toISOString().split('T')[0]
      },
      {
        action: 'click',
        target: '検索または適用または確定ボタン'
      },

      // 6. CSVダウンロード
      {
        action: 'wait_time',
        milliseconds: 3000
      },
      {
        action: 'screenshot',
        path: 'airregi-before-download.png'
      },
      {
        action: 'click',
        target: 'CSVダウンロードのリンクまたはボタン'
      },

      // 7. ダウンロード完了を待つ
      {
        action: 'wait_time',
        milliseconds: 5000
      }
    ];

    // ステップを実行
    await autoVision.executeSteps(steps);

    console.log('\n✅ Airレジの操作が完了しました！');
    
    // 画面の内容を読み取って確認
    const screenText = await autoVision.readScreen();
    console.log('\n📄 現在の画面内容:');
    console.log(screenText.substring(0, 500) + '...');

    // FTPアップロード部分（別途実装）
    console.log('\n📤 次のステップ: FTPアップロード');
    console.log('ダウンロードしたCSVファイルを partner.openmart.jp にアップロードしてください');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    await autoVision.screenshot('error-vision.png');
  }

  console.log('\n🔍 ブラウザは開いたままです。確認後、Ctrl+Cで終了してください。');
  
  // ブラウザを開いたままにする
  await new Promise(() => {});
}

// 実行
airregiWithVision();