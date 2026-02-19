import { test, expect } from '@playwright/test';
import { LoginPage } from '../tests/ui/pageObjects';

test('Login with test credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  // Fill in the form with test credentials
  await page.fill('input[name="email"]', 'admin@malar.com');
  await page.fill('input[name="password"]', 'admin123');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForURL(/\/(dashboard|daily-entry)/, { timeout: 10000 });
  
  const currentUrl = page.url();
  const isLoggedIn = !currentUrl.includes('/login');
  
  expect(isLoggedIn).toBeTruthy();
  console.log('Login successful!');
});