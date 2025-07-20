/**
 * AI自己診断・自動修復システム
 * Claude APIを使用してエラーを分析し、最適な解決策を提案・実行
 */

class AISelfDiagnosis {
    constructor(anthropicApiKey) {
        this.apiKey = anthropicApiKey;
        this.apiUrl = 'https://api.anthropic.com/v1/messages';
        this.diagnosisHistory = [];
        this.knowledgeBase = new Map();
        
        // 事前学習された知識ベースを初期化
        this.initializeKnowledgeBase();
    }

    /**
     * 知識ベースを初期化
     */
    initializeKnowledgeBase() {
        this.knowledgeBase.set('login_failed', {
            symptoms: ['認証エラー', 'ログインボタンが見つからない', 'パスワード入力失敗'],
            commonCauses: ['認証情報の変更', 'UI変更', 'レート制限'],
            solutions: ['credential_refresh', 'ui_adaptation', 'wait_and_retry']
        });

        this.knowledgeBase.set('element_not_found', {
            symptoms: ['要素が見つからない', 'セレクタエラー', 'タイムアウト'],
            commonCauses: ['UI変更', 'ページ読み込み遅延', '動的コンテンツ'],
            solutions: ['wait_longer', 'alternative_selector', 'page_reload']
        });

        this.knowledgeBase.set('network_error', {
            symptoms: ['接続タイムアウト', 'DNS解決失敗', 'HTTP エラー'],
            commonCauses: ['ネットワーク問題', 'サーバーダウン', 'プロキシ問題'],
            solutions: ['retry_with_backoff', 'check_network', 'use_proxy']
        });

        this.knowledgeBase.set('browser_crash', {
            symptoms: ['ブラウザプロセス終了', 'メモリ不足', 'GPU問題'],
            commonCauses: ['メモリリーク', 'リソース不足', 'ドライバー問題'],
            solutions: ['restart_browser', 'reduce_memory_usage', 'disable_gpu']
        });
    }

    /**
     * エラーを分析し、診断結果を返す
     */
    async diagnose(error, context = {}) {
        const diagnosis = {
            timestamp: new Date().toISOString(),
            error,
            context,
            analysis: null,
            recommendation: null,
            confidence: 0
        };

        try {
            // 1. ローカル知識ベースで事前チェック
            const localDiagnosis = this.checkKnowledgeBase(error);
            
            // 2. AI分析を実行
            const aiAnalysis = await this.performAIAnalysis(error, context);
            
            // 3. 診断結果を統合
            diagnosis.analysis = {
                local: localDiagnosis,
                ai: aiAnalysis,
                hybrid: this.combineAnalysis(localDiagnosis, aiAnalysis)
            };

            // 4. 推奨アクションを決定
            diagnosis.recommendation = this.generateRecommendation(diagnosis.analysis);
            diagnosis.confidence = this.calculateConfidence(diagnosis.analysis);

            // 5. 診断履歴に保存
            this.diagnosisHistory.push(diagnosis);

            console.log(`🧠 AI診断完了: 信頼度 ${(diagnosis.confidence * 100).toFixed(1)}%`);
            
            return diagnosis;

        } catch (analysisError) {
            console.error('❌ AI診断でエラーが発生:', analysisError.message);
            
            // フォールバック: ローカル知識ベースのみ使用
            diagnosis.analysis = { local: this.checkKnowledgeBase(error) };
            diagnosis.recommendation = this.generateFallbackRecommendation(error);
            diagnosis.confidence = 0.3; // 低信頼度

            return diagnosis;
        }
    }

    /**
     * ローカル知識ベースでエラーをチェック
     */
    checkKnowledgeBase(error) {
        const errorType = this.classifyError(error);
        const knowledge = this.knowledgeBase.get(errorType);
        
        if (knowledge) {
            return {
                type: errorType,
                match: true,
                confidence: 0.8,
                solutions: knowledge.solutions,
                reasoning: `Known error pattern: ${errorType}`
            };
        }

        return {
            type: 'unknown',
            match: false,
            confidence: 0.1,
            solutions: ['generic_retry'],
            reasoning: 'Error pattern not recognized in knowledge base'
        };
    }

    /**
     * AI分析を実行
     */
    async performAIAnalysis(error, context) {
        const prompt = this.buildAnalysisPrompt(error, context);
        
        try {
            const response = await fetch(this.apiUrl, {
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
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const analysis = this.parseAIResponse(data.content[0].text);
            
            return {
                success: true,
                analysis,
                confidence: analysis.confidence || 0.7,
                reasoning: analysis.reasoning
            };

        } catch (apiError) {
            console.error('AI API エラー:', apiError.message);
            return {
                success: false,
                error: apiError.message,
                confidence: 0
            };
        }
    }

    /**
     * AI分析用のプロンプトを構築
     */
    buildAnalysisPrompt(error, context) {
        return `
あなたはブラウザ自動化の専門家です。以下のエラーを分析し、最適な解決策を提案してください。

エラー情報:
- エラータイプ: ${error.type}
- エラーメッセージ: ${error.message}
- 発生場所: ${error.selector || error.url || 'unknown'}
- 試行回数: ${error.attempts || 1}

コンテキスト:
- ページURL: ${context.url || 'unknown'}
- ユーザーエージェント: ${context.userAgent || 'unknown'}
- 実行環境: ${context.environment || 'unknown'}
- 前回の成功時刻: ${context.lastSuccess || 'unknown'}

過去の診断履歴:
${this.getRecentDiagnosisHistory()}

以下のJSON形式で回答してください:

{
  "errorCategory": "login_failed|element_not_found|network_error|browser_crash|ui_change|rate_limit|unknown",
  "rootCause": "推定される根本原因",
  "confidence": 0.0-1.0,
  "recommendedActions": [
    {
      "action": "アクション名",
      "priority": 1-5,
      "description": "アクションの説明",
      "expectedSuccess": 0.0-1.0
    }
  ],
  "reasoning": "分析の根拠",
  "preventionTips": ["今後の予防策"]
}
        `;
    }

    /**
     * AI応答を解析
     */
    parseAIResponse(response) {
        try {
            // JSONの抽出を試行
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // JSON形式でない場合のフォールバック
            return {
                errorCategory: 'unknown',
                rootCause: 'AI analysis parsing failed',
                confidence: 0.3,
                recommendedActions: [
                    {
                        action: 'generic_retry',
                        priority: 1,
                        description: 'Generic retry with exponential backoff',
                        expectedSuccess: 0.5
                    }
                ],
                reasoning: 'Could not parse AI response as JSON',
                preventionTips: ['Improve error handling']
            };
        } catch (parseError) {
            console.error('AI応答の解析エラー:', parseError.message);
            return this.getDefaultAnalysis();
        }
    }

    /**
     * ローカルとAI分析を統合
     */
    combineAnalysis(localAnalysis, aiAnalysis) {
        if (!aiAnalysis.success) {
            return localAnalysis;
        }

        // 信頼度の重み付け平均
        const combinedConfidence = (
            localAnalysis.confidence * 0.3 + 
            aiAnalysis.confidence * 0.7
        );

        return {
            errorCategory: aiAnalysis.analysis.errorCategory || localAnalysis.type,
            confidence: combinedConfidence,
            localSolutions: localAnalysis.solutions,
            aiRecommendations: aiAnalysis.analysis.recommendedActions,
            reasoning: `Local: ${localAnalysis.reasoning} | AI: ${aiAnalysis.reasoning}`
        };
    }

    /**
     * 推奨アクションを生成
     */
    generateRecommendation(analysis) {
        const hybrid = analysis.hybrid;
        const recommendations = [];

        // AI推奨アクションを優先
        if (hybrid.aiRecommendations) {
            recommendations.push(...hybrid.aiRecommendations.map(action => ({
                ...action,
                source: 'ai'
            })));
        }

        // ローカル知識ベースの解決策を追加
        if (hybrid.localSolutions) {
            for (const solution of hybrid.localSolutions) {
                if (!recommendations.some(r => r.action === solution)) {
                    recommendations.push({
                        action: solution,
                        priority: 3,
                        description: `Knowledge base solution: ${solution}`,
                        expectedSuccess: 0.6,
                        source: 'local'
                    });
                }
            }
        }

        // 優先度順にソート
        recommendations.sort((a, b) => a.priority - b.priority);

        return {
            primary: recommendations[0],
            alternatives: recommendations.slice(1),
            confidence: hybrid.confidence
        };
    }

    /**
     * エラーを分類
     */
    classifyError(error) {
        const message = error.message.toLowerCase();
        const type = error.type.toLowerCase();

        if (message.includes('login') || message.includes('authentication')) {
            return 'login_failed';
        }
        if (message.includes('element') || message.includes('selector')) {
            return 'element_not_found';
        }
        if (message.includes('network') || message.includes('timeout')) {
            return 'network_error';
        }
        if (message.includes('browser') || message.includes('crash')) {
            return 'browser_crash';
        }

        return 'unknown';
    }

    /**
     * 最近の診断履歴を取得
     */
    getRecentDiagnosisHistory() {
        return this.diagnosisHistory
            .slice(-5) // 最新5件
            .map(d => `${d.timestamp}: ${d.error.type} -> ${d.recommendation?.primary?.action || 'no_action'}`)
            .join('\n');
    }

    /**
     * 信頼度を計算
     */
    calculateConfidence(analysis) {
        if (!analysis.hybrid) return 0;

        let confidence = analysis.hybrid.confidence || 0;
        
        // 診断履歴に基づく調整
        const similarCases = this.diagnosisHistory.filter(d => 
            d.error.type === analysis.hybrid.errorCategory
        );
        
        if (similarCases.length > 0) {
            const successRate = similarCases.filter(d => 
                d.recommendation?.success === true
            ).length / similarCases.length;
            
            confidence = confidence * 0.8 + successRate * 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * フォールバック推奨を生成
     */
    generateFallbackRecommendation(error) {
        return {
            primary: {
                action: 'exponential_backoff_retry',
                priority: 1,
                description: 'Fallback: Retry with exponential backoff',
                expectedSuccess: 0.4,
                source: 'fallback'
            },
            alternatives: [
                {
                    action: 'manual_intervention',
                    priority: 2,
                    description: 'Require manual intervention',
                    expectedSuccess: 0.9,
                    source: 'fallback'
                }
            ],
            confidence: 0.2
        };
    }

    /**
     * デフォルト分析を取得
     */
    getDefaultAnalysis() {
        return {
            errorCategory: 'unknown',
            rootCause: 'Unable to determine root cause',
            confidence: 0.1,
            recommendedActions: [
                {
                    action: 'generic_retry',
                    priority: 1,
                    description: 'Generic retry mechanism',
                    expectedSuccess: 0.3
                }
            ],
            reasoning: 'Default fallback analysis',
            preventionTips: ['Improve error reporting']
        };
    }

    /**
     * 学習: 成功した解決策を記録
     */
    recordSuccess(diagnosis, usedAction, success) {
        // 診断履歴を更新
        diagnosis.recommendation.success = success;
        diagnosis.recommendation.usedAction = usedAction;

        // 成功した場合、知識ベースを更新
        if (success) {
            const errorType = diagnosis.analysis.hybrid.errorCategory;
            if (this.knowledgeBase.has(errorType)) {
                const knowledge = this.knowledgeBase.get(errorType);
                if (!knowledge.solutions.includes(usedAction)) {
                    knowledge.solutions.unshift(usedAction); // 先頭に追加
                }
            }
        }

        console.log(`📚 学習記録: ${usedAction} -> ${success ? '成功' : '失敗'}`);
    }

    /**
     * 診断統計を取得
     */
    getDiagnosisStats() {
        const stats = {
            totalDiagnoses: this.diagnosisHistory.length,
            successfulRecommendations: 0,
            averageConfidence: 0,
            commonErrors: new Map(),
            effectiveSolutions: new Map()
        };

        for (const diagnosis of this.diagnosisHistory) {
            // 成功数カウント
            if (diagnosis.recommendation?.success === true) {
                stats.successfulRecommendations++;
            }

            // 平均信頼度計算
            stats.averageConfidence += diagnosis.confidence || 0;

            // 一般的なエラー
            const errorType = diagnosis.error.type;
            stats.commonErrors.set(errorType, (stats.commonErrors.get(errorType) || 0) + 1);

            // 効果的な解決策
            if (diagnosis.recommendation?.success === true && diagnosis.recommendation?.usedAction) {
                const action = diagnosis.recommendation.usedAction;
                stats.effectiveSolutions.set(action, (stats.effectiveSolutions.get(action) || 0) + 1);
            }
        }

        if (stats.totalDiagnoses > 0) {
            stats.averageConfidence /= stats.totalDiagnoses;
            stats.successRate = (stats.successfulRecommendations / stats.totalDiagnoses) * 100;
        }

        return stats;
    }

    /**
     * 統計をコンソールに出力
     */
    printDiagnosisStats() {
        const stats = this.getDiagnosisStats();
        
        console.log('\n🧠 AI診断システム統計:');
        console.log(`総診断数: ${stats.totalDiagnoses}`);
        console.log(`成功推奨数: ${stats.successfulRecommendations}`);
        console.log(`成功率: ${(stats.successRate || 0).toFixed(1)}%`);
        console.log(`平均信頼度: ${(stats.averageConfidence * 100).toFixed(1)}%`);
        
        console.log('\n📊 一般的なエラー:');
        for (const [error, count] of stats.commonErrors) {
            console.log(`  ${error}: ${count}回`);
        }
        
        console.log('\n✅ 効果的な解決策:');
        for (const [solution, count] of stats.effectiveSolutions) {
            console.log(`  ${solution}: ${count}回成功`);
        }
    }
}

module.exports = AISelfDiagnosis;