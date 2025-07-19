// テスト実行スクリプト
// 時間制限なしで即座に実行できます

const { scheduledUpload } = require('./airregi-scheduled-upload');

console.log('🧪 Airレジ定期アップロードのテスト実行\n');
console.log('⚠️  注意: このテストでは実際にメールは送信されません\n');

// テスト実行
scheduledUpload()
  .then(() => {
    console.log('\n✅ テスト完了！');
    console.log('\nメール送信を有効にするには:');
    console.log('1. email-config.js でメール設定を行う');
    console.log('2. airregi-scheduled-upload.js でtransporter設定を更新');
    console.log('3. setup-cron.sh を実行してcronジョブを設定');
  })
  .catch(error => {
    console.error('\n❌ テストエラー:', error.message);
  });