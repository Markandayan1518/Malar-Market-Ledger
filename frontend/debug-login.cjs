const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
    
    // Check for form
    const form = await page.$('form');
    console.log('Form found:', !!form);
    
    // Check for inputs
    const inputs = await page.$$('input');
    console.log('Number of inputs:', inputs.length);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const name = await input.getAttribute('name');
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`Input ${i}: name="${name}", type="${type}", placeholder="${placeholder}"`);
    }
    
    // Check for buttons
    const buttons = await page.$$('button');
    console.log('Number of buttons:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const type = await button.getAttribute('type');
      const text = await button.textContent();
      console.log(`Button ${i}: type="${type}", text="${text}"`);
    }
    
    // Get page content
    const title = await page.title();
    console.log('Page title:', title);
    
    // Wait for 5 seconds before closing
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();