/**
 * Test setup and configuration utilities
 */

import { setupCustomMatchers } from '../matchers';

export interface TestSetupOptions {
  enableCustomMatchers?: boolean;
  enableFakeTimers?: boolean;
  enableMockConsole?: boolean;
  enableMockFetch?: boolean;
  mockFetchHandler?: (url: string, options?: RequestInit) => Response | Promise<Response>;
  timeout?: number;
}

/**
 * Setup test environment
 */
export class TestEnvironment {
  private originalConsole: typeof console | null = null;
  private originalFetch: typeof fetch | null = null;
  private consoleOutput: Array<{ level: string; message: string[] }> = [];

  /**
   * Setup the test environment
   */
  setup(options: TestSetupOptions = {}): void {
    const {
      enableCustomMatchers = true,
      enableFakeTimers = false,
      enableMockConsole = false,
      enableMockFetch = false,
      mockFetchHandler,
      timeout = 30000,
    } = options;

    // Set test timeout
    jest.setTimeout(timeout);

    if (enableCustomMatchers) {
      setupCustomMatchers();
    }

    if (enableFakeTimers) {
      jest.useFakeTimers();
    }

    if (enableMockConsole) {
      this.setupConsoleMock();
    }

    if (enableMockFetch) {
      this.setupFetchMock(mockFetchHandler);
    }

    // Setup error handlers
    this.setupErrorHandlers();
  }

  /**
   * Cleanup after tests
   */
  cleanup(): void {
    this.restoreConsoleMock();
    this.restoreFetchMock();
    jest.clearAllMocks();
  }

  /**
   * Setup console mock
   */
  private setupConsoleMock(): void {
    this.originalConsole = { ...console };

    const captureLog = (level: string) => (...args: unknown[]) => {
      this.consoleOutput.push({
        level,
        message: args.map((arg) => String(arg)),
      });
    };

    console.log = captureLog('log') as any;
    console.warn = captureLog('warn') as any;
    console.error = captureLog('error') as any;
    console.info = captureLog('info') as any;
    console.debug = captureLog('debug') as any;
  }

  /**
   * Restore console
   */
  private restoreConsoleMock(): void {
    if (this.originalConsole) {
      Object.assign(console, this.originalConsole);
    }
  }

  /**
   * Setup fetch mock
   */
  private setupFetchMock(handler?: (url: string, options?: RequestInit) => Response | Promise<Response>): void {
    this.originalFetch = global.fetch;

    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (handler) {
        return Promise.resolve(handler(url, options));
      }

      return Promise.resolve(
        new Response(JSON.stringify({ message: 'Mocked fetch' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }) as any;
  }

  /**
   * Restore fetch
   */
  private restoreFetchMock(): void {
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
    }
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });
  }

  /**
   * Get console output
   */
  getConsoleOutput(level?: string): Array<{ level: string; message: string[] }> {
    if (!level) return this.consoleOutput;
    return this.consoleOutput.filter((log) => log.level === level);
  }

  /**
   * Clear console output
   */
  clearConsoleOutput(): void {
    this.consoleOutput = [];
  }
}

/**
 * Global test environment instance
 */
let globalTestEnv: TestEnvironment | null = null;

/**
 * Get global test environment
 */
export function getGlobalTestEnvironment(): TestEnvironment {
  if (!globalTestEnv) {
    globalTestEnv = new TestEnvironment();
  }
  return globalTestEnv;
}

/**
 * Setup global test environment
 */
export function setupGlobalTestEnvironment(options?: TestSetupOptions): TestEnvironment {
  const env = getGlobalTestEnvironment();
  env.setup(options);
  return env;
}

/**
 * Cleanup global test environment
 */
export function cleanupGlobalTestEnvironment(): void {
  const env = getGlobalTestEnvironment();
  env.cleanup();
}

/**
 * Test suite setup helper
 */
export function setupTestSuite(options?: TestSetupOptions): {
  beforeAll(): void;
  afterEach(): void;
  afterAll(): void;
  getEnv(): TestEnvironment;
} {
  const env = setupGlobalTestEnvironment(options);

  return {
    beforeAll(): void {
      // Setup already done
    },
    afterEach(): void {
      env.clearConsoleOutput();
      jest.clearAllMocks();
    },
    afterAll(): void {
      env.cleanup();
    },
    getEnv(): TestEnvironment {
      return env;
    },
  };
}

/**
 * Common test setup presets
 */
export const TestPresets = {
  /**
   * Unit test preset
   */
  unitTest(): TestSetupOptions {
    return {
      enableCustomMatchers: true,
      enableMockConsole: true,
      timeout: 10000,
    };
  },

  /**
   * Integration test preset
   */
  integrationTest(): TestSetupOptions {
    return {
      enableCustomMatchers: true,
      enableMockConsole: true,
      enableMockFetch: true,
      timeout: 30000,
    };
  },

  /**
   * Database test preset
   */
  databaseTest(): TestSetupOptions {
    return {
      enableCustomMatchers: true,
      enableMockConsole: false,
      timeout: 60000,
    };
  },

  /**
   * API test preset
   */
  apiTest(): TestSetupOptions {
    return {
      enableCustomMatchers: true,
      enableMockFetch: true,
      enableMockConsole: true,
      timeout: 30000,
    };
  },
};

/**
 * Jest config helper
 */
export const createJestConfig = (options: {
  rootDir?: string;
  displayName?: string;
  testEnvironment?: string;
  setupFilesAfterEnv?: string[];
  collectCoverageFrom?: string[];
  moduleNameMapper?: Record<string, string>;
  transform?: Record<string, string>;
}) => ({
  displayName: options.displayName || 'tests',
  testEnvironment: options.testEnvironment || 'node',
  rootDir: options.rootDir || 'src',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  setupFilesAfterEnv: options.setupFilesAfterEnv || [],
  collectCoverageFrom: options.collectCoverageFrom || [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  moduleNameMapper: options.moduleNameMapper,
  transform: options.transform || {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
});
