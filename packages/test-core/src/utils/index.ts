/**
 * Common utility functions for testing
 */

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 100,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        onRetry?.(attempt, lastError);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retry attempts reached');
}

/**
 * Wait for a condition to be true with timeout
 */
export async function waitUntil(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeoutMs?: number;
    pollIntervalMs?: number;
    message?: string;
  } = {}
): Promise<void> {
  const { timeoutMs = 5000, pollIntervalMs = 100, message = 'Timeout waiting for condition' } =
    options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await condition();
      if (result) {
        return;
      }
    } catch (error) {
      // Continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`${message} (timeout: ${timeoutMs}ms)`);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}

/**
 * Merge two objects deeply
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target } as any;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue as object, sourceValue as object);
      } else {
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * Create a deferred promise
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Sanitize data for logging (removes sensitive info)
 */
export function sanitizeForLogging(
  data: unknown,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'apiKey', 'authorization']
): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLogging(item, sensitiveKeys));
  }

  const sanitized: Record<string, unknown> = {};

  for (const key in data as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = (data as Record<string, unknown>)[key];
      const isSensitive = sensitiveKeys.some((sensitiveKey) =>
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeForLogging(value, sensitiveKeys);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}
