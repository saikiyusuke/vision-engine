const { chromium } = require('playwright');
const Anthropic = require('@anthropic-ai/sdk');

class VisionAnalyzer {
  constructor(apiKey) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * スクリーンショットを撮影して画像をbase64エンコード
   */
  async captureScreen(page) {
    const screenshot = await page.screenshot({ fullPage: false });
    return screenshot.toString('base64');
  }

  /**
   * Claude Vision APIに画像を送信して要素を探す
   */
  async findElement(page, description) {
    console.log(`🔍 探しています: "${description}"`);
    
    // スクリーンショットを取得
    const imageBase64 = await this.captureScreen(page);
    
    // ビューポートのサイズを取得
    const viewport = await page.viewportSize();
    
    // Claude Vision APIに問い合わせ
    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: `この画面で「${description}」を探してください。
見つかった場合は、その要素の中心座標を以下の形式で返してください：
FOUND: x=123, y=456

見つからない場合は：
NOT_FOUND

画面サイズは幅${viewport.width}px、高さ${viewport.height}pxです。`
          }
        ]
      }]
    });

    // レスポンスを解析
    const text = response.content[0].text;
    console.log('Vision API レスポンス:', text);

    if (text.includes('FOUND:')) {
      const match = text.match(/x=(\d+),\s*y=(\d+)/);
      if (match) {
        return {
          found: true,
          x: parseInt(match[1]),
          y: parseInt(match[2])
        };
      }
    }

    return { found: false };
  }

  /**
   * 複数の要素を一度に探す（効率化）
   */
  async findMultipleElements(page, descriptions) {
    const imageBase64 = await this.captureScreen(page);
    const viewport = await page.viewportSize();
    
    const prompt = `この画面で以下の要素を探してください：
${descriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

見つかった要素について、以下の形式で座標を返してください：
1: x=123, y=456
2: NOT_FOUND
3: x=789, y=012

画面サイズは幅${viewport.width}px、高さ${viewport.height}pxです。`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }]
    });

    // レスポンスを解析して結果を返す
    const results = {};
    const lines = response.content[0].text.split('\n');
    
    for (const line of lines) {
      const match = line.match(/(\d+):\s*x=(\d+),\s*y=(\d+)/);
      if (match) {
        const index = parseInt(match[1]) - 1;
        results[descriptions[index]] = {
          found: true,
          x: parseInt(match[2]),
          y: parseInt(match[3])
        };
      } else if (line.includes('NOT_FOUND')) {
        const indexMatch = line.match(/(\d+):\s*NOT_FOUND/);
        if (indexMatch) {
          const index = parseInt(indexMatch[1]) - 1;
          results[descriptions[index]] = { found: false };
        }
      }
    }

    return results;
  }

  /**
   * テキストを読み取る
   */
  async readText(page, region = null) {
    const imageBase64 = await this.captureScreen(page);
    
    let prompt = '画面に表示されているテキストをすべて読み取ってください。';
    if (region) {
      prompt = `画面の座標(${region.x}, ${region.y})から幅${region.width}、高さ${region.height}の範囲内のテキストを読み取ってください。`;
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }]
    });

    return response.content[0].text;
  }
}

module.exports = VisionAnalyzer;