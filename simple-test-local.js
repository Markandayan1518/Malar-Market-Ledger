const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Starting simple UI test...');
    
    // Test 1: Login
    console.log('Test 1: Testing login...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/01-login.png', fullPage: true });
    
    // Test 2: Login with credentials
    console.log('Test 2: Testing login with credentials...');
    await page.fill('input[type="email"]', 'admin@malar.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await page.screenshot({ path: 'screenshots/02-after-login.png', fullPage: true });
    
    // Test 3: Navigate to Daily Entry page
    console.log('Test 3: Testing Daily Entry page...');
    await page.goto('http://localhost:5173/daily-entry');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/03-daily-entry.png', fullPage: true });
    
    // Test 4: Check page elements
    console.log('Test 4: Checking page elements...');
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    const hasMainContent = await page.$('.main-content');
    const hasForm = await page.$('form');
    const hasAddButton = await page.$('button[type="submit"]');
    
    console.log(`Has main content: ${hasMainContent}`);
    console.log(`Has form: ${hasForm}`);
    console.log(`Has add button: ${hasAddButton}`);
    
    // Test 5: Test responsive design
    console.log('Test 5: Testing responsive design...');
    
    // Test desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/04-desktop.png', fullPage: true });
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/05-tablet.png', fullPage: true });
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/06-mobile.png', fullPage: true });
    
    console.log('UI testing completed successfully!');
    
  } catch (error) {
    console.error('Error during UI testing:', error);
  } finally {
    await browser.close();
  }
})();