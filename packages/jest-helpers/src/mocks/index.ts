/**
 * Jest mock utilities and factories
 */

export type MockFunction<T extends (...args: unknown[]) => unknown> = jest.Mock<
  ReturnType<T>,
  Parameters<T>
>;

export interface MockSetupOptions {
  returnValue?: unknown;
  returnValues?: unknown[];
  implementation?: (...args: unknown[]) => unknown;
  rejectWith?: Error;
  resolveWith?: unknown;
}

/**
 * Create a simple mock function
 */
export function createMock<T extends (...args: unknown[]) => unknown>(
  options?: MockSetupOptions
): MockFunction<T> {
  const mock = jest.fn<ReturnType<T>, Parameters<T>>();

  if (options?.returnValue !== undefined) {
    mock.mockReturnValue(options.returnValue as ReturnType<T>);
  }

  if (options?.returnValues) {
    mock.mockReturnValueOnce = jest.fn();
    options.returnValues.forEach((value) => {
      mock.mockReturnValueOnce(value as ReturnType<T>);
    });
  }

  if (options?.implementation) {
    mock.mockImplementation(options.implementation as any);
  }

  if (options?.resolveWith !== undefined) {
    mock.mockResolvedValue(options.resolveWith);
  }

  if (options?.rejectWith) {
    mock.mockRejectedValue(options.rejectWith);
  }

  return mock;
}

/**
 * Create a mock object with specified methods
 */
export function createMockObject<T extends Record<string, unknown>>(
  template: T,
  mockOverrides?: Partial<Record<keyof T, MockSetupOptions>>
): T {
  const result: Partial<T> = {};

  for (const key in template) {
    if (Object.prototype.hasOwnProperty.call(template, key)) {
      const value = template[key];
      const override = mockOverrides?.[key];

      if (typeof value === 'function') {
        result[key] = createMock(override) as unknown as T[keyof T];
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = createMockObject(
          value as Record<string, unknown>,
          override as Partial<Record<string, MockSetupOptions>>
        ) as T[keyof T];
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}

/**
 * Create a mock module
 */
export function createMockModule<T extends Record<string, unknown>>(
  moduleName: string,
  mockImplementation: T
): T {
  jest.mock(moduleName, () => mockImplementation);
  return mockImplementation;
}

/**
 * Spy on a function and track calls
 */
export function spyOnFunction<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options?: MockSetupOptions
): MockFunction<T> {
  const spy = jest.spyOn({ fn }, 'fn') as unknown as MockFunction<T>;

  if (options?.returnValue !== undefined) {
    spy.mockReturnValue(options.returnValue as ReturnType<T>);
  }

  if (options?.implementation) {
    spy.mockImplementation(options.implementation as any);
  }

  return spy;
}

/**
 * Mock timers with convenience methods
 */
export const mockTimers = {
  enable(): void {
    jest.useFakeTimers();
  },

  disable(): void {
    jest.useRealTimers();
  },

  advanceByTime(ms: number): void {
    jest.advanceTimersByTime(ms);
  },

  advanceToNextTimer(): void {
    jest.runOnlyPendingTimers();
  },

  advanceAllTimers(): void {
    jest.runAllTimers();
  },

  clear(): void {
    jest.clearAllTimers();
  },

  reset(): void {
    jest.resetModules();
  },
};

/**
 * Reset all mocks
 */
export function resetAllMocks(): void {
  jest.clearAllMocks();
}

/**
 * Restore all mocks
 */
export function restoreAllMocks(): void {
  jest.restoreAllMocks();
}

/**
 * Create a mock with lifecycle management
 */
export class ManagedMock<T extends (...args: unknown[]) => unknown> {
  private mock: MockFunction<T>;

  constructor(options?: MockSetupOptions) {
    this.mock = createMock<T>(options);
  }

  get fn(): MockFunction<T> {
    return this.mock;
  }

  getCalls(): Array<{ args: Parameters<T>; result?: ReturnType<T>; error?: Error }> {
    return this.mock.mock.calls.map((args, index) => ({
      args: args as Parameters<T>,
      result: this.mock.mock.results[index]?.value as ReturnType<T>,
      error: this.mock.mock.results[index]?.value as Error,
    }));
  }

  getLastCall(): { args: Parameters<T>; result?: ReturnType<T> } | null {
    const calls = this.getCalls();
    return calls.length > 0 ? calls[calls.length - 1] : null;
  }

  getCallCount(): number {
    return this.mock.mock.calls.length;
  }

  wasCalledWith(...args: Parameters<T>): boolean {
    return this.mock.mock.calls.some(
      (callArgs) => JSON.stringify(callArgs) === JSON.stringify(args)
    );
  }

  clear(): void {
    this.mock.mockClear();
  }

  reset(): void {
    this.mock.mockReset();
  }

  restore(): void {
    this.mock.mockRestore();
  }
}
