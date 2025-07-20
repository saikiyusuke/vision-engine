#!/usr/bin/env node
/**
 * アップロード結果をログファイルに記録
 */

const fs = require('fs');
const path = require('path');

function logUploadResult(fileName, ftpPath, success = true) {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'upload-history.log');
  const timestamp = new Date().toLocaleString('ja-JP');
  
  const logEntry = `
=====================================
日時: ${timestamp}
ファイル名: ${fileName}
FTPパス: ${ftpPath}
ステータス: ${success ? '✅ 成功' : '❌ 失敗'}
=====================================\n`;

  fs.appendFileSync(logFile, logEntry);
  console.log(`📝 ログファイルに記録: ${logFile}`);
  
  return logEntry;
}

module.exports = { logUploadResult };