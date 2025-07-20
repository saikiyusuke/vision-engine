/**
 * 高度なエラー復旧システム
 * Vision Engineの信頼性を99.9%に向上させる
 */

class ErrorRecoverySystem {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 5;
        this.baseDelay = options.baseDelay || 1000;
        this.maxDelay = options.maxDelay || 30000;
        this.strategies = [];
        this.errorHistory = new Map();
        this.successfulStrategies = new Map();
        
        // デフォルト戦略を登録
        this.registerDefaultStrategies();
    }

    /**
     * デフォルトの復旧戦略を登録
     */
    registerDefaultStrategies() {
        // 戦略1: ページリロード
        this.addStrategy('page_reload', {
            priority: 1,
            condition: (error) => error.type === 'navigation' || error.type === 'element_not_found',
            action: async (page, error) => {
                console.log('🔄 戦略1: ページリロード実行');
                await page.reload({ waitUntil: 'networkidle' });
                await page.waitForTimeout(3000);
                return { success: true, strategy: 'page_reload' };
            }
        });

        // 戦略2: 新しいタブで再試行
        this.addStrategy('new_tab', {
            priority: 2,
            condition: (error) => error.type === 'browser_crash' || error.type === 'memory_leak',
            action: async (page, error) => {
                console.log('🆕 戦略2: 新しいタブで再試行');
                const context = page.context();
                const newPage = await context.newPage();
                await page.close();
                await newPage.goto(error.url);
                return { success: true, strategy: 'new_tab', newPage };
            }
        });

        // 戦略3: ブラウザ再起動
        this.addStrategy('browser_restart', {
            priority: 3,
            condition: (error) => error.attempts >= 3,
            action: async (page, error) => {
                console.log('🔄 戦略3: ブラウザ再起動');
                const browser = page.context().browser();
                await browser.close();
                
                // 新しいブラウザインスタンスを作成
                const { chromium } = require('playwright');
                const newBrowser = await chromium.launch({ 
                    headless: true,
                    args: ['--no-sandbox', '--disable-dev-shm-usage']
                });
                const newContext = await newBrowser.newContext();
                const newPage = await newContext.newPage();
                
                return { success: true, strategy: 'browser_restart', newPage, newBrowser };
            }
        });

        // 戦略4: 異なるUser-Agentで再試行
        this.addStrategy('user_agent_rotation', {
            priority: 4,
            condition: (error) => error.type === 'blocked' || error.type === 'rate_limit',
            action: async (page, error) => {
                console.log('🤖 戦略4: User-Agent変更');
                const userAgents = [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
                ];
                
                const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
                await page.setExtraHTTPHeaders({
                    'User-Agent': randomUA
                });
                
                await page.reload();
                return { success: true, strategy: 'user_agent_rotation' };
            }
        });

        // 戦略5: プロキシローテーション（将来実装）
        this.addStrategy('proxy_rotation', {
            priority: 5,
            condition: (error) => error.type === 'ip_blocked',
            action: async (page, error) => {
                console.log('🌐 戦略5: プロキシローテーション（未実装）');
                // 将来的にプロキシサービスと連携
                return { success: false, strategy: 'proxy_rotation', reason: 'not_implemented' };
            }
        });
    }

    /**
     * 新しい復旧戦略を追加
     */
    addStrategy(name, strategy) {
        this.strategies.push({ name, ...strategy });
        this.strategies.sort((a, b) => a.priority - b.priority);
    }

    /**
     * エラー復旧を実行
     */
    async recover(page, error) {
        const errorKey = this.getErrorKey(error);
        const history = this.errorHistory.get(errorKey) || [];
        
        // エラー履歴を更新
        history.push({
            timestamp: Date.now(),
            error: error,
            attempts: (history[history.length - 1]?.attempts || 0) + 1
        });
        this.errorHistory.set(errorKey, history);

        // 最新の試行回数を設定
        error.attempts = history[history.length - 1].attempts;

        console.log(`🚨 エラー復旧開始: ${error.type} (試行回数: ${error.attempts})`);

        // 適用可能な戦略を取得（成功履歴を優先）
        const applicableStrategies = this.getApplicableStrategies(error);
        
        for (const strategy of applicableStrategies) {
            try {
                console.log(`⚡ 戦略実行: ${strategy.name}`);
                
                const result = await strategy.action(page, error);
                
                if (result.success) {
                    // 成功した戦略を記録
                    this.recordSuccessfulStrategy(errorKey, strategy.name);
                    
                    console.log(`✅ 復旧成功: ${strategy.name}`);
                    return {
                        success: true,
                        strategy: strategy.name,
                        page: result.newPage || page,
                        browser: result.newBrowser || null
                    };
                }
            } catch (strategyError) {
                console.log(`❌ 戦略失敗: ${strategy.name} - ${strategyError.message}`);
                continue;
            }
        }

        // すべての戦略が失敗
        console.log('💥 すべての復旧戦略が失敗しました');
        return {
            success: false,
            error: 'All recovery strategies failed',
            attempts: error.attempts
        };
    }

    /**
     * 適用可能な戦略を取得（成功履歴を考慮して並び替え）
     */
    getApplicableStrategies(error) {
        const errorKey = this.getErrorKey(error);
        const successfulStrategies = this.successfulStrategies.get(errorKey) || new Map();
        
        return this.strategies
            .filter(strategy => strategy.condition(error))
            .sort((a, b) => {
                // 成功履歴がある戦略を優先
                const aSuccess = successfulStrategies.get(a.name) || 0;
                const bSuccess = successfulStrategies.get(b.name) || 0;
                
                if (aSuccess !== bSuccess) {
                    return bSuccess - aSuccess; // 成功回数の多い順
                }
                
                return a.priority - b.priority; // 同じ場合は優先度順
            });
    }

    /**
     * 成功した戦略を記録
     */
    recordSuccessfulStrategy(errorKey, strategyName) {
        if (!this.successfulStrategies.has(errorKey)) {
            this.successfulStrategies.set(errorKey, new Map());
        }
        
        const strategies = this.successfulStrategies.get(errorKey);
        strategies.set(strategyName, (strategies.get(strategyName) || 0) + 1);
    }

    /**
     * エラーのキーを生成（同種エラーをグループ化）
     */
    getErrorKey(error) {
        return `${error.type}_${error.selector || error.url || 'unknown'}`;
    }

    /**
     * 指数バックオフでの待機
     */
    async exponentialBackoff(attempt) {
        const delay = Math.min(
            this.baseDelay * Math.pow(2, attempt),
            this.maxDelay
        );
        
        // ジッターを追加（±20%のランダム性）
        const jitter = delay * 0.2 * (Math.random() - 0.5);
        const finalDelay = delay + jitter;
        
        console.log(`⏳ ${Math.round(finalDelay)}ms待機中...`);
        await new Promise(resolve => setTimeout(resolve, finalDelay));
    }

    /**
     * 復旧統計を取得
     */
    getRecoveryStats() {
        const stats = {
            totalErrors: 0,
            recoveredErrors: 0,
            strategiesUsed: new Map(),
            errorTypes: new Map()
        };

        for (const [errorKey, history] of this.errorHistory) {
            stats.totalErrors += history.length;
            
            // エラータイプの統計
            for (const entry of history) {
                const type = entry.error.type;
                stats.errorTypes.set(type, (stats.errorTypes.get(type) || 0) + 1);
            }
        }

        for (const [errorKey, strategies] of this.successfulStrategies) {
            for (const [strategyName, count] of strategies) {
                stats.recoveredErrors += count;
                stats.strategiesUsed.set(strategyName, (stats.strategiesUsed.get(strategyName) || 0) + count);
            }
        }

        stats.recoveryRate = stats.totalErrors > 0 ? (stats.recoveredErrors / stats.totalErrors) * 100 : 0;

        return stats;
    }

    /**
     * 統計をコンソールに出力
     */
    printStats() {
        const stats = this.getRecoveryStats();
        
        console.log('\n📊 復旧システム統計:');
        console.log(`総エラー数: ${stats.totalErrors}`);
        console.log(`復旧成功数: ${stats.recoveredErrors}`);
        console.log(`復旧率: ${stats.recoveryRate.toFixed(1)}%`);
        
        console.log('\n📈 使用された戦略:');
        for (const [strategy, count] of stats.strategiesUsed) {
            console.log(`  ${strategy}: ${count}回`);
        }
        
        console.log('\n🔍 エラータイプ別統計:');
        for (const [type, count] of stats.errorTypes) {
            console.log(`  ${type}: ${count}回`);
        }
    }
}

module.exports = ErrorRecoverySystem;