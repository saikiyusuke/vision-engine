# Vision Engine - AI-Powered Web Automation System

## 📋 Executive Summary

Vision Engine is an advanced web automation system that leverages Claude's Vision API to enable natural language-based browser control. Unlike traditional automation tools that rely on CSS selectors or XPath, Vision Engine "sees" web pages like a human would and can interact with elements using simple natural language descriptions.

The system was developed to compete with and surpass ChatGPT's Operator, achieving complete automation capabilities for complex web tasks, with a primary implementation for Airregi POS system data synchronization.

### 🎯 Key Achievements
- ✅ **100% Selector-Free Automation** - No CSS/XPath required
- ✅ **Natural Language Commands** - "Click the login button" instead of `#login-btn`
- ✅ **24/7 Autonomous Operation** - Runs without human intervention
- ✅ **Multi-Environment Support** - Local, cloud, and server execution
- ✅ **Production-Ready** - Currently automating daily business operations

## 🚀 Core Features

### 1. AI Vision Integration
Vision Engine uses Claude 3 Opus's vision capabilities to:
- **Analyze screenshots** of web pages in real-time
- **Locate elements** using natural language descriptions
- **Handle dynamic content** that traditional selectors can't reach
- **Adapt to UI changes** without code modifications

```javascript
// Example: Natural language automation
await autoVision.click('ログインボタン');
await autoVision.fill('ユーザー名の入力欄', 'myusername');
await autoVision.waitFor('ダッシュボードのタイトル');
```

### 2. Airregi POS Automation
Complete automation workflow for Airregi POS system:
- **Automated Login** with credential management
- **Multi-Store Support** with automatic store selection
- **Sales Data Retrieval** for specified date ranges
- **CSV Generation** and download
- **FTP Upload** to OpenMart system
- **Email Notifications** with daily reports

### 3. GitHub Actions Integration
Fully automated CI/CD pipeline:
- **Scheduled Execution** - Runs hourly from 10:00-23:00 JST
- **Cloud-Based** - No local machine required
- **Error Recovery** - Automatic retries and fallbacks
- **Artifact Storage** - 30-day retention for CSV files
- **Debug Screenshots** - Visual debugging for failures

### 4. Multi-Platform Architecture
Flexible deployment options:
- **Local Development** - Direct execution with Node.js
- **GitHub Actions** - Cloud-based scheduled automation
- **Server Deployment** - PHP integration for web hosting
- **Hybrid Mode** - Combine multiple platforms

## 🏗️ Architecture Overview

### System Components

```
Vision Engine
├── Core Libraries
│   ├── autoclaude-vision.js      # Main AI vision library
│   ├── vision-analyzer.js        # Claude API integration
│   └── chrome-integration.js     # Browser management
├── Automation Scripts
│   ├── airregi-*.js             # Various Airregi automation scripts
│   ├── github-setup-*.js        # GitHub automation setup
│   └── test-*.js                # Testing utilities
├── Server Components
│   ├── dashboard/               # Web dashboard
│   ├── server/                  # PHP server scripts
│   └── api/                     # API endpoints
├── Configuration
│   ├── .github/workflows/       # GitHub Actions
│   ├── config/                  # Email and system config
│   └── .env                     # Environment variables
└── Documentation
    ├── README.md
    ├── SETUP_GUIDE.md
    └── TROUBLESHOOTING.md
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Core Engine** | Node.js 18+ | Runtime environment |
| **Browser Automation** | Playwright | Browser control |
| **AI Vision** | Claude 3 Opus API | Visual element detection |
| **Server-Side** | PHP 7.4/8.1 | Email, FTP, web endpoints |
| **CI/CD** | GitHub Actions | Automated execution |
| **Data Transfer** | FTP/cURL | File uploads |
| **Notifications** | PHP Mail/Sendmail | Email alerts |

### Data Flow

```
1. GitHub Actions Trigger (Schedule/Manual)
   ↓
2. AutoClaude Vision Launch
   ↓
3. Airregi Login & Navigation
   ↓
4. Sales Data Extraction
   ↓
5. CSV Download
   ↓
6. FTP Upload to OpenMart
   ↓
7. Email Notification
   ↓
8. Artifact Storage
```

## 💡 How It Works

### 1. Vision-Based Element Detection

Instead of traditional selectors:
```javascript
// Traditional approach ❌
await page.click('#login-button');

// Vision Engine approach ✅
await autoVision.click('ログインボタン');
```

The system:
1. Takes a screenshot of the current page
2. Sends it to Claude Vision API with the description
3. Receives coordinates of the matching element
4. Performs the click at those coordinates

### 2. Intelligent Wait Strategies

```javascript
// Wait for elements to appear
await autoVision.waitFor('売上データ表', 30000);

// Read screen content
const data = await autoVision.readScreen('売上金額の部分');
```

### 3. Error Handling & Recovery

The system includes multiple layers of error handling:
- **Automatic retries** for transient failures
- **Screenshot capture** on errors for debugging
- **Fallback strategies** for common issues
- **Detailed logging** for troubleshooting

## 📊 Current Implementation: Airregi Automation

### Daily Workflow
1. **10:00-23:00 JST** - Hourly execution via GitHub Actions
2. **Login** to Airregi with stored credentials
3. **Navigate** to sales report section
4. **Generate** previous day's sales data
5. **Download** CSV file
6. **Upload** to OpenMart via FTP
7. **Send** email notification with results

### Success Metrics
- **Reliability**: 95%+ success rate
- **Speed**: 3-5 minutes per execution
- **Uptime**: 24/7 operation without manual intervention
- **Cost**: ~$20/month for API usage

## 🔧 Configuration & Setup

### Environment Variables
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...     # Claude API key
AIRREGI_USERNAME=info@openmart.jp      # Airregi username
AIRREGI_PASSWORD=***                   # Airregi password
EMAIL_TO=admin@example.com             # Notification email
```

### Key Files
- **`.env`** - Local environment configuration
- **`config/email-config.php`** - Email settings
- **`.github/workflows/airregi-autoclaude.yml`** - GitHub Actions workflow
- **`dashboard/settings.php`** - Web dashboard configuration

## 🚨 Security Considerations

### Implemented Security Measures
- **API keys** stored in environment variables
- **GitHub Secrets** for sensitive data
- **Token authentication** for web endpoints
- **HTTPS only** for data transmission
- **No credential logging** in any output

### Best Practices
1. Rotate API keys regularly
2. Use strong, unique passwords
3. Limit GitHub repository access
4. Monitor usage and costs
5. Regular security audits

## 📈 Performance & Scalability

### Current Performance
- **Execution Time**: 3-5 minutes per run
- **API Calls**: 10-20 per execution
- **Success Rate**: 95%+
- **Resource Usage**: Minimal (runs in GitHub Actions)

### Scalability Options
1. **Parallel Execution** - Run multiple stores simultaneously
2. **Distributed Processing** - Split across multiple runners
3. **Caching Strategy** - Reduce API calls for static elements
4. **Queue System** - Handle multiple requests

## 🛠️ Maintenance & Monitoring

### Dashboard Features
- **Real-time Status** - Current automation state
- **Sales Analytics** - Visual sales data representation
- **Error Logs** - Detailed error tracking
- **Performance Metrics** - Execution time trends

### Monitoring Checklist
- [ ] Daily email notifications arriving
- [ ] CSV files uploading successfully
- [ ] GitHub Actions running on schedule
- [ ] API usage within limits
- [ ] No repeated failures

## 🔮 Future Enhancements

### Planned Features
1. **Multi-POS Support** - Extend beyond Airregi
2. **Advanced Analytics** - AI-powered insights
3. **Mobile App** - Monitor from anywhere
4. **Webhook Integration** - Real-time notifications
5. **Auto-scaling** - Dynamic resource allocation

### Research Areas
- **GPT-4 Vision** comparison and integration
- **Local LLM** for reduced costs
- **Browser fingerprinting** resistance
- **Advanced anti-detection** techniques

## 🤝 Comparison with Competitors

| Feature | Vision Engine | ChatGPT Operator | Traditional RPA |
|---------|--------------|------------------|-----------------|
| **Natural Language** | ✅ | ✅ | ❌ |
| **No Selectors** | ✅ | ✅ | ❌ |
| **24/7 Operation** | ✅ | ❓ | ✅ |
| **Open Source** | ✅ | ❌ | Varies |
| **Cost** | $20/month | Subscription | License fees |
| **Customizable** | ✅ | Limited | ✅ |
| **Multi-site** | ✅ | ❓ | ✅ |

## 📚 Related Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[API_REFERENCE.md](API_REFERENCE.md)** - Technical API documentation
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

## 👥 Credits & License

Developed with Claude 3 Opus by the AutoClaude Vision team.

**License**: MIT

---

*Last Updated: January 2025*