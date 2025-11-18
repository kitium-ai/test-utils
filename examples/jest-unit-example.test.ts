/**
 * Jest Unit Test Example
 * Demonstrates common patterns for unit testing with @org/jest-helpers
 */

import {
  setupCustomMatchers,
  createMock,
  createMockObject,
  createFixture,
  withFixture,
} from '@org/jest-helpers';
import { Factories, DataGenerators, createFactory } from '@org/test-core';

// Setup custom matchers before tests
beforeAll(() => {
  setupCustomMatchers();
});

describe('Jest Unit Testing Examples', () => {
  describe('Custom Matchers', () => {
    it('should validate email format', () => {
      const validEmail = DataGenerators.email();
      expect(validEmail).toBeValidEmail();

      expect('invalid-email').not.toBeValidEmail();
    });

    it('should validate URLs', () => {
      const url = DataGenerators.url();
      expect(url).toBeValidUrl();
    });

    it('should check if number is within range', () => {
      expect(50).toBeWithinRange(0, 100);
      expect(150).not.toBeWithinRange(0, 100);
    });

    it('should check if array contains object', () => {
      const objects = [{ id: 1, name: 'Test' }, { id: 2, name: 'Other' }];

      expect(objects).toContainObject({ id: 1, name: 'Test' });
      expect(objects).not.toContainObject({ id: 3, name: 'Nonexistent' });
    });

    it('should match object shape', () => {
      const user = {
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      expect(user).toMatchObject({
        id: '123',
        name: 'John',
      });
    });
  });

  describe('Mock Creation', () => {
    it('should create a simple mock function', () => {
      const mockFn = createMock<(name: string) => string>({
        returnValue: 'Hello',
      });

      mockFn('World');

      expect(mockFn).toHaveBeenCalledWith('World');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should create mock with multiple return values', () => {
      const mockFn = createMock<() => number>({
        returnValues: [1, 2, 3],
      });

      expect(mockFn()).toBe(1);
      expect(mockFn()).toBe(2);
      expect(mockFn()).toBe(3);
    });

    it('should create mock that resolves promise', async () => {
      const mockApi = createMock<() => Promise<{ id: string }>>(
        {
          resolveWith: { id: '123' },
        }
      );

      const result = await mockApi();
      expect(result.id).toBe('123');
    });

    it('should create mock that rejects promise', async () => {
      const error = new Error('API Error');
      const mockApi = createMock<() => Promise<void>>({
        rejectWith: error,
      });

      await expect(mockApi()).rejects.toThrow('API Error');
    });
  });

  describe('Mock Objects', () => {
    interface UserService {
      getUser(id: string): Promise<{ id: string; name: string }>;
      updateUser(id: string, data: unknown): Promise<void>;
      deleteUser(id: string): Promise<void>;
    }

    it('should create mock object from interface', () => {
      const mockService = createMockObject<UserService>({
        getUser: async () => ({ id: '1', name: 'John' }),
        updateUser: async () => {},
        deleteUser: async () => {},
      });

      expect(mockService.getUser).toBeDefined();
      expect(typeof mockService.getUser).toBe('function');
    });

    it('should mock with override behavior', async () => {
      const mockService = createMockObject<UserService>(
        {
          getUser: async () => ({ id: '1', name: 'John' }),
          updateUser: async () => {},
          deleteUser: async () => {},
        },
        {
          getUser: { resolveWith: { id: '2', name: 'Jane' } },
        }
      );

      const user = await mockService.getUser('2');
      expect(user.name).toBe('Jane');
    });
  });

  describe('Fixtures', () => {
    it('should use fixture with setup and teardown', async () => {
      const userFixture = createFixture(
        () => Factories.user({ username: 'test_user' }),
        (user) => {
          console.log(`Cleaning up user: ${user.id}`);
        }
      );

      await withFixture(userFixture, async (user) => {
        expect(user.username).toBe('test_user');
        expect(user.id).toBeDefined();
      });
    });

    it('should use multiple fixtures together', async () => {
      const userFixture = createFixture(
        () => Factories.user(),
        () => console.log('User cleaned up')
      );

      const postFixture = createFixture(
        () => Factories.post(),
        () => console.log('Post cleaned up')
      );

      await withFixture(userFixture, async (user) => {
        await withFixture(postFixture, async (post) => {
          expect(user.id).toBeDefined();
          expect(post.id).toBeDefined();
        });
      });
    });
  });

  describe('Data Generators and Factories', () => {
    it('should generate random data', () => {
      expect(DataGenerators.uuid()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );

      expect(DataGenerators.email()).toMatch(/@/);
      expect(DataGenerators.phoneNumber()).toMatch(/^\+1/);
      expect(typeof DataGenerators.number()).toBe('number');
      expect(typeof DataGenerators.boolean()).toBe('boolean');
    });

    it('should create user with factory', () => {
      const user = Factories.user();

      expect(user.id).toBeDefined();
      expect(user.email).toMatch(/@/);
      expect(user.username).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should override factory defaults', () => {
      const user = Factories.user({
        email: 'custom@example.com',
        username: 'custom_user',
      });

      expect(user.email).toBe('custom@example.com');
      expect(user.username).toBe('custom_user');
      expect(user.id).toBeDefined(); // Still generated
    });

    it('should create custom factory', () => {
      const productFactory = createFactory<{
        id: string;
        name: string;
        price: number;
      }>((seed) => ({
        id: `product_${seed}`,
        name: `Product ${seed}`,
        price: seed * 10.99,
      }));

      const product1 = productFactory();
      const product2 = productFactory();

      expect(product1.id).toBe('product_1');
      expect(product2.id).toBe('product_2');
      expect(product2.price).toBe(21.98);
    });

    it('should generate arrays of data', () => {
      const numbers = DataGenerators.array(
        () => DataGenerators.number(1, 100),
        5
      );

      expect(numbers).toHaveLength(5);
      expect(numbers.every((n) => n >= 1 && n <= 100)).toBe(true);
    });

    it('should generate objects with typed structure', () => {
      interface Product {
        id: string;
        name: string;
        price: number;
        inStock: boolean;
      }

      const product = DataGenerators.object<Product>({
        id: () => DataGenerators.uuid(),
        name: () => DataGenerators.string(10),
        price: () => DataGenerators.number(10, 1000),
        inStock: () => DataGenerators.boolean(),
      });

      expect(product.id).toBeDefined();
      expect(product.name).toBeDefined();
      expect(typeof product.price).toBe('number');
      expect(typeof product.inStock).toBe('boolean');
    });
  });

  describe('Mock Inspection', () => {
    it('should inspect mock call history', () => {
      const mockFn = createMock<(id: string, name: string) => string>();

      mockFn('1', 'Alice');
      mockFn('2', 'Bob');

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenNthCalledWith(1, '1', 'Alice');
      expect(mockFn).toHaveBeenNthCalledWith(2, '2', 'Bob');
    });

    it('should verify mock was called with object', () => {
      const mockFn = createMock<(user: { id: string; name: string }) => void>();

      const user = { id: '123', name: 'John' };
      mockFn(user);

      expect(mockFn).toHaveBeenCalledWith(user);
    });
  });

  describe('Practical Example: User Service Tests', () => {
    class UserService {
      constructor(private api: { getUser(id: string): Promise<any> }) {}

      async fetchUser(id: string) {
        const user = await this.api.getUser(id);
        return { ...user, email: user.email?.toLowerCase() };
      }
    }

    it('should fetch and normalize user', async () => {
      const mockApi = createMockObject<{ getUser(id: string): Promise<any> }>(
        {
          getUser: async () => ({
            id: '1',
            name: 'John',
            email: 'JOHN@EXAMPLE.COM',
          }),
        }
      );

      const service = new UserService(mockApi);
      const user = await service.fetchUser('1');

      expect(user.email).toBe('john@example.com');
      expect(user.id).toBe('1');
    });
  });
});
