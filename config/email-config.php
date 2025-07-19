<?php
/**
 * Email Configuration File
 * Update these settings with your actual email addresses
 */

return [
    // Sender Information
    'from_email' => 'info@vision-engine.com',  // UPDATE: Your sender email
    'from_name' => 'Vision Engine',            // UPDATE: Your sender name
    
    // Admin Email (receives contact form notifications)
    'admin_email' => 'admin@vision-engine.com', // UPDATE: Your admin email
    
    // Email Settings
    'use_mb_send_mail' => true,  // Use mb_send_mail for Japanese support
    'log_emails' => true,        // Log email sending attempts
    
    // SMTP Settings (for future use)
    'smtp_enabled' => false,
    'smtp_host' => '',
    'smtp_port' => 587,
    'smtp_username' => '',
    'smtp_password' => '',
    'smtp_encryption' => 'tls',
];
?>