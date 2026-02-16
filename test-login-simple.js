const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  try {
    // Navigate to login page
    await context.goto('http://localhost:5173/login');
    
    // Wait for page to load
    await context.waitForLoadState('networkidle');
    
    // Take a screenshot of the login page
    await context.screenshot({ path: 'login-page.png', fullPage: true });
    
    // Fill in login credentials
    await context.fill('input[name="email"]', 'admin@malar.com');
    await context.fill('input[name="password"]', 'admin123');
    
    // Click login button
    await context.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await context.waitForLoadState('networkidle');
    
    // Take a screenshot after login
    await context.screenshot({ path: 'dashboard-after-login.png', fullPage: true });
    
    // Navigate to Daily Entry page
    await context.goto('http://localhost:5173/daily-entry');
    await context.waitForLoadState('networkidle');
    
    // Take a screenshot of Daily Entry page
    await context.screenshot({ path: 'daily-entry-page.png', fullPage: true });
    
    console.log('Screenshots saved successfully');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();