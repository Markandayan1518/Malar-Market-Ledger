const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Listen for console messages
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    await page.goto('http://localhost:5173/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get page HTML
    const html = await page.content();
    console.log('Page HTML snippet:', html.substring(0, 1000));
    
    // Check for any error overlays
    const errorOverlay = await page.$('.vite-error-overlay');
    if (errorOverlay) {
      const errorText = await errorOverlay.textContent();
      console.log('Error overlay found:', errorText);
    }
    
    // Check if there's any text content at all
    const bodyText = await page.evaluate(() => document.body.textContent);
    console.log('Body text length:', bodyText.length);
    console.log('Body text snippet:', bodyText.substring(0, 200));
    
    // Wait for 5 seconds before closing
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();