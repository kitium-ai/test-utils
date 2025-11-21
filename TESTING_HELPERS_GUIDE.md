# Testing Helpers Guide

Comprehensive guide to using the enterprise-ready test utilities library.

## Table of Contents

- [Overview](#overview)
- [Mock Data Generators](#mock-data-generators)
- [API Request/Response Testing](#api-requestresponse-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Examples](#examples)

## Overview

The test-utils library provides modular testing utilities organized into three packages:

- **@kitiumai/test-core**: Shared utilities for all testing frameworks
- **@kitiumai/jest-helpers**: Jest-specific testing utilities
- **@kitiumai/playwright-helpers**: Playwright E2E testing utilities

## Mock Data Generators

### Enhanced Data Generators

The `DataGenerators` object provides methods for generating realistic test data:

```typescript
import { DataGenerators } from '@kitiumai/test-core';

// Basic types
const str = DataGenerators.string(10);
const num = DataGenerators.number(1, 100);
const email = DataGenerators.email();
const uuid = DataGenerators.uuid();
const bool = DataGenerators.boolean();

// People & Places
const firstName = DataGenerators.firstName();
const lastName = DataGenerators.lastName();
const fullName = DataGenerators.fullName();
const company = DataGenerators.companyName();
const address = DataGenerators.address();
const city = DataGenerators.city();
const country = DataGenerators.country();
const zipCode = DataGenerators.zipCode();

// Internet & Technical
const url = DataGenerators.url();
const ipAddress = DataGenerators.ipAddress();
const slug = DataGenerators.slug();
const locale = DataGenerators.locale();
const creditCard = DataGenerators.creditCardNumber(); // Masked for safety

// Dates & Time
const date = DataGenerators.date();
const pastDate = DataGenerators.pastDate(30); // Last 30 days
const futureDate = DataGenerators.futureDate(30); // Next 30 days
const isoTimestamp = DataGenerators.isoTimestamp();

// Advanced
const enumValue = DataGenerators.enum(['pending', 'active', 'inactive']);
const weighted = DataGenerators.weighted([
  { value: 'common', weight: 80 },
  { value: 'rare', weight: 20 }
]);
const color = DataGenerators.hexColor();
const json = DataGenerators.json(2);
```

### Pre-built Factories

Ready-to-use factories for common domain objects:

```typescript
import { Factories } from '@kitiumai/test-core';

// Create single instances
const user = Factories.user();
const userWithCustomName = Factories.user({ name: 'John Doe' });

// Available factories
const post = Factories.post();
const comment = Factories.comment();
const company = Factories.company();
const product = Factories.product();
const order = Factories.order();
const todo = Factories.todo();
const article = Factories.article();
const profile = Factories.profile();
const apiResponse = Factories.apiResponse();
```

### Factory Builder Pattern

For advanced scenarios with relationships:

```typescript
import { createFactoryWithBuilder } from '@kitiumai/test-core';

const userWithPosts = createFactoryWithBuilder(
  (seed) => ({
    id: `user-${seed}`,
    name: `User ${seed}`,
    email: `user${seed}@example.com`
  }),
  {
    posts: (seed) => ({
      id: `post-${seed}`,
      title: `Post ${seed}`,
      authorId: `user-${seed}`
    })
  }
);

const user = userWithPosts({
  name: 'Custom User'
});
```

## API Request/Response Testing

### Basic HTTP Mocking

```typescript
import { createHttpMockRegistry, HttpMockBuilder, ApiMocks } from '@kitiumai/jest-helpers';

describe('API Tests', () => {
  let registry = createHttpMockRegistry();

  beforeEach(() => {
    registry = createHttpMockRegistry();
  });

  it('should mock GET request', () => {
    const builder = new HttpMockBuilder(registry);

    builder
      .forGet('/api/users')
      .thenSuccess([{ id: 1, name: 'John' }])
      .register();

    const response = registry.getHandler({ method: 'GET', url: '/api/users' });
    expect(response).toBeDefined();
  });

  it('should handle common API responses', () => {
    registry.mockGet('/api/users', ApiMocks.success([{ id: 1 }]));
    registry.mockPost('/api/users', ApiMocks.success({ id: 2 }, 201));
    registry.mockGet('/api/missing', ApiMocks.notFound('User'));
    registry.mockPost('/api/invalid', ApiMocks.validationError({
      name: 'Name is required'
    }));
  });
});
```

### Advanced HTTP Testing with Interceptors

```typescript
import {
  HttpMockServer,
  createSimpleInterceptor,
  RequestMatcher
} from '@kitiumai/jest-helpers';

const server = new HttpMockServer();

// Add interceptor with custom matching
server.addInterceptor({
  match: (req) => req.method === 'POST' && req.url.includes('/api/users'),
  handle: (req) => {
    const body = req.body as any;
    return {
      status: 201,
      statusText: 'Created',
      data: { id: 1, ...body }
    };
  }
});

// Verify requests
expect(server.wasRequestMade({
  method: 'POST',
  path: '/api/users',
  body: (body) => body?.name === 'John'
})).toBe(true);
```

### Response Validation

```typescript
import {
  createValidatedResponseBuilder,
  SchemaValidator
} from '@kitiumai/jest-helpers';

const builder = createValidatedResponseBuilder();

const response = builder
  .withStatus(200)
  .withData({ id: 1, name: 'John' })
  .withHeader('Content-Type', 'application/json')
  .asJSON()
  .build();

// With schema validation
const validator = new SchemaValidator({
  status: 200,
  requiredHeaders: ['Content-Type'],
  dataSchema: (data) => {
    const obj = data as any;
    return obj.id !== undefined && obj.name !== undefined;
  }
});

const validatedBuilder = createValidatedResponseBuilder()
  .withValidator(validator)
  .withData({ id: 1, name: 'John' })
  .build();
```

### Response Chaining

```typescript
import { createResponseChain } from '@kitiumai/jest-helpers';

const chain = createResponseChain();

chain
  .add(ApiMocks.success([]))                    // First call
  .add(ApiMocks.error('Timeout', 500))          // Second call
  .add(ApiMocks.success([{ id: 1 }]));          // Third+ calls

// Get responses sequentially
const resp1 = chain.next(); // Success with []
const resp2 = chain.next(); // Error
const resp3 = chain.next(); // Success with [{ id: 1 }]
```

## Integration Testing

### Integration Test Environment

```typescript
import {
  createIntegrationTestEnvironment,
  TestResource
} from '@kitiumai/jest-helpers';

describe('Integration Tests', () => {
  const env = createIntegrationTestEnvironment();

  beforeEach(async () => {
    // Register resources
    env.registerResource<any>({
      name: 'database',
      setup: async () => {
        // Setup database connection
        return { connection: 'mock' };
      },
      teardown: async (db) => {
        // Cleanup database
      }
    });

    // Setup all resources
    await env.setupAll();
  });

  afterEach(async () => {
    // Cleanup
    await env.teardownAll();
  });

  it('should access resources', async () => {
    const db = env.getResource('database');
    expect(db).toBeDefined();
  });
});
```

### Test Scenarios

```typescript
import { createTestScenario } from '@kitiumai/jest-helpers';

it('should execute test scenario', async () => {
  const scenario = createTestScenario();

  await scenario
    .beforeEach(async () => {
      // Setup
    })
    .step('should login', async () => {
      // Test step 1
    })
    .step('should navigate to dashboard', async () => {
      // Test step 2
    })
    .step('should verify user data', async () => {
      // Test step 3
    })
    .afterEach(async () => {
      // Teardown
    })
    .execute();
});
```

### Test Data Builder

```typescript
import { createTestDataBuilder } from '@kitiumai/jest-helpers';

const builder = createTestDataBuilder();

builder
  .set('userId', '123')
  .set('userName', 'John')
  .addRelated('posts', { id: '1', title: 'Post 1' })
  .addRelated('posts', { id: '2', title: 'Post 2' });

const data = builder.build();
// { userId: '123', userName: 'John', posts: [...] }
```

### Integration Assertions

```typescript
import { IntegrationAssertions } from '@kitiumai/jest-helpers';

// Assert resource is accessible
const user = IntegrationAssertions.assertResourceAccessible(userData);

// Assert change occurred
IntegrationAssertions.assertChanged(oldUser, newUser, 'User should be updated');

// Assert eventual consistency
await IntegrationAssertions.assertEventuallyConsistent(
  async () => fetchUserFromCache(userId),
  expectedUser,
  { timeout: 3000 }
);

// Assert no side effects
IntegrationAssertions.assertNoSideEffects(
  initialState,
  async () => readOperation(),
  finalState
);
```

### Parallel Test Execution

```typescript
import {
  runTestsInParallel,
  runTestsSequentially
} from '@kitiumai/jest-helpers';

// Run tests in parallel (concurrency: 5)
const results = await runTestsInParallel(
  [
    () => testUser(),
    () => testPost(),
    () => testComment()
  ],
  { concurrency: 5 }
);

// Run tests sequentially
const sequentialResults = await runTestsSequentially([
  () => testSetup(),
  () => testMain(),
  () => testCleanup()
]);
```

## E2E Testing

### Composite Test Helper

```typescript
import { createE2ETestHelper } from '@kitiumai/playwright-helpers';
import { test } from '@playwright/test';

test('user registration flow', async ({ page }) => {
  const helper = createE2ETestHelper(page);

  // Use all helpers through composite object
  await helper.navigation.navigateTo('https://example.com');
  await helper.form.fillFields({
    '#name': 'John Doe',
    '#email': 'john@example.com',
    '#password': 'password123'
  });
  await helper.form.submit('#registerForm');

  const formData = await helper.form.getFormData('#registerForm');
  expect(formData).toEqual({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  });
});
```

### Form Helper

```typescript
import { createFormHelper } from '@kitiumai/playwright-helpers';

const form = createFormHelper(page);

// Fill form fields
await form.fillField('#email', 'john@example.com');
await form.fillFields({
  '#name': 'John',
  '#phone': '555-1234'
});

// Handle form controls
await form.check('#agree');
await form.selectOption('#country', 'USA');

// Submit and reset
await form.submit('#myForm');
await form.reset('#myForm');

// Get form data
const data = await form.getFormData('#myForm');
```

### Table Helper

```typescript
import { createTableHelper } from '@kitiumai/playwright-helpers';

const table = createTableHelper(page);

// Get all table data
const rows = await table.getTableData('#myTable');
// [{ Name: 'John', Email: 'john@...' }, ...]

// Get row count
const count = await table.getRowCount('#myTable');

// Find specific row
const rowIndex = await table.findRow('#myTable', 'john@example.com');

// Get cell value
const email = await table.getCellValue('#myTable', 0, 'Email');
```

### Dialog/Modal Helper

```typescript
import { createDialogHelper } from '@kitiumai/playwright-helpers';

const dialog = createDialogHelper(page);

// Check visibility
const visible = await dialog.isDialogVisible('#deleteModal');

// Get dialog content
const content = await dialog.getDialogContent('#deleteModal');

// Close/confirm dialog
await dialog.closeDialog('#closeBtn');
await dialog.confirmDialog('#confirmBtn');
```

### Navigation Helper

```typescript
import { createNavigationHelper } from '@kitiumai/playwright-helpers';

const nav = createNavigationHelper(page);

// Navigation
await nav.navigateTo('https://example.com');
await nav.clickLink('a[href="/dashboard"]'); // Waits for navigation

// History
await nav.goBack();
await nav.goForward();
await nav.reload();

// URL operations
const url = nav.getCurrentURL();
const newUrl = await nav.waitForURLChange();
```

### Wait Helper

```typescript
import { createWaitHelper } from '@kitiumai/playwright-helpers';

const wait = createWaitHelper(page);

// Wait for stable element (stops moving)
await wait.waitForStableElement('#loading');

// Wait for specific count
await wait.waitForElementCount('.item', 5);

// Wait for text
await wait.waitForText('Welcome back');

// Wait for custom condition
await wait.waitForCondition(() => {
  return document.querySelectorAll('.item').length > 0;
});

// Wait for network
await wait.waitForNetworkIdle();
```

### Storage Helper

```typescript
import { createStorageHelper } from '@kitiumai/playwright-helpers';

const storage = createStorageHelper(page);

// Cookies
await storage.setCookie('auth', 'token123');
const authCookie = await storage.getCookie('auth');
await storage.clearCookies();

// Local Storage
await storage.setLocalStorage('user', JSON.stringify({ id: 1 }));
const user = await storage.getLocalStorage('user');
await storage.clearLocalStorage();

// Session Storage
await storage.setSessionStorage('temp', 'value');
await storage.clearSessionStorage();
```

### Screenshot Helper

```typescript
import { createScreenshotHelper } from '@kitiumai/playwright-helpers';

const screenshot = createScreenshotHelper(page);

// Full page screenshot
await screenshot.takeFullPageScreenshot('./screenshots/home.png');

// Element screenshot
await screenshot.takeElementScreenshot('#header', './screenshots/header.png');

// Visual regression
const matches = await screenshot.compareScreenshots(
  './current.png',
  './baseline.png'
);
```

### Console Helper

```typescript
import { createConsoleHelper } from '@kitiumai/playwright-helpers';

const console = createConsoleHelper(page);

// After test execution
const logs = console.getLogs();
const errors = console.getErrors();
const warnings = console.getWarnings();

// Assert
console.assertNoErrors(); // Throws if errors found

// Clear
console.clear();
```

### Test Data in E2E

```typescript
import { createE2ETestData } from '@kitiumai/playwright-helpers';

const testData = createE2ETestData();

// Store in memory
testData.store('userId', '123');
const userId = testData.retrieve('userId');

// Store in page context
await testData.storeInPage(page, 'sessionId', 'abc123');
const sessionId = await testData.retrieveFromPage(page, 'sessionId');
```

## Examples

### Complete Integration Test Example

```typescript
import {
  createIntegrationTestEnvironment,
  createTestScenario,
  IntegrationAssertions,
  retryTestWithReport,
  TestCleanupManager
} from '@kitiumai/jest-helpers';

describe('User Service Integration', () => {
  const env = createIntegrationTestEnvironment();
  const cleanup = new TestCleanupManager();

  beforeAll(async () => {
    await env.setupAll();
  });

  afterAll(async () => {
    await env.teardownAll();
    await cleanup.cleanup();
  });

  it('should create and retrieve user', async () => {
    const scenario = createTestScenario();

    await scenario
      .step('should create user', async () => {
        const user = await userService.createUser({
          name: 'John Doe',
          email: 'john@example.com'
        });

        testData.store('userId', user.id);
        IntegrationAssertions.assertResourceAccessible(user);
      })
      .step('should retrieve user with retry', async () => {
        const userId = testData.retrieve('userId');

        const user = await retryTestWithReport(
          () => userService.getUser(userId),
          { maxAttempts: 3, delayMs: 100 }
        );

        expect(user.name).toBe('John Doe');
      })
      .step('should verify consistency', async () => {
        await IntegrationAssertions.assertEventuallyConsistent(
          () => userCache.getUser(userId),
          { id: userId, name: 'John Doe', email: 'john@example.com' }
        );
      })
      .execute();

    cleanup.onCleanup(async () => {
      await userService.deleteUser(testData.retrieve('userId'));
    });
  });
});
```

### Complete E2E Test Example

```typescript
import { test, expect } from '@playwright/test';
import { createE2ETestHelper } from '@kitiumai/playwright-helpers';

test.describe('E2E User Workflow', () => {
  test('user can register and login', async ({ page }) => {
    const helper = createE2ETestHelper(page);

    // Navigate to registration
    await helper.navigation.navigateTo('https://example.com/register');
    await helper.wait.waitForElement('#registerForm');

    // Fill registration form
    await helper.form.fillFields({
      '#firstName': 'John',
      '#lastName': 'Doe',
      '#email': 'john@example.com',
      '#password': 'SecurePass123!',
      '#confirmPassword': 'SecurePass123!'
    });

    // Check terms
    await helper.form.check('#agree');

    // Submit form and wait for navigation
    await helper.form.submit('#registerForm');
    const newUrl = await helper.navigation.waitForURLChange();
    expect(newUrl).toContain('/dashboard');

    // Verify success message
    await helper.wait.waitForText('Welcome, John');

    // Store user data for cleanup
    await helper.data.storeInPage(page, 'userId', 'new-user-123');

    // Verify no console errors
    helper.console.assertNoErrors();
  });
});
```

## Best Practices

1. **Use Factory Pattern**: Leverage pre-built factories for consistent test data
2. **Organize Resources**: Use IntegrationTestEnvironment for resource lifecycle
3. **Handle Cleanup**: Always use cleanup managers for proper teardown
4. **Verify Requests**: Use HTTP mock verification for API contracts
5. **Chain Operations**: Use builder patterns for complex scenarios
6. **Wait Appropriately**: Use wait helpers to avoid flaky tests
7. **Storage Management**: Always clear storage between tests
8. **Console Monitoring**: Catch errors early with console helper

## API Reference

For complete API documentation, refer to the TypeScript types and JSDoc comments in each module.

## Contributing

To add new helpers or improve existing ones, follow the patterns established in this library and add comprehensive examples.
