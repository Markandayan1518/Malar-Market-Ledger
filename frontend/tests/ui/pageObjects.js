import { BasePage } from './BasePage';

/**
 * Login Page Object
 */
export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.selectors = {
      usernameInput: 'input[name="email"], input[name="username"], input[type="email"], input[type="text"], input[placeholder*="email" i], input[placeholder*="username" i], input[placeholder*="Email" i]',
      passwordInput: 'input[name="password"], input[type="password"], input[placeholder*="password" i]',
      loginButton: 'button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Sign in")',
      errorMessage: '.error-message, [role="alert"], .text-red, .text-frostbite, .text-accent-crimson',
      forgotPasswordLink: 'a:has-text("Forgot"), a:has-text("Reset"), a[href*="forgot"]',
      form: 'form',
    };
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.navigate('/login');
    await this.waitForPageLoad();
  }

  /**
   * Fill username field
   * @param {string} username - Username
   */
  async fillUsername(username) {
    await this.fill(this.selectors.usernameInput, username);
  }

  /**
   * Fill password field
   * @param {string} password - Password
   */
  async fillPassword(password) {
    await this.fill(this.selectors.passwordInput, password);
  }

  /**
   * Click login button
   */
  async clickLogin() {
    await this.click(this.selectors.loginButton);
  }

  /**
   * Perform login
   * @param {string} username - Username
   * @param {string} password - Password
   */
  async login(username, password) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * Get error message
   * @returns {Promise<string>} Error message text
   */
  async getErrorMessage() {
    await this.page.waitForSelector(this.selectors.errorMessage, { timeout: 5000 });
    return await this.getText(this.selectors.errorMessage);
  }

  /**
   * Check if login form is visible
   * @returns {Promise<boolean>} Form visible
   */
  async isLoginFormVisible() {
    return await this.isVisible(this.selectors.form);
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.click(this.selectors.forgotPasswordLink);
  }
}

/**
 * Dashboard Page Object
 */
export class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    
    this.selectors = {
      welcomeMessage: '[data-testid="welcome"], h1, .dashboard-title',
      statsCards: '.stats-card, [data-testid="stats-card"]',
      totalEntries: '[data-testid="total-entries"], .total-entries',
      totalAmount: '[data-testid="total-amount"], .total-amount',
      farmerCount: '[data-testid="farmer-count"], .farmer-count',
      navDailyEntry: 'a[href*="daily-entry"], a:has-text("Daily Entry")',
      navFarmers: 'a[href*="farmers"], a:has-text("Farmers")',
      navReports: 'a[href*="reports"], a:has-text("Reports")',
      logoutButton: 'button:has-text("Logout"), button:has-text("Sign Out")',
    };
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.navigate('/dashboard');
    await this.waitForPageLoad();
  }

  /**
   * Check if dashboard is loaded
   * @returns {Promise<boolean>} Dashboard loaded
   */
  async isLoaded() {
    try {
      await this.waitForVisible(this.selectors.statsCards, 5000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get stats card values
   * @returns {Promise<Object>} Stats values
   */
  async getStatsValues() {
    const stats = {};
    
    try {
      const totalEntries = await this.page.$(this.selectors.totalEntries);
      if (totalEntries) {
        stats.totalEntries = await totalEntries.textContent();
      }
      
      const totalAmount = await this.page.$(this.selectors.totalAmount);
      if (totalAmount) {
        stats.totalAmount = await totalAmount.textContent();
      }
      
      const farmerCount = await this.page.$(this.selectors.farmerCount);
      if (farmerCount) {
        stats.farmerCount = await farmerCount.textContent();
      }
    } catch {}
    
    return stats;
  }

  /**
   * Navigate to daily entry page
   */
  async goToDailyEntry() {
    await this.click(this.selectors.navDailyEntry);
  }

  /**
   * Navigate to farmers page
   */
  async goToFarmers() {
    await this.click(this.selectors.navFarmers);
  }

  /**
   * Navigate to reports page
   */
  async goToReports() {
    await this.click(this.selectors.navReports);
  }

  /**
   * Logout
   */
  async logout() {
    await this.click(this.selectors.logoutButton);
  }
}

/**
 * Daily Entry Page Object
 */
export class DailyEntryPage extends BasePage {
  constructor(page) {
    super(page);
    
    this.selectors = {
      quickAddPanel: '.quick-add-entry, [data-testid="quick-add"]',
      farmerSelect: 'input[placeholder*="farmer" i], select[name="farmer"], [data-testid="farmer-select"]',
      flowerTypeSelect: 'select[name="flower_type"], [data-testid="flower-type-select"]',
      weightInput: 'input[name="weight"], input[type="number"], [data-testid="weight-input"]',
      rateInput: 'input[name="rate"], [data-testid="rate-input"]',
      saveButton: 'button:has-text("Save"), button:has-text("Add"), button[type="submit"]',
      entryGrid: '.entry-grid, [data-testid="entry-grid"]',
      entryRow: '.entry-row, [data-testid="entry-row"]',
      totalAmount: '.total-amount, [data-testid="total-amount"]',
      rateBadge: '.rate-badge, [data-testid="rate-badge"]',
      adjustmentTag: '.adjustment-tag, [data-testid="adjustment-tag"]',
      flashFreezeAnimation: '.animate-flash-freeze',
    };
  }

  /**
   * Navigate to daily entry page
   */
  async goto() {
    await this.navigate('/daily-entry');
    await this.waitForPageLoad();
  }

  /**
   * Select farmer
   * @param {string} farmerName - Farmer name
   */
  async selectFarmer(farmerName) {
    const farmerInput = await this.page.$(this.selectors.farmerSelect);
    
    if (farmerInput) {
      const tagName = await farmerInput.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await this.page.selectOption(this.selectors.farmerSelect, { label: farmerName });
      } else {
        await this.fill(this.selectors.farmerSelect, farmerName);
        await this.page.waitForTimeout(300);
        await this.page.keyboard.press('Enter');
      }
    }
  }

  /**
   * Select flower type
   * @param {string} flowerType - Flower type name
   */
  async selectFlowerType(flowerType) {
    await this.page.selectOption(this.selectors.flowerTypeSelect, { label: flowerType });
  }

  /**
   * Enter weight
   * @param {number} weight - Weight in kg
   */
  async enterWeight(weight) {
    await this.fill(this.selectors.weightInput, String(weight));
  }

  /**
   * Enter rate
   * @param {number} rate - Rate per kg
   */
  async enterRate(rate) {
    await this.fill(this.selectors.rateInput, String(rate));
  }

  /**
   * Click save button
   */
  async clickSave() {
    await this.click(this.selectors.saveButton);
  }

  /**
   * Add a new entry
   * @param {Object} entry - Entry data
   */
  async addEntry(entry) {
    if (entry.farmerName) {
      await this.selectFarmer(entry.farmerName);
    }
    if (entry.flowerType) {
      await this.selectFlowerType(entry.flowerType);
    }
    if (entry.weight) {
      await this.enterWeight(entry.weight);
    }
    if (entry.rate) {
      await this.enterRate(entry.rate);
    }
    await this.clickSave();
    
    // Wait for flash freeze animation or entry to appear
    await this.page.waitForTimeout(500);
  }

  /**
   * Get entry rows
   * @returns {Promise<Array>} Entry rows
   */
  async getEntryRows() {
    return await this.page.$$(this.selectors.entryRow);
  }

  /**
   * Get entry count
   * @returns {Promise<number>} Entry count
   */
  async getEntryCount() {
    const rows = await this.getEntryRows();
    return rows.length;
  }

  /**
   * Click entry row (activates spotlight)
   * @param {number} index - Row index
   */
  async clickEntryRow(index) {
    const rows = await this.getEntryRows();
    if (rows[index]) {
      await rows[index].click();
    }
  }

  /**
   * Check if row has spotlight effect
   * @param {number} index - Row index
   * @returns {Promise<boolean>} Has spotlight
   */
  async hasRowSpotlight(index) {
    const rows = await this.getEntryRows();
    if (rows[index]) {
      const className = await rows[index].evaluate(el => el.className);
      return className.includes('arctic-row-active') || className.includes('spotlight');
    }
    return false;
  }

  /**
   * Get total amount
   * @returns {Promise<string>} Total amount text
   */
  async getTotalAmount() {
    return await this.getText(this.selectors.totalAmount);
  }

  /**
   * Check if quick add panel is visible
   * @returns {Promise<boolean>} Quick add visible
   */
  async isQuickAddVisible() {
    return await this.isVisible(this.selectors.quickAddPanel);
  }

  /**
   * Wait for flash freeze animation
   * @returns {Promise<boolean>} Animation occurred
   */
  async waitForFlashFreeze() {
    try {
      await this.page.waitForSelector(this.selectors.flashFreezeAnimation, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Farmers Page Object
 */
export class FarmersPage extends BasePage {
  constructor(page) {
    super(page);
    
    this.selectors = {
      dataTable: '.data-table, [data-testid="farmers-table"]',
      addFarmerButton: 'button:has-text("Add"), button:has-text("New")',
      farmerRow: '.data-table tbody tr',
      searchInput: 'input[placeholder*="search" i], input[type="search"]',
      pagination: '.pagination, [data-testid="pagination"]',
    };
  }

  /**
   * Navigate to farmers page
   */
  async goto() {
    await this.navigate('/farmers');
    await this.waitForPageLoad();
  }

  /**
   * Click add farmer button
   */
  async clickAddFarmer() {
    await this.click(this.selectors.addFarmerButton);
  }

  /**
   * Search farmers
   * @param {string} query - Search query
   */
  async search(query) {
    await this.fill(this.selectors.searchInput, query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  /**
   * Get farmer rows
   * @returns {Promise<Array>} Farmer rows
   */
  async getFarmerRows() {
    return await this.page.$$(this.selectors.farmerRow);
  }

  /**
   * Get farmer count
   * @returns {Promise<number>} Farmer count
   */
  async getFarmerCount() {
    const rows = await this.getFarmerRows();
    return rows.length;
  }
}

export default {
  LoginPage,
  DashboardPage,
  DailyEntryPage,
  FarmersPage,
};
