#!/usr/bin/env node
/**
 * FTPアップロードモジュール
 * CSVファイルをFTPサーバーにアップロード
 */

const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

// FTP設定
const FTP_CONFIG = {
  host: 'ftp.gmoserver.jp',
  user: 'sd0121397@gmoserver.jp',
  password: 'drES2JFGYt6ennR&',
  secure: false, // GMOサーバーは通常のFTP
  // アップロード先のパス
  remoteDir: '/partner.openmart.jp/saleslist_bymenu/' // ユーザー指定のパス
};

/**
 * FTPアップロード関数
 * @param {string} localFilePath - アップロードするファイルのローカルパス
 * @param {string} remotePath - アップロード先のパス（省略時はファイル名のみ）
 */
async function uploadToFTP(localFilePath, remotePath = null) {
  const client = new ftp.Client();
  client.ftp.verbose = true; // デバッグ出力を有効化

  try {
    console.log('📤 FTPサーバーに接続中...');
    await client.access({
      host: FTP_CONFIG.host,
      user: FTP_CONFIG.user,
      password: FTP_CONFIG.password,
      secure: FTP_CONFIG.secure
    });
    console.log('✅ FTP接続成功');

    // リモートディレクトリに移動
    if (FTP_CONFIG.remoteDir) {
      console.log(`📁 ディレクトリ移動: ${FTP_CONFIG.remoteDir}`);
      await client.ensureDir(FTP_CONFIG.remoteDir);
    }

    // ファイル名
    const fileName = path.basename(localFilePath);
    const remoteFilePath = remotePath || fileName;

    // アップロード実行
    console.log(`⬆️  アップロード中: ${fileName}`);
    await client.uploadFrom(localFilePath, remoteFilePath);
    
    console.log(`✅ FTPアップロード完了: ${FTP_CONFIG.remoteDir}${remoteFilePath}`);
    
    // アップロード先の完全なパスを返す
    return `${FTP_CONFIG.host}${FTP_CONFIG.remoteDir}${remoteFilePath}`;

  } catch (error) {
    console.error('❌ FTPアップロードエラー:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

/**
 * Airレジ用のアップロード関数
 * 日付付きのディレクトリに整理してアップロード
 */
async function uploadAirregiCSV(csvPath) {
  try {
    // オリジナルのファイル名をそのまま使用
    const originalName = path.basename(csvPath);
    
    // アップロード実行
    const uploadedPath = await uploadToFTP(csvPath, originalName);
    
    return {
      success: true,
      remotePath: uploadedPath,
      fileName: originalName,
      uploadTime: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// コマンドライン実行
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方法: node ftp-upload.js <ファイルパス>');
    console.log('例: node ftp-upload.js ./downloads/sales.csv');
    process.exit(1);
  }
  
  const filePath = args[0];
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ファイルが見つかりません: ${filePath}`);
    process.exit(1);
  }
  
  uploadAirregiCSV(filePath)
    .then(result => {
      if (result.success) {
        console.log('\n📊 アップロード結果:');
        console.log(`  ファイル名: ${result.fileName}`);
        console.log(`  アップロード先: ${result.remotePath}`);
        console.log(`  完了時刻: ${new Date(result.uploadTime).toLocaleString('ja-JP')}`);
      } else {
        console.error('アップロード失敗:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('エラー:', error);
      process.exit(1);
    });
}

module.exports = {
  uploadToFTP,
  uploadAirregiCSV,
  FTP_CONFIG
};