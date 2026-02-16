const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  try {
    // Navigate to login page
    await context.goto('http://localhost:5173/login');
    await context.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await context.screenshot({ path: 'login-page.png', fullPage: true });
    
    // Fill in login credentials
    await context.fill('input[name="email"]', 'admin@malar.com');
    await context.fill('input[name="password"]', 'admin123');
    
    // Click login button
    await context.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await context.waitForNavigation();
    
    // Take screenshot after login
    await context.screenshot({ path: 'dashboard-after-login.png', fullPage: true });
    
    // Navigate to Daily Entry page
    await context.goto('http://localhost:5173/daily-entry');
    await context.waitForLoadState('networkidle');
    
    // Take screenshot of Daily Entry page
    await context.screenshot({ path: 'daily-entry-page.png', fullPage: true });
    
    console.log('Manual testing completed successfully!');
    
  } catch (error) {
    console.error('Manual testing failed:', error);
  } finally {
    await browser.close();
  }
})();