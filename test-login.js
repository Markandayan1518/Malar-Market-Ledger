const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    
    console.log('Screenshot saved as login-page.png');
    
    // Fill in login credentials
    await page.fill('input[name="email"]', 'admin@malar.com');
    await page.fill('input[name="password"]', 'admin123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot after login
    await page.screenshot({ path: 'dashboard-after-login.png', fullPage: true });
    
    console.log('Screenshot saved as dashboard-after-login.png');
    
    // Navigate to Daily Entry page
    await page.goto('http://localhost:5173/daily-entry');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of Daily Entry page
    await page.screenshot({ path: 'daily-entry-page.png', fullPage: true });
    
    console.log('Screenshot saved as daily-entry-page.png');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();