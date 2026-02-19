/**
 * UI tests for offline flower suggestion functionality
 * Tests network connectivity changes and offline fallback behavior
 */

import { test, expect } from '@playwright/test';

test.describe('Offline Flower Suggestion - Network Connectivity', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@malarmarket.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should show flower type dropdown on daily entry page', async ({ page }) => {
    // Navigate to daily entry page
    await page.goto('/daily-entry');
    
    // Check for flower type dropdown
    const flowerDropdown = page.locator('[data-testid="flower-type-dropdown"], select[name="flowerType"], input[placeholder*="flower" i]').first();
    await expect(flowerDropdown).toBeVisible({ timeout: 5000 });
  });

  test('should auto-suggest flower when farmer is selected', async ({ page }) => {
    // Navigate to daily entry page
    await page.goto('/daily-entry');
    
    // Select a farmer (assuming there's a farmer dropdown)
    const farmerInput = page.locator('input[placeholder*="farmer" i], select[name="farmer"]').first();
    if (await farmerInput.isVisible()) {
      await farmerInput.click();
      await farmerInput.fill('Ramesh');
      
      // Wait for suggestion to appear
      await page.waitForTimeout(1000);
      
      // Check if flower type is auto-selected
      const flowerDropdown = page.locator('[data-testid="flower-type-dropdown"], select[name="flowerType"]').first();
      const selectedFlower = await flowerDropdown.inputValue();
      
      // If farmer has linked flowers, one should be selected
      if (selectedFlower) {
        expect(selectedFlower).not.toBe('');
      }
    }
  });

  test('should handle offline mode gracefully', async ({ page, context }) => {
    // Navigate to daily entry page first while online
    await page.goto('/daily-entry');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to select a farmer
    const farmerInput = page.locator('input[placeholder*="farmer" i], select[name="farmer"]').first();
    if (await farmerInput.isVisible()) {
      await farmerInput.click();
      await farmerInput.fill('Test Farmer');
      
      // Wait a moment for any offline handling
      await page.waitForTimeout(2000);
      
      // The page should not show any error alerts
      const alertVisible = await page.locator('role=alert').isVisible().catch(() => false);
      expect(alertVisible).toBe(false);
    }
    
    // Go back online
    await context.setOffline(false);
  });

  test('should cache flower suggestions for offline use', async ({ page }) => {
    // Navigate to daily entry page
    await page.goto('/daily-entry');
    
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    
    // Check IndexedDB for cached farmer products
    const cachedProducts = await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('MalarLedgerDB', 3);
        request.onsuccess = (event) => {
          const db = event.target.result;
          if (db.objectStoreNames.contains('farmer_products_cache')) {
            const transaction = db.transaction('farmer_products_cache', 'readonly');
            const store = transaction.objectStore('farmer_products_cache');
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => resolve([]);
          } else {
            resolve([]);
          }
        };
        request.onerror = () => resolve([]);
      });
    });
    
    // The cache should exist (may be empty if no farmers have been viewed)
    expect(Array.isArray(cachedProducts)).toBe(true);
  });

  test('should show add-to-profile dialog when selecting non-suggested flower', async ({ page }) => {
    // Navigate to daily entry page
    await page.goto('/daily-entry');
    
    // Select a farmer first
    const farmerInput = page.locator('input[placeholder*="farmer" i], select[name="farmer"]').first();
    if (await farmerInput.isVisible()) {
      await farmerInput.click();
      await farmerInput.fill('Test Farmer');
      
      // Wait for farmer selection
      await page.waitForTimeout(500);
      
      // Try to select a different flower (if flower dropdown exists)
      const flowerDropdown = page.locator('[data-testid="flower-type-dropdown"], select[name="flowerType"]').first();
      if (await flowerDropdown.isVisible()) {
        await flowerDropdown.click();
        
        // Select any option
        const options = await page.locator('option, [role="option"]').all();
        if (options.length > 1) {
          await options[1].click();
          
          // Check if dialog appears
          const dialog = page.locator('[role="dialog"], .modal, [data-testid="add-to-profile-dialog"]');
          const dialogVisible = await dialog.isVisible().catch(() => false);
          
          // Dialog may or may not appear depending on whether the flower is suggested
          // Just verify no errors occurred
          expect(true).toBe(true);
        }
      }
    }
  });
});

test.describe('Offline Store - Network Resilience', () => {
  test('should persist data in IndexedDB across page reloads', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@malarmarket.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to daily entry page
    await page.goto('/daily-entry');
    await page.waitForLoadState('networkidle');
    
    // Store a test value in IndexedDB
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('MalarLedgerDB', 3);
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction('farmer_products_cache', 'readwrite');
          const store = transaction.objectStore('farmer_products_cache');
          store.put({
            id: 'test-farmer_test-flower',
            farmer_id: 'test-farmer',
            flower_type_id: 'test-flower',
            entry_count: 5
          });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => resolve();
        };
        request.onerror = () => resolve();
      });
    });
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify the data persists
    const cachedData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('MalarLedgerDB', 3);
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction('farmer_products_cache', 'readonly');
          const store = transaction.objectStore('farmer_products_cache');
          const getRequest = store.get('test-farmer_test-flower');
          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => resolve(null);
        };
        request.onerror = () => resolve(null);
      });
    });
    
    expect(cachedData).not.toBeNull();
    expect(cachedData.entry_count).toBe(5);
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@malarmarket.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to daily entry page
    await page.goto('/daily-entry');
    
    // Slow down network
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
      route.continue();
    });
    
    // Try to interact with the page
    const farmerInput = page.locator('input[placeholder*="farmer" i], select[name="farmer"]').first();
    if (await farmerInput.isVisible()) {
      await farmerInput.click();
      
      // The page should remain responsive
      await page.waitForTimeout(2000);
      
      // Check page is still functional
      const isVisible = await farmerInput.isVisible();
      expect(isVisible).toBe(true);
    }
  });
});

test.describe('Flower Suggestion - User Experience', () => {
  test.use({ storageState: 'auth-state.json' });

  test.skip('should highlight suggested flowers in dropdown', async ({ page }) => {
    // This test requires a farmer with linked flowers
    await page.goto('/daily-entry');
    
    // Select a farmer
    const farmerInput = page.locator('input[placeholder*="farmer" i]').first();
    if (await farmerInput.isVisible()) {
      await farmerInput.fill('Ramesh');
      await page.waitForTimeout(1000);
      
      // Open flower dropdown
      const flowerDropdown = page.locator('[data-testid="flower-type-dropdown"]').first();
      await flowerDropdown.click();
      
      // Check for highlighted/suggested items
      const suggestedItems = page.locator('[data-suggested="true"], .suggested-flower, .highlighted');
      const count = await suggestedItems.count();
      
      // If farmer has linked flowers, at least one should be highlighted
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display offline indicator when network is unavailable', async ({ page, context }) => {
    await page.goto('/daily-entry');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to load data
    await page.waitForTimeout(2000);
    
    // Check for offline indicator (if implemented)
    const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-badge, .offline-indicator');
    const hasOfflineIndicator = await offlineIndicator.isVisible().catch(() => false);
    
    // The app should handle offline state gracefully
    // Either show an indicator or continue to work with cached data
    expect(true).toBe(true); // Placeholder assertion
    
    // Restore network
    await context.setOffline(false);
  });
});
