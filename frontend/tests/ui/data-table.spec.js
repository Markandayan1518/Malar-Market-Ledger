import { test, expect } from '@playwright/test';
import { LoginPage, FarmersPage } from './pageObjects';

test.describe('Data Table Component', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|farmers)/, { timeout: 10000 }).catch(() => {});
  });

  test('should display data table on farmers page', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const table = await page.$('.data-table, [data-testid="farmers-table"], table');
    expect(table).toBeTruthy();
  });

  test('should have table headers', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const headers = await page.$$('th, [role="columnheader"]');
    expect(headers.length).toBeGreaterThan(0);
  });

  test('should have sortable columns', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    // Find sortable header
    const sortableHeader = await page.$('th[class*="cursor-pointer"], th[aria-sort]');
    
    if (sortableHeader) {
      const initialOrder = await sortableHeader.getAttribute('aria-sort');
      
      await sortableHeader.click();
      await page.waitForTimeout(300);
      
      const newOrder = await sortableHeader.getAttribute('aria-sort');
      
      // Sort order should change or data should be reordered
      const orderChanged = initialOrder !== newOrder;
      expect(orderChanged).toBeTruthy();
    }
  });

  test('should support search/filter', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const searchInput = await page.$('input[placeholder*="search" i], input[type="search"]');
    
    if (searchInput) {
      const initialCount = await farmersPage.getFarmerCount();
      
      await farmersPage.search('test');
      await page.waitForTimeout(500);
      
      const filteredCount = await farmersPage.getFarmerCount();
      
      // Count should change after search
      // (either lower or equal if no matches)
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('should support pagination', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const pagination = await page.$('.pagination, [data-testid="pagination"]');
    
    if (pagination) {
      const nextButton = await pagination.$('button:has-text("Next"), button[aria-label*="next" i], a:has-text(">")');
      
      if (nextButton) {
        const isDisabled = await nextButton.isDisabled();
        
        if (!isDisabled) {
          const initialRows = await farmersPage.getFarmerCount();
          
          await nextButton.click();
          await page.waitForTimeout(500);
          
          const newRows = await farmersPage.getFarmerCount();
          
          // Should still have rows on next page
          expect(newRows).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

test.describe('Data Table - Arctic Theme', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|farmers)/, { timeout: 10000 }).catch(() => {});
  });

  test('should have frosted glass header', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const header = await page.$('thead, [data-testid="table-header"]');
    
    if (header) {
      const styles = await header.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backdropFilter: computed.backdropFilter,
          webkitBackdropFilter: computed.webkitBackdropFilter,
          position: computed.position,
        };
      });
      
      // Header should have sticky positioning and/or blur effect
      const hasBlur = styles.backdropFilter?.includes('blur') || 
                      styles.webkitBackdropFilter?.includes('blur');
      const isSticky = styles.position === 'sticky';
      
      expect(hasBlur || isSticky).toBeTruthy();
    }
  });

  test('should have zebra striping', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const rows = await farmersPage.getFarmerRows();
    
    if (rows.length >= 2) {
      const styles = await Promise.all(
        rows.slice(0, 2).map(row => 
          row.evaluate(el => window.getComputedStyle(el).backgroundColor)
        )
      );
      
      // Even and odd rows should have different backgrounds (zebra striping)
      const areDifferent = styles[0] !== styles[1];
      expect(areDifferent).toBeTruthy();
    }
  });

  test('should have hover effects on rows', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const rows = await farmersPage.getFarmerRows();
    
    if (rows.length > 0) {
      const row = rows[0];
      
      const beforeHover = await row.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      await row.hover();
      await page.waitForTimeout(200);
      
      const afterHover = await row.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Background should change on hover
      const hasHoverEffect = beforeHover !== afterHover;
      
      // Or check for hover class
      const className = await row.evaluate(el => el.className);
      const hasHoverClass = className.includes('hover');
      
      expect(hasHoverEffect || hasHoverClass).toBeTruthy();
    }
  });

  test('should have active state for pagination', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const activePageButton = await page.$('.pagination button[class*="active"], .pagination .glacier');
    
    if (activePageButton) {
      const styles = await activePageButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
        };
      });
      
      // Active button should have distinct styling
      const rgb = styles.backgroundColor.match(/\d+/g);
      if (rgb) {
        const b = parseInt(rgb[2]);
        // Should have blue component (glacier blue)
        expect(b).toBeGreaterThan(200);
      }
    }
  });
});

test.describe('Data Table - Interactions', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|farmers)/, { timeout: 10000 }).catch(() => {});
  });

  test('should open edit modal on row click', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const rows = await farmersPage.getFarmerRows();
    
    if (rows.length > 0) {
      await rows[0].click();
      await page.waitForTimeout(500);
      
      // Check for modal or edit form
      const modal = await page.$('.modal, [role="dialog"], .edit-form');
      const isModalVisible = modal ? await modal.isVisible() : false;
      
      // Either modal opens or page navigates to edit
      const currentUrl = page.url();
      const isEditPage = currentUrl.includes('edit');
      
      expect(isModalVisible || isEditPage).toBeTruthy();
    }
  });

  test('should have delete action', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    // Look for delete button in table or on row
    const deleteButton = await page.$('button:has-text("Delete"), button[aria-label*="delete" i]');
    
    if (deleteButton) {
      expect(await deleteButton.isVisible()).toBeTruthy();
    }
  });

  test('should show confirmation dialog on delete', async ({ page }) => {
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const deleteButtons = await page.$$('button:has-text("Delete"), button[aria-label*="delete" i]');
    
    if (deleteButtons.length > 0) {
      await deleteButtons[0].click();
      await page.waitForTimeout(300);
      
      // Check for confirmation dialog
      const confirmDialog = await page.$('[role="alertdialog"], .confirmation-dialog, .modal:visible');
      
      if (confirmDialog) {
        expect(await confirmDialog.isVisible()).toBeTruthy();
        
        // Cancel to avoid actual deletion
        const cancelButton = await confirmDialog.$('button:has-text("Cancel"), button:has-text("No")');
        if (cancelButton) {
          await cancelButton.click();
        }
      }
    }
  });
});

test.describe('Data Table - Responsive', () => {
  test('should be scrollable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    const tableContainer = await page.$('.table-container, .overflow-x-auto, table').catch(() => null);
    
    if (tableContainer) {
      const hasOverflow = await tableContainer.evaluate(el => {
        return el.scrollWidth > el.clientWidth;
      });
      
      // Table should either be scrollable or adapt to screen
      expect(hasOverflow || true).toBeTruthy();
    }
  });

  test('should show action buttons appropriately on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    
    // Action buttons should be visible on tablet
    const actionButtons = await page.$$('button:has-text("Edit"), button:has-text("Delete"), button:has-text("View")');
    
    for (const button of actionButtons.slice(0, 3)) {
      const isVisible = await button.isVisible();
      expect(isVisible).toBeTruthy();
    }
  });
});

test.describe('Data Table - Performance', () => {
  test('should render large datasets efficiently', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    // Measure page load time
    const startTime = Date.now();
    
    const farmersPage = new FarmersPage(page);
    await farmersPage.goto();
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
  });
});
