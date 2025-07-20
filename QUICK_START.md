# Quick Start Guide - Vision Engine

Get Vision Engine running in 5 minutes! This guide covers the essentials to start automating web tasks with AI vision.

## 🚀 Prerequisites

- **Node.js 18+** installed
- **Anthropic API Key** (Claude API)
- **GitHub account** (for cloud automation)
- **macOS/Linux/Windows** with Chrome/Chromium

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/vision-engine.git
cd vision-engine
```

### 2. Install Dependencies
```bash
npm install
npx playwright install chromium
```

### 3. Set Up Environment Variables
Create a `.env` file:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
AIRREGI_USERNAME=your-username
AIRREGI_PASSWORD=your-password
EMAIL_TO=your-email@example.com
```

## 🎯 Basic Usage

### Your First Automation

Create `my-first-automation.js`:

```javascript
const AutoClaudeVision = require('./autoclaude-vision');

async function main() {
    // Initialize with your API key
    const vision = new AutoClaudeVision(process.env.ANTHROPIC_API_KEY);
    
    try {
        // Launch browser
        await vision.launch();
        
        // Navigate to a website
        await vision.goto('https://example.com');
        
        // Click using natural language
        await vision.click('the login button');
        
        // Fill in a form
        await vision.fill('email input field', 'test@example.com');
        await vision.fill('password field', 'mypassword');
        
        // Submit the form
        await vision.click('submit button');
        
        // Wait for success
        await vision.waitFor('welcome message');
        
        // Take a screenshot
        await vision.screenshot('success.png');
        
        console.log('✅ Automation completed!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await vision.close();
    }
}

main();
```

Run it:
```bash
node my-first-automation.js
```

## 🏃 Quick Examples

### Example 1: Google Search
```javascript
// Search Google for "AI automation"
await vision.goto('https://google.com');
await vision.fill('search box', 'AI automation');
await vision.click('Google Search button');
await vision.waitFor('search results');
```

### Example 2: Form Filling
```javascript
// Fill a contact form
await vision.goto('https://example.com/contact');
await vision.fill('name field', 'John Doe');
await vision.fill('email field', 'john@example.com');
await vision.fill('message textarea', 'Hello, this is a test message');
await vision.click('send message button');
```

### Example 3: Data Extraction
```javascript
// Extract text from screen
await vision.goto('https://example.com/dashboard');
const salesData = await vision.readScreen('sales figures section');
console.log('Sales data:', salesData);
```

## 🎮 Running Pre-built Automations

### Test Vision System
```bash
node test-vision.js
```

### Run Airregi Automation
```bash
node airregi-vision.js
```

### Debug Chrome Launch
```bash
node debug-chrome-launch.js
```

## ☁️ Cloud Automation Setup (GitHub Actions)

### 1. Quick GitHub Setup
```bash
# Install GitHub CLI
brew install gh  # macOS
# or
sudo apt install gh  # Linux

# Run setup script
node github-setup-simple.js
```

### 2. Manual GitHub Setup
1. Create a new GitHub repository
2. Push your code
3. Go to Settings → Secrets → Actions
4. Add these secrets:
   - `ANTHROPIC_API_KEY`
   - `AIRREGI_USERNAME`
   - `AIRREGI_PASSWORD`
   - `EMAIL_TO`

### 3. Enable GitHub Actions
1. Go to the Actions tab
2. Enable workflows
3. Run manually or wait for schedule

## 🔧 Common Commands

### Development
```bash
# Test your setup
npm test

# Run specific automation
node airregi-vision.js

# Debug mode
DEBUG=* node test-vision.js
```

### Deployment
```bash
# Deploy to server
./server-upload.sh

# Set up cron job
./setup-cron.sh

# Update GitHub secrets
gh secret set ANTHROPIC_API_KEY
```

## 📝 Configuration Options

### Browser Options
```javascript
await vision.launch({
    headless: false,      // Show browser window
    slowMo: 1000,        // Slow down actions
    devtools: true,      // Open DevTools
    timeout: 60000       // Page timeout
});
```

### Vision Options
```javascript
// Custom timeout for element search
await vision.waitFor('complex element', 60000);

// Take full page screenshot
await vision.screenshot('full-page.png', { fullPage: true });

// Custom viewport size
await vision.setViewportSize(1920, 1080);
```

## 🚨 Troubleshooting Quick Fixes

### API Key Issues
```bash
# Test your API key
node -e "console.log(process.env.ANTHROPIC_API_KEY)"

# Re-export if needed
export ANTHROPIC_API_KEY="your-key-here"
```

### Browser Won't Launch
```bash
# Reinstall Playwright browsers
npx playwright install chromium --force
npx playwright install-deps
```

### Element Not Found
```javascript
// Use more descriptive text
await vision.click('blue login button in the top right');

// Add wait before action
await vision.waitFor('page to load', 5000);
await vision.click('login button');
```

## 📚 Next Steps

1. **Read Full Documentation**: See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
2. **Learn the API**: Check [API_REFERENCE.md](API_REFERENCE.md)
3. **Deploy to Production**: Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
4. **Join Community**: Report issues on GitHub

## 💡 Pro Tips

1. **Use Descriptive Text**: "the blue submit button" vs just "button"
2. **Add Waits**: Pages need time to load
3. **Take Screenshots**: Debug visually with `screenshot()`
4. **Check Logs**: Detailed logs help troubleshooting
5. **Start Simple**: Test on easy sites first

## 🎉 You're Ready!

You now have the basics to start automating with Vision Engine. Remember:
- Natural language is powerful but be specific
- Screenshots are your debugging friend
- The system "sees" like you do

Happy automating! 🤖