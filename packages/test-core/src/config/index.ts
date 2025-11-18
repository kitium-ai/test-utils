/**
 * Configuration management for tests
 */

export interface TestConfig {
  timeout?: number;
  retries?: number;
  verbose?: boolean;
  ci?: boolean;
  headless?: boolean;
  baseUrl?: string;
  apiUrl?: string;
  dbUrl?: string;
  [key: string]: unknown;
}

class ConfigManager {
  private config: TestConfig = {};
  private defaults: TestConfig = {
    timeout: 30000,
    retries: 0,
    verbose: false,
    ci: false,
    headless: true,
  };

  constructor(initialConfig?: TestConfig) {
    this.config = {
      ...this.defaults,
      ...initialConfig,
    };
    this.loadEnvironmentVariables();
  }

  private loadEnvironmentVariables(): void {
    if (process.env.TEST_TIMEOUT) {
      this.config.timeout = parseInt(process.env.TEST_TIMEOUT, 10);
    }
    if (process.env.TEST_RETRIES) {
      this.config.retries = parseInt(process.env.TEST_RETRIES, 10);
    }
    if (process.env.CI) {
      this.config.ci = true;
      this.config.headless = true;
    }
    if (process.env.TEST_VERBOSE) {
      this.config.verbose = process.env.TEST_VERBOSE === 'true';
    }
    if (process.env.BASE_URL) {
      this.config.baseUrl = process.env.BASE_URL;
    }
    if (process.env.API_URL) {
      this.config.apiUrl = process.env.API_URL;
    }
    if (process.env.DATABASE_URL) {
      this.config.dbUrl = process.env.DATABASE_URL;
    }
  }

  get<T extends keyof TestConfig>(key: T): TestConfig[T] {
    return this.config[key];
  }

  set<T extends keyof TestConfig>(key: T, value: TestConfig[T]): void {
    this.config[key] = value;
  }

  getAll(): TestConfig {
    return { ...this.config };
  }

  merge(partial: Partial<TestConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  reset(): void {
    this.config = { ...this.defaults };
  }
}

let instance: ConfigManager | null = null;

export const createConfigManager = (initialConfig?: TestConfig): ConfigManager =>
  new ConfigManager(initialConfig);

export const getConfigManager = (): ConfigManager => {
  if (!instance) {
    instance = new ConfigManager();
  }
  return instance;
};

export const resetConfig = (): void => {
  instance = null;
};

export default ConfigManager;
