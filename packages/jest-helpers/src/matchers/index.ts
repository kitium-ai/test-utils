/**
 * Custom Jest matchers for enterprise testing
 */

/**
 * Extend Jest matchers
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(min: number, max: number): R;
      toBeValidEmail(): R;
      toBeValidUrl(): R;
      toContainObject(object: unknown): R;
      toHaveBeenCalledWithObject(object: unknown): R;
      toMatchObject(expected: unknown): R;
    }
  }
}

export const customMatchers: jest.CustomMatcherMap = {
  /**
   * Check if a number is within a range
   */
  toBeWithinRange(received: unknown, min: number, max: number) {
    const isNumber = typeof received === 'number';
    const isWithinRange = isNumber && received >= min && received <= max;

    return {
      pass: isWithinRange,
      message: () =>
        isWithinRange
          ? `expected ${received} not to be within range ${min} - ${max}`
          : `expected ${received} to be within range ${min} - ${max}`,
    };
  },

  /**
   * Check if a string is a valid email
   */
  toBeValidEmail(received: unknown) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = typeof received === 'string' && emailRegex.test(received);

    return {
      pass: isValidEmail,
      message: () =>
        isValidEmail
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`,
    };
  },

  /**
   * Check if a string is a valid URL
   */
  toBeValidUrl(received: unknown) {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    const isValidUrl = typeof received === 'string' && urlRegex.test(received);

    return {
      pass: isValidUrl,
      message: () =>
        isValidUrl
          ? `expected ${received} not to be a valid URL`
          : `expected ${received} to be a valid URL`,
    };
  },

  /**
   * Check if an array contains an object
   */
  toContainObject(received: unknown, object: unknown) {
    const pass =
      Array.isArray(received) &&
      received.some((item) => {
        if (typeof item === 'object' && typeof object === 'object') {
          return JSON.stringify(item) === JSON.stringify(object);
        }
        return item === object;
      });

    return {
      pass,
      message: () =>
        pass
          ? `expected array not to contain object ${JSON.stringify(object)}`
          : `expected array to contain object ${JSON.stringify(object)}`,
    };
  },

  /**
   * Check if a mock was called with a specific object
   */
  toHaveBeenCalledWithObject(received: unknown, object: unknown) {
    if (typeof received !== 'function' || !('mock' in received)) {
      return {
        pass: false,
        message: () => 'expected a Jest mock function',
      };
    }

    const mock = received as jest.Mock;
    const pass = mock.mock.calls.some((args) => {
      return args.some((arg) => JSON.stringify(arg) === JSON.stringify(object));
    });

    return {
      pass,
      message: () =>
        pass
          ? `expected mock not to be called with object ${JSON.stringify(object)}`
          : `expected mock to be called with object ${JSON.stringify(object)}`,
    };
  },

  /**
   * Check if an object matches expected shape
   */
  toMatchObject(received: unknown, expected: unknown) {
    if (typeof received !== 'object' || received === null) {
      return {
        pass: false,
        message: () => 'expected an object',
      };
    }

    if (typeof expected !== 'object' || expected === null) {
      return {
        pass: false,
        message: () => 'expected argument to be an object',
      };
    }

    const matches = Object.keys(expected as Record<string, unknown>).every((key) => {
      const receivedValue = (received as Record<string, unknown>)[key];
      const expectedValue = (expected as Record<string, unknown>)[key];

      if (typeof expectedValue === 'object' && expectedValue !== null) {
        return (
          receivedValue && JSON.stringify(receivedValue) === JSON.stringify(expectedValue)
        );
      }

      return receivedValue === expectedValue;
    });

    return {
      pass: matches,
      message: () =>
        matches
          ? `expected object not to match ${JSON.stringify(expected)}`
          : `expected object to match ${JSON.stringify(expected)}`,
    };
  },
};

/**
 * Setup custom matchers in test environment
 */
export function setupCustomMatchers(): void {
  expect.extend(customMatchers);
}
