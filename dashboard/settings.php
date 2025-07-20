<?php
/**
 * 売上目標設定ページ
 */

// 設定ファイル
$settingsFile = __DIR__ . '/../data/settings.json';
$settings = file_exists($settingsFile) ? json_decode(file_get_contents($settingsFile), true) : [];

// デフォルト値
$defaultSettings = [
    'daily_targets' => [
        'monday' => 80000,
        'tuesday' => 80000,
        'wednesday' => 80000,
        'thursday' => 80000,
        'friday' => 80000,
        'saturday' => 100000,
        'sunday' => 90000
    ],
    'hourly_targets' => [
        'monday' => [],
        'tuesday' => [],
        'wednesday' => [],
        'thursday' => [],
        'friday' => [],
        'saturday' => [],
        'sunday' => []
    ],
    'business_hours' => [
        'monday' => ['start' => '08:00', 'end' => '23:30'],
        'tuesday' => ['start' => '08:00', 'end' => '23:30'],
        'wednesday' => ['start' => '08:00', 'end' => '23:30'],
        'thursday' => ['start' => '08:00', 'end' => '23:30'],
        'friday' => ['start' => '08:00', 'end' => '23:30'],
        'saturday' => ['start' => '10:30', 'end' => '23:30'],
        'sunday' => ['start' => '10:30', 'end' => '23:00']
    ],
    'line_notify_token' => '',
    'email_to' => 'tuwari69@gmail.com'
];

// 時間帯別目標の初期化
function initializeHourlyTargets(&$settings) {
    $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    foreach ($days as $day) {
        if (empty($settings['hourly_targets'][$day])) {
            $start = $settings['business_hours'][$day]['start'];
            $end = $settings['business_hours'][$day]['end'];
            $dailyTarget = $settings['daily_targets'][$day];
            
            // 営業時間を計算
            $startTime = strtotime($start);
            $endTime = strtotime($end);
            $totalHours = ($endTime - $startTime) / 3600;
            
            // 1時間ごとの目標を設定
            $hourlyTargets = [];
            $accumulated = 0;
            
            for ($hour = intval($start); $hour < intval($end); $hour++) {
                $progress = ($hour - intval($start) + 1) / $totalHours;
                $target = round($dailyTarget * $progress);
                $hourlyTargets[(string)$hour] = $target;
            }
            
            $settings['hourly_targets'][$day] = $hourlyTargets;
        }
    }
}

initializeHourlyTargets($defaultSettings);

// 設定をマージ
$settings = array_merge($defaultSettings, $settings);

// POSTリクエスト処理
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // 各曜日の設定を処理
    foreach ($days as $day) {
        // 売上目標
        $settings['daily_targets'][$day] = intval($_POST["daily_target_{$day}"] ?? 80000);
        
        // 営業時間
        $settings['business_hours'][$day]['start'] = $_POST["{$day}_start"] ?? '08:00';
        $settings['business_hours'][$day]['end'] = $_POST["{$day}_end"] ?? '23:30';
        
        // 時間帯別目標
        $settings['hourly_targets'][$day] = [];
        $start = intval($settings['business_hours'][$day]['start']);
        $end = intval($settings['business_hours'][$day]['end']);
        
        for ($hour = $start; $hour < $end; $hour++) {
            $key = "hourly_{$day}_{$hour}";
            if (isset($_POST[$key])) {
                $settings['hourly_targets'][$day][(string)$hour] = intval($_POST[$key]);
            }
        }
    }
    
    // LINE Notify トークン
    $settings['line_notify_token'] = trim($_POST['line_notify_token'] ?? '');
    
    // メール送信先
    $settings['email_to'] = trim($_POST['email_to'] ?? 'tuwari69@gmail.com');
    
    // ディレクトリ作成
    $dataDir = dirname($settingsFile);
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0777, true);
    }
    
    // 保存
    file_put_contents($settingsFile, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    // 設定変更をメール通知
    $subject = "【設定変更通知】売上管理システム";
    $message = "売上目標設定が変更されました\n\n";
    $message .= "■ 変更日時\n" . date('Y年m月d日 H:i:s') . "\n\n";
    $message .= "■ 曜日別売上目標と営業時間\n";
    $dayLabels = [
        'monday' => '月',
        'tuesday' => '火', 
        'wednesday' => '水',
        'thursday' => '木',
        'friday' => '金',
        'saturday' => '土',
        'sunday' => '日'
    ];
    
    foreach ($dayLabels as $day => $label) {
        $message .= $label . ": ";
        $message .= "¥" . number_format($settings['daily_targets'][$day]) . " ";
        $message .= "(" . $settings['business_hours'][$day]['start'] . "～" . $settings['business_hours'][$day]['end'] . ")\n";
    }
    
    $message .= "\n■ 通知設定\n";
    $message .= "LINE Notify: " . ($settings['line_notify_token'] ? '設定済み' : '未設定') . "\n";
    $message .= "メール通知先: " . $settings['email_to'] . "\n";
    $message .= "\n設定画面: https://akichikikaku.com/vision-engine/dashboard/settings.php";
    
    $headers = "From: noreply@akichikikaku.com\r\n";
    $headers .= "Reply-To: noreply@akichikikaku.com\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // メール送信
    if (function_exists('mb_send_mail')) {
        mb_language("Japanese");
        mb_internal_encoding("UTF-8");
        mb_send_mail($settings['email_to'], $subject, $message, $headers);
    } else {
        mail($settings['email_to'], $subject, $message, $headers);
    }
    
    $saved = true;
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>設定 - 売上管理システム</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f8f9fa;
            color: #212529;
            line-height: 1.6;
            font-size: 14px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 15s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1) rotate(180deg); }
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: white;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
        }
        
        .card {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            margin-bottom: 30px;
            border: 1px solid rgba(0,0,0,0.03);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .card:hover {
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
            transform: translateY(-2px);
        }
        
        .card:hover::before {
            opacity: 1;
        }
        
        .card h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e9ecef;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            font-weight: 500;
            margin-bottom: 5px;
            color: #555;
        }
        
        input[type="number"],
        input[type="text"],
        input[type="email"],
        input[type="time"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            font-size: 15px;
            transition: all 0.3s ease;
            background-color: #f8f9fa;
        }
        
        input[type="number"]:focus,
        input[type="text"]:focus,
        input[type="email"]:focus,
        input[type="time"]:focus {
            outline: none;
            border-color: #4c6ef5;
            background-color: white;
            box-shadow: 0 0 0 3px rgba(76, 110, 245, 0.1);
        }
        
        .hourly-targets {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 16px;
        }
        
        .hourly-item {
            display: flex;
            flex-direction: column;
            background: #f8fafc;
            padding: 16px;
            border-radius: 10px;
            transition: all 0.2s ease;
            border: 2px solid transparent;
        }
        
        .hourly-item:hover {
            background: white;
            border-color: #e2e8f0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        
        .hourly-item label {
            font-size: 13px;
            margin-bottom: 8px;
            color: #64748b;
            font-weight: 500;
        }
        
        .hourly-item input {
            padding: 10px;
            font-size: 14px;
            font-weight: 500;
            color: #1a1a1a;
        }
        
        .btn {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .btn-secondary {
            background: #e9ecef;
            color: #495057;
            margin-left: 10px;
            box-shadow: none;
        }
        
        .btn-secondary:hover {
            background: #dee2e6;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .alert {
            padding: 16px 20px;
            margin-bottom: 24px;
            border-radius: 12px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from {
                transform: translateY(-10px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .info-box {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            padding: 16px 20px;
            border-radius: 12px;
            margin-top: 10px;
            font-size: 14px;
            color: #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.1);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .info-box::before {
            content: '💡';
            font-size: 18px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .hourly-targets {
                grid-template-columns: 1fr 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚙️ 売上目標設定</h1>
        </div>
        
        <?php if (isset($saved) && $saved): ?>
        <div class="alert">
            ✅ 設定を保存しました
        </div>
        <?php endif; ?>
        
        <form method="post">
            <div class="card">
                <h2>曜日別営業時間と売上目標</h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    <?php
                    $dayNames = [
                        'monday' => ['月曜日', '📅', '#6366f1'],
                        'tuesday' => ['火曜日', '📅', '#6366f1'],
                        'wednesday' => ['水曜日', '📅', '#6366f1'],
                        'thursday' => ['木曜日', '📅', '#6366f1'],
                        'friday' => ['金曜日', '📅', '#6366f1'],
                        'saturday' => ['土曜日', '📆', '#3b82f6'],
                        'sunday' => ['日曜日', '🎅', '#ef4444']
                    ];
                    
                    foreach ($dayNames as $day => [$name, $emoji, $color]):
                    ?>
                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid transparent; padding: 20px; border-radius: 12px; transition: all 0.3s ease; position: relative; overflow: hidden;"
                         onmouseover="this.style.borderColor='<?php echo $color; ?>'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.08)'"
                         onmouseout="this.style.borderColor='transparent'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: <?php echo $color; ?>; opacity: 0.8;"></div>
                        <h3 style="margin-bottom: 15px; color: <?php echo $color; ?>; font-size: 17px; font-weight: 600;">
                            <?php echo $emoji; ?> <?php echo $name; ?>
                        </h3>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="font-size: 12px; color: #666;">営業時間</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="time" name="<?php echo $day; ?>_start" 
                                       value="<?php echo $settings['business_hours'][$day]['start']; ?>" 
                                       style="width: auto; font-size: 13px; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: white;">
                                <span style="font-size: 13px; color: #94a3b8;">～</span>
                                <input type="time" name="<?php echo $day; ?>_end" 
                                       value="<?php echo $settings['business_hours'][$day]['end']; ?>" 
                                       style="width: auto; font-size: 13px; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: white;">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="daily_target_<?php echo $day; ?>" style="font-size: 12px; color: #666; margin-bottom: 8px;">売上目標（円）</label>
                            <input type="number" id="daily_target_<?php echo $day; ?>" 
                                   name="daily_target_<?php echo $day; ?>" 
                                   value="<?php echo $settings['daily_targets'][$day]; ?>" 
                                   min="0" step="1000" required
                                   style="font-size: 15px; padding: 8px 12px; font-weight: 500; color: #1a1a1a;">
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            
            <div class="card">
                <h2>時間帯別累計目標</h2>
                <div class="info-box">
                    曜日を選択して、各時間までの累計売上目標を設定してください
                </div>
                
                <!-- 曜日選択タブ -->
                <div style="display: flex; gap: 8px; margin: 24px 0; padding: 8px; background: #f8fafc; border-radius: 12px; overflow-x: auto;">
                    <?php 
                    $dayLabels = [
                        'monday' => '月',
                        'tuesday' => '火',
                        'wednesday' => '水',
                        'thursday' => '木',
                        'friday' => '金',
                        'saturday' => '土',
                        'sunday' => '日'
                    ];
                    $isFirst = true;
                    foreach ($dayLabels as $day => $label): 
                    ?>
                    <button type="button" class="tab-button" onclick="showDayType('<?php echo $day; ?>')" 
                            style="padding: 12px 24px; background: <?php echo $isFirst ? 'white' : 'none'; ?>; border: none; cursor: pointer; font-weight: 600; font-size: 15px; border-radius: 8px; transition: all 0.2s ease; color: <?php echo $isFirst ? '#6366f1' : '#64748b'; ?>; box-shadow: <?php echo $isFirst ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'; ?>;">
                        <?php echo $label; ?>曜日
                    </button>
                    <?php $isFirst = false; endforeach; ?>
                </div>
                
                <?php 
                $isFirst = true;
                foreach ($dayNames as $day => [$name, $emoji, $color]): 
                ?>
                <div class="hourly-targets-section" id="hourly_<?php echo $day; ?>" style="display: <?php echo $isFirst ? 'block' : 'none'; ?>;">
                    <h4 style="color: <?php echo $color; ?>; margin-bottom: 15px;"><?php echo $emoji; ?> <?php echo $name; ?>の時間帯別目標</h4>
                    <div class="hourly-targets">
                        <?php 
                        $start = intval($settings['business_hours'][$day]['start']);
                        $end = intval($settings['business_hours'][$day]['end']);
                        for ($hour = $start; $hour < $end; $hour++): 
                        ?>
                        <div class="hourly-item">
                            <label for="hourly_<?php echo $day; ?>_<?php echo $hour; ?>"><?php echo $hour; ?>:時まで</label>
                            <input type="number" id="hourly_<?php echo $day; ?>_<?php echo $hour; ?>" 
                                   name="hourly_<?php echo $day; ?>_<?php echo $hour; ?>" 
                                   value="<?php echo $settings['hourly_targets'][$day][(string)$hour] ?? 0; ?>" 
                                   min="0" step="1000">
                        </div>
                        <?php endfor; ?>
                    </div>
                </div>
                <?php $isFirst = false; endforeach; ?>
            </div>
            
            <script>
            function showDayType(dayType) {
                // すべてのセクションを非表示
                document.querySelectorAll('.hourly-targets-section').forEach(section => {
                    section.style.display = 'none';
                });
                
                // すべてのタブボタンからアクティブスタイルを削除
                document.querySelectorAll('.tab-button').forEach(button => {
                    button.style.background = 'none';
                    button.style.color = '#64748b';
                    button.style.boxShadow = 'none';
                });
                
                // 選択されたセクションを表示
                document.getElementById('hourly_' + dayType).style.display = 'block';
                
                // 選択されたタブにアクティブスタイルを適用
                event.target.style.background = 'white';
                event.target.style.color = '#6366f1';
                event.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }
            </script>
            
            <div class="card">
                <h2>通知設定</h2>
                <div class="form-group">
                    <label for="line_notify_token">LINE Notify トークン</label>
                    <input type="text" id="line_notify_token" name="line_notify_token" 
                           value="<?php echo htmlspecialchars($settings['line_notify_token']); ?>" 
                           placeholder="LINE Notifyのトークンを入力">
                    <div class="info-box">
                        <a href="https://notify-bot.line.me/ja/" target="_blank">LINE Notify</a>でトークンを取得してください
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="email_to">メール通知先</label>
                    <input type="email" id="email_to" name="email_to" 
                           value="<?php echo htmlspecialchars($settings['email_to']); ?>" 
                           required>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button type="submit" class="btn">保存</button>
                <a href="index.php" class="btn btn-secondary">ダッシュボードに戻る</a>
            </div>
        </form>
    </div>
</body>
</html>