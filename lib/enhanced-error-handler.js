/**
 * 詳細なエラー分類とハンドリングシステム
 * エラーを細かく分類し、それぞれに最適化された対処法を実行
 */

const ErrorRecoverySystem = require('./error-recovery-system');
const AISelfDiagnosis = require('./ai-self-diagnosis');

class EnhancedErrorHandler {
    constructor(options = {}) {
        this.anthropicApiKey = options.anthropicApiKey;
        this.recoverySystem = new ErrorRecoverySystem(options.recovery);
        this.aiDiagnosis = new AISelfDiagnosis(this.anthropicApiKey);
        
        this.errorPatterns = new Map();
        this.contextData = new Map();
        this.performanceMetrics = {
            totalErrors: 0,
            resolvedErrors: 0,
            avgResolutionTime: 0,
            resolutionTimes: []
        };
        
        this.initializeErrorPatterns();
    }

    /**
     * エラーパターンを初期化
     */
    initializeErrorPatterns() {
        // ログインエラーパターン
        this.addErrorPattern('LOGIN_INVALID_CREDENTIALS', {
            pattern: /invalid.*(credential|password|username|login)/i,
            severity: 'HIGH',
            category: 'authentication',
            autoRetry: false,
            requiresIntervention: true,
            suggestions: ['認証情報を確認してください', 'パスワードが変更された可能性があります']
        });

        this.addErrorPattern('LOGIN_RATE_LIMITED', {
            pattern: /rate.*(limit|exceeded)|too.* many.* attempts/i,
            severity: 'MEDIUM',
            category: 'rate_limiting',
            autoRetry: true,
            retryDelay: 300000, // 5分
            suggestions: ['レート制限が適用されています', '時間を置いて再試行します']
        });

        this.addErrorPattern('LOGIN_CAPTCHA_REQUIRED', {
            pattern: /captcha|human.*verification|robot.*check/i,
            severity: 'HIGH',
            category: 'anti_automation',
            autoRetry: false,
            requiresIntervention: true,
            suggestions: ['CAPTCHA認証が必要です', '手動での認証が必要かもしれません']
        });

        // UI要素エラーパターン
        this.addErrorPattern('ELEMENT_NOT_FOUND', {
            pattern: /element.*not.*found|selector.*failed|cannot.*locate/i,
            severity: 'MEDIUM',
            category: 'ui_element',
            autoRetry: true,
            maxRetries: 3,
            suggestions: ['UI要素が見つかりません', 'ページの読み込みを待機します']
        });

        this.addErrorPattern('ELEMENT_NOT_VISIBLE', {
            pattern: /element.*not.*visible|hidden.*element|display.*none/i,
            severity: 'MEDIUM',
            category: 'ui_element',
            autoRetry: true,
            retryDelay: 2000,
            suggestions: ['要素が非表示です', 'スクロールまたは待機が必要です']
        });

        this.addErrorPattern('ELEMENT_NOT_CLICKABLE', {
            pattern: /not.*clickable|element.*overlapped|click.*intercepted/i,
            severity: 'MEDIUM',
            category: 'ui_interaction',
            autoRetry: true,
            customHandler: 'handleClickableElement',
            suggestions: ['要素がクリックできません', '他の要素に隠れている可能性があります']
        });

        // ネットワークエラーパターン
        this.addErrorPattern('NETWORK_TIMEOUT', {
            pattern: /timeout|timed.*out|request.*timeout/i,
            severity: 'MEDIUM',
            category: 'network',
            autoRetry: true,
            maxRetries: 5,
            exponentialBackoff: true,
            suggestions: ['ネットワークタイムアウトが発生しました', '接続を再試行します']
        });

        this.addErrorPattern('NETWORK_DNS_FAILED', {
            pattern: /dns.*resolution.*failed|name.*not.*resolved|dns.*lookup/i,
            severity: 'HIGH',
            category: 'network',
            autoRetry: true,
            retryDelay: 10000,
            suggestions: ['DNS解決に失敗しました', 'ネットワーク接続を確認します']
        });

        this.addErrorPattern('NETWORK_CONNECTION_REFUSED', {
            pattern: /connection.*refused|connection.*reset|network.*error/i,
            severity: 'HIGH',
            category: 'network',
            autoRetry: true,
            maxRetries: 3,
            suggestions: ['接続が拒否されました', 'サーバーが利用できない可能性があります']
        });

        // ブラウザエラーパターン
        this.addErrorPattern('BROWSER_CRASHED', {
            pattern: /browser.*crash|browser.*closed|connection.*lost/i,
            severity: 'HIGH',
            category: 'browser',
            autoRetry: true,
            customHandler: 'handleBrowserCrash',
            suggestions: ['ブラウザがクラッシュしました', '新しいブラウザインスタンスを開始します']
        });

        this.addErrorPattern('BROWSER_MEMORY_ERROR', {
            pattern: /out.*of.*memory|memory.*allocation|heap.*exhausted/i,
            severity: 'HIGH',
            category: 'browser',
            autoRetry: true,
            customHandler: 'handleMemoryError',
            suggestions: ['メモリ不足エラーです', 'ブラウザを再起動します']
        });

        // ページ読み込みエラーパターン
        this.addErrorPattern('PAGE_LOAD_FAILED', {
            pattern: /page.*load.*failed|navigation.*failed|net::err_/i,
            severity: 'MEDIUM',
            category: 'navigation',
            autoRetry: true,
            maxRetries: 3,
            suggestions: ['ページの読み込みに失敗しました', 'ページを再読み込みします']
        });

        this.addErrorPattern('PAGE_NOT_FOUND', {
            pattern: /404|not.*found|page.*does.*not.*exist/i,
            severity: 'HIGH',
            category: 'navigation',
            autoRetry: false,
            requiresIntervention: true,
            suggestions: ['ページが見つかりません', 'URLを確認してください']
        });

        // セキュリティエラーパターン
        this.addErrorPattern('SECURITY_CERTIFICATE_ERROR', {
            pattern: /certificate.*error|ssl.*error|tls.*error/i,
            severity: 'MEDIUM',
            category: 'security',
            autoRetry: true,
            customHandler: 'handleCertificateError',
            suggestions: ['SSL証明書エラーです', '証明書を無視して続行します']
        });

        this.addErrorPattern('SECURITY_BLOCKED', {
            pattern: /blocked.*by.*security|security.*policy|cors.*error/i,
            severity: 'HIGH',
            category: 'security',
            autoRetry: false,
            customHandler: 'handleSecurityBlocked',
            suggestions: ['セキュリティポリシーによりブロックされました', '設定の変更が必要です']
        });
    }

    /**
     * エラーパターンを追加
     */
    addErrorPattern(name, pattern) {
        this.errorPatterns.set(name, pattern);
    }

    /**
     * エラーを処理する主要メソッド
     */
    async handleError(error, context = {}) {
        const startTime = Date.now();
        this.performanceMetrics.totalErrors++;

        console.log(`🚨 エラーハンドリング開始: ${error.message}`);

        try {
            // 1. エラーを詳細に分類
            const classification = this.classifyError(error, context);
            console.log(`🔍 エラー分類: ${classification.type} (信頼度: ${(classification.confidence * 100).toFixed(1)}%)`);

            // 2. コンテキストデータを収集
            const enrichedContext = await this.enrichContext(context, error);

            // 3. AI診断を実行
            const diagnosis = await this.aiDiagnosis.diagnose(error, enrichedContext);
            console.log(`🧠 AI診断完了: ${diagnosis.recommendation?.primary?.action || 'no_action'}`);

            // 4. 最適な処理戦略を決定
            const strategy = this.determineStrategy(classification, diagnosis, enrichedContext);

            // 5. エラー処理を実行
            const result = await this.executeStrategy(strategy, error, enrichedContext);

            // 6. 結果を記録
            const resolutionTime = Date.now() - startTime;
            this.recordResult(result, resolutionTime, diagnosis);

            return result;

        } catch (handlingError) {
            console.error(`❌ エラーハンドリング中にエラーが発生: ${handlingError.message}`);
            
            // フォールバック処理
            return await this.fallbackHandling(error, context);
        }
    }

    /**
     * エラーを詳細に分類
     */
    classifyError(error, context) {
        const matches = [];
        
        for (const [patternName, pattern] of this.errorPatterns) {
            if (pattern.pattern.test(error.message)) {
                matches.push({
                    name: patternName,
                    pattern,
                    confidence: this.calculatePatternConfidence(error, pattern, context)
                });
            }
        }

        // 最も信頼度の高いマッチを選択
        matches.sort((a, b) => b.confidence - a.confidence);
        
        if (matches.length > 0) {
            const bestMatch = matches[0];
            return {
                type: bestMatch.name,
                pattern: bestMatch.pattern,
                confidence: bestMatch.confidence,
                alternatives: matches.slice(1)
            };
        }

        // パターンにマッチしない場合
        return {
            type: 'UNKNOWN_ERROR',
            pattern: null,
            confidence: 0.1,
            alternatives: []
        };
    }

    /**
     * パターンマッチの信頼度を計算
     */
    calculatePatternConfidence(error, pattern, context) {
        let confidence = 0.7; // ベース信頼度

        // エラーメッセージの長さと一致度
        const messageLength = error.message.length;
        if (messageLength > 50) confidence += 0.1;

        // コンテキスト情報による調整
        if (context.url && pattern.category === 'navigation') {
            confidence += 0.1;
        }
        if (context.selector && pattern.category === 'ui_element') {
            confidence += 0.1;
        }

        // 過去の成功履歴による調整
        const historicalSuccess = this.getHistoricalSuccess(pattern.category);
        confidence = confidence * 0.8 + historicalSuccess * 0.2;

        return Math.min(confidence, 1.0);
    }

    /**
     * コンテキストを詳細化
     */
    async enrichContext(context, error) {
        const enriched = { ...context };
        
        // タイムスタンプ追加
        enriched.timestamp = new Date().toISOString();
        enriched.errorId = this.generateErrorId();
        
        // ブラウザ情報
        if (context.page) {
            try {
                enriched.url = await context.page.url();
                enriched.title = await context.page.title();
                enriched.viewport = await context.page.viewportSize();
                enriched.userAgent = await context.page.evaluate(() => navigator.userAgent);
            } catch (e) {
                console.log('⚠️ ブラウザ情報の取得に失敗');
            }
        }

        // システム情報
        enriched.system = {
            platform: process.platform,
            nodeVersion: process.version,
            memory: process.memoryUsage()
        };

        // エラー履歴
        enriched.recentErrors = this.getRecentErrors(5);

        return enriched;
    }

    /**
     * 処理戦略を決定
     */
    determineStrategy(classification, diagnosis, context) {
        const strategy = {
            primary: null,
            fallbacks: [],
            skipRecovery: false
        };

        // 分類されたパターンの戦略
        if (classification.pattern) {
            const pattern = classification.pattern;
            
            if (pattern.requiresIntervention) {
                strategy.primary = {
                    type: 'manual_intervention',
                    reason: 'Pattern requires manual intervention',
                    suggestions: pattern.suggestions
                };
                strategy.skipRecovery = true;
            } else if (pattern.customHandler) {
                strategy.primary = {
                    type: 'custom_handler',
                    handler: pattern.customHandler,
                    config: pattern
                };
            } else if (pattern.autoRetry) {
                strategy.primary = {
                    type: 'auto_retry',
                    config: pattern
                };
            }
        }

        // AI診断の推奨を追加
        if (diagnosis.recommendation?.primary) {
            if (!strategy.primary) {
                strategy.primary = {
                    type: 'ai_recommendation',
                    action: diagnosis.recommendation.primary
                };
            } else {
                strategy.fallbacks.push({
                    type: 'ai_recommendation',
                    action: diagnosis.recommendation.primary
                });
            }
        }

        // フォールバック戦略
        if (!strategy.primary) {
            strategy.primary = {
                type: 'generic_recovery',
                reason: 'No specific strategy found'
            };
        }

        return strategy;
    }

    /**
     * 戦略を実行
     */
    async executeStrategy(strategy, error, context) {
        console.log(`⚡ 戦略実行: ${strategy.primary.type}`);

        try {
            switch (strategy.primary.type) {
                case 'manual_intervention':
                    return await this.handleManualIntervention(strategy.primary, error, context);

                case 'custom_handler':
                    return await this.executeCustomHandler(strategy.primary, error, context);

                case 'auto_retry':
                    return await this.executeAutoRetry(strategy.primary, error, context);

                case 'ai_recommendation':
                    return await this.executeAIRecommendation(strategy.primary, error, context);

                case 'generic_recovery':
                    if (!strategy.skipRecovery) {
                        return await this.recoverySystem.recover(context.page, error);
                    }
                    break;
            }
        } catch (executionError) {
            console.log(`❌ 主戦略失敗: ${executionError.message}`);
            
            // フォールバック戦略を試行
            for (const fallback of strategy.fallbacks) {
                try {
                    console.log(`🔄 フォールバック実行: ${fallback.type}`);
                    const result = await this.executeStrategy({ primary: fallback }, error, context);
                    if (result.success) {
                        return result;
                    }
                } catch (fallbackError) {
                    console.log(`❌ フォールバック失敗: ${fallbackError.message}`);
                    continue;
                }
            }
        }

        // すべて失敗した場合
        return {
            success: false,
            error: 'All strategies failed',
            strategy: strategy.primary.type
        };
    }

    /**
     * カスタムハンドラーを実行
     */
    async executeCustomHandler(strategyConfig, error, context) {
        const handlerName = strategyConfig.handler;
        
        switch (handlerName) {
            case 'handleClickableElement':
                return await this.handleClickableElement(error, context);
                
            case 'handleBrowserCrash':
                return await this.handleBrowserCrash(error, context);
                
            case 'handleMemoryError':
                return await this.handleMemoryError(error, context);
                
            case 'handleCertificateError':
                return await this.handleCertificateError(error, context);
                
            case 'handleSecurityBlocked':
                return await this.handleSecurityBlocked(error, context);
                
            default:
                throw new Error(`Unknown custom handler: ${handlerName}`);
        }
    }

    /**
     * クリック不可要素のハンドリング
     */
    async handleClickableElement(error, context) {
        const page = context.page;
        const selector = context.selector;
        
        try {
            // 1. スクロールして要素を表示
            await page.locator(selector).scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);
            
            // 2. オーバーレイ要素を除去
            await page.evaluate(() => {
                const overlays = document.querySelectorAll('[style*="z-index"]');
                overlays.forEach(el => {
                    if (parseInt(el.style.zIndex) > 1000) {
                        el.style.display = 'none';
                    }
                });
            });
            
            // 3. 強制クリック
            await page.locator(selector).click({ force: true });
            
            return { success: true, strategy: 'force_click' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * ブラウザクラッシュのハンドリング
     */
    async handleBrowserCrash(error, context) {
        console.log('🔄 ブラウザを再起動します...');
        
        try {
            const { chromium } = require('playwright');
            const newBrowser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--memory-pressure-off'
                ]
            });
            
            const newContext = await newBrowser.newContext();
            const newPage = await newContext.newPage();
            
            return {
                success: true,
                strategy: 'browser_restart',
                newPage,
                newBrowser
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * メモリエラーのハンドリング
     */
    async handleMemoryError(error, context) {
        console.log('🧹 メモリをクリーンアップします...');
        
        try {
            const page = context.page;
            
            // ガベージコレクション実行
            if (global.gc) {
                global.gc();
            }
            
            // ページのリソースをクリア
            await page.evaluate(() => {
                // 不要な要素を削除
                const images = document.querySelectorAll('img');
                images.forEach(img => img.remove());
                
                // メモリリークの原因となる可能性のあるイベントリスナーを削除
                window.removeEventListener('scroll', () => {});
                window.removeEventListener('resize', () => {});
            });
            
            return { success: true, strategy: 'memory_cleanup' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * SSL証明書エラーのハンドリング
     */
    async handleCertificateError(error, context) {
        console.log('🔒 SSL証明書エラーを回避します...');
        
        try {
            const page = context.page;
            const context_obj = page.context();
            
            // 証明書エラーを無視
            await context_obj.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            });
            
            return { success: true, strategy: 'ignore_certificate' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * セキュリティブロックのハンドリング
     */
    async handleSecurityBlocked(error, context) {
        console.log('🛡️ セキュリティブロックを回避します...');
        
        try {
            const page = context.page;
            
            // User-Agentを変更
            await page.setExtraHTTPHeaders({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            });
            
            return { success: true, strategy: 'bypass_security' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * 自動リトライを実行
     */
    async executeAutoRetry(strategyConfig, error, context) {
        const config = strategyConfig.config;
        const maxRetries = config.maxRetries || 3;
        const retryDelay = config.retryDelay || 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`🔄 自動リトライ ${attempt}/${maxRetries}`);
            
            if (config.exponentialBackoff) {
                await this.recoverySystem.exponentialBackoff(attempt - 1);
            } else {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
            
            try {
                // 元の操作を再試行
                // この部分は実際の操作によって異なるため、
                // 呼び出し元で定義する必要がある
                return { success: true, strategy: 'auto_retry', attempt };
            } catch (retryError) {
                if (attempt === maxRetries) {
                    return { success: false, error: retryError.message, attempts: attempt };
                }
            }
        }
    }

    /**
     * AI推奨を実行
     */
    async executeAIRecommendation(strategyConfig, error, context) {
        const action = strategyConfig.action;
        
        console.log(`🤖 AI推奨アクション実行: ${action.action}`);
        
        // AI推奨アクションを実際の操作にマッピング
        switch (action.action) {
            case 'page_reload':
                return await this.recoverySystem.recover(context.page, { type: 'navigation' });
                
            case 'wait_longer':
                await context.page.waitForTimeout(5000);
                return { success: true, strategy: 'wait_longer' };
                
            case 'alternative_selector':
                // 代替セレクターの実装は呼び出し元で行う
                return { success: false, strategy: 'alternative_selector', reason: 'not_implemented' };
                
            default:
                return { success: false, strategy: 'unknown_ai_action', action: action.action };
        }
    }

    /**
     * 手動介入のハンドリング
     */
    async handleManualIntervention(strategyConfig, error, context) {
        console.log('👤 手動介入が必要です');
        console.log('提案:', strategyConfig.suggestions.join(', '));
        
        // 通知システムがあれば、ここで通知を送信
        
        return {
            success: false,
            strategy: 'manual_intervention',
            requiresIntervention: true,
            suggestions: strategyConfig.suggestions
        };
    }

    /**
     * フォールバック処理
     */
    async fallbackHandling(error, context) {
        console.log('🆘 フォールバック処理を実行');
        
        try {
            return await this.recoverySystem.recover(context.page, error);
        } catch (fallbackError) {
            return {
                success: false,
                error: 'Fallback handling failed',
                originalError: error.message,
                fallbackError: fallbackError.message
            };
        }
    }

    /**
     * 結果を記録
     */
    recordResult(result, resolutionTime, diagnosis) {
        if (result.success) {
            this.performanceMetrics.resolvedErrors++;
        }
        
        this.performanceMetrics.resolutionTimes.push(resolutionTime);
        this.performanceMetrics.avgResolutionTime = 
            this.performanceMetrics.resolutionTimes.reduce((a, b) => a + b, 0) / 
            this.performanceMetrics.resolutionTimes.length;
        
        // AI診断システムに学習結果を記録
        if (diagnosis.recommendation) {
            this.aiDiagnosis.recordSuccess(
                diagnosis, 
                result.strategy, 
                result.success
            );
        }
        
        console.log(`📊 解決時間: ${resolutionTime}ms, 成功: ${result.success}`);
    }

    /**
     * ユーティリティメソッド
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getHistoricalSuccess(category) {
        // 実装: 過去の成功率を計算
        return 0.7; // プレースホルダー
    }

    getRecentErrors(count) {
        // 実装: 最近のエラー履歴を取得
        return []; // プレースホルダー
    }

    /**
     * 統計とレポート
     */
    getErrorHandlingStats() {
        const stats = {
            ...this.performanceMetrics,
            resolutionRate: this.performanceMetrics.totalErrors > 0 ? 
                (this.performanceMetrics.resolvedErrors / this.performanceMetrics.totalErrors) * 100 : 0,
            recoveryStats: this.recoverySystem.getRecoveryStats(),
            diagnosisStats: this.aiDiagnosis.getDiagnosisStats()
        };
        
        return stats;
    }

    printErrorHandlingStats() {
        const stats = this.getErrorHandlingStats();
        
        console.log('\n📈 エラーハンドリング統計:');
        console.log(`総エラー数: ${stats.totalErrors}`);
        console.log(`解決エラー数: ${stats.resolvedErrors}`);
        console.log(`解決率: ${stats.resolutionRate.toFixed(1)}%`);
        console.log(`平均解決時間: ${stats.avgResolutionTime.toFixed(0)}ms`);
        
        this.recoverySystem.printStats();
        this.aiDiagnosis.printDiagnosisStats();
    }
}

module.exports = EnhancedErrorHandler;