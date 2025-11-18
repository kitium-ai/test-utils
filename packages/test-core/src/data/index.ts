/**
 * Data generation and factory utilities
 */

export type Generator<T> = (seed?: number) => T;
export type PartialFactory<T> = (overrides?: Partial<T>) => T;

/**
 * Create a factory for generating test data
 */
export function createFactory<T>(defaultFactory: (seed: number) => T): PartialFactory<T> {
  let seed = 1;

  return (overrides?: Partial<T>): T => {
    const data = defaultFactory(seed++);
    return { ...data, ...overrides };
  };
}

/**
 * Built-in data generators
 */
export const DataGenerators = {
  /**
   * Generate a random string
   */
  string(
    length = 10,
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  ): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  },

  /**
   * Generate a random number within range
   */
  number(min = 0, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate a random email
   */
  email(): string {
    return `${this.string(8)}@${this.string(6)}.com`;
  },

  /**
   * Generate a random UUID
   */
  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Generate a random boolean
   */
  boolean(): boolean {
    return Math.random() > 0.5;
  },

  /**
   * Generate a random date
   */
  date(
    start = new Date(2020, 0, 1),
    end = new Date()
  ): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },

  /**
   * Generate a random phone number
   */
  phoneNumber(): string {
    return `+1${this.number(2000000000, 9999999999)}`;
  },

  /**
   * Generate a random user name
   */
  username(): string {
    const adjectives = ['quick', 'lazy', 'sleepy', 'noisy', 'hungry', 'angry'];
    const nouns = ['fox', 'dog', 'cat', 'bear', 'lion', 'tiger'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = this.number(1, 999);
    return `${adj}_${noun}_${num}`;
  },

  /**
   * Generate a random URL
   */
  url(): string {
    const protocols = ['http', 'https'];
    const domains = ['example.com', 'test.com', 'demo.com', 'sample.io'];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const path = this.string(8);
    return `${protocol}://${domain}/${path}`;
  },

  /**
   * Generate a random array
   */
  array<T>(generator: () => T, length = 3): T[] {
    return Array.from({ length }, () => generator());
  },

  /**
   * Generate a random object with specified keys
   */
  object<T extends Record<string, unknown>>(generators: {
    [K in keyof T]: () => T[K];
  }): T {
    const result: Record<string, unknown> = {};
    for (const key in generators) {
      if (Object.prototype.hasOwnProperty.call(generators, key)) {
        result[key] = generators[key]();
      }
    }
    return result as T;
  },
};

/**
 * Common factory builders
 */
export const Factories = {
  /**
   * User factory
   */
  user: createFactory<{ id: string; email: string; username: string; createdAt: Date }>((seed) => ({
    id: DataGenerators.uuid(),
    email: `user${seed}@example.com`,
    username: `user_${seed}`,
    createdAt: new Date(),
  })),

  /**
   * Post factory
   */
  post: createFactory<{ id: string; title: string; content: string; authorId: string; createdAt: Date }>((seed) => ({
    id: DataGenerators.uuid(),
    title: `Post ${seed}`,
    content: `Content for post ${seed}`,
    authorId: DataGenerators.uuid(),
    createdAt: new Date(),
  })),

  /**
   * Comment factory
   */
  comment: createFactory<{
    id: string;
    text: string;
    authorId: string;
    postId: string;
    createdAt: Date;
  }>((seed) => ({
    id: DataGenerators.uuid(),
    text: `Comment ${seed}`,
    authorId: DataGenerators.uuid(),
    postId: DataGenerators.uuid(),
    createdAt: new Date(),
  })),

  /**
   * API response factory
   */
  apiResponse: createFactory<{ status: number; data: unknown; timestamp: string }>((seed) => ({
    status: 200,
    data: { id: seed },
    timestamp: new Date().toISOString(),
  })),
};
