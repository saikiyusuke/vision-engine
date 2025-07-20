/**
 * Enhanced AutoClaude Vision - 完全改良版
 * エラー率0.1%以下を目指す次世代Vision Engine
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 新しいエラーハンドリングシステムをインポート
const EnhancedErrorHandler = require('./lib/enhanced-error-handler');

class EnhancedAutoClaude {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.options = {
            headless: options.headless !== false,
            timeout: options.timeout || 30000,
            retries: options.retries || 5,
            debugMode: options.debugMode || false,
            screenshotPath: options.screenshotPath || './screenshots',
            ...options
        };
        
        this.browser = null;
        this.context = null;
        this.page = null;
        
        // 高度なエラーハンドリングシステム
        this.errorHandler = new EnhancedErrorHandler({
            anthropicApiKey: apiKey,
            recovery: {
                maxRetries: this.options.retries,
                baseDelay: 1000,
                maxDelay: 30000
            }
        });
        
        // パフォーマンス追跡
        this.metrics = {
            operations: 0,
            successes: 0,
            errors: 0,
            totalTime: 0,
            averageTime: 0
        };
        
        // 操作履歴
        this.operationHistory = [];
        
        this.setupScreenshotDirectory();
    }

    /**
     * スクリーンショットディレクトリのセットアップ
     */
    async setupScreenshotDirectory() {
        try {
            await fs.mkdir(this.options.screenshotPath, { recursive: true });
        } catch (error) {
            console.warn('スクリーンショットディレクトリの作成に失敗:', error.message);
        }
    }

    /**
     * ブラウザを起動（エラーハンドリング強化版）
     */
    async launch() {
        const startTime = Date.now();
        
        try {
            console.log('🚀 Enhanced Vision Engine起動中...');
            
            this.browser = await chromium.launch({
                headless: this.options.headless,
                args: [
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-extensions',
                    '--memory-pressure-off',
                    '--max_old_space_size=4096'
                ]
            });

            this.context = await this.browser.newContext({
                viewport: { width: 1920, height: 1080 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });

            // リクエストインターセプトの設定
            await this.context.route('**/*', async route => {
                const request = route.request();
                
                // 不要なリソースをブロック（パフォーマンス向上）
                if (request.resourceType() === 'image' && !request.url().includes('captcha')) {
                    await route.abort();
                } else if (request.resourceType() === 'font') {
                    await route.abort();
                } else {
                    await route.continue();
                }
            });

            this.page = await this.context.newPage();
            
            // ページエラーハンドリング
            this.page.on('pageerror', error => {
                console.log('🔍 ページエラー:', error.message);
            });
            
            this.page.on('console', msg => {
                if (this.options.debugMode && msg.type() === 'error') {
                    console.log('🔍 コンソールエラー:', msg.text());
                }
            });

            const launchTime = Date.now() - startTime;
            console.log(`✅ 起動完了 (${launchTime}ms)`);
            
            return true;
        } catch (error) {
            console.error('❌ ブラウザ起動エラー:', error.message);
            
            // エラーハンドリングシステムで復旧を試行
            const recovery = await this.errorHandler.handleError(error, {
                operation: 'browser_launch',
                startTime
            });
            
            if (recovery.success) {
                this.browser = recovery.newBrowser;
                this.context = recovery.newBrowser?.contexts()[0];
                this.page = recovery.newPage;
                return true;
            }
            
            throw error;
        }
    }

    /**
     * ページに移動（エラーハンドリング強化版）
     */
    async goto(url) {
        return await this.executeWithErrorHandling('navigation', async () => {
            console.log(`🌐 ページ移動: ${url}`);
            
            await this.page.goto(url, {
                waitUntil: 'networkidle',
                timeout: this.options.timeout
            });
            
            // ページの安定性を確認
            await this.waitForPageStability();
            
            return { success: true, url };
        }, { url });
    }

    /**
     * 要素をクリック（AI Vision + エラーハンドリング）
     */
    async click(description, options = {}) {
        return await this.executeWithErrorHandling('click', async () => {
            console.log(`👆 クリック: ${description}`);
            
            // 1. AI Visionで要素を特定
            const elementInfo = await this.findElementByVision(description, options);
            
            if (!elementInfo.success) {
                throw new Error(`要素が見つかりません: ${description}`);
            }
            
            // 2. クリック実行（複数の方法を試行）
            const clickMethods = [
                () => this.page.click(`css=${elementInfo.selector}`, { timeout: 5000 }),
                () => this.page.locator(elementInfo.selector).click({ force: true }),
                () => this.page.locator(elementInfo.selector).click({ button: 'left', clickCount: 1 }),
                () => this.clickByCoordinates(elementInfo.coordinates)
            ];
            
            for (const [index, method] of clickMethods.entries()) {
                try {
                    await method();
                    console.log(`✅ クリック成功 (方法${index + 1})`);
                    return { success: true, method: index + 1, description };
                } catch (clickError) {
                    console.log(`⚠️ クリック方法${index + 1}失敗: ${clickError.message}`);
                    if (index === clickMethods.length - 1) {
                        throw clickError;
                    }
                }
            }
        }, { description, operation: 'click' });
    }

    /**
     * テキストを入力（エラーハンドリング強化版）
     */
    async fill(description, text, options = {}) {
        return await this.executeWithErrorHandling('fill', async () => {
            console.log(`⌨️ 入力: ${description}`);
            
            // 1. 要素を特定
            const elementInfo = await this.findElementByVision(description, options);
            
            if (!elementInfo.success) {
                throw new Error(`入力要素が見つかりません: ${description}`);
            }
            
            // 2. 入力実行（複数の方法を試行）
            const fillMethods = [
                async () => {
                    await this.page.locator(elementInfo.selector).clear();
                    await this.page.locator(elementInfo.selector).fill(text);
                },
                async () => {
                    await this.page.locator(elementInfo.selector).click();
                    await this.page.keyboard.press('Control+a');
                    await this.page.keyboard.type(text);
                },
                async () => {
                    await this.page.evaluate((selector, value) => {
                        const element = document.querySelector(selector);
                        if (element) {
                            element.value = value;
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }, elementInfo.selector, text);
                }
            ];
            
            for (const [index, method] of fillMethods.entries()) {
                try {
                    await method();
                    
                    // 入力値の確認
                    const actualValue = await this.page.locator(elementInfo.selector).inputValue();
                    if (actualValue === text) {
                        console.log(`✅ 入力成功 (方法${index + 1})`);
                        return { success: true, method: index + 1, description, text };
                    }
                } catch (fillError) {
                    console.log(`⚠️ 入力方法${index + 1}失敗: ${fillError.message}`);
                    if (index === fillMethods.length - 1) {
                        throw fillError;
                    }
                }
            }
        }, { description, text, operation: 'fill' });
    }

    /**
     * 要素の出現を待機（エラーハンドリング強化版）
     */
    async waitFor(description, timeout = 30000) {
        return await this.executeWithErrorHandling('wait', async () => {
            console.log(`⏳ 要素待機: ${description}`);
            
            const startTime = Date.now();
            const endTime = startTime + timeout;
            
            while (Date.now() < endTime) {
                try {
                    const elementInfo = await this.findElementByVision(description, { timeout: 5000 });
                    
                    if (elementInfo.success) {
                        const waitTime = Date.now() - startTime;
                        console.log(`✅ 要素発見 (${waitTime}ms)`);
                        return { success: true, description, waitTime };
                    }
                } catch (searchError) {
                    // 継続して検索
                }
                
                await this.page.waitForTimeout(1000);
            }
            
            throw new Error(`要素が見つかりませんでした: ${description} (タイムアウト: ${timeout}ms)`);
        }, { description, timeout, operation: 'wait' });
    }

    /**
     * 画面の内容を読み取り
     */
    async readScreen(description = '画面全体') {
        return await this.executeWithErrorHandling('read', async () => {
            console.log(`👁️ 画面読み取り: ${description}`);
            
            const screenshot = await this.takeScreenshot();
            const analysis = await this.analyzeScreenshot(screenshot, `画面から以下の情報を読み取ってください: ${description}`);
            
            return { success: true, description, content: analysis };
        }, { description, operation: 'read' });
    }

    /**
     * AI Visionで要素を特定
     */
    async findElementByVision(description, options = {}) {
        try {
            const screenshot = await this.takeScreenshot();
            
            const prompt = `
この画面で「${description}」に該当する要素を特定してください。

要求:
1. 要素の位置（座標）
2. 適切なCSSセレクター
3. 要素の説明

以下のJSON形式で回答してください:
{
    "found": true/false,
    "coordinates": {"x": 数値, "y": 数値},
    "selector": "CSSセレクター",
    "confidence": 0.0-1.0,
    "description": "要素の説明"
}
            `;
            
            const analysis = await this.analyzeScreenshot(screenshot, prompt);
            const result = this.parseVisionResult(analysis);
            
            if (result.found && result.confidence > 0.7) {
                return {
                    success: true,
                    coordinates: result.coordinates,
                    selector: result.selector,
                    confidence: result.confidence
                };
            }
            
            return { success: false, reason: 'Element not found or low confidence' };
        } catch (error) {
            console.error('Vision分析エラー:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * スクリーンショットを撮影
     */
    async takeScreenshot() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshot_${timestamp}.png`;
        const filepath = path.join(this.options.screenshotPath, filename);
        
        await this.page.screenshot({ 
            path: filepath, 
            fullPage: true,
            quality: 80
        });
        
        return filepath;
    }

    /**
     * スクリーンショットを分析
     */
    async analyzeScreenshot(imagePath, prompt) {
        try {
            const imageData = await fs.readFile(imagePath);
            const base64Image = imageData.toString('base64');
            
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/png',
                                    data: base64Image
                                }
                            }
                        ]
                    }]
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('スクリーンショット分析エラー:', error.message);
            throw error;
        }
    }

    /**
     * Vision結果を解析
     */
    parseVisionResult(text) {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.warn('Vision結果の解析に失敗:', error.message);
        }
        
        return {
            found: false,
            coordinates: { x: 0, y: 0 },
            selector: '',
            confidence: 0,
            description: 'Parse failed'
        };
    }

    /**
     * 座標でクリック
     */
    async clickByCoordinates(coordinates) {
        await this.page.mouse.click(coordinates.x, coordinates.y);
    }

    /**
     * ページの安定性を待機
     */
    async waitForPageStability() {
        // ネットワークアクティビティが落ち着くまで待機
        await this.page.waitForLoadState('networkidle');
        
        // 追加の安定性確認
        await this.page.waitForTimeout(1000);
        
        // JavaScriptエラーをチェック
        const jsErrors = await this.page.evaluate(() => {
            return window.jsErrors || [];
        });
        
        if (jsErrors.length > 0) {
            console.warn('⚠️ JavaScript エラーを検出:', jsErrors);
        }
    }

    /**
     * エラーハンドリング付きで操作を実行
     */
    async executeWithErrorHandling(operationType, operation, context = {}) {
        const startTime = Date.now();
        this.metrics.operations++;
        
        try {
            const result = await operation();
            
            // 成功時の記録
            this.metrics.successes++;
            const operationTime = Date.now() - startTime;
            this.metrics.totalTime += operationTime;
            this.metrics.averageTime = this.metrics.totalTime / this.metrics.operations;
            
            this.recordOperation(operationType, true, operationTime, context);
            
            return result;
        } catch (error) {
            this.metrics.errors++;
            
            console.log(`❌ ${operationType}エラー: ${error.message}`);
            
            // エラーハンドリングシステムで復旧を試行
            const enhancedContext = {
                ...context,
                page: this.page,
                operationType,
                timestamp: new Date().toISOString()
            };
            
            const recovery = await this.errorHandler.handleError(error, enhancedContext);
            
            if (recovery.success) {
                console.log(`✅ ${operationType}復旧成功`);
                
                // ページが更新された場合は参照を更新
                if (recovery.newPage) {
                    this.page = recovery.newPage;
                }
                if (recovery.newBrowser) {
                    this.browser = recovery.newBrowser;
                    this.context = this.browser.contexts()[0];
                }
                
                // 復旧後に元の操作を再試行
                try {
                    const result = await operation();
                    this.metrics.successes++;
                    return result;
                } catch (retryError) {
                    console.log(`❌ 復旧後の再試行も失敗: ${retryError.message}`);
                    throw retryError;
                }
            } else {
                this.recordOperation(operationType, false, Date.now() - startTime, context, error.message);
                throw error;
            }
        }
    }

    /**
     * 操作履歴を記録
     */
    recordOperation(type, success, duration, context, error = null) {
        const record = {
            timestamp: new Date().toISOString(),
            type,
            success,
            duration,
            context,
            error
        };
        
        this.operationHistory.push(record);
        
        // 履歴が長くなりすぎないように制限
        if (this.operationHistory.length > 1000) {
            this.operationHistory = this.operationHistory.slice(-500);
        }
    }

    /**
     * メトリクスを取得
     */
    getMetrics() {
        return {
            ...this.metrics,
            successRate: this.metrics.operations > 0 ? 
                (this.metrics.successes / this.metrics.operations) * 100 : 0,
            errorRate: this.metrics.operations > 0 ? 
                (this.metrics.errors / this.metrics.operations) * 100 : 0,
            errorHandlingStats: this.errorHandler.getErrorHandlingStats()
        };
    }

    /**
     * 統計を出力
     */
    printStats() {
        const metrics = this.getMetrics();
        
        console.log('\n📊 Enhanced Vision Engine 統計:');
        console.log(`総操作数: ${metrics.operations}`);
        console.log(`成功数: ${metrics.successes}`);
        console.log(`エラー数: ${metrics.errors}`);
        console.log(`成功率: ${metrics.successRate.toFixed(1)}%`);
        console.log(`エラー率: ${metrics.errorRate.toFixed(1)}%`);
        console.log(`平均操作時間: ${metrics.averageTime.toFixed(0)}ms`);
        
        this.errorHandler.printErrorHandlingStats();
    }

    /**
     * リソースをクリーンアップ
     */
    async close() {
        console.log('🧹 リソースクリーンアップ中...');
        
        try {
            if (this.page) {
                await this.page.close();
            }
            if (this.context) {
                await this.context.close();
            }
            if (this.browser) {
                await this.browser.close();
            }
        } catch (error) {
            console.warn('クリーンアップ中にエラー:', error.message);
        }
        
        console.log('✅ クリーンアップ完了');
        this.printStats();
    }
}

module.exports = EnhancedAutoClaude;