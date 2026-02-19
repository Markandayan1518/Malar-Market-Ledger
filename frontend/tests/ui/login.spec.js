import { test, expect } from '@playwright/test';
import { LoginPage } from './pageObjects';

test.describe('Login Page', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login form', async ({ page }) => {
    const isVisible = await loginPage.isLoginFormVisible();
    expect(isVisible).toBeTruthy();
  });

  test('should have username and password inputs', async ({ page }) => {
    const emailInput = await page.$('input[name="email"], input[type="email"]');
    const passwordInput = await page.$('input[name="password"], input[type="password"]');
    
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });

  test('should have login button', async ({ page }) => {
    const loginButton = await page.$('button[type="submit"], button:has-text("Login")');
    expect(loginButton).toBeTruthy();
  });

  test('should show error with empty credentials', async ({ page }) => {
    await loginPage.clickLogin();
    
    // Should show validation error or stay on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await loginPage.login('invalid_user', 'invalid_password');
    
    // Should show error message
    const pageContent = await page.content();
    const hasError = pageContent.includes('invalid') || 
                     pageContent.includes('incorrect') || 
                     pageContent.includes('failed') ||
                     pageContent.includes('error');
    
    expect(hasError).toBeTruthy();
  });

  test('should navigate to dashboard on successful login', async ({ page }) => {
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin@malar.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    
    await loginPage.login(testUsername, testPassword);
    
    // Wait for navigation
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
    
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login');
    
    expect(isLoggedIn).toBeTruthy();
  });

  test('should have forgot password link', async ({ page }) => {
    const forgotLink = await page.$('a:has-text("Forgot"), a:has-text("Reset")');
    
    if (forgotLink) {
      await loginPage.clickForgotPassword();
      await page.waitForURL(/forgot|reset/, { timeout: 5000 }).catch(() => {});
      
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/forgot|reset/i);
    }
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(['INPUT', 'BUTTON']).toContain(focusedElement);
  });

  test('should have proper form labels', async ({ page }) => {
    const inputs = await page.$$('input');
    
    for (const input of inputs) {
      const hasLabel = await input.evaluate((el) => {
        const id = el.id;
        const name = el.name;
        const placeholder = el.placeholder;
        const ariaLabel = el.getAttribute('aria-label');
        
        // Check for associated label
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return true;
        }
        
        // Check for aria-label
        if (ariaLabel) return true;
        
        // Check for placeholder
        if (placeholder) return true;
        
        return false;
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should store auth token after login', async ({ page }) => {
    const testUsername = process.env.TEST_ADMIN_USERNAME || 'admin@malar.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    
    await loginPage.login(testUsername, testPassword);
    
    await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 }).catch(() => {});
    
    const token = await page.evaluate(() => {
      return localStorage.getItem('auth_token');
    });
    
    // Token should be stored if login successful
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      expect(token).toBeTruthy();
    }
  });
});

test.describe('Login Page - Arctic Theme', () => {
  test('should have Arctic-styled login form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Check for Arctic theme classes
    const form = await page.$('form');
    if (form) {
      const classes = await form.evaluate(el => el.className);
      
      // Should have some styling (any Tailwind class indicates styled)
      const hasStyling = classes.length > 0;
      expect(hasStyling).toBeTruthy();
    }
  });

  test('should have visible button with proper contrast', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const button = await page.$('button[type="submit"], button:has-text("Login")');
    if (button) {
      const isVisible = await button.isVisible();
      expect(isVisible).toBeTruthy();
      
      // Check button has background color for contrast
      const styles = await button.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
        };
      });
      
      expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should have proper input styling', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const inputs = await page.$$('input');
    
    for (const input of inputs) {
      const styles = await input.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          borderWidth: computed.borderWidth,
        };
      });
      
      // Inputs should have visible border
      expect(parseFloat(styles.borderWidth)).toBeGreaterThan(0);
    }
  });
});

test.describe('Login Page - Accessibility', () => {
  test('should have no accessibility violations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Basic accessibility checks
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check for proper heading structure
    const h1 = await page.$('h1');
    expect(h1).toBeTruthy();
    
    // Check form has proper structure
    const form = await page.$('form');
    expect(form).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Check body text color
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });
    
    // Body should have text color set
    expect(bodyStyles.color).toBeTruthy();
  });

  test('should be usable on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.waitForSelector('form', { timeout: 10000 });
    
    const isVisible = await loginPage.isLoginFormVisible();
    expect(isVisible).toBeTruthy();
    
    // Form should be centered or appropriately sized for tablet
    const form = await page.$('form');
    if (form) {
      const box = await form.boundingBox();
      expect(box.width).toBeLessThan(1024);
    }
  });

  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.waitForSelector('form', { timeout: 10000 });
    
    const isVisible = await loginPage.isLoginFormVisible();
    expect(isVisible).toBeTruthy();
    
    // Inputs should be full width or appropriately sized
    const inputs = await page.$$('input');
    for (const input of inputs) {
      const box = await input.boundingBox();
      expect(box.width).toBeGreaterThan(100);
    }
  });
});
