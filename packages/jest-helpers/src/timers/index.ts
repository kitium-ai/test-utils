/**
 * Timer and timeout helpers for testing
 */

export interface TimerStats {
  total: number;
  processed: number;
  pending: number;
}

/**
 * Timer management utilities
 */
export class TimerManager {
  private isUsingFakeTimers = false;
  private timerStats: TimerStats = { total: 0, processed: 0, pending: 0 };

  /**
   * Enable fake timers
   */
  enableFakeTimers(): void {
    if (!this.isUsingFakeTimers) {
      jest.useFakeTimers();
      this.isUsingFakeTimers = true;
    }
  }

  /**
   * Disable fake timers
   */
  disableFakeTimers(): void {
    if (this.isUsingFakeTimers) {
      jest.useRealTimers();
      this.isUsingFakeTimers = false;
      this.timerStats = { total: 0, processed: 0, pending: 0 };
    }
  }

  /**
   * Advance timers by a specific amount
   */
  advanceBy(ms: number): void {
    if (!this.isUsingFakeTimers) {
      throw new Error('Fake timers must be enabled');
    }
    jest.advanceTimersByTime(ms);
    this.timerStats.processed += Math.floor(ms / 100); // Rough estimation
  }

  /**
   * Advance to next timer
   */
  advanceToNextTimer(): void {
    if (!this.isUsingFakeTimers) {
      throw new Error('Fake timers must be enabled');
    }
    jest.runOnlyPendingTimers();
    this.timerStats.processed++;
  }

  /**
   * Advance all timers
   */
  advanceAllTimers(): void {
    if (!this.isUsingFakeTimers) {
      throw new Error('Fake timers must be enabled');
    }
    jest.runAllTimers();
    this.timerStats.processed = this.timerStats.total;
  }

  /**
   * Clear all timers
   */
  clearAll(): void {
    if (!this.isUsingFakeTimers) {
      throw new Error('Fake timers must be enabled');
    }
    jest.clearAllTimers();
    this.timerStats.pending = 0;
  }

  /**
   * Get current timer statistics
   */
  getStats(): TimerStats {
    return { ...this.timerStats };
  }

  /**
   * Check if fake timers are enabled
   */
  isEnabled(): boolean {
    return this.isUsingFakeTimers;
  }
}

/**
 * Single instance timer manager
 */
const timerManager = new TimerManager();

export function getTimerManager(): TimerManager {
  return timerManager;
}

/**
 * Create a timer manager instance
 */
export function createTimerManager(): TimerManager {
  return new TimerManager();
}

/**
 * Run test with fake timers
 */
export async function runWithFakeTimers<T>(
  testFn: (timers: TimerManager) => T | Promise<T>
): Promise<T> {
  const manager = createTimerManager();
  manager.enableFakeTimers();

  try {
    return await testFn(manager);
  } finally {
    manager.disableFakeTimers();
  }
}

/**
 * Timeout helper - reject promise after specified time
 */
export function timeout<T>(ms: number, message?: string): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(message || `Operation timed out after ${ms}ms`)),
      ms
    );
  });
}

/**
 * Race a promise against a timeout
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T> {
  return Promise.race([promise, timeout<T>(ms, message)]);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

/**
 * Delay promise resolution
 */
export function delay<T>(ms: number, value?: T): Promise<T | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

/**
 * Delay function execution
 */
export function delayedFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    await delay(delayMs);
    return fn(...args) as ReturnType<T>;
  };
}

/**
 * Wait with condition polling
 */
export async function waitFor(
  condition: () => boolean,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
  } = {}
): Promise<void> {
  const { timeoutMs = 5000, intervalMs = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (condition()) {
      return;
    }
    await delay(intervalMs);
  }

  throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;

  return { result, duration };
}

/**
 * Assert execution time is within bounds
 */
export async function assertExecutionTime<T>(
  fn: () => T | Promise<T>,
  minMs: number,
  maxMs: number
): Promise<T> {
  const { result, duration } = await measureTime(fn);

  if (duration < minMs || duration > maxMs) {
    throw new Error(
      `Execution time ${duration.toFixed(2)}ms not within range ${minMs}-${maxMs}ms`
    );
  }

  return result;
}
