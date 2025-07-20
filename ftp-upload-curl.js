#!/usr/bin/env node
/**
 * cURLを使ったFTPアップロード
 * 日本語ファイル名にも対応
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const execPromise = util.promisify(exec);

// FTP設定
const FTP_CONFIG = {
  host: 'ftp.gmoserver.jp',
  user: 'sd0121397@gmoserver.jp',
  password: 'drES2JFGYt6ennR&',
  remotePath: '/partner.openmart.jp/saleslist_bymenu/'
};

async function uploadWithCurl(localFilePath) {
  try {
    console.log('📤 cURLでFTPアップロード開始...');
    
    // ファイルの存在確認
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`ファイルが見つかりません: ${localFilePath}`);
    }
    
    // ファイル名を取得
    const fileName = path.basename(localFilePath);
    console.log(`📁 アップロードファイル: ${fileName}`);
    
    // FTP URLを構築（ディレクトリパスのみ、ファイル名は含めない）
    const ftpUrl = `ftp://${FTP_CONFIG.host}${FTP_CONFIG.remotePath}`;
    
    // curlコマンドを構築（-Tオプションでアップロード）
    const curlCommand = `curl -T "${localFilePath}" --user "${FTP_CONFIG.user}:${FTP_CONFIG.password}" "${ftpUrl}" --ftp-create-dirs`;
    
    console.log('⬆️  アップロード中...');
    
    // コマンド実行
    const { stdout, stderr } = await execPromise(curlCommand);
    
    if (stderr && !stderr.includes('100.0%')) {
      console.error('⚠️  cURL警告:', stderr);
    }
    
    console.log('✅ FTPアップロード完了');
    console.log(`📍 アップロード先: ${FTP_CONFIG.remotePath}${fileName}`);
    
    return {
      success: true,
      remotePath: `${FTP_CONFIG.remotePath}${fileName}`,
      fileName: fileName
    };
    
  } catch (error) {
    console.error('❌ FTPアップロードエラー:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 直接実行時のテスト
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方法: node ftp-upload-curl.js <ファイルパス>');
    process.exit(1);
  }
  
  uploadWithCurl(args[0])
    .then(result => {
      if (result.success) {
        console.log('\n✅ アップロード成功！');
      } else {
        console.error('\n❌ アップロード失敗');
        process.exit(1);
      }
    });
}

module.exports = { uploadWithCurl };