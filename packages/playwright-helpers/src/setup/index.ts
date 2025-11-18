/**
 * Playwright test setup and configuration utilities
 */

import { test as base, Page, BrowserContext } from '@playwright/test';

export interface TestFixtures {
  baseUrl: string;
  apiUrl: string;
}

/**
 * Create Playwright test with custom fixtures
 */
export const createTest = base.extend<TestFixtures>({
  baseUrl: async ({}, use) => {
    const url = process.env.BASE_URL || 'http://localhost:3000';
    await use(url);
  },
  apiUrl: async ({}, use) => {
    const url = process.env.API_URL || 'http://localhost:3000/api';
    await use(url);
  },
});

/**
 * Playwright configuration presets
 */
export const PlaywrightPresets = {
  /**
   * Configuration for local development
   */
  development: {
    use: {
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  },

  /**
   * Configuration for CI/CD
   */
  ci: {
    use: {
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      trace: 'on',
      screenshot: 'on',
      video: 'on',
    },
    retries: 2,
    workers: 4,
  },

  /**
   * Configuration for visual regression tests
   */
  visualRegression: {
    use: {
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      trace: 'off',
      screenshot: 'off',
      video: 'off',
    },
    snapshotDir: 'visual-baselines',
    snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-{arg}{ext}',
  },

  /**
   * Configuration for performance tests
   */
  performance: {
    use: {
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      trace: 'off',
      screenshot: 'off',
      video: 'off',
    },
    timeout: 120000,
  },

  /**
   * Configuration for accessibility tests
   */
  accessibility: {
    use: {
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      trace: 'on-first-retry',
      screenshot: 'on-failure',
      video: 'off',
    },
  },
};

/**
 * Global test setup helper
 */
export async function globalSetup(): Promise<void> {
  // Setup tasks that run once before all tests
  console.log('Running global setup...');
  process.env.PLAYWRIGHT_TEST_RUNNING = 'true';
}

/**
 * Global test teardown helper
 */
export async function globalTeardown(): Promise<void> {
  // Cleanup tasks that run once after all tests
  console.log('Running global teardown...');
  delete process.env.PLAYWRIGHT_TEST_RUNNING;
}

/**
 * Page setup utilities
 */
export async function setupPageForTesting(page: Page): Promise<void> {
  // Setup common page configurations
  await page.setViewportSize({ width: 1280, height: 720 });

  // Disable animations for consistent tests
  await page.addInitScript(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const style = document.createElement('style');
    style.textContent = `
      * {
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
  });

  // Setup console message handler
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('Browser console error:', msg.text());
    }
  });

  // Setup page crash handler
  page.on('close', () => {
    console.log('Page closed');
  });
}

/**
 * Context setup utilities
 */
export async function setupContextForTesting(context: BrowserContext): Promise<void> {
  // Add any global headers
  await context.setExtraHTTPHeaders({
    'X-Test-Environment': 'true',
  });

  // Setup network idle handling
  await context.setDefaultNavigationTimeout(30000);
  await context.setDefaultTimeout(30000);
}

/**
 * Environment setup utilities
 */
export function setupEnvironmentVariables(): void {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';

  // Suppress console output in tests if not verbose
  if (process.env.VERBOSE !== 'true') {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: unknown[]) => {
      if (process.env.PLAYWRIGHT_TEST_RUNNING === 'true') {
        // Suppress during tests
      } else {
        originalLog(...args);
      }
    };

    console.warn = (...args: unknown[]) => {
      if (process.env.PLAYWRIGHT_TEST_RUNNING === 'true') {
        // Suppress during tests
      } else {
        originalWarn(...args);
      }
    };

    console.error = (...args: unknown[]) => {
      if (process.env.PLAYWRIGHT_TEST_RUNNING === 'true') {
        // Suppress during tests
      } else {
        originalError(...args);
      }
    };
  }
}

/**
 * Cleanup utilities
 */
export async function cleanupAfterTest(page?: Page, context?: BrowserContext): Promise<void> {
  if (page) {
    try {
      await page.context().clearCookies();
    } catch {
      // Page might be closed
    }
  }

  if (context) {
    try {
      await context.clearCookies();
    } catch {
      // Context might be closed
    }
  }
}

/**
 * Test configuration generator
 */
export function generatePlaywrightConfig(options: {
  baseURL?: string;
  workers?: number;
  retries?: number;
  timeout?: number;
  headed?: boolean;
  trace?: 'off' | 'on' | 'on-first-retry' | 'retain-on-failure';
  screenshot?: 'off' | 'on' | 'only-on-failure';
  video?: 'off' | 'on' | 'retain-on-failure';
  projects?: Array<{ name: string; use: Record<string, unknown> }>;
}) {
  return {
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: options.retries || (process.env.CI ? 2 : 0),
    workers: options.workers || (process.env.CI ? 1 : undefined),
    timeout: options.timeout || 30000,
    reporter: 'html',
    use: {
      baseURL: options.baseURL || 'http://localhost:3000',
      trace: options.trace || 'on-first-retry',
      screenshot: options.screenshot || 'only-on-failure',
      video: options.video || 'retain-on-failure',
      headless: options.headed !== true,
    },
    projects: options.projects || [
      {
        name: 'chromium',
        use: { ...process.env.CI ? {} : { launchArgs: ['--no-sandbox'] } },
      },
      {
        name: 'firefox',
        use: {},
      },
      {
        name: 'webkit',
        use: {},
      },
    ],
    webServer: {
      command: 'npm run dev',
      url: options.baseURL || 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  };
}
