const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Starting UI testing for Malar Market Digital Ledger...');
    
    // Test 1: Login to the application
    console.log('Test 1: Testing login functionality...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    console.log('✓ Login page screenshot captured');
    
    // Fill in login credentials
    await page.fill('input[name="email"]', 'admin@malar.com');
    await page.fill('input[name="password"]', 'admin123');
    
    // Click login button
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Take screenshot after login
    await page.screenshot({ path: 'screenshots/02-after-login.png', fullPage: true });
    console.log('✓ Login successful, screenshot captured');
    
    // Test 2: Navigate to Daily Entry page
    console.log('Test 2: Navigating to Daily Entry page...');
    await page.goto('http://localhost:5173/daily-entry');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of Daily Entry page
    await page.screenshot({ path: 'screenshots/03-daily-entry-page.png', fullPage: true });
    console.log('✓ Daily Entry page screenshot captured');
    
    // Test 3: Check form elements are present
    console.log('Test 3: Checking form elements...');
    
    // Check if farmer autocomplete is present
    const farmerAutocomplete = await page.$('[data-testid="farmer-autocomplete"]');
    if (farmerAutocomplete) {
      console.log('✓ Farmer autocomplete element found');
    } else {
      console.log('✗ Farmer autocomplete element not found');
    }
    
    // Check if weight input is present
    const weightInput = await page.$('[data-testid="weight-input"]');
    if (weightInput) {
      console.log('✓ Weight input element found');
    } else {
      console.log('✗ Weight input element not found');
    }
    
    // Check if flower type select is present
    const flowerTypeSelect = await page.$('[data-testid="flower-type-select"]');
    if (flowerTypeSelect) {
      console.log('✓ Flower type select element found');
    } else {
      console.log('✗ Flower type select element not found');
    }
    
    // Check if add entry button is present
    const addEntryButton = await page.$('[data-testid="add-entry-button"]');
    if (addEntryButton) {
      console.log('✓ Add entry button found');
    } else {
      console.log('✗ Add entry button not found');
    }
    
    // Test 4: Test form validation
    console.log('Test 4: Testing form validation...');
    
    // Test empty form submission
    if (addEntryButton) {
      await addEntryButton.click();
      await page.waitForTimeout(1000);
      
      // Check for validation messages
      const validationMessage = await page.$('.validation-message');
      if (validationMessage) {
        console.log('✓ Form validation message displayed for empty form');
        await page.screenshot({ path: 'screenshots/04-form-validation.png', fullPage: true });
      } else {
        console.log('✗ No validation message displayed for empty form');
      }
    }
    
    // Test 5: Test valid form submission
    console.log('Test 5: Testing valid form submission...');
    
    // Fill in valid form data
    if (farmerAutocomplete) {
      await farmerAutocomplete.click();
      await page.waitForTimeout(500);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
    
    if (weightInput) {
      await weightInput.fill('10.5');
    }
    
    if (flowerTypeSelect) {
      await flowerTypeSelect.click();
      await page.waitForTimeout(500);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
    
    // Submit valid form
    if (addEntryButton) {
      await addEntryButton.click();
      await page.waitForTimeout(2000);
      
      // Check for success message
      const successMessage = await page.$('.success-message');
      if (successMessage) {
        console.log('✓ Success message displayed for valid form');
        await page.screenshot({ path: 'screenshots/05-form-success.png', fullPage: true });
      } else {
        console.log('✗ No success message displayed for valid form');
        await page.screenshot({ path: 'screenshots/06-form-error.png', fullPage: true });
      }
    }
    
    // Test 6: Test responsive design
    console.log('Test 6: Testing responsive design...');
    
    const viewports = [
      { width: 1280, height: 720, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const filename = `screenshots/07-responsive-${viewport.name}.png`;
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`✓ Responsive screenshot captured for ${viewport.name} (${viewport.width}x${viewport.height})`);
    }
    
    // Test 7: Test error handling
    console.log('Test 7: Testing error handling...');
    
    // Test network error simulation
    await page.route('**/*', route => {
      route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'Internal Server Error'
      });
    });
    
    // Try to submit form with network error
    if (addEntryButton) {
      await addEntryButton.click();
      await page.waitForTimeout(2000);
      
      // Check for error message
      const errorMessage = await page.$('.error-message');
      if (errorMessage) {
        console.log('✓ Error message displayed for network error');
        await page.screenshot({ path: 'screenshots/08-network-error.png', fullPage: true });
      } else {
        console.log('✗ No error message displayed for network error');
      }
    }
    
    // Test 8: Test offline functionality
    console.log('Test 8: Testing offline functionality...');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to navigate to Daily Entry page
    await page.goto('http://localhost:5173/daily-entry');
    await page.waitForTimeout(3000);
    
    // Check for offline indicator
    const offlineIndicator = await page.$('.offline-indicator');
    if (offlineIndicator) {
      console.log('✓ Offline indicator displayed');
      await page.screenshot({ path: 'screenshots/09-offline-mode.png', fullPage: true });
    } else {
      console.log('✗ Offline indicator not displayed');
    }
    
    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(1000);
    
    console.log('UI testing completed successfully!');
    
  } catch (error) {
    console.error('Error during UI testing:', error);
  } finally {
    await browser.close();
  }
})();