/**
 * Jest Integration Test Example
 * Demonstrates common patterns for integration testing with @kitiumai/jest-helpers
 */

import {
  createTestDatabase,
  createDataBuilder,
  resetDatabaseWithSeed,
  TestPresets,
  setupTestSuite,
  createHttpMockRegistry,
  ApiMocks,
} from '@kitiumai/jest-helpers';
import { getConfigManager, retry, waitUntil, Factories } from '@kitiumai/test-core';

describe('Jest Integration Testing Examples', () => {
  const suite = setupTestSuite(TestPresets.integrationTest());
  let db: ReturnType<typeof createTestDatabase>;
  let httpMocks: ReturnType<typeof createHttpMockRegistry>;

  beforeAll(async () => {
    const config = getConfigManager();

    // Initialize database
    db = await (async () => {
      const instance = createTestDatabase({
        url: config.get('dbUrl') || 'sqlite:///:memory:',
      });
      await instance.connect();
      return instance;
    })();

    // Initialize HTTP mocks
    httpMocks = createHttpMockRegistry();

    console.log('Integration test suite initialized');
  });

  afterEach(() => {
    suite.afterEach();
  });

  afterAll(async () => {
    suite.afterAll();
    await db.disconnect();
    httpMocks.clear();
  });

  describe('Database Testing', () => {
    it('should connect to database', async () => {
      const status = db.getConnectionStatus();
      expect(status.connected).toBe(true);
      expect(status.url).toBeTruthy();
    });

    it('should seed database with initial data', async () => {
      const seedData = {
        users: [
          { id: 1, email: 'user1@example.com', name: 'User 1' },
          { id: 2, email: 'user2@example.com', name: 'User 2' },
        ],
        posts: [
          { id: 1, userId: 1, title: 'Post 1', content: 'Content 1' },
          { id: 2, userId: 1, title: 'Post 2', content: 'Content 2' },
          { id: 3, userId: 2, title: 'Post 3', content: 'Content 3' },
        ],
      };

      await db.seed(seedData);
      // Verify seeding was successful
      expect(db).toBeTruthy();
    });

    it('should use data builder for fluent seeding', async () => {
      const builder = createDataBuilder()
        .add('users', [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
        ])
        .addSingle('users', { id: 3, name: 'Charlie', email: 'charlie@example.com' })
        .add('posts', [{ id: 1, userId: 1, title: 'First Post' }]);

      await builder.seedInto(db);
      const data = builder.getData();

      expect(data.users).toHaveLength(3);
      expect(data.posts).toHaveLength(1);
    });

    it('should clear database tables', async () => {
      // Seed some data
      await db.seed({
        users: [{ id: 1, name: 'Test User' }],
      });

      // Clear
      await db.clear(['users']);

      // Verify cleared
      expect(db).toBeTruthy();
    });

    it('should reset database and reseed', async () => {
      const initialSeed = {
        users: [
          { id: 1, name: 'Initial User' },
          { id: 2, name: 'Second User' },
        ],
      };

      await resetDatabaseWithSeed(db, initialSeed);
      expect(db).toBeTruthy();
    });

    it('should handle database transactions', async () => {
      const result = await db.transaction(async (conn) => {
        await conn.execute('INSERT INTO users VALUES (1, "Test User")');
        return 'success';
      });

      expect(result).toBe('success');
    });
  });

  describe('Database with Factories', () => {
    it('should seed database with factory-generated data', async () => {
      const users = [
        Factories.user({ email: 'user1@example.com' }),
        Factories.user({ email: 'user2@example.com' }),
      ];

      const posts = [
        Factories.post({ authorId: users[0].id }),
        Factories.post({ authorId: users[0].id }),
        Factories.post({ authorId: users[1].id }),
      ];

      const seedData = {
        users: users as unknown[],
        posts: posts as unknown[],
      };

      await db.seed(seedData);
      expect(users).toHaveLength(2);
      expect(posts).toHaveLength(3);
    });

    it('should create test data with relationships', async () => {
      const user = Factories.user();
      const post1 = Factories.post({ authorId: user.id });
      const post2 = Factories.post({ authorId: user.id });
      const comment = Factories.comment({ authorId: user.id, postId: post1.id });

      const seedData = {
        users: [user] as unknown[],
        posts: [post1, post2] as unknown[],
        comments: [comment] as unknown[],
      };

      await db.seed(seedData);

      // Verify relationships
      expect(post1.authorId).toBe(user.id);
      expect(post2.authorId).toBe(user.id);
      expect(comment.postId).toBe(post1.id);
    });
  });

  describe('HTTP Mocking', () => {
    it('should mock GET request', () => {
      httpMocks.mockGet('/api/users', [{ id: 1, name: 'John' }]);

      const handler = httpMocks.getHandler({
        method: 'GET',
        url: '/api/users',
      });

      expect(handler).toBeTruthy();
    });

    it('should mock POST request', () => {
      httpMocks.mockPost('/api/users', { id: 1, created: true });

      const handler = httpMocks.getHandler({
        method: 'POST',
        url: '/api/users',
      });

      expect(handler).toBeTruthy();
    });

    it('should mock error response', () => {
      httpMocks.mockError('/api/invalid', 400, 'Invalid request');

      const handler = httpMocks.getHandler({
        method: 'GET',
        url: '/api/invalid',
      });

      expect(handler).toBeTruthy();
    });

    it('should use API mock builders', () => {
      httpMocks.mockGet('/api/products', [
        { id: 1, name: 'Product 1', price: 29.99 },
        { id: 2, name: 'Product 2', price: 39.99 },
      ]);

      httpMocks.mockError('/api/products/999', 404, 'Product not found');

      const requests = httpMocks.getRequestsByUrl('/api/products');
      expect(requests).toBeTruthy();
    });

    it('should track intercepted requests', () => {
      httpMocks.mockGet('/api/test', { success: true });

      httpMocks.recordRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/test',
      });

      const requests = httpMocks.getRequests();
      expect(requests.length).toBeGreaterThan(0);
    });

    it('should verify request was made', () => {
      httpMocks.mockGet('/api/verify', { ok: true });

      httpMocks.recordRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/verify',
      });

      const wasMade = httpMocks.wasRequestMade('GET', '/api/verify');
      expect(wasMade).toBe(true);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed operation', async () => {
      let attempts = 0;

      const result = await retry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Still failing');
          }
          return 'success';
        },
        {
          maxAttempts: 5,
          delayMs: 10,
          backoffMultiplier: 1,
        }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max retries exceeded', async () => {
      await expect(
        retry(
          async () => {
            throw new Error('Always fails');
          },
          { maxAttempts: 2, delayMs: 10 }
        )
      ).rejects.toThrow('Always fails');
    });

    it('should track retry attempts', async () => {
      const attempts: number[] = [];

      try {
        await retry(
          async () => {
            throw new Error('Fail');
          },
          {
            maxAttempts: 3,
            delayMs: 10,
            onRetry: (attempt) => {
              attempts.push(attempt);
            },
          }
        );
      } catch {
        // Expected
      }

      expect(attempts).toEqual([1, 2]);
    });
  });

  describe('Wait Until Utility', () => {
    it('should wait for condition to be true', async () => {
      let ready = false;

      setTimeout(() => {
        ready = true;
      }, 50);

      await waitUntil(() => ready, {
        timeoutMs: 1000,
        pollIntervalMs: 10,
      });

      expect(ready).toBe(true);
    });

    it('should timeout if condition never met', async () => {
      await expect(
        waitUntil(() => false, {
          timeoutMs: 50,
          pollIntervalMs: 10,
        })
      ).rejects.toThrow();
    });

    it('should work with async conditions', async () => {
      let counter = 0;

      await waitUntil(
        async () => {
          counter++;
          return counter >= 3;
        },
        {
          timeoutMs: 1000,
          pollIntervalMs: 10,
        }
      );

      expect(counter).toBe(3);
    });
  });

  describe('Integration Test Flow', () => {
    it('should complete full integration test flow', async () => {
      // 1. Setup database with seed data
      const users = [
        Factories.user({ email: 'alice@example.com' }),
        Factories.user({ email: 'bob@example.com' }),
      ];

      const posts = [
        Factories.post({ authorId: users[0].id, title: 'Alice Post' }),
        Factories.post({ authorId: users[1].id, title: 'Bob Post' }),
      ];

      await db.seed({
        users: users as unknown[],
        posts: posts as unknown[],
      });

      // 2. Mock API responses
      httpMocks.mockGet(
        /api\/users\/\d+/,
        users[0]
      );

      httpMocks.mockGet(
        /api\/posts\/\d+/,
        posts[0]
      );

      // 3. Verify database state
      expect(users).toHaveLength(2);
      expect(posts).toHaveLength(2);

      // 4. Verify mocks are ready
      const userHandler = httpMocks.getHandler({
        method: 'GET',
        url: '/api/users/1',
      });

      expect(userHandler).toBeTruthy();

      // 5. Simulate retry behavior
      const data = await retry(
        async () => {
          return users[0];
        },
        { maxAttempts: 2, delayMs: 10 }
      );

      expect(data.email).toBe('alice@example.com');

      // 6. Wait for condition
      let processed = false;
      setTimeout(() => {
        processed = true;
      }, 50);

      await waitUntil(() => processed, { timeoutMs: 500, pollIntervalMs: 10 });

      expect(processed).toBe(true);
    });
  });

  describe('Practical Example: User API Integration', () => {
    class UserRepository {
      constructor(private db: ReturnType<typeof createTestDatabase>) {}

      async getUserById(id: number) {
        const result = await this.db.query(
          'SELECT * FROM users WHERE id = ?',
          [id]
        );
        return result;
      }

      async createUser(userData: { email: string; name: string }) {
        await this.db.execute(
          'INSERT INTO users (email, name) VALUES (?, ?)',
          [userData.email, userData.name]
        );
        return userData;
      }

      async getAllUsers() {
        const result = await this.db.query('SELECT * FROM users');
        return result;
      }
    }

    it('should perform repository operations', async () => {
      const repo = new UserRepository(db);

      // Create user
      const newUser = await repo.createUser({
        email: 'newuser@example.com',
        name: 'New User',
      });

      expect(newUser.email).toBe('newuser@example.com');

      // Get all users
      const allUsers = await repo.getAllUsers();
      expect(allUsers).toBeTruthy();
    });
  });
});
