/**
 * API最適化とキャッシュシステム
 * 実行時間を1-2分に短縮する高性能最適化エンジン
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class PerformanceOptimizer {
    constructor(options = {}) {
        this.options = {
            cacheDir: options.cacheDir || './cache',
            maxCacheSize: options.maxCacheSize || 1000, // MB
            cacheExpiry: options.cacheExpiry || 3600000, // 1時間
            enableBatching: options.enableBatching !== false,
            batchSize: options.batchSize || 5,
            enablePreloading: options.enablePreloading !== false,
            enableCompression: options.enableCompression !== false,
            ...options
        };
        
        // キャッシュシステム
        this.visionCache = new VisionCache(this.options);
        this.apiCache = new Map();
        this.batchProcessor = new BatchProcessor(this.options);
        this.preloader = new ElementPreloader(this.options);
        this.requestOptimizer = new RequestOptimizer(this.options);
        
        // パフォーマンス統計
        this.stats = {
            apiCalls: 0,
            cacheHits: 0,
            cacheMisses: 0,
            batchedRequests: 0,
            preloadedElements: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            savedTime: 0
        };
        
        this.initializeCache();
    }

    /**
     * キャッシュシステムを初期化
     */
    async initializeCache() {
        try {
            await fs.mkdir(this.options.cacheDir, { recursive: true });
            await this.visionCache.initialize();
            console.log('✅ キャッシュシステム初期化完了');
        } catch (error) {
            console.warn('⚠️ キャッシュ初期化エラー:', error.message);
        }
    }

    /**
     * 最適化されたAPI呼び出し
     */
    async optimizedApiCall(type, params, options = {}) {
        const startTime = Date.now();
        this.stats.apiCalls++;
        
        try {
            // 1. キャッシュチェック
            if (options.enableCache !== false) {
                const cachedResult = await this.checkCache(type, params);
                if (cachedResult) {
                    this.stats.cacheHits++;
                    const responseTime = Date.now() - startTime;
                    this.updateStats(responseTime, true);
                    console.log(`🚀 キャッシュヒット: ${type} (${responseTime}ms)`);
                    return cachedResult;
                }
                this.stats.cacheMisses++;
            }

            // 2. バッチ処理の検討
            if (this.options.enableBatching && this.shouldBatch(type, params)) {
                return await this.batchProcessor.addToBatch(type, params, options);
            }

            // 3. プリロード最適化
            if (this.options.enablePreloading) {
                this.preloader.schedulePreload(type, params);
            }

            // 4. 最適化されたリクエスト実行
            const result = await this.executeOptimizedRequest(type, params, options);

            // 5. 結果をキャッシュ
            if (options.enableCache !== false && result.success) {
                await this.storeCache(type, params, result);
            }

            const responseTime = Date.now() - startTime;
            this.updateStats(responseTime, false);
            
            return result;

        } catch (error) {
            console.error(`❌ 最適化API呼び出しエラー (${type}):`, error.message);
            throw error;
        }
    }

    /**
     * 最適化されたVision分析
     */
    async optimizedVisionAnalysis(screenshot, prompt, options = {}) {
        // Vision特有の最適化
        const optimizedPrompt = this.optimizePrompt(prompt);
        const optimizedImage = await this.optimizeImage(screenshot, options);
        
        return await this.optimizedApiCall('vision_analysis', {
            image: optimizedImage,
            prompt: optimizedPrompt
        }, options);
    }

    /**
     * プロンプトを最適化
     */
    optimizePrompt(prompt) {
        // 1. 冗長な表現を削除
        let optimized = prompt
            .replace(/\s+/g, ' ') // 複数スペースを単一に
            .replace(/[。、]{2,}/g, '。') // 重複句読点を削除
            .trim();

        // 2. 共通パターンの簡略化
        const patterns = [
            { from: /この画面で(.+?)に該当する要素を特定してください/, to: '要素特定: $1' },
            { from: /以下のJSON形式で回答してください/, to: 'JSON回答:' },
            { from: /座標とセレクターを教えてください/, to: '座標・セレクター回答' }
        ];

        for (const pattern of patterns) {
            optimized = optimized.replace(pattern.from, pattern.to);
        }

        // 3. 最適化統計を記録
        const savedChars = prompt.length - optimized.length;
        if (savedChars > 0) {
            console.log(`📝 プロンプト最適化: ${savedChars}文字削減`);
        }

        return optimized;
    }

    /**
     * 画像を最適化
     */
    async optimizeImage(imagePath, options = {}) {
        try {
            const { default: sharp } = await import('sharp');
            
            const optimizedPath = imagePath.replace('.png', '_optimized.png');
            
            await sharp(imagePath)
                .resize(1280, 720, { // 適切な解像度にリサイズ
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .png({ 
                    quality: 80, // 品質を下げて容量削減
                    compressionLevel: 6
                })
                .toFile(optimizedPath);

            // サイズ削減を確認
            const originalSize = (await fs.stat(imagePath)).size;
            const optimizedSize = (await fs.stat(optimizedPath)).size;
            const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
            
            console.log(`🖼️ 画像最適化: ${reduction}%削減`);
            
            return optimizedPath;
        } catch (error) {
            console.warn('⚠️ 画像最適化失敗、元画像を使用:', error.message);
            return imagePath;
        }
    }

    /**
     * 最適化されたリクエスト実行
     */
    async executeOptimizedRequest(type, params, options) {
        switch (type) {
            case 'vision_analysis':
                return await this.requestOptimizer.visionAnalysis(params.image, params.prompt, options);
            
            case 'element_detection':
                return await this.requestOptimizer.elementDetection(params.description, params.screenshot, options);
            
            case 'text_extraction':
                return await this.requestOptimizer.textExtraction(params.screenshot, params.region, options);
            
            default:
                throw new Error(`未対応のリクエストタイプ: ${type}`);
        }
    }

    /**
     * キャッシュをチェック
     */
    async checkCache(type, params) {
        const cacheKey = this.generateCacheKey(type, params);
        
        // インメモリキャッシュをチェック
        if (this.apiCache.has(cacheKey)) {
            const cached = this.apiCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.options.cacheExpiry) {
                return cached.data;
            } else {
                this.apiCache.delete(cacheKey);
            }
        }
        
        // ディスクキャッシュをチェック
        return await this.visionCache.get(cacheKey);
    }

    /**
     * キャッシュに保存
     */
    async storeCache(type, params, result) {
        const cacheKey = this.generateCacheKey(type, params);
        
        // インメモリキャッシュに保存
        this.apiCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        // ディスクキャッシュに保存
        await this.visionCache.set(cacheKey, result);
    }

    /**
     * キャッシュキーを生成
     */
    generateCacheKey(type, params) {
        const input = JSON.stringify({ type, params });
        return crypto.createHash('md5').update(input).digest('hex');
    }

    /**
     * バッチ処理すべきかチェック
     */
    shouldBatch(type, params) {
        return type === 'vision_analysis' || type === 'element_detection';
    }

    /**
     * 統計を更新
     */
    updateStats(responseTime, fromCache) {
        this.stats.totalResponseTime += responseTime;
        this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.apiCalls;
        
        if (fromCache) {
            // キャッシュヒットで節約された時間を推定
            this.stats.savedTime += Math.max(0, this.stats.averageResponseTime - responseTime);
        }
    }

    /**
     * パフォーマンス統計を取得
     */
    getPerformanceStats() {
        const cacheHitRate = this.stats.apiCalls > 0 ? 
            (this.stats.cacheHits / this.stats.apiCalls) * 100 : 0;
        
        return {
            ...this.stats,
            cacheHitRate,
            efficiency: this.calculateEfficiency(),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * 効率スコアを計算
     */
    calculateEfficiency() {
        const baseline = 5000; // ベースライン応答時間 (ms)
        const improvement = Math.max(0, (baseline - this.stats.averageResponseTime) / baseline);
        return improvement * 100;
    }

    /**
     * 最適化推奨事項を生成
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.stats.cacheHits / this.stats.apiCalls < 0.3) {
            recommendations.push('キャッシュ効率が低いです。キャッシュ期間の延長を検討してください。');
        }
        
        if (this.stats.averageResponseTime > 3000) {
            recommendations.push('平均応答時間が長いです。画像最適化を強化してください。');
        }
        
        if (this.stats.batchedRequests / this.stats.apiCalls < 0.2) {
            recommendations.push('バッチ処理の使用率が低いです。並列リクエストを増やしてください。');
        }
        
        return recommendations;
    }

    /**
     * 統計を出力
     */
    printPerformanceStats() {
        const stats = this.getPerformanceStats();
        
        console.log('\n⚡ パフォーマンス最適化統計:');
        console.log(`API呼び出し数: ${stats.apiCalls}`);
        console.log(`キャッシュヒット率: ${stats.cacheHitRate.toFixed(1)}%`);
        console.log(`平均応答時間: ${stats.averageResponseTime.toFixed(0)}ms`);
        console.log(`節約時間: ${(stats.savedTime / 1000).toFixed(1)}秒`);
        console.log(`効率スコア: ${stats.efficiency.toFixed(1)}%`);
        
        if (stats.recommendations.length > 0) {
            console.log('\n💡 最適化推奨事項:');
            stats.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec}`);
            });
        }
    }
}

/**
 * Visionキャッシュシステム
 */
class VisionCache {
    constructor(options) {
        this.options = options;
        this.cacheDir = path.join(options.cacheDir, 'vision');
        this.indexFile = path.join(this.cacheDir, 'index.json');
        this.index = new Map();
    }

    async initialize() {
        await fs.mkdir(this.cacheDir, { recursive: true });
        await this.loadIndex();
    }

    async loadIndex() {
        try {
            const indexData = await fs.readFile(this.indexFile, 'utf8');
            const indexObject = JSON.parse(indexData);
            this.index = new Map(Object.entries(indexObject));
        } catch (error) {
            // インデックスファイルが存在しない場合は新規作成
            this.index = new Map();
        }
    }

    async saveIndex() {
        const indexObject = Object.fromEntries(this.index);
        await fs.writeFile(this.indexFile, JSON.stringify(indexObject, null, 2));
    }

    async get(key) {
        const entry = this.index.get(key);
        if (!entry) return null;
        
        // 有効期限チェック
        if (Date.now() - entry.timestamp > this.options.cacheExpiry) {
            await this.delete(key);
            return null;
        }
        
        try {
            const filePath = path.join(this.cacheDir, `${key}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            await this.delete(key);
            return null;
        }
    }

    async set(key, value) {
        const filePath = path.join(this.cacheDir, `${key}.json`);
        await fs.writeFile(filePath, JSON.stringify(value, null, 2));
        
        this.index.set(key, {
            timestamp: Date.now(),
            size: JSON.stringify(value).length
        });
        
        await this.saveIndex();
        await this.cleanup();
    }

    async delete(key) {
        const filePath = path.join(this.cacheDir, `${key}.json`);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            // ファイルが存在しない場合は無視
        }
        
        this.index.delete(key);
        await this.saveIndex();
    }

    async cleanup() {
        const totalSize = Array.from(this.index.values())
            .reduce((sum, entry) => sum + entry.size, 0);
        
        if (totalSize > this.options.maxCacheSize * 1024 * 1024) {
            // 古いエントリから削除
            const entries = Array.from(this.index.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toDelete = entries.slice(0, Math.floor(entries.length * 0.3));
            for (const [key] of toDelete) {
                await this.delete(key);
            }
            
            console.log(`🧹 キャッシュクリーンアップ: ${toDelete.length}件削除`);
        }
    }
}

/**
 * バッチ処理システム
 */
class BatchProcessor {
    constructor(options) {
        this.options = options;
        this.batches = new Map();
        this.timers = new Map();
    }

    async addToBatch(type, params, options) {
        const batchKey = this.getBatchKey(type);
        
        if (!this.batches.has(batchKey)) {
            this.batches.set(batchKey, []);
        }
        
        const batch = this.batches.get(batchKey);
        const request = { params, options, resolve: null, reject: null };
        
        const promise = new Promise((resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
        });
        
        batch.push(request);
        
        // バッチが満杯または時間制限に達したら実行
        if (batch.length >= this.options.batchSize) {
            await this.executeBatch(batchKey);
        } else if (!this.timers.has(batchKey)) {
            this.timers.set(batchKey, setTimeout(() => {
                this.executeBatch(batchKey);
            }, 1000)); // 1秒後に実行
        }
        
        return promise;
    }

    async executeBatch(batchKey) {
        const batch = this.batches.get(batchKey);
        if (!batch || batch.length === 0) return;
        
        // タイマーをクリア
        if (this.timers.has(batchKey)) {
            clearTimeout(this.timers.get(batchKey));
            this.timers.delete(batchKey);
        }
        
        console.log(`📦 バッチ実行: ${batchKey} (${batch.length}件)`);
        
        try {
            // 並列実行
            const results = await Promise.allSettled(
                batch.map(req => this.executeSingleRequest(batchKey, req.params, req.options))
            );
            
            // 結果を各リクエストに返す
            for (const [index, result] of results.entries()) {
                const request = batch[index];
                if (result.status === 'fulfilled') {
                    request.resolve(result.value);
                } else {
                    request.reject(result.reason);
                }
            }
            
        } catch (error) {
            // 全体エラーの場合、すべてのリクエストを失敗にする
            batch.forEach(req => req.reject(error));
        } finally {
            // バッチをクリア
            this.batches.delete(batchKey);
        }
    }

    async executeSingleRequest(type, params, options) {
        // 実際のAPIリクエスト実行（オーバーライド必要）
        throw new Error('executeSingleRequest must be implemented');
    }

    getBatchKey(type) {
        return type; // タイプごとにバッチを分ける
    }
}

/**
 * 要素プリローダー
 */
class ElementPreloader {
    constructor(options) {
        this.options = options;
        this.preloadQueue = [];
        this.isProcessing = false;
    }

    schedulePreload(type, params) {
        if (!this.options.enablePreloading) return;
        
        this.preloadQueue.push({ type, params, timestamp: Date.now() });
        
        if (!this.isProcessing) {
            this.processPreloadQueue();
        }
    }

    async processPreloadQueue() {
        this.isProcessing = true;
        
        while (this.preloadQueue.length > 0) {
            const item = this.preloadQueue.shift();
            
            try {
                await this.preloadItem(item);
            } catch (error) {
                console.warn('⚠️ プリロードエラー:', error.message);
            }
        }
        
        this.isProcessing = false;
    }

    async preloadItem(item) {
        // プリロード処理の実装
        console.log(`🔮 プリロード: ${item.type}`);
    }
}

/**
 * リクエスト最適化
 */
class RequestOptimizer {
    constructor(options) {
        this.options = options;
        this.apiKey = process.env.ANTHROPIC_API_KEY;
    }

    async visionAnalysis(imagePath, prompt, options = {}) {
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
                max_tokens: options.maxTokens || 1000,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
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
        return {
            success: true,
            content: data.content[0].text,
            usage: data.usage
        };
    }

    async elementDetection(description, screenshot, options = {}) {
        const prompt = `要素「${description}」の座標とセレクターをJSON形式で回答してください。`;
        return await this.visionAnalysis(screenshot, prompt, options);
    }

    async textExtraction(screenshot, region, options = {}) {
        const prompt = `指定された領域のテキストを抽出してください。`;
        return await this.visionAnalysis(screenshot, prompt, options);
    }
}

module.exports = PerformanceOptimizer;