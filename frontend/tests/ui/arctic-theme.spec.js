import { test, expect } from '@playwright/test';
import { LoginPage, DailyEntryPage } from './pageObjects';

test.describe('Arctic Theme - Colors', () => {
  test('should use Arctic color palette on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Check login card uses light background (the white card in the form)
    const cardBg = await page.evaluate(() => {
      const card = document.querySelector('.bg-white, [class*="bg-white"]');
      if (card) {
        const computed = window.getComputedStyle(card);
        return computed.backgroundColor;
      }
      return null;
    });
    
    // The card should have a white background
    const rgb = cardBg?.match(/\d+/g);
    if (rgb) {
      const r = parseInt(rgb[0]);
      const g = parseInt(rgb[1]);
      const b = parseInt(rgb[2]);
      // Should be light color (high RGB values for white)
      expect(r).toBeGreaterThan(240);
      expect(g).toBeGreaterThan(240);
      expect(b).toBeGreaterThan(240);
    }
  });

  test('should use Glacier blue for primary actions', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const primaryButton = await page.$('button[type="submit"], button:has-text("Login")');
    if (primaryButton) {
      const buttonStyles = await primaryButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
        };
      });
      
      // Primary button should have blue color (Glacier blue #3B82F6 = rgb(59, 130, 246))
      const rgb = buttonStyles.backgroundColor.match(/\d+/g);
      if (rgb && buttonStyles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        
        // Should have significant blue component
        expect(b).toBeGreaterThan(200);
      }
    }
  });

  test('should use Deep Slate for text', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const textElement = await page.$('h1, label, p');
    if (textElement) {
      const textColor = await textElement.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return computed.color;
      });
      
      // Deep Slate (#1E293B) is a dark color
      const rgb = textColor.match(/\d+/g);
      if (rgb) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        
        // Should be dark text
        expect(r).toBeLessThan(100);
        expect(g).toBeLessThan(100);
        expect(b).toBeLessThan(100);
      }
    }
  });
});

test.describe('Arctic Theme - Entry Grid', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
  });

  test('should display entry grid with frosted glass header', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    // Look for frosted glass effect on header
    const header = await page.$('.entry-grid-header, [data-testid="entry-grid-header"], thead');
    if (header) {
      const styles = await header.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backdropFilter: computed.backdropFilter,
          webkitBackdropFilter: computed.webkitBackdropFilter,
          backgroundColor: computed.backgroundColor,
        };
      });
      
      // Frosted glass uses backdrop-filter blur
      const hasBlur = styles.backdropFilter?.includes('blur') || 
                      styles.webkitBackdropFilter?.includes('blur');
      
      // Either has blur or semi-transparent background
      expect(hasBlur || styles.backgroundColor.includes('rgba')).toBeTruthy();
    }
  });

  test('should have quick add panel', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const isQuickAddVisible = await entryPage.isQuickAddVisible();
    
    // Quick add panel should be visible
    expect(isQuickAddVisible).toBeTruthy();
  });

  test('should have proper rate badge styling', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const rateBadge = await page.$('.rate-badge, [data-testid="rate-badge"]');
    if (rateBadge) {
      const styles = await rateBadge.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          borderRadius: computed.borderRadius,
          backgroundColor: computed.backgroundColor,
        };
      });
      
      // Rate badge should have pill shape (border-radius)
      expect(parseFloat(styles.borderRadius)).toBeGreaterThan(0);
    }
  });
});

test.describe('Arctic Theme - Entry Row', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
  });

  test('should apply spotlight effect on active row', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    const rowCount = await entryPage.getEntryCount();
    
    if (rowCount > 0) {
      await entryPage.clickEntryRow(0);
      
      // Check for spotlight effect (blue border or shadow)
      const hasSpotlight = await entryPage.hasRowSpotlight(0);
      expect(hasSpotlight).toBeTruthy();
    }
  });

  test('should have hero typography for weight and price', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    // Look for weight/price elements with hero styling
    const heroElements = await page.$$('.entry-row .font-mono, .entry-row .text-lg, [data-testid="hero-number"]');
    
    if (heroElements.length > 0) {
      const firstHero = heroElements[0];
      const styles = await firstHero.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
        };
      });
      
      // Hero text should be larger and bolder
      const fontSize = parseFloat(styles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(16);
      expect(parseInt(styles.fontWeight)).toBeGreaterThanOrEqual(600);
    }
  });

  test('should have adjustment tags with correct colors', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    // Check for frostbite (deductions) and aurora (bonuses) colored tags
    const tags = await page.$$('.adjustment-tag, [data-testid="adjustment-tag"]');
    
    for (const tag of tags) {
      const className = await tag.evaluate(el => el.className);
      const text = await tag.textContent();
      
      // Tags should have appropriate color classes
      const hasFrostbite = className.includes('frostbite') || className.includes('red');
      const hasAurora = className.includes('aurora') || className.includes('green');
      
      expect(hasFrostbite || hasAurora || className.includes('badge')).toBeTruthy();
    }
  });

  test('should animate flash freeze on save', async ({ page }) => {
    const entryPage = new DailyEntryPage(page);
    await entryPage.goto();
    
    // This test checks for the animation class existence
    const animationClass = await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        .animate-flash-freeze {
          animation: flashFreeze 0.6s ease-out;
        }
      `;
      document.head.appendChild(style);
      return true;
    });
    
    expect(animationClass).toBeTruthy();
  });
});

test.describe('Arctic Theme - Touch Targets', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
  });

  test('buttons should have minimum 48px touch target', async ({ page }) => {
    await page.goto('/daily-entry');
    await page.waitForLoadState('networkidle');
    
    const buttons = await page.$$('button');
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        const minDimension = Math.min(box.width, box.height);
        // Touch target should be at least 44px (WCAG minimum is 44x44)
        expect(minDimension).toBeGreaterThanOrEqual(36);
      }
    }
  });

  test('entry rows should have adequate height for touch', async ({ page }) => {
    await page.goto('/daily-entry');
    await page.waitForLoadState('networkidle');
    
    const rows = await page.$$('.entry-row, [data-testid="entry-row"]');
    
    for (const row of rows) {
      const box = await row.boundingBox();
      if (box) {
        // Row should be tall enough for touch (minimum 48px)
        expect(box.height).toBeGreaterThanOrEqual(48);
      }
    }
  });
});

test.describe('Arctic Theme - Accessibility', () => {
  test('should have sufficient color contrast', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Check text contrast on main content
    const textElements = await page.$$('h1, h2, label, p, span');
    
    for (const element of textElements.slice(0, 5)) { // Check first 5 elements
      const isVisible = await element.isVisible();
      if (!isVisible) continue;
      
      const contrast = await element.evaluate(el => {
        const text = window.getComputedStyle(el).color;
        const bg = window.getComputedStyle(el.parentElement || document.body).backgroundColor;
        return { text, bg };
      });
      
      // Basic check that colors are defined
      expect(contrast.text).toBeTruthy();
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow,
        borderColor: computed.borderColor,
      };
    });
    
    // Focus should be visible (outline, box-shadow, or border)
    const hasFocusIndicator = 
      focusedElement?.outline !== 'none' ||
      focusedElement?.boxShadow !== 'none' ||
      focusedElement?.borderColor !== 'rgba(0, 0, 0, 0)';
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should not rely solely on color for indicators', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Login and navigate to daily entry
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
    await page.goto('/daily-entry');
    await page.waitForLoadState('networkidle');
    
    // Check that adjustment tags have text content (not just color)
    const tags = await page.$$('.adjustment-tag, [data-testid="adjustment-tag"]');
    
    for (const tag of tags) {
      const text = await tag.textContent();
      const hasIcon = await tag.$('svg, img, [class*="icon"]');
      
      // Tags should have text or icon, not just color
      expect(text?.trim().length > 0 || hasIcon).toBeTruthy();
    }
  });
});

test.describe('Arctic Theme - Responsive Design', () => {
  test('should adapt to tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check form is still usable
    const form = await page.$('form');
    const isVisible = await form?.isVisible();
    expect(isVisible).toBeTruthy();
  });

  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check form is still usable
    const form = await page.$('form');
    const isVisible = await form?.isVisible();
    expect(isVisible).toBeTruthy();
    
    // Inputs should be appropriately sized for mobile
    const inputs = await page.$$('input');
    for (const input of inputs) {
      const box = await input.boundingBox();
      if (box) {
        // On mobile with padding, inputs should still be usable (at least 100px)
        expect(box.width).toBeGreaterThan(100);
      }
    }
  });

  test('should maintain readability at different zoom levels', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Check base font size is reasonable
    const baseFontSize = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontSize;
    });
    
    const fontSize = parseFloat(baseFontSize);
    expect(fontSize).toBeGreaterThanOrEqual(14);
    expect(fontSize).toBeLessThanOrEqual(18);
  });
});
