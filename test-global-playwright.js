const { chromium } = require('/Users/mark-4304/.nvm/versions/node/v20.19.5/lib/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/login-page.png', fullPage: true });
    console.log('Login page screenshot saved');

    // Fill in login form
    await page.fill('input[type="email"]', 'admin@malar.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Click login button
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'screenshots/dashboard.png', fullPage: true });
    console.log('Dashboard screenshot saved');

    // Navigate to daily entry page
    await page.click('text=Daily Entry');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of daily entry page
    await page.screenshot({ path: 'screenshots/daily-entry.png', fullPage: true });
    console.log('Daily entry page screenshot saved');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();