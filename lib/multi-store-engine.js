/**
 * 複数店舗対応並列処理エンジン
 * 100店舗同時処理可能な高性能エンジン
 */

const EnhancedAutoClaude = require('../enhanced-autoclaude-vision');
const fs = require('fs').promises;
const path = require('path');

class MultiStoreEngine {
    constructor(options = {}) {
        this.options = {
            maxConcurrentStores: options.maxConcurrentStores || 10,
            maxBrowsersPerWorker: options.maxBrowsersPerWorker || 3,
            queueTimeout: options.queueTimeout || 300000, // 5分
            retryAttempts: options.retryAttempts || 3,
            debugMode: options.debugMode || false,
            resourceLimits: {
                maxMemoryMB: options.maxMemoryMB || 2048,
                maxCpuPercent: options.maxCpuPercent || 80
            },
            ...options
        };
        
        this.storeQueue = [];
        this.activeWorkers = new Map();
        this.completedStores = new Map();
        this.failedStores = new Map();
        this.resourceMonitor = new ResourceMonitor();
        this.loadBalancer = new LoadBalancer(this.options);
        
        // 統計情報
        this.stats = {
            totalStores: 0,
            processedStores: 0,
            successfulStores: 0,
            failedStores: 0,
            averageProcessingTime: 0,
            totalProcessingTime: 0,
            peakConcurrency: 0,
            resourceUsage: []
        };
    }

    /**
     * 複数店舗の処理を開始
     */
    async processStores(stores) {
        console.log(`🏪 ${stores.length}店舗の並列処理を開始`);
        this.stats.totalStores = stores.length;
        
        try {
            // 1. 店舗をキューに追加
            this.storeQueue.push(...stores.map(store => ({
                ...store,
                id: store.id || this.generateStoreId(),
                status: 'queued',
                attempts: 0,
                createdAt: Date.now()
            })));

            // 2. 負荷分散戦略を決定
            const strategy = this.loadBalancer.determineStrategy(stores);
            console.log(`📊 負荷分散戦略: ${strategy.type} (並列度: ${strategy.concurrency})`);

            // 3. 並列処理を実行
            const results = await this.executeParallelProcessing(strategy);

            // 4. 結果をまとめ
            const summary = this.generateProcessingSummary();
            
            console.log('🎉 並列処理完了');
            this.printProcessingSummary(summary);
            
            return {
                success: true,
                summary,
                results,
                stats: this.stats
            };

        } catch (error) {
            console.error('❌ 並列処理でエラーが発生:', error.message);
            return {
                success: false,
                error: error.message,
                partialResults: this.getPartialResults()
            };
        }
    }

    /**
     * 並列処理を実行
     */
    async executeParallelProcessing(strategy) {
        const results = [];
        const workers = [];
        
        // ワーカーを起動
        for (let i = 0; i < strategy.concurrency; i++) {
            const worker = this.createWorker(i, strategy);
            workers.push(worker);
            this.activeWorkers.set(i, worker);
        }

        // 処理開始
        const processingPromises = workers.map(worker => worker.start());
        
        // 進捗監視を開始
        const progressMonitor = this.startProgressMonitoring();
        
        try {
            // すべてのワーカーの完了を待機
            const workerResults = await Promise.allSettled(processingPromises);
            
            // 結果を集計
            for (const [index, result] of workerResults.entries()) {
                if (result.status === 'fulfilled') {
                    results.push(...result.value);
                } else {
                    console.error(`ワーカー${index}でエラー:`, result.reason);
                }
            }
            
            return results;
        } finally {
            // クリーンアップ
            clearInterval(progressMonitor);
            await this.cleanupWorkers();
        }
    }

    /**
     * ワーカーを作成
     */
    createWorker(workerId, strategy) {
        return new StoreWorker(workerId, {
            engine: this,
            strategy,
            options: this.options,
            resourceMonitor: this.resourceMonitor
        });
    }

    /**
     * 次の店舗をキューから取得
     */
    getNextStore() {
        // 優先度順にソート
        this.storeQueue.sort((a, b) => {
            // 失敗回数が少ない順
            if (a.attempts !== b.attempts) {
                return a.attempts - b.attempts;
            }
            // 作成時刻が古い順
            return a.createdAt - b.createdAt;
        });

        const store = this.storeQueue.shift();
        if (store) {
            store.status = 'processing';
            store.attempts++;
            store.startedAt = Date.now();
        }
        
        return store;
    }

    /**
     * 店舗処理完了を記録
     */
    recordStoreCompletion(store, result) {
        const completionTime = Date.now() - store.startedAt;
        
        if (result.success) {
            this.completedStores.set(store.id, {
                store,
                result,
                completionTime
            });
            this.stats.successfulStores++;
        } else {
            // 失敗した場合、リトライするかどうか判定
            if (store.attempts < this.options.retryAttempts) {
                console.log(`🔄 店舗${store.id}をリトライキューに追加 (試行${store.attempts}/${this.options.retryAttempts})`);
                store.status = 'queued';
                store.lastError = result.error;
                this.storeQueue.push(store);
            } else {
                this.failedStores.set(store.id, {
                    store,
                    result,
                    completionTime
                });
                this.stats.failedStores++;
            }
        }

        this.stats.processedStores++;
        this.stats.totalProcessingTime += completionTime;
        this.stats.averageProcessingTime = this.stats.totalProcessingTime / this.stats.processedStores;
    }

    /**
     * 進捗監視を開始
     */
    startProgressMonitoring() {
        return setInterval(() => {
            const currentConcurrency = this.activeWorkers.size;
            this.stats.peakConcurrency = Math.max(this.stats.peakConcurrency, currentConcurrency);
            
            const resourceUsage = this.resourceMonitor.getCurrentUsage();
            this.stats.resourceUsage.push({
                timestamp: Date.now(),
                ...resourceUsage
            });

            // リソース制限チェック
            if (resourceUsage.memoryMB > this.options.resourceLimits.maxMemoryMB) {
                console.warn('⚠️ メモリ使用量が制限を超えています');
                this.triggerResourceOptimization();
            }

            if (this.options.debugMode) {
                this.printProgress();
            }
        }, 5000); // 5秒間隔
    }

    /**
     * 進捗を出力
     */
    printProgress() {
        const queueLength = this.storeQueue.length;
        const activeWorkers = this.activeWorkers.size;
        const completed = this.completedStores.size;
        const failed = this.failedStores.size;
        
        console.log(`📈 進捗: キュー${queueLength} | 実行中${activeWorkers} | 完了${completed} | 失敗${failed}`);
        
        const resourceUsage = this.resourceMonitor.getCurrentUsage();
        console.log(`💻 リソース: CPU${resourceUsage.cpuPercent}% | メモリ${resourceUsage.memoryMB}MB`);
    }

    /**
     * リソース最適化をトリガー
     */
    async triggerResourceOptimization() {
        console.log('🧹 リソース最適化を実行中...');
        
        // ガベージコレクション実行
        if (global.gc) {
            global.gc();
        }
        
        // 不要なワーカーを停止
        const activeWorkerCount = this.activeWorkers.size;
        if (activeWorkerCount > this.options.maxConcurrentStores / 2) {
            const workersToStop = Math.floor(activeWorkerCount * 0.2);
            let stopped = 0;
            
            for (const [workerId, worker] of this.activeWorkers) {
                if (stopped >= workersToStop) break;
                
                if (worker.canBeStopped()) {
                    await worker.gracefulStop();
                    this.activeWorkers.delete(workerId);
                    stopped++;
                }
            }
            
            console.log(`🛑 ${stopped}個のワーカーを停止しました`);
        }
    }

    /**
     * ワーカーをクリーンアップ
     */
    async cleanupWorkers() {
        console.log('🧹 ワーカーをクリーンアップ中...');
        
        const cleanupPromises = [];
        for (const worker of this.activeWorkers.values()) {
            cleanupPromises.push(worker.cleanup());
        }
        
        await Promise.allSettled(cleanupPromises);
        this.activeWorkers.clear();
        
        console.log('✅ ワーカークリーンアップ完了');
    }

    /**
     * 処理サマリーを生成
     */
    generateProcessingSummary() {
        const totalStores = this.stats.totalStores;
        const successRate = totalStores > 0 ? (this.stats.successfulStores / totalStores) * 100 : 0;
        const avgTime = this.stats.averageProcessingTime;
        
        return {
            totalStores,
            successfulStores: this.stats.successfulStores,
            failedStores: this.stats.failedStores,
            successRate,
            averageProcessingTime: avgTime,
            peakConcurrency: this.stats.peakConcurrency,
            totalProcessingTime: this.stats.totalProcessingTime,
            throughput: totalStores / (this.stats.totalProcessingTime / 1000), // stores/sec
            resourceEfficiency: this.calculateResourceEfficiency()
        };
    }

    /**
     * リソース効率を計算
     */
    calculateResourceEfficiency() {
        if (this.stats.resourceUsage.length === 0) return 0;
        
        const avgCpu = this.stats.resourceUsage.reduce((sum, usage) => sum + usage.cpuPercent, 0) / this.stats.resourceUsage.length;
        const avgMemory = this.stats.resourceUsage.reduce((sum, usage) => sum + usage.memoryMB, 0) / this.stats.resourceUsage.length;
        
        // 効率スコア (低いリソース使用率で高いスループットが理想)
        const throughput = this.stats.successfulStores / (this.stats.totalProcessingTime / 1000);
        const resourceUtilization = (avgCpu / 100 + avgMemory / this.options.resourceLimits.maxMemoryMB) / 2;
        
        return resourceUtilization > 0 ? throughput / resourceUtilization : 0;
    }

    /**
     * 部分結果を取得
     */
    getPartialResults() {
        return {
            completed: Array.from(this.completedStores.values()),
            failed: Array.from(this.failedStores.values()),
            remaining: this.storeQueue.length
        };
    }

    /**
     * 処理サマリーを出力
     */
    printProcessingSummary(summary) {
        console.log('\n📊 並列処理結果サマリー:');
        console.log(`総店舗数: ${summary.totalStores}`);
        console.log(`成功: ${summary.successfulStores} (${summary.successRate.toFixed(1)}%)`);
        console.log(`失敗: ${summary.failedStores}`);
        console.log(`平均処理時間: ${summary.averageProcessingTime.toFixed(0)}ms`);
        console.log(`最大並列度: ${summary.peakConcurrency}`);
        console.log(`スループット: ${summary.throughput.toFixed(2)} stores/sec`);
        console.log(`リソース効率: ${summary.resourceEfficiency.toFixed(2)}`);
    }

    /**
     * 店舗IDを生成
     */
    generateStoreId() {
        return `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * 個別店舗処理ワーカー
 */
class StoreWorker {
    constructor(workerId, config) {
        this.workerId = workerId;
        this.engine = config.engine;
        this.strategy = config.strategy;
        this.options = config.options;
        this.resourceMonitor = config.resourceMonitor;
        
        this.isRunning = false;
        this.canStop = false;
        this.visionInstances = new Map();
        this.processedStores = [];
    }

    /**
     * ワーカーを開始
     */
    async start() {
        this.isRunning = true;
        console.log(`🚀 ワーカー${this.workerId}開始`);
        
        while (this.isRunning && !this.shouldStop()) {
            const store = this.engine.getNextStore();
            
            if (!store) {
                // キューが空の場合、少し待機
                await this.wait(1000);
                continue;
            }
            
            try {
                const result = await this.processStore(store);
                this.engine.recordStoreCompletion(store, result);
                this.processedStores.push({ store, result });
                
            } catch (error) {
                console.error(`❌ ワーカー${this.workerId}で店舗${store.id}の処理エラー:`, error.message);
                this.engine.recordStoreCompletion(store, {
                    success: false,
                    error: error.message
                });
            }
        }
        
        console.log(`🏁 ワーカー${this.workerId}終了 (処理数: ${this.processedStores.length})`);
        return this.processedStores;
    }

    /**
     * 個別店舗を処理
     */
    async processStore(store) {
        console.log(`🏪 ワーカー${this.workerId}: 店舗${store.id}処理開始`);
        
        let visionInstance = null;
        
        try {
            // Vision Engineインスタンスを取得または作成
            visionInstance = await this.getVisionInstance();
            
            // 店舗固有の処理を実行
            const result = await this.executeStoreProcess(store, visionInstance);
            
            console.log(`✅ ワーカー${this.workerId}: 店舗${store.id}処理完了`);
            return result;
            
        } catch (error) {
            console.error(`❌ ワーカー${this.workerId}: 店舗${store.id}処理失敗:`, error.message);
            throw error;
        } finally {
            // インスタンスをプールに戻す
            if (visionInstance) {
                await this.returnVisionInstance(visionInstance);
            }
        }
    }

    /**
     * Vision Engineインスタンスを取得
     */
    async getVisionInstance() {
        // 既存のインスタンスを再利用
        for (const [instanceId, instance] of this.visionInstances) {
            if (!instance.inUse) {
                instance.inUse = true;
                return instance.vision;
            }
        }
        
        // 新しいインスタンスを作成（制限内の場合）
        if (this.visionInstances.size < this.options.maxBrowsersPerWorker) {
            const instanceId = `vision_${this.workerId}_${this.visionInstances.size}`;
            const vision = new EnhancedAutoClaude(process.env.ANTHROPIC_API_KEY, {
                headless: true,
                debugMode: this.options.debugMode
            });
            
            await vision.launch();
            
            const instance = {
                vision,
                inUse: true,
                createdAt: Date.now(),
                usageCount: 0
            };
            
            this.visionInstances.set(instanceId, instance);
            return vision;
        }
        
        // すべてのインスタンスが使用中の場合、待機
        await this.wait(1000);
        return await this.getVisionInstance();
    }

    /**
     * Vision Engineインスタンスを返却
     */
    async returnVisionInstance(vision) {
        for (const [instanceId, instance] of this.visionInstances) {
            if (instance.vision === vision) {
                instance.inUse = false;
                instance.usageCount++;
                
                // 使用回数が多い場合は再起動
                if (instance.usageCount > 20) {
                    console.log(`🔄 ワーカー${this.workerId}: インスタンス${instanceId}を再起動`);
                    await instance.vision.close();
                    this.visionInstances.delete(instanceId);
                }
                break;
            }
        }
    }

    /**
     * 店舗処理を実行
     */
    async executeStoreProcess(store, vision) {
        // この部分は実際の業務ロジックに応じてカスタマイズ
        // 例: Airレジからの売上データ取得
        
        try {
            // 1. ログインページに移動
            await vision.goto(store.loginUrl || 'https://airregi.jp/login');
            
            // 2. ログイン
            await vision.fill('ユーザー名入力欄', store.username);
            await vision.fill('パスワード入力欄', store.password);
            await vision.click('ログインボタン');
            
            // 3. ダッシュボードを待機
            await vision.waitFor('ダッシュボード');
            
            // 4. 売上データページに移動
            await vision.click('売上データリンク');
            await vision.waitFor('売上データ表');
            
            // 5. データを取得
            const salesData = await vision.readScreen('売上データ');
            
            return {
                success: true,
                storeId: store.id,
                data: salesData,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                success: false,
                storeId: store.id,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 停止条件をチェック
     */
    shouldStop() {
        // リソース不足の場合は停止
        const usage = this.resourceMonitor.getCurrentUsage();
        if (usage.memoryMB > this.options.resourceLimits.maxMemoryMB * 0.9) {
            return true;
        }
        
        // タイムアウトの場合は停止
        if (Date.now() - this.startTime > this.options.queueTimeout) {
            return true;
        }
        
        return false;
    }

    /**
     * 停止可能かチェック
     */
    canBeStopped() {
        return this.canStop && this.visionInstances.size === 0;
    }

    /**
     * 優雅な停止
     */
    async gracefulStop() {
        this.isRunning = false;
        this.canStop = true;
        await this.cleanup();
    }

    /**
     * クリーンアップ
     */
    async cleanup() {
        console.log(`🧹 ワーカー${this.workerId}クリーンアップ中...`);
        
        const cleanupPromises = [];
        for (const instance of this.visionInstances.values()) {
            cleanupPromises.push(instance.vision.close());
        }
        
        await Promise.allSettled(cleanupPromises);
        this.visionInstances.clear();
        
        console.log(`✅ ワーカー${this.workerId}クリーンアップ完了`);
    }

    /**
     * 待機
     */
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * リソース監視
 */
class ResourceMonitor {
    getCurrentUsage() {
        const memoryUsage = process.memoryUsage();
        
        return {
            memoryMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            cpuPercent: process.cpuUsage ? this.getCpuPercent() : 0,
            timestamp: Date.now()
        };
    }
    
    getCpuPercent() {
        // CPU使用率の簡易計算
        const cpuUsage = process.cpuUsage();
        return Math.round((cpuUsage.user + cpuUsage.system) / 1000000 * 100);
    }
}

/**
 * 負荷分散
 */
class LoadBalancer {
    constructor(options) {
        this.options = options;
    }
    
    determineStrategy(stores) {
        const storeCount = stores.length;
        const maxConcurrency = this.options.maxConcurrentStores;
        
        if (storeCount <= 5) {
            return { type: 'sequential', concurrency: 1 };
        } else if (storeCount <= 20) {
            return { type: 'small_parallel', concurrency: Math.min(5, maxConcurrency) };
        } else if (storeCount <= 50) {
            return { type: 'medium_parallel', concurrency: Math.min(10, maxConcurrency) };
        } else {
            return { type: 'large_parallel', concurrency: maxConcurrency };
        }
    }
}

module.exports = MultiStoreEngine;