<?php
/**
 * GMOサーバー用メール送信クラス
 */
class MailSender {
    private $sendmail_path;
    
    public function __construct() {
        // sendmailパスを動的に検出
        $paths = [
            '/usr/sbin/sendmail -t -i',  // macOS, 多くのLinux
            '/usr/lib/sendmail -t -i',   // 一部のLinux
            '/usr/sendmail -t -i',        // 旧式
            ini_get('sendmail_path')      // php.iniの設定
        ];
        
        foreach ($paths as $path) {
            if ($path && file_exists(explode(' ', $path)[0])) {
                $this->sendmail_path = $path;
                break;
            }
        }
        
        // デフォルト
        if (!$this->sendmail_path) {
            $this->sendmail_path = '/usr/sbin/sendmail -t -i';
        }
    }
    
    /**
     * メール送信
     */
    public function send($to, $subject, $message, $from = 'noreply@openmart.jp', $from_name = '', $attachment = null) {
        try {
            // 添付ファイルがある場合は専用メソッドを使用
            if ($attachment !== null) {
                return $this->sendWithAttachmentInternal($to, $subject, $message, $attachment, $from, $from_name);
            }
            
            // メールヘッダー構築
            $reply_to = $from; // reply_toをfromと同じに設定
            
            // Fromヘッダーの設定
            if ($from_name) {
                $headers = "From: " . mb_encode_mimeheader($from_name, 'UTF-8', 'B') . " <{$from}>\r\n";
            } else {
                $headers = "From: {$from}\r\n";
            }
            
            $headers .= "Reply-To: {$reply_to}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $headers .= "Content-Transfer-Encoding: 8bit\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
            
            // 件名をエンコード（日本語対応）
            $encoded_subject = mb_encode_mimeheader($subject, 'UTF-8', 'B');
            
            // メール全体を構築
            $mail_content = "To: {$to}\r\n";
            $mail_content .= "Subject: {$encoded_subject}\r\n";
            $mail_content .= $headers;
            $mail_content .= "\r\n";
            $mail_content .= $message;
            
            // sendmailコマンドで送信
            $fp = popen($this->sendmail_path, 'w');
            if (!$fp) {
                error_log("Failed to open sendmail");
                return false;
            }
            
            fputs($fp, $mail_content);
            $result = pclose($fp);
            
            // 結果を返す（0 = 成功）
            return ($result === 0);
            
        } catch (Exception $e) {
            error_log("Mail send error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 標準のmail関数を使用した送信（フォールバック）
     */
    public function sendWithMailFunction($to, $subject, $message, $from = 'noreply@openmart.jp', $reply_to = 'noreply@openmart.jp') {
        $headers = "From: {$from}\r\n";
        $headers .= "Reply-To: {$reply_to}\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
        
        // 追加のパラメータでFromアドレスを指定
        $additional_params = "-f{$from}";
        
        return mail($to, $subject, $message, $headers, $additional_params);
    }
    
    /**
     * 内部用: 添付ファイル付きメール送信
     */
    private function sendWithAttachmentInternal($to, $subject, $message, $attachment, $from = 'noreply@openmart.jp', $from_name = '') {
        try {
            // 境界文字列
            $boundary = md5(uniqid(time()));
            
            // ヘッダー構築
            if ($from_name) {
                $headers = "From: " . mb_encode_mimeheader($from_name, 'UTF-8', 'B') . " <{$from}>\r\n";
            } else {
                $headers = "From: {$from}\r\n";
            }
            $headers .= "Reply-To: {$from}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
            
            // 件名をエンコード
            $encoded_subject = mb_encode_mimeheader($subject, 'UTF-8', 'B');
            
            // 本文部分
            $body = "--{$boundary}\r\n";
            $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $body .= $message . "\r\n\r\n";
            
            // 添付ファイル部分
            if (isset($attachment['content']) && isset($attachment['name'])) {
                $fileName = $attachment['name'];
                $fileContent = $attachment['content'];
                $fileType = isset($attachment['type']) ? $attachment['type'] : 'application/octet-stream';
                
                $encodedFile = base64_encode($fileContent);
                
                $body .= "--{$boundary}\r\n";
                $body .= "Content-Type: {$fileType}; name=\"{$fileName}\"\r\n";
                $body .= "Content-Transfer-Encoding: base64\r\n";
                $body .= "Content-Disposition: attachment; filename=\"{$fileName}\"\r\n\r\n";
                $body .= chunk_split($encodedFile) . "\r\n";
            }
            
            $body .= "--{$boundary}--";
            
            // メール全体を構築
            $mail_content = "To: {$to}\r\n";
            $mail_content .= "Subject: {$encoded_subject}\r\n";
            $mail_content .= $headers;
            $mail_content .= "\r\n";
            $mail_content .= $body;
            
            // sendmailコマンドで送信
            $fp = popen($this->sendmail_path, 'w');
            if (!$fp) {
                error_log("Failed to open sendmail for attachment");
                return false;
            }
            
            fputs($fp, $mail_content);
            $result = pclose($fp);
            
            return ($result === 0);
            
        } catch (Exception $e) {
            error_log("Mail send with attachment error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * ファイル添付対応メール送信（ファイルパス版）
     */
    public function sendWithAttachment($to, $subject, $message, $attachmentPath, $from = 'noreply@openmart.jp') {
        try {
            // 境界文字列
            $boundary = md5(uniqid(time()));
            
            // ヘッダー構築
            $headers = "From: {$from}\r\n";
            $headers .= "Reply-To: {$from}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
            
            // 件名をエンコード
            $encoded_subject = mb_encode_mimeheader($subject, 'UTF-8', 'B');
            
            // 本文部分
            $body = "--{$boundary}\r\n";
            $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $body .= $message . "\r\n\r\n";
            
            // 添付ファイル部分
            if (file_exists($attachmentPath)) {
                $fileName = basename($attachmentPath);
                $fileContent = file_get_contents($attachmentPath);
                $encodedFile = base64_encode($fileContent);
                
                $body .= "--{$boundary}\r\n";
                $body .= "Content-Type: application/octet-stream; name=\"{$fileName}\"\r\n";
                $body .= "Content-Transfer-Encoding: base64\r\n";
                $body .= "Content-Disposition: attachment; filename=\"{$fileName}\"\r\n\r\n";
                $body .= chunk_split($encodedFile) . "\r\n";
            }
            
            $body .= "--{$boundary}--";
            
            // メール全体を構築
            $mail_content = "To: {$to}\r\n";
            $mail_content .= "Subject: {$encoded_subject}\r\n";
            $mail_content .= $headers;
            $mail_content .= "\r\n";
            $mail_content .= $body;
            
            // sendmailコマンドで送信
            $fp = popen($this->sendmail_path, 'w');
            if (!$fp) {
                error_log("Failed to open sendmail for attachment");
                return false;
            }
            
            fputs($fp, $mail_content);
            $result = pclose($fp);
            
            return ($result === 0);
            
        } catch (Exception $e) {
            error_log("Mail send with attachment error: " . $e->getMessage());
            return false;
        }
    }
}
?>