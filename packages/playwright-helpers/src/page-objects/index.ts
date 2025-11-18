/**
 * Page Object Model framework for Playwright
 */

import { Page, Locator, BrowserContext } from '@playwright/test';

export interface PageObjectOptions {
  baseUrl?: string;
  waitTimeout?: number;
}

/**
 * Base page object class
 */
export abstract class BasePage {
  protected page: Page;
  protected baseUrl: string;
  protected waitTimeout: number;

  constructor(page: Page, options: PageObjectOptions = {}) {
    this.page = page;
    this.baseUrl = options.baseUrl || '';
    this.waitTimeout = options.waitTimeout || 30000;
  }

  /**
   * Navigate to page
   */
  async goto(path: string = '/', options?: { waitUntil?: 'load' | 'domcontentloaded' }): Promise<void> {
    const url = this.baseUrl + path;
    await this.page.goto(url, { waitUntil: 'domcontentloaded', ...options });
  }

  /**
   * Get page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Click an element
   */
  async click(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.click({ timeout: this.waitTimeout });
  }

  /**
   * Type text into an element
   */
  async type(selector: string | Locator, text: string): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.fill(text);
  }

  /**
   * Get text content
   */
  async getText(selector: string | Locator): Promise<string | null> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.textContent();
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string | Locator): Promise<boolean> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Wait for element
   */
  async waitForElement(selector: string | Locator): Promise<Locator> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ timeout: this.waitTimeout });
    return locator;
  }

  /**
   * Get element count
   */
  async getElementCount(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  /**
   * Fill form field
   */
  async fillField(selector: string, value: string): Promise<void> {
    const field = this.page.locator(selector);
    await field.fill(value);
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string): Promise<void> {
    const select = this.page.locator(selector);
    await select.selectOption(value);
  }

  /**
   * Check checkbox
   */
  async checkCheckbox(selector: string): Promise<void> {
    const checkbox = this.page.locator(selector);
    await checkbox.check();
  }

  /**
   * Uncheck checkbox
   */
  async uncheckCheckbox(selector: string): Promise<void> {
    const checkbox = this.page.locator(selector);
    await checkbox.uncheck();
  }

  /**
   * Wait for URL to match
   */
  async waitForUrl(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout: this.waitTimeout });
  }

  /**
   * Get attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    const element = this.page.locator(selector);
    return await element.getAttribute(attribute);
  }

  /**
   * Execute JavaScript
   */
  async execute<T>(script: string, arg?: unknown): Promise<T> {
    return await this.page.evaluate(script, arg);
  }

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    await this.page.reload();
  }

  /**
   * Go back
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  /**
   * Go forward
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
  }
}

/**
 * Specific page object for common application structure
 */
export class ApplicationPage extends BasePage {
  /**
   * Wait for navigation
   */
  async waitForNavigation<T>(action: () => Promise<T>): Promise<T> {
    const navigationPromise = this.page.waitForNavigation();
    const result = await action();
    await navigationPromise;
    return result;
  }

  /**
   * Accept dialog
   */
  async acceptDialog(): Promise<void> {
    this.page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
  }

  /**
   * Dismiss dialog
   */
  async dismissDialog(): Promise<void> {
    this.page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });
  }

  /**
   * Get dialog message
   */
  async getDialogMessage(): Promise<string | null> {
    return new Promise((resolve) => {
      this.page.on('dialog', (dialog) => {
        resolve(dialog.message);
      });
    });
  }

  /**
   * Focus element
   */
  async focus(selector: string): Promise<void> {
    await this.page.locator(selector).focus();
  }

  /**
   * Hover element
   */
  async hover(selector: string): Promise<void> {
    await this.page.locator(selector).hover();
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Get bounding box of element
   */
  async getBoundingBox(selector: string): Promise<{ x: number; y: number; width: number; height: number } | null> {
    return await this.page.locator(selector).boundingBox();
  }
}

/**
 * Create page object instance
 */
export function createPageObject<T extends BasePage>(
  PageObjectClass: new (page: Page, options?: PageObjectOptions) => T,
  page: Page,
  options?: PageObjectOptions
): T {
  return new PageObjectClass(page, options);
}

/**
 * Page object registry
 */
export class PageObjectRegistry {
  private pages: Map<string, BasePage> = new Map();

  register<T extends BasePage>(name: string, page: T): void {
    this.pages.set(name, page);
  }

  get<T extends BasePage>(name: string): T {
    const page = this.pages.get(name);
    if (!page) {
      throw new Error(`Page object '${name}' not found in registry`);
    }
    return page as T;
  }

  getAll(): Map<string, BasePage> {
    return new Map(this.pages);
  }

  clear(): void {
    this.pages.clear();
  }
}

/**
 * Create page object registry
 */
export function createPageObjectRegistry(): PageObjectRegistry {
  return new PageObjectRegistry();
}
