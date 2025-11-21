# @kitiumai/test-helpers

Enterprise-ready test helpers library for full-stack JavaScript testing. Provides comprehensive utilities for Jest unit/integration tests and Playwright E2E tests.

## 📦 Packages

### [@kitiumai/test-core](packages/test-core)
Core test utilities and shared functionality used across all test frameworks.

**Features:**
- Logger with structured logging
- Configuration management
- Common utilities (retry, waitUntil, deepClone, deepMerge, etc.)
- Data generation and factories
- Deferred promises and async helpers

### [@kitiumai/jest-helpers](packages/jest-helpers)
Jest unit and integration test helpers.

**Features:**
- Mock factories and creation utilities
- Fixture management
- Custom Jest matchers
- Database testing utilities
- HTTP/API mocking helpers
- Timer management and utilities
- Test environment setup

### [@kitiumai/playwright-helpers](packages/playwright-helpers)
Playwright E2E test helpers.

**Features:**
- Page Object Model framework
- Custom assertions and matchers
- Network mocking and request interception
- Authentication helpers
- Accessibility testing utilities
- Visual regression and screenshot tools
- Performance monitoring
- Test setup and configuration

## 🚀 Quick Start

### Installation

```bash
npm install @kitiumai/test-core @kitiumai/jest-helpers @kitiumai/playwright-helpers
```

### Jest Unit Test Example

```typescript
import { createFactory, Factories, DataGenerators } from '@kitiumai/test-core';
import { setupCustomMatchers, createMockObject, createFixture } from '@kitiumai/jest-helpers';

describe('User Service', () => {
  // Setup custom matchers
  beforeAll(() => setupCustomMatchers());

  // Create user fixture
  const userFixture = createFixture(
    () => Factories.user(),
    (user) => console.log('Cleaning up user:', user.id)
  );

  it('should validate email format', () => {
    expect(DataGenerators.email()).toBeValidEmail();
  });

  it('should create user with factory', async () => {
    const user = Factories.user({ username: 'test_user' });
    expect(user.username).toBe('test_user');
    expect(user.id).toBeDefined();
  });

  it('should mock API response', () => {
    const mockApi = createMockObject(
      { getUser: (id: string) => Promise.resolve({ id, name: 'Test' }) },
      { getUser: { resolveWith: { id: '1', name: 'John' } } }
    );

    expect(mockApi.getUser).toBeDefined();
  });
});
```

### Jest Integration Test Example

```typescript
import { createTestDatabase, createDataBuilder, TestPresets, setupTestSuite } from '@kitiumai/jest-helpers';
import { getConfigManager } from '@kitiumai/test-core';

describe('User API Integration Tests', () => {
  const suite = setupTestSuite(TestPresets.integrationTest());
  let db: any;

  beforeAll(async () => {
    const config = getConfigManager();
    db = createTestDatabase({
      url: config.get('dbUrl') || 'postgres://localhost/test_db',
    });
    await db.connect();
  });

  afterEach(() => {
    suite.afterEach();
  });

  afterAll(async () => {
    suite.afterAll();
    await db.disconnect();
  });

  it('should seed and verify database data', async () => {
    const builder = createDataBuilder()
      .add('users', [{ id: 1, name: 'User 1' }])
      .add('posts', [{ id: 1, userId: 1, title: 'Post 1' }]);

    await builder.seedInto(db);
  });
});
```

### Playwright E2E Test Example

```typescript
import { test } from '@playwright/test';
import { ApplicationPage, createAuthHelper, AuthPresets, createAccessibilityChecker, createPerformanceMonitor } from '@kitiumai/playwright-helpers';

// Create custom page object
class LoginPage extends ApplicationPage {
  async login(email: string, password: string) {
    await this.fillField('input[type="email"]', email);
    await this.fillField('input[type="password"]', password);
    await this.click('button[type="submit"]');
    await this.waitForUrl(/dashboard/);
  }
}

test.describe('User Authentication E2E', () => {
  const authConfig = AuthPresets.emailLogin('http://localhost:3000/login');
  const authHelper = createAuthHelper(authConfig);
  const a11y = createAccessibilityChecker();
  const perf = createPerformanceMonitor();

  test('should login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page, { baseUrl: 'http://localhost:3000' });

    // Navigate to login
    await loginPage.goto('/login');

    // Check accessibility
    await a11y.assertNoAccessibilityErrors(page);

    // Login
    await loginPage.login('user@example.com', 'password');

    // Verify navigation
    expect(page.url()).toContain('dashboard');

    // Check performance
    const loadTime = await perf.getPageLoadTime(page);
    expect(loadTime).toBeLessThan(3000);
  });

  test('should display login form correctly', async ({ page }) => {
    const loginPage = new LoginPage(page, { baseUrl: 'http://localhost:3000' });
    await loginPage.goto('/login');

    // Check visual elements
    const usernameField = page.locator('input[type="email"]');
    expect(usernameField).toBeVisible();

    // Get computed styles
    const styles = await getComputedStyles(usernameField);
    expect(styles.display).not.toBe('none');
  });
});
```

## 📚 Documentation

### Core Package
- [Logger](packages/test-core/src/logger/index.ts) - Structured logging
- [Config Management](packages/test-core/src/config/index.ts) - Configuration handling
- [Utilities](packages/test-core/src/utils/index.ts) - Common utility functions
- [Data Generators](packages/test-core/src/data/index.ts) - Test data factories

### Jest Helpers Package
- [Mocks](packages/jest-helpers/src/mocks/index.ts) - Mock creation and management
- [Fixtures](packages/jest-helpers/src/fixtures/index.ts) - Test fixture management
- [Matchers](packages/jest-helpers/src/matchers/index.ts) - Custom Jest matchers
- [Database](packages/jest-helpers/src/database/index.ts) - Database testing
- [HTTP Mocking](packages/jest-helpers/src/http/index.ts) - API mocking
- [Timers](packages/jest-helpers/src/timers/index.ts) - Timer utilities
- [Setup](packages/jest-helpers/src/setup/index.ts) - Test environment setup

### Playwright Helpers Package
- [Page Objects](packages/playwright-helpers/src/page-objects/index.ts) - POM framework
- [Assertions](packages/playwright-helpers/src/assertions/index.ts) - Custom assertions
- [Network Mocking](packages/playwright-helpers/src/network/index.ts) - Network control
- [Auth Helpers](packages/playwright-helpers/src/auth/index.ts) - Authentication
- [Accessibility](packages/playwright-helpers/src/accessibility/index.ts) - A11y testing
- [Visual Testing](packages/playwright-helpers/src/visual/index.ts) - Screenshot/visual regression
- [Performance](packages/playwright-helpers/src/performance/index.ts) - Performance monitoring
- [Setup](packages/playwright-helpers/src/setup/index.ts) - Test configuration

## 🏗️ Architecture

```
@kitiumai/test-helpers (monorepo)
├── packages/
│   ├── test-core/              # Shared core utilities
│   │   ├── src/
│   │   │   ├── logger/         # Logging utilities
│   │   │   ├── config/         # Configuration management
│   │   │   ├── utils/          # Common utilities
│   │   │   └── data/           # Data generation
│   │   └── package.json
│   │
│   ├── jest-helpers/           # Jest test utilities
│   │   ├── src/
│   │   │   ├── mocks/          # Mock utilities
│   │   │   ├── fixtures/       # Fixture management
│   │   │   ├── matchers/       # Custom matchers
│   │   │   ├── database/       # DB testing
│   │   │   ├── http/           # HTTP mocking
│   │   │   ├── timers/         # Timer utilities
│   │   │   └── setup/          # Setup utilities
│   │   └── package.json
│   │
│   └── playwright-helpers/     # Playwright E2E utilities
│       ├── src/
│       │   ├── page-objects/   # Page Object Models
│       │   ├── assertions/     # Custom assertions
│       │   ├── network/        # Network mocking
│       │   ├── auth/           # Auth helpers
│       │   ├── accessibility/  # A11y testing
│       │   ├── visual/         # Visual testing
│       │   ├── performance/    # Performance monitoring
│       │   └── setup/          # Setup utilities
│       └── package.json
│
├── package.json                # Root monorepo config
├── tsconfig.json              # Root TypeScript config
├── .eslintrc.json             # Root ESLint config
└── .prettierrc                # Code formatting rules
```

## 🔧 Scripts

### Development
```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Watch mode
npm run build -- --watch

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage reports
npm run test:coverage

# Type check all packages
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

## 📋 Key Features

### Test Core
- ✅ Structured logging with levels
- ✅ Environment-aware configuration
- ✅ Retry with exponential backoff
- ✅ Deep object cloning and merging
- ✅ Data generators and factories
- ✅ Deferred promise utilities
- ✅ Sensitive data sanitization

### Jest Helpers
- ✅ Comprehensive mock creation
- ✅ Fixture lifecycle management
- ✅ 10+ custom matchers
- ✅ Database seeding and verification
- ✅ HTTP request mocking and inspection
- ✅ Fake timer management
- ✅ Test environment presets

### Playwright Helpers
- ✅ Page Object Model framework
- ✅ Fluent assertion API
- ✅ Network request interception
- ✅ Form-based and OAuth auth helpers
- ✅ Accessibility violation detection
- ✅ Visual regression testing
- ✅ Core Web Vitals monitoring
- ✅ Resource timing analysis

## 🎯 Use Cases

### Unit Testing
- Mock external dependencies
- Test data generation with factories
- Custom assertions for domain objects
- Timer-dependent code testing

### Integration Testing
- Database fixture setup/teardown
- API response mocking
- Multi-system integration validation
- Event-driven flow testing

### E2E Testing
- Page Object Model for maintainability
- User authentication flows
- Accessibility compliance validation
- Visual consistency checks
- Performance baselines

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests to the main repository.

## 📞 Support

For issues, questions, or suggestions:
- GitHub Issues: [Create an issue](https://github.com/org/test-utils/issues)
- Documentation: See individual package READMEs
- Examples: Check the `examples/` directory

---

Built with ❤️ for enterprise-scale testing
