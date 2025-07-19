<?php
/**
 * Email Sender Class for Vision Engine
 * Based on working implementation from realtimememo project
 */

class EmailSender {
    private $sendmail_path = '/usr/lib/sendmail -t -i';
    private $from_email;
    private $from_name;
    private $admin_email;
    private $config;
    
    public function __construct() {
        // Load configuration
        $configFile = dirname(__DIR__) . '/config/email-config.php';
        if (file_exists($configFile)) {
            $this->config = require $configFile;
            $this->from_email = $this->config['from_email'];
            $this->from_name = $this->config['from_name'];
            $this->admin_email = $this->config['admin_email'];
        } else {
            // Fallback values if config file doesn't exist
            $this->from_email = 'info@vision-engine.com';
            $this->from_name = 'Vision Engine';
            $this->admin_email = 'admin@vision-engine.com';
        }
    }
    
    /**
     * Send email using sendmail command (primary method)
     */
    public function send($to, $subject, $message, $from = null, $reply_to = null) {
        try {
            // Use default from email if not provided
            if (!$from) {
                $from = $this->from_email;
            }
            if (!$reply_to) {
                $reply_to = $from;
            }
            
            // Configure Japanese encoding
            mb_language("japanese");
            mb_internal_encoding("UTF-8");
            
            // Build email headers
            $headers = "From: {$this->from_name} <{$from}>\r\n";
            $headers .= "Reply-To: {$reply_to}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $headers .= "Content-Transfer-Encoding: 8bit\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
            
            // Encode subject for Japanese support
            $encoded_subject = mb_encode_mimeheader($subject, 'UTF-8', 'B');
            
            // Build complete email content
            $mail_content = "To: {$to}\r\n";
            $mail_content .= "Subject: {$encoded_subject}\r\n";
            $mail_content .= $headers;
            $mail_content .= "\r\n";
            $mail_content .= $message;
            
            // Try sendmail first
            $fp = popen($this->sendmail_path, 'w');
            if (!$fp) {
                // Fallback to mail() function
                return $this->sendWithMailFunction($to, $subject, $message, $from, $reply_to);
            }
            
            fputs($fp, $mail_content);
            $result = pclose($fp);
            
            // Log the result
            $this->logEmail($to, $subject, ($result === 0));
            
            // Return success if exit code is 0
            return ($result === 0);
            
        } catch (Exception $e) {
            error_log("Email send error: " . $e->getMessage());
            // Try fallback method
            return $this->sendWithMailFunction($to, $subject, $message, $from, $reply_to);
        }
    }
    
    /**
     * Fallback method using PHP's mail() function
     */
    private function sendWithMailFunction($to, $subject, $message, $from = null, $reply_to = null) {
        try {
            // Use defaults if not provided
            if (!$from) {
                $from = $this->from_email;
            }
            if (!$reply_to) {
                $reply_to = $from;
            }
            
            // Configure Japanese encoding
            mb_language("japanese");
            mb_internal_encoding("UTF-8");
            
            $headers = "From: {$this->from_name} <{$from}>\r\n";
            $headers .= "Reply-To: {$reply_to}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
            
            // Additional parameters for envelope sender
            $additional_params = "-f{$from}";
            
            // Use mb_send_mail for Japanese support
            $result = mb_send_mail($to, $subject, $message, $headers, $additional_params);
            
            // Log the result
            $this->logEmail($to, $subject, $result);
            
            return $result;
            
        } catch (Exception $e) {
            error_log("Mail function error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send contact form notification to admin
     */
    public function sendContactNotification($formData) {
        $subject = "新しいお問い合わせ - Vision Engine";
        
        $message = "Vision Engineに新しいお問い合わせがありました。\n\n";
        $message .= "【お問い合わせ詳細】\n";
        $message .= "----------------------------------------\n";
        $message .= "お名前: " . $formData['name'] . "\n";
        $message .= "メールアドレス: " . $formData['email'] . "\n";
        $message .= "件名: " . $formData['subject'] . "\n";
        $message .= "お問い合わせ日時: " . date('Y年m月d日 H:i:s') . "\n";
        $message .= "----------------------------------------\n\n";
        $message .= "【お問い合わせ内容】\n";
        $message .= $formData['message'] . "\n\n";
        $message .= "----------------------------------------\n";
        $message .= "このメールは自動送信されています。\n";
        
        return $this->send($this->admin_email, $subject, $message, $this->from_email, $formData['email']);
    }
    
    /**
     * Send auto-reply to user
     */
    public function sendAutoReply($formData) {
        $subject = "お問い合わせありがとうございます - Vision Engine";
        
        $message = $formData['name'] . " 様\n\n";
        $message .= "この度は、Vision Engineへお問い合わせいただき、誠にありがとうございます。\n\n";
        $message .= "以下の内容でお問い合わせを承りました。\n";
        $message .= "担当者より2-3営業日以内にご連絡させていただきますので、\n";
        $message .= "今しばらくお待ちくださいますようお願い申し上げます。\n\n";
        $message .= "【お問い合わせ内容】\n";
        $message .= "----------------------------------------\n";
        $message .= "お名前: " . $formData['name'] . "\n";
        $message .= "メールアドレス: " . $formData['email'] . "\n";
        $message .= "件名: " . $formData['subject'] . "\n";
        $message .= "お問い合わせ日時: " . date('Y年m月d日 H:i:s') . "\n";
        $message .= "----------------------------------------\n\n";
        $message .= "【メッセージ】\n";
        $message .= $formData['message'] . "\n\n";
        $message .= "----------------------------------------\n";
        $message .= "Vision Engine カスタマーサポート\n";
        $message .= "Email: " . $this->from_email . "\n";
        $message .= "※このメールは送信専用です。返信はできません。\n";
        
        return $this->send($formData['email'], $subject, $message);
    }
    
    /**
     * Log email sending attempts
     */
    private function logEmail($to, $subject, $success) {
        // Check if logging is enabled
        if (!isset($this->config['log_emails']) || !$this->config['log_emails']) {
            return;
        }
        
        $logDir = dirname(__DIR__) . '/logs';
        if (!file_exists($logDir)) {
            mkdir($logDir, 0777, true);
        }
        
        $logFile = $logDir . '/email_log_' . date('Y-m') . '.txt';
        $logEntry = sprintf(
            "[%s] %s | To: %s | Subject: %s | Status: %s\n",
            date('Y-m-d H:i:s'),
            $_SERVER['REMOTE_ADDR'] ?? 'CLI',
            $to,
            $subject,
            $success ? 'SUCCESS' : 'FAILED'
        );
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
}

// Helper function to get email sender instance
function getEmailSender() {
    return new EmailSender();
}
?>