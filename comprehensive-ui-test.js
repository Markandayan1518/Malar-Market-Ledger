const { chromium } = require('/Users/mark-4304/.nvm/versions/node/v20.19.5/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotDir = 'screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir);
}

// Test configuration
const testConfig = {
  viewport: { width: 1280, height: 720 },
  baseUrl: 'http://localhost:5173',
  credentials: {
    email: 'admin@malar.com',
    password: 'admin123'
  }
};

// Helper function to take screenshots with descriptive names
async function takeScreenshot(page, name, description) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(screenshotDir, filename);
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: true 
  });
  
  console.log(`✓ Screenshot saved: ${filename} - ${description}`);
  
  // Write description to a log file
  const logEntry = `${filename}: ${description}\n`;
  fs.appendFileSync(path.join(screenshotDir, 'test-log.txt'), logEntry);
}

// Helper function to add delay
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test function
async function runComprehensiveUITest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: testConfig.viewport
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting Comprehensive UI Test for Daily Entry Page');
    console.log('='.repeat(60));
    
    // 1. Login Page Test
    console.log('\n📝 Step 1: Testing Login Page');
    await page.goto(`${testConfig.baseUrl}/login`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '01-login-page', 'Login page initial state');
    
    // Test form validation - empty fields
    await page.click('button[type="submit"]');
    await delay(1000);
    await takeScreenshot(page, '02-login-validation-empty', 'Login form validation with empty fields');
    
    // Test form validation - invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await delay(2000);
    await takeScreenshot(page, '03-login-validation-invalid', 'Login form validation with invalid credentials');
    
    // Test successful login
    await page.fill('input[type="email"]', testConfig.credentials.email);
    await page.fill('input[type="password"]', testConfig.credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '04-login-success', 'Successful login redirect');
    
    // 2. Dashboard Page Test
    console.log('\n📊 Step 2: Testing Dashboard Page');
    await delay(2000);
    await takeScreenshot(page, '05-dashboard', 'Dashboard page after login');
    
    // Test navigation to Daily Entry
    await page.click('text=Daily Entry');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '06-daily-entry-navigation', 'Navigation to Daily Entry page');
    
    // 3. Daily Entry Page - Initial State
    console.log('\n📝 Step 3: Testing Daily Entry Page - Initial State');
    await takeScreenshot(page, '07-daily-entry-initial', 'Daily Entry page initial state');
    
    // 4. Test Add Entry Functionality
    console.log('\n➕ Step 4: Testing Add Entry Functionality');
    
    // Test form validation - empty form
    await page.click('button:has-text("Add Entry")');
    await delay(1000);
    await takeScreenshot(page, '08-add-entry-form-empty', 'Add Entry form - empty state');
    
    // Try to submit empty form
    await page.click('button:has-text("Save")');
    await delay(2000);
    await takeScreenshot(page, '09-add-entry-validation-empty', 'Add Entry validation - empty form');
    
    // Close the modal/dialog
    await page.click('button:has-text("Cancel")');
    await delay(1000);
    
    // Test adding a valid entry
    await page.click('button:has-text("Add Entry")');
    await delay(1000);
    
    // Fill in the form with test data
    await page.selectOption('select[name="farmer_id"]', '1'); // Assuming first farmer
    await page.selectOption('select[name="flower_type_id"]', '1'); // Assuming first flower type
    await page.selectOption('select[name="time_slot_id"]', '1'); // Assuming first time slot
    await page.fill('input[name="weight"]', '50.5');
    await page.fill('input[name="rate"]', '15.50');
    await page.fill('input[name="commission"]', '5.25');
    await page.fill('textarea[name="notes"]', 'Test entry for UI validation');
    
    await takeScreenshot(page, '10-add-entry-filled', 'Add Entry form - filled with valid data');
    
    // Submit the form
    await page.click('button:has-text("Save")');
    await delay(2000);
    await takeScreenshot(page, '11-add-entry-success', 'Add Entry - successful submission');
    
    // 5. Test Update Entry Functionality
    console.log('\n✏️ Step 5: Testing Update Entry Functionality');
    
    // Wait for entries to load and find an entry to update
    await delay(2000);
    await takeScreenshot(page, '12-entries-list', 'Entries list after adding');
    
    // Try to click on an entry to edit (assuming there's an edit button)
    const editButtons = await page.$$('button[aria-label*="edit"], button:has-text("Edit"), button:has-text("Update")');
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await delay(1000);
      await takeScreenshot(page, '13-update-entry-form', 'Update Entry form - opened');
      
      // Modify some data
      await page.fill('input[name="weight"]', '55.0');
      await page.fill('textarea[name="notes"]', 'Updated test entry for UI validation');
      
      await takeScreenshot(page, '14-update-entry-modified', 'Update Entry form - modified data');
      
      // Save the update
      await page.click('button:has-text("Update")');
      await delay(2000);
      await takeScreenshot(page, '15-update-entry-success', 'Update Entry - successful update');
    } else {
      console.log('⚠️ No edit buttons found, skipping update test');
      await takeScreenshot(page, '13-no-edit-buttons', 'No edit buttons available for testing');
    }
    
    // 6. Test Form Validation
    console.log('\n🔍 Step 6: Testing Form Validation');
    
    // Open add entry form again for validation testing
    await page.click('button:has-text("Add Entry")');
    await delay(1000);
    
    // Test invalid weight
    await page.fill('input[name="weight"]', '-10');
    await page.click('button:has-text("Save")');
    await delay(2000);
    await takeScreenshot(page, '16-validation-negative-weight', 'Form validation - negative weight');
    
    // Test invalid rate
    await page.fill('input[name="weight"]', '50');
    await page.fill('input[name="rate"]', '-5');
    await page.click('button:has-text("Save")');
    await delay(2000);
    await takeScreenshot(page, '17-validation-negative-rate', 'Form validation - negative rate');
    
    // Test invalid commission
    await page.fill('input[name="rate"]', '15');
    await page.fill('input[name="commission"]', '999999');
    await page.click('button:has-text("Save")');
    await delay(2000);
    await takeScreenshot(page, '18-validation-excessive-commission', 'Form validation - excessive commission');
    
    // 7. Test Responsive Design
    console.log('\n📱 Step 7: Testing Responsive Design');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await takeScreenshot(page, '19-responsive-mobile', 'Mobile responsive view');
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await takeScreenshot(page, '20-responsive-tablet', 'Tablet responsive view');
    
    // Reset to desktop view
    await page.setViewportSize(testConfig.viewport);
    
    // 8. Test Error Handling
    console.log('\n⚠️ Step 8: Testing Error Handling');
    
    // Try to submit with missing required fields
    await page.click('button:has-text("Add Entry")');
    await delay(1000);
    await page.fill('input[name="weight"]', '50');
    await page.fill('input[name="rate"]', '15');
    // Leave farmer empty
    await page.click('button:has-text("Save")');
    await delay(2000);
    await takeScreenshot(page, '21-error-missing-farmer', 'Error handling - missing required field');
    
    // 9. Test Data Persistence
    console.log('\n💾 Step 9: Testing Data Persistence');
    
    // Refresh the page to check if data persists
    await page.reload();
    await page.waitForLoadState('networkidle');
    await delay(2000);
    await takeScreenshot(page, '22-data-persistence', 'Data persistence after page refresh');
    
    // 10. Test UI Elements and Interactions
    console.log('\n🎨 Step 10: Testing UI Elements and Interactions');
    
    // Test hover states
    const buttons = await page.$$('button');
    if (buttons.length > 0) {
      await buttons[0].hover();
      await delay(500);
      await takeScreenshot(page, '23-hover-state', 'Button hover state');
    }
    
    // Test focus states
    const inputs = await page.$$('input, select, textarea');
    if (inputs.length > 0) {
      await inputs[0].focus();
      await delay(500);
      await takeScreenshot(page, '24-focus-state', 'Input focus state');
    }
    
    // 11. Test Accessibility
    console.log('\n♿ Step 11: Testing Accessibility');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await delay(500);
    await takeScreenshot(page, '25-keyboard-navigation', 'Keyboard navigation focus');
    
    // Test ARIA labels
    const hasAriaLabels = await page.$$('[aria-label]');
    await takeScreenshot(page, '26-aria-labels', 'ARIA labels and accessibility features');
    
    console.log('\n✅ Comprehensive UI Test Completed!');
    console.log('='.repeat(60));
    console.log(`📸 Screenshots saved to: ${screenshotDir}/`);
    console.log('📋 Test log saved to: screenshots/test-log.txt');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await takeScreenshot(page, 'error-screenshot', `Error occurred: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Run the test
runComprehensiveUITest();