/**
 * Base Page Object for Playwright tests
 * All page objects should extend this class
 */
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a URL path
   * @param {string} path - URL path
   */
  async navigate(path) {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  }

  /**
   * Get page title
   * @returns {Promise<string>} Page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Check if element is visible
   * @param {string} selector - Element selector
   * @returns {Promise<boolean>} Is visible
   */
  async isVisible(selector) {
    try {
      const element = await this.page.$(selector);
      return element ? await element.isVisible() : false;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to be visible
   * @param {string} selector - Element selector
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForVisible(selector, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Click element
   * @param {string} selector - Element selector
   */
  async click(selector) {
    await this.page.click(selector);
  }

  /**
   * Fill input field
   * @param {string} selector - Element selector
   * @param {string} value - Value to fill
   */
  async fill(selector, value) {
    await this.page.fill(selector, value);
  }

  /**
   * Get element text
   * @param {string} selector - Element selector
   * @returns {Promise<string>} Element text
   */
  async getText(selector) {
    return await this.page.textContent(selector);
  }

  /**
   * Take screenshot
   * @param {string} name - Screenshot name
   */
  async screenshot(name) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Wait for toast notification
   * @param {string} message - Expected message (partial match)
   * @returns {Promise<boolean>} Found toast
   */
  async waitForToast(message, timeout = 5000) {
    try {
      await this.page.waitForSelector(`[role="alert"]:has-text("${message}")`, { timeout });
      return true;
    } catch {
      return false;
    }
  }
}

export default BasePage;
