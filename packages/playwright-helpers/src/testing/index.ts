/**
 * E2E testing utilities and helpers
 * Provides utilities for advanced E2E testing with Playwright
 */

import { Page, expect, BrowserContext } from '@playwright/test';

/**
 * Test data helper for E2E tests
 */
export class E2ETestData {
  private storage: Map<string, unknown> = new Map();

  /**
   * Store test data
   */
  store(key: string, value: unknown): void {
    this.storage.set(key, value);
  }

  /**
   * Retrieve test data
   */
  retrieve<T>(key: string): T | undefined {
    return this.storage.get(key) as T | undefined;
  }

  /**
   * Store in page context
   */
  async storeInPage(page: Page, key: string, value: unknown): Promise<void> {
    await page.evaluate(
      ({ k, v }) => {
        (window as any).__testData = (window as any).__testData || {};
        (window as any).__testData[k] = v;
      },
      { k: key, v: value }
    );
  }

  /**
   * Retrieve from page context
   */
  async retrieveFromPage<T>(page: Page, key: string): Promise<T | undefined> {
    return await page.evaluate(({ k }) => {
      return (window as any).__testData?.[k];
    }, { k: key });
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    this.storage.clear();
  }
}

/**
 * Form helper for E2E tests
 */
export class FormHelper {
  constructor(private page: Page) {}

  /**
   * Fill form field
   */
  async fillField(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value);
  }

  /**
   * Fill multiple fields
   */
  async fillFields(fields: Record<string, string>): Promise<void> {
    for (const [selector, value] of Object.entries(fields)) {
      await this.fillField(selector, value);
    }
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).selectOption(value);
  }

  /**
   * Check checkbox
   */
  async check(selector: string): Promise<void> {
    await this.page.locator(selector).check();
  }

  /**
   * Uncheck checkbox
   */
  async uncheck(selector: string): Promise<void> {
    await this.page.locator(selector).uncheck();
  }

  /**
   * Get form data
   */
  async getFormData(selector: string): Promise<Record<string, any>> {
    return await this.page.locator(selector).evaluate((form) => {
      const data: Record<string, any> = {};
      const elements = (form as HTMLFormElement).elements;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as any;
        if (el.name) {
          if (el.type === 'checkbox') {
            data[el.name] = el.checked;
          } else if (el.type === 'radio') {
            if (el.checked) data[el.name] = el.value;
          } else {
            data[el.name] = el.value;
          }
        }
      }

      return data;
    });
  }

  /**
   * Submit form
   */
  async submit(selector: string): Promise<void> {
    await this.page.locator(selector).evaluate((form) => {
      (form as HTMLFormElement).submit();
    });
  }

  /**
   * Reset form
   */
  async reset(selector: string): Promise<void> {
    await this.page.locator(selector).evaluate((form) => {
      (form as HTMLFormElement).reset();
    });
  }
}

/**
 * Table helper for E2E tests
 */
export class TableHelper {
  constructor(private page: Page) {}

  /**
   * Get table data
   */
  async getTableData(tableSelector: string): Promise<Record<string, string>[]> {
    return await this.page.locator(tableSelector).evaluate((table) => {
      const rows: Record<string, string>[] = [];
      const headers: string[] = [];

      // Get headers
      const headerCells = table.querySelectorAll('thead th');
      headerCells.forEach((cell) => {
        headers.push(cell.textContent?.trim() || '');
      });

      // Get rows
      const bodyRows = table.querySelectorAll('tbody tr');
      bodyRows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        const rowData: Record<string, string> = {};

        cells.forEach((cell, index) => {
          rowData[headers[index]] = cell.textContent?.trim() || '';
        });

        rows.push(rowData);
      });

      return rows;
    });
  }

  /**
   * Get row count
   */
  async getRowCount(tableSelector: string): Promise<number> {
    return await this.page.locator(`${tableSelector} tbody tr`).count();
  }

  /**
   * Find row by content
   */
  async findRow(tableSelector: string, content: string): Promise<number> {
    const rows = await this.getTableData(tableSelector);
    return rows.findIndex((row) =>
      Object.values(row).some((val) => val.includes(content))
    );
  }

  /**
   * Get cell value
   */
  async getCellValue(tableSelector: string, rowIndex: number, columnName: string): Promise<string> {
    const rows = await this.getTableData(tableSelector);
    return rows[rowIndex]?.[columnName] || '';
  }
}

/**
 * Modal/Dialog helper for E2E tests
 */
export class DialogHelper {
  constructor(private page: Page) {}

  /**
   * Wait for dialog
   */
  async waitForDialog(timeout = 5000): Promise<string> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => resolve(''), timeout);

        (window as any).__dialogText = '';
        (window as any).__dialogShown = () => {
          clearTimeout(timeoutId);
          resolve((window as any).__dialogText);
        };
      });
    });
  }

  /**
   * Is dialog visible
   */
  async isDialogVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      return await element.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Close dialog
   */
  async closeDialog(closeButtonSelector: string): Promise<void> {
    await this.page.locator(closeButtonSelector).click();
  }

  /**
   * Confirm dialog
   */
  async confirmDialog(confirmButtonSelector: string): Promise<void> {
    await this.page.locator(confirmButtonSelector).click();
  }

  /**
   * Get dialog content
   */
  async getDialogContent(dialogSelector: string): Promise<string> {
    return await this.page.locator(dialogSelector).textContent() || '';
  }
}

/**
 * Navigation helper for E2E tests
 */
export class NavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate and wait for load
   */
  async navigateTo(url: string, waitUntil: 'load' | 'domcontentloaded' = 'domcontentloaded'): Promise<void> {
    await this.page.goto(url, { waitUntil });
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

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    await this.page.reload();
  }

  /**
   * Check current URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * Wait for URL change
   */
  async waitForURLChange(timeout = 5000): Promise<string> {
    const previousURL = this.getCurrentURL();
    await this.page.waitForFunction(
      () => window.location.href !== previousURL,
      { timeout }
    );
    return this.getCurrentURL();
  }

  /**
   * Navigate using link
   */
  async clickLink(selector: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      this.page.locator(selector).click(),
    ]);
  }
}

/**
 * Wait helper for E2E tests
 */
export class WaitHelper {
  constructor(private page: Page) {}

  /**
   * Wait for element to be stable (stop moving/changing)
   */
  async waitForStableElement(selector: string, timeout = 5000): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });

    // Wait for position to stabilize
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLElement;
        if (!el) return false;

        const rect = el.getBoundingClientRect();
        (window as any).__lastRect = (window as any).__lastRect || rect;

        const isStable =
          rect.top === (window as any).__lastRect.top &&
          rect.left === (window as any).__lastRect.left;

        (window as any).__lastRect = rect;
        return isStable;
      },
      selector,
      { timeout: 2000 }
    );
  }

  /**
   * Wait for element count
   */
  async waitForElementCount(selector: string, expectedCount: number, timeout = 5000): Promise<void> {
    await this.page.waitForFunction(
      ({ sel, count }) => document.querySelectorAll(sel).length === count,
      { sel: selector, count: expectedCount },
      { timeout }
    );
  }

  /**
   * Wait for text to appear
   */
  async waitForText(text: string, timeout = 5000): Promise<void> {
    await this.page.waitForFunction(
      (txt) => document.body.innerText.includes(txt),
      text,
      { timeout }
    );
  }

  /**
   * Wait for condition
   */
  async waitForCondition(condition: () => boolean, timeout = 5000): Promise<void> {
    await this.page.waitForFunction(condition, { timeout });
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(timeout = 5000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }
}

/**
 * Screenshot helper for E2E tests
 */
export class ScreenshotHelper {
  constructor(private page: Page) {}

  /**
   * Take screenshot of full page
   */
  async takeFullPageScreenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true });
  }

  /**
   * Take screenshot of element
   */
  async takeElementScreenshot(selector: string, path: string): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.screenshot({ path });
  }

  /**
   * Compare screenshots
   */
  async compareScreenshots(current: string, baseline: string): Promise<boolean> {
    // This is a simplified comparison - in real scenarios, use visual regression tools
    try {
      await expect(this.page).toHaveScreenshot(baseline, {
        maxDiffPixels: 0,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Cookie/Storage helper for E2E tests
 */
export class StorageHelper {
  constructor(private page: Page) {}

  /**
   * Set cookie
   */
  async setCookie(name: string, value: string, options?: any): Promise<void> {
    const context = this.page.context();
    const url = this.page.url();
    await context.addCookies([{ name, value, url, ...options }]);
  }

  /**
   * Get cookie
   */
  async getCookie(name: string): Promise<string | undefined> {
    const context = this.page.context();
    const cookies = await context.cookies();
    return cookies.find((c) => c.name === name)?.value;
  }

  /**
   * Clear cookies
   */
  async clearCookies(): Promise<void> {
    const context = this.page.context();
    await context.clearCookies();
  }

  /**
   * Set local storage
   */
  async setLocalStorage(key: string, value: string): Promise<void> {
    await this.page.evaluate(({ k, v }) => {
      localStorage.setItem(k, v);
    }, { k: key, v: value });
  }

  /**
   * Get local storage
   */
  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate(({ k }) => {
      return localStorage.getItem(k);
    }, { k: key });
  }

  /**
   * Clear local storage
   */
  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * Set session storage
   */
  async setSessionStorage(key: string, value: string): Promise<void> {
    await this.page.evaluate(({ k, v }) => {
      sessionStorage.setItem(k, v);
    }, { k: key, v: value });
  }

  /**
   * Clear session storage
   */
  async clearSessionStorage(): Promise<void> {
    await this.page.evaluate(() => {
      sessionStorage.clear();
    });
  }
}

/**
 * Console helper for E2E tests
 */
export class ConsoleHelper {
  private logs: any[] = [];
  private errors: any[] = [];
  private warnings: any[] = [];

  constructor(page: Page) {
    page.on('console', (msg) => {
      const args = msg.args();
      const logEntry = { type: msg.type(), text: msg.text(), args };

      switch (msg.type()) {
        case 'log':
          this.logs.push(logEntry);
          break;
        case 'error':
          this.errors.push(logEntry);
          break;
        case 'warning':
          this.warnings.push(logEntry);
          break;
      }
    });
  }

  /**
   * Get logs
   */
  getLogs(): any[] {
    return [...this.logs];
  }

  /**
   * Get errors
   */
  getErrors(): any[] {
    return [...this.errors];
  }

  /**
   * Get warnings
   */
  getWarnings(): any[] {
    return [...this.warnings];
  }

  /**
   * Assert no errors
   */
  assertNoErrors(): void {
    if (this.errors.length > 0) {
      throw new Error(`Found ${this.errors.length} console errors: ${this.errors.map((e) => e.text).join(', ')}`);
    }
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
    this.errors = [];
    this.warnings = [];
  }
}

/**
 * Create E2E test data helper
 */
export function createE2ETestData(): E2ETestData {
  return new E2ETestData();
}

/**
 * Create form helper
 */
export function createFormHelper(page: Page): FormHelper {
  return new FormHelper(page);
}

/**
 * Create table helper
 */
export function createTableHelper(page: Page): TableHelper {
  return new TableHelper(page);
}

/**
 * Create dialog helper
 */
export function createDialogHelper(page: Page): DialogHelper {
  return new DialogHelper(page);
}

/**
 * Create navigation helper
 */
export function createNavigationHelper(page: Page): NavigationHelper {
  return new NavigationHelper(page);
}

/**
 * Create wait helper
 */
export function createWaitHelper(page: Page): WaitHelper {
  return new WaitHelper(page);
}

/**
 * Create screenshot helper
 */
export function createScreenshotHelper(page: Page): ScreenshotHelper {
  return new ScreenshotHelper(page);
}

/**
 * Create storage helper
 */
export function createStorageHelper(page: Page): StorageHelper {
  return new StorageHelper(page);
}

/**
 * Create console helper
 */
export function createConsoleHelper(page: Page): ConsoleHelper {
  return new ConsoleHelper(page);
}

/**
 * Composite helper - combines all helpers
 */
export class E2ETestHelper {
  readonly data: E2ETestData;
  readonly form: FormHelper;
  readonly table: TableHelper;
  readonly dialog: DialogHelper;
  readonly navigation: NavigationHelper;
  readonly wait: WaitHelper;
  readonly screenshot: ScreenshotHelper;
  readonly storage: StorageHelper;
  readonly console: ConsoleHelper;

  constructor(page: Page) {
    this.data = createE2ETestData();
    this.form = createFormHelper(page);
    this.table = createTableHelper(page);
    this.dialog = createDialogHelper(page);
    this.navigation = createNavigationHelper(page);
    this.wait = createWaitHelper(page);
    this.screenshot = createScreenshotHelper(page);
    this.storage = createStorageHelper(page);
    this.console = createConsoleHelper(page);
  }
}

/**
 * Create composite E2E test helper
 */
export function createE2ETestHelper(page: Page): E2ETestHelper {
  return new E2ETestHelper(page);
}
