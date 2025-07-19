<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>お問い合わせ - Vision Engine</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        .contact-form {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
        }
        
        .required {
            color: #e74c3c;
        }
        
        input[type="text"],
        input[type="email"],
        textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        input[type="text"]:focus,
        input[type="email"]:focus,
        textarea:focus {
            outline: none;
            border-color: #3498db;
        }
        
        textarea {
            resize: vertical;
            min-height: 150px;
        }
        
        .submit-button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.3s;
        }
        
        .submit-button:hover {
            background-color: #2980b9;
        }
        
        .submit-button:disabled {
            background-color: #bdc3c7;
            cursor: not-allowed;
        }
        
        .alert {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            display: none;
        }
        
        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .loading {
            display: none;
            text-align: center;
            margin: 20px 0;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .info-text {
            text-align: center;
            color: #7f8c8d;
            margin-top: 20px;
            font-size: 14px;
        }
        
        @media (max-width: 600px) {
            .contact-form {
                padding: 20px;
            }
            
            h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>お問い合わせ</h1>
        
        <div class="contact-form">
            <div id="alertMessage" class="alert"></div>
            
            <form id="contactForm">
                <div class="form-group">
                    <label for="name">お名前 <span class="required">*</span></label>
                    <input type="text" id="name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="email">メールアドレス <span class="required">*</span></label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="subject">件名 <span class="required">*</span></label>
                    <input type="text" id="subject" name="subject" required>
                </div>
                
                <div class="form-group">
                    <label for="message">お問い合わせ内容 <span class="required">*</span></label>
                    <textarea id="message" name="message" required></textarea>
                </div>
                
                <div class="loading" id="loadingSpinner">
                    <div class="spinner"></div>
                    <p>送信中...</p>
                </div>
                
                <button type="submit" class="submit-button" id="submitButton">送信する</button>
            </form>
            
            <p class="info-text">
                <span class="required">*</span> は必須項目です。<br>
                お問い合わせいただいた内容には、2-3営業日以内にご返信いたします。
            </p>
        </div>
    </div>

    <script>
        document.getElementById('contactForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form elements
            const form = e.target;
            const submitButton = document.getElementById('submitButton');
            const loadingSpinner = document.getElementById('loadingSpinner');
            const alertMessage = document.getElementById('alertMessage');
            
            // Hide any previous alerts
            alertMessage.style.display = 'none';
            alertMessage.className = 'alert';
            
            // Show loading state
            submitButton.disabled = true;
            loadingSpinner.style.display = 'block';
            
            // Collect form data
            const formData = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                subject: form.subject.value.trim(),
                message: form.message.value.trim()
            };
            
            try {
                // Send email via API
                const response = await fetch('./api/send-email.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Show success message
                    alertMessage.textContent = result.message || 'お問い合わせを受け付けました。';
                    alertMessage.className = 'alert alert-success';
                    alertMessage.style.display = 'block';
                    
                    // Clear form
                    form.reset();
                    
                    // Scroll to top to show message
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    // Show error message
                    alertMessage.textContent = result.message || '送信に失敗しました。';
                    alertMessage.className = 'alert alert-error';
                    alertMessage.style.display = 'block';
                    
                    // If validation errors, show them
                    if (result.data && result.data.errors) {
                        alertMessage.innerHTML = '<strong>エラー:</strong><br>' + 
                            result.data.errors.join('<br>');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alertMessage.textContent = 'ネットワークエラーが発生しました。しばらくしてから再度お試しください。';
                alertMessage.className = 'alert alert-error';
                alertMessage.style.display = 'block';
            } finally {
                // Hide loading state
                submitButton.disabled = false;
                loadingSpinner.style.display = 'none';
            }
        });
        
        // Client-side validation
        document.getElementById('contactForm').addEventListener('input', function(e) {
            const field = e.target;
            
            if (field.validity.valid) {
                field.style.borderColor = '#ddd';
            } else {
                field.style.borderColor = '#e74c3c';
            }
        });
    </script>
</body>
</html>