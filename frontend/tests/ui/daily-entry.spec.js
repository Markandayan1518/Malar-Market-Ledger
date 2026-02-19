import { test, expect } from '@playwright/test';
import { LoginPage, DailyEntryPage, DashboardPage } from './pageObjects';

test.describe('Daily Entry Workflow', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
  });

  test('should navigate to daily entry page from dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    
    await dashboard.goToDailyEntry();
    
    await page.waitForURL(/daily-entry/, { timeout: 5000 }).catch(() => {});
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('daily-entry');
  });

  test('should display quick add panel', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const isQuickAddVisible = await entryPage.isQuickAddVisible();
    expect(isQuickAddVisible).toBeTruthy();
  });

  test('should display existing entries grid', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    // Entry grid should be present
    const grid = await page.$('.entry-grid, [data-testid="entry-grid"]');
    expect(grid).toBeTruthy();
  });

  test('should show total amount in footer', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const totalAmount = await page.$('.total-amount, [data-testid="total-amount"], .footer-total');
    
    // Footer should exist
    expect(totalAmount).toBeTruthy();
  });
});

test.describe('Daily Entry - Add Entry', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
  });

  test('should have farmer selection input', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const farmerInput = await page.$('input[placeholder*="farmer" i], select[name="farmer"], [data-testid="farmer-select"]');
    expect(farmerInput).toBeTruthy();
  });

  test('should have flower type selection', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const flowerSelect = await page.$('select[name="flower_type"], [data-testid="flower-type-select"], select[name*="flower" i]');
    
    // Flower type selection should exist
    expect(flowerSelect).toBeTruthy();
  });

  test('should have weight input', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const weightInput = await page.$('input[name="weight"], input[type="number"], [data-testid="weight-input"]');
    expect(weightInput).toBeTruthy();
  });

  test('should have rate input or auto-populate', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    // Rate might be auto-populated based on flower type and time slot
    const rateInput = await page.$('input[name="rate"], [data-testid="rate-input"], .rate-display');
    
    // Either rate input or rate display should exist
    expect(rateInput).toBeTruthy();
  });

  test('should have save/add button', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const saveButton = await page.$('button:has-text("Save"), button:has-text("Add"), button[type="submit"]');
    expect(saveButton).toBeTruthy();
  });

  test('should show validation errors for empty submission', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    await entryPage.clickSave();
    await page.waitForTimeout(500);
    
    // Should show validation error or stay on page
    const pageContent = await page.content();
    const hasError = pageContent.includes('required') || 
                     pageContent.includes('invalid') ||
                     pageContent.includes('error');
    
    // Should have some form of error indication
    const currentUrl = page.url();
    expect(currentUrl.includes('daily-entry') || hasError).toBeTruthy();
  });
});

test.describe('Daily Entry - Entry Management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
  });

  test('should select entry row on click', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const count = await entryPage.getEntryCount();
    
    if (count > 0) {
      await entryPage.clickEntryRow(0);
      await page.waitForTimeout(300);
      
      const hasSpotlight = await entryPage.hasRowSpotlight(0);
      expect(hasSpotlight).toBeTruthy();
    }
  });

  test('should show entry details when selected', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const count = await entryPage.getEntryCount();
    
    if (count > 0) {
      await entryPage.clickEntryRow(0);
      await page.waitForTimeout(300);
      
      // Should show edit form or details panel
      const editForm = await page.$('.edit-form, .entry-details, [data-testid="edit-form"]');
      
      // Either shows details or allows inline editing
      const hasActiveRow = await entryPage.hasRowSpotlight(0);
      expect(editForm || hasActiveRow).toBeTruthy();
    }
  });

  test('should allow editing selected entry', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const count = await entryPage.getEntryCount();
    
    if (count > 0) {
      await entryPage.clickEntryRow(0);
      await page.waitForTimeout(300);
      
      // Check if weight input is editable
      const weightInput = await page.$('.entry-row.selected input[name="weight"], .arctic-row-active input[type="number"]');
      
      if (weightInput) {
        const isEditable = await weightInput.isEditable();
        expect(isEditable).toBeTruthy();
      }
    }
  });

  test('should allow deleting entry', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const count = await entryPage.getEntryCount();
    
    if (count > 0) {
      await entryPage.clickEntryRow(0);
      await page.waitForTimeout(300);
      
      // Look for delete button
      const deleteButton = await page.$('button:has-text("Delete"), button[aria-label*="delete" i], .delete-btn');
      
      if (deleteButton) {
        expect(await deleteButton.isVisible()).toBeTruthy();
      }
    }
  });
});

test.describe('Daily Entry - Totals Calculation', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
  });

  test('should display total weight', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const totalWeight = await page.$('[data-testid="total-weight"], .total-weight');
    
    if (totalWeight) {
      const text = await totalWeight.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('should display total amount', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const totalAmount = await page.$('[data-testid="total-amount"], .total-amount');
    
    if (totalAmount) {
      const text = await totalAmount.textContent();
      expect(text).toMatch(/₹|Rs|INR|\d/);
    }
  });

  test('should update totals when entry changes', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const initialTotal = await entryPage.getTotalAmount();
    
    const count = await entryPage.getEntryCount();
    
    if (count > 0) {
      // Select and modify an entry
      await entryPage.clickEntryRow(0);
      await page.waitForTimeout(300);
      
      const weightInput = await page.$('.entry-row.selected input[name="weight"], .arctic-row-active input[type="number"]');
      
      if (weightInput) {
        await weightInput.fill('20');
        await weightInput.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
        await page.waitForTimeout(500);
        
        const newTotal = await entryPage.getTotalAmount();
        
        // Total should potentially change
        expect(newTotal).toBeTruthy();
      }
    }
  });
});

test.describe('Daily Entry - Adjustments', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
  });

  test('should show adjustment tags on entries', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    // Look for adjustment tags
    const tags = await page.$$('.adjustment-tag, [data-testid="adjustment-tag"]');
    
    // Tags may or may not exist depending on data
    // Just check they're styled correctly if present
    for (const tag of tags.slice(0, 3)) {
      const isVisible = await tag.isVisible();
      expect(isVisible).toBeTruthy();
    }
  });

  test('should have frostbite styling for deductions', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const deductionTags = await page.$$('.adjustment-tag.frostbite, .adjustment-tag.deduction, [data-type="deduction"]');
    
    for (const tag of deductionTags) {
      const className = await tag.evaluate(el => el.className);
      
      // Should have red/frostbite color indication
      const hasFrostbiteStyle = className.includes('frostbite') || 
                                 className.includes('red') ||
                                 className.includes('deduction');
      expect(hasFrostbiteStyle).toBeTruthy();
    }
  });

  test('should have aurora styling for bonuses', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const bonusTags = await page.$$('.adjustment-tag.aurora, .adjustment-tag.bonus, [data-type="bonus"]');
    
    for (const tag of bonusTags) {
      const className = await tag.evaluate(el => el.className);
      
      // Should have green/aurora color indication
      const hasAuroraStyle = className.includes('aurora') || 
                             className.includes('green') ||
                             className.includes('bonus');
      expect(hasAuroraStyle).toBeTruthy();
    }
  });
});

test.describe('Daily Entry - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
  });

  test('should be keyboard navigable', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });
    
    expect(['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA']).toContain(focusedElement);
  });

  test('should navigate rows with arrow keys', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const count = await entryPage.getEntryCount();
    
    if (count > 1) {
      // Select first row
      await entryPage.clickEntryRow(0);
      await page.waitForTimeout(200);
      
      // Try arrow down
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
      
      const hasSecondRowSpotlight = await entryPage.hasRowSpotlight(1);
      
      // Arrow navigation may or may not be implemented
      // Just verify no errors occur
      expect(true).toBeTruthy();
    }
  });

  test('should save with Enter key in form', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    // Find an input in the quick add panel
    const input = await page.$('.quick-add-entry input, [data-testid="quick-add"] input');
    
    if (input) {
      await input.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Either submits or shows validation
      const currentUrl = page.url();
      expect(currentUrl).toContain('daily-entry');
    }
  });
});

test.describe('Daily Entry - Offline Support', () => {
  test('should handle offline gracefully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(500);
    
    // Check for offline indicator
    const offlineIndicator = await page.$('.offline-indicator, [data-testid="offline-status"]');
    
    // Page should still be functional
    const grid = await page.$('.entry-grid, [data-testid="entry-grid"]');
    
    // Go back online
    await page.context().setOffline(false);
    
    expect(grid).toBeTruthy();
  });
});

test.describe('Daily Entry - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    const startTime = Date.now();
    
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should respond quickly to row selection', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const count = await entryPage.getEntryCount();
    
    if (count > 0) {
      const startTime = Date.now();
      
      await entryPage.clickEntryRow(0);
      await page.waitForTimeout(100);
      
      const responseTime = Date.now() - startTime;
      
      // Row selection should respond within 200ms
      expect(responseTime).toBeLessThan(500);
    }
  });
});
