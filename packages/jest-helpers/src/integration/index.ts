/**
 * Integration testing helpers and utilities
 * Provides utilities for setup, teardown, and testing integrated components
 */

import { retry, waitUntil, sleep } from '@kitiumai/test-core';

/**
 * Integration test context - manages test state and resources
 */
export interface IntegrationTestContext {
  [key: string]: unknown;
}

/**
 * Test resource - lifecycle management for test dependencies
 */
export interface TestResource<T> {
  name: string;
  setup(): Promise<T> | T;
  teardown(resource: T): Promise<void> | void;
}

/**
 * Integration test environment manager
 */
export class IntegrationTestEnvironment {
  private resources: Map<string, unknown> = new Map();
  private resourceDefs: Map<string, TestResource<unknown>> = new Map();
  private setupHooks: Array<() => Promise<void>> = [];
  private teardownHooks: Array<() => Promise<void>> = [];

  /**
   * Register a test resource
   */
  registerResource<T>(resource: TestResource<T>): void {
    this.resourceDefs.set(resource.name, resource);
  }

  /**
   * Setup a specific resource
   */
  async setupResource<T>(name: string): Promise<T> {
    const resource = this.resourceDefs.get(name);
    if (!resource) {
      throw new Error(`Resource '${name}' not registered`);
    }

    const instance = await resource.setup();
    this.resources.set(name, instance);
    return instance as T;
  }

  /**
   * Get a resource instance
   */
  getResource<T>(name: string): T {
    const instance = this.resources.get(name);
    if (!instance) {
      throw new Error(`Resource '${name}' not setup`);
    }
    return instance as T;
  }

  /**
   * Setup all registered resources
   */
  async setupAll(): Promise<void> {
    for (const name of this.resourceDefs.keys()) {
      await this.setupResource(name);
    }
  }

  /**
   * Teardown a specific resource
   */
  async teardownResource(name: string): Promise<void> {
    const resource = this.resourceDefs.get(name);
    const instance = this.resources.get(name);

    if (resource && instance) {
      await resource.teardown(instance);
      this.resources.delete(name);
    }
  }

  /**
   * Teardown all resources
   */
  async teardownAll(): Promise<void> {
    const names = Array.from(this.resources.keys()).reverse();
    for (const name of names) {
      await this.teardownResource(name);
    }
  }

  /**
   * Add setup hook
   */
  onSetup(hook: () => Promise<void>): void {
    this.setupHooks.push(hook);
  }

  /**
   * Add teardown hook
   */
  onTeardown(hook: () => Promise<void>): void {
    this.teardownHooks.push(hook);
  }

  /**
   * Execute setup process
   */
  async setup(): Promise<void> {
    for (const hook of this.setupHooks) {
      await hook();
    }
  }

  /**
   * Execute teardown process
   */
  async teardown(): Promise<void> {
    for (const hook of this.teardownHooks) {
      await hook();
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.resources.clear();
    this.resourceDefs.clear();
    this.setupHooks = [];
    this.teardownHooks = [];
  }
}

/**
 * Test scenario builder - defines a sequence of test operations
 */
export class TestScenario {
  private steps: Array<() => Promise<void>> = [];
  private beforeEachFn?: () => Promise<void>;
  private afterEachFn?: () => Promise<void>;

  /**
   * Add setup step
   */
  beforeEach(fn: () => Promise<void>): this {
    this.beforeEachFn = fn;
    return this;
  }

  /**
   * Add teardown step
   */
  afterEach(fn: () => Promise<void>): this {
    this.afterEachFn = fn;
    return this;
  }

  /**
   * Add a test step
   */
  step(name: string, fn: () => Promise<void>): this {
    this.steps.push(async () => {
      console.log(`  → ${name}`);
      await fn();
    });
    return this;
  }

  /**
   * Execute scenario
   */
  async execute(): Promise<void> {
    if (this.beforeEachFn) {
      await this.beforeEachFn();
    }

    for (const step of this.steps) {
      await step();
    }

    if (this.afterEachFn) {
      await this.afterEachFn();
    }
  }
}

/**
 * Test data builder for complex scenarios
 */
export class TestDataBuilder {
  private data: Record<string, unknown> = {};
  private relationships: Map<string, unknown[]> = new Map();

  /**
   * Set a value
   */
  set(key: string, value: unknown): this {
    this.data[key] = value;
    return this;
  }

  /**
   * Add related entity
   */
  addRelated(key: string, entity: unknown): this {
    if (!this.relationships.has(key)) {
      this.relationships.set(key, []);
    }
    this.relationships.get(key)!.push(entity);
    return this;
  }

  /**
   * Get value
   */
  get(key: string): unknown {
    return this.data[key];
  }

  /**
   * Get related entities
   */
  getRelated(key: string): unknown[] {
    return this.relationships.get(key) || [];
  }

  /**
   * Build complete data object
   */
  build(): Record<string, unknown> {
    const result = { ...this.data };
    for (const [key, entities] of this.relationships) {
      result[key] = entities;
    }
    return result;
  }

  /**
   * Reset builder
   */
  reset(): this {
    this.data = {};
    this.relationships.clear();
    return this;
  }
}

/**
 * Integration test assertions
 */
export const IntegrationAssertions = {
  /**
   * Assert resource exists and is accessible
   */
  assertResourceAccessible<T>(value: T, message?: string): T {
    if (value === null || value === undefined) {
      throw new Error(message || 'Resource is not accessible');
    }
    return value;
  },

  /**
   * Assert value changed
   */
  assertChanged<T>(before: T, after: T, message?: string): void {
    if (JSON.stringify(before) === JSON.stringify(after)) {
      throw new Error(message || 'Value did not change');
    }
  },

  /**
   * Assert value did not change
   */
  assertUnchanged<T>(before: T, after: T, message?: string): void {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error(message || 'Value should not have changed');
    }
  },

  /**
   * Assert state consistency
   */
  async assertEventuallyConsistent<T>(
    fn: () => Promise<T>,
    expectedValue: T,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 100 } = options;

    await waitUntil(
      async () => {
        const value = await fn();
        return JSON.stringify(value) === JSON.stringify(expectedValue);
      },
      { timeoutMs: timeout, pollIntervalMs: interval }
    );
  },

  /**
   * Assert no side effects
   */
  assertNoSideEffects<T>(
    before: T,
    operation: () => Promise<void>,
    after: T,
    message?: string
  ): void {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error(message || 'Operation caused unexpected side effects');
    }
  },
};

/**
 * Create integration test environment
 */
export function createIntegrationTestEnvironment(): IntegrationTestEnvironment {
  return new IntegrationTestEnvironment();
}

/**
 * Create test scenario
 */
export function createTestScenario(): TestScenario {
  return new TestScenario();
}

/**
 * Create test data builder
 */
export function createTestDataBuilder(): TestDataBuilder {
  return new TestDataBuilder();
}

/**
 * Parallel test execution helper
 */
export async function runTestsInParallel<T>(
  tests: Array<() => Promise<T>>,
  options: { concurrency?: number } = {}
): Promise<T[]> {
  const { concurrency = 5 } = options;
  const results: T[] = [];
  const executing: Promise<T>[] = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const promise = Promise.resolve().then(test);

    results[i] = await promise;

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex((p) => p === promise), 1);
    }

    executing.push(promise);
  }

  await Promise.all(executing);
  return results;
}

/**
 * Sequential test execution helper
 */
export async function runTestsSequentially<T>(
  tests: Array<() => Promise<T>>
): Promise<T[]> {
  const results: T[] = [];

  for (const test of tests) {
    results.push(await test());
  }

  return results;
}

/**
 * Test retry helper with reporting
 */
export async function retryTestWithReport<T>(
  testFn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 100, onRetry } = options;

  return retry(testFn, {
    maxAttempts,
    delayMs,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}/${maxAttempts}: ${error.message}`);
      onRetry?.(attempt, error);
    },
  });
}

/**
 * Timeout helper for test execution
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  let completed = false;
  let result: T;
  let error: Error | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      if (!completed) {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });

  try {
    result = await Promise.race([fn(), timeoutPromise]);
    completed = true;
    return result;
  } catch (e) {
    completed = true;
    throw e;
  }
}

/**
 * Test cleanup manager
 */
export class TestCleanupManager {
  private cleanupFns: Array<() => Promise<void>> = [];

  /**
   * Register cleanup function
   */
  onCleanup(fn: () => Promise<void>): void {
    this.cleanupFns.push(fn);
  }

  /**
   * Execute all cleanup functions in reverse order
   */
  async cleanup(): Promise<void> {
    for (let i = this.cleanupFns.length - 1; i >= 0; i--) {
      try {
        await this.cleanupFns[i]();
      } catch (error) {
        console.error(`Cleanup function failed: ${error}`);
      }
    }
  }

  /**
   * Clear cleanup functions
   */
  clear(): void {
    this.cleanupFns = [];
  }
}

/**
 * Create cleanup manager
 */
export function createTestCleanupManager(): TestCleanupManager {
  return new TestCleanupManager();
}
