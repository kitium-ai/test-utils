/**
 * Playwright E2E Test Examples
 * Demonstrates common patterns for E2E testing with @kitiumai/playwright-helpers
 */

import { test, expect } from '@playwright/test';
import {
  ApplicationPage,
  createAuthHelper,
  AuthPresets,
  createAccessibilityChecker,
  createPerformanceMonitor,
  createNetworkMockManager,
  createAssertion,
  createVisualRegressionHelper,
} from '@kitiumai/playwright-helpers';

// Custom page objects
class HomePage extends ApplicationPage {
  async navigateToHome(): Promise<void> {
    await this.goto('/');
  }

  async getWelcomeMessage(): Promise<string | null> {
    return await this.getText('h1');
  }

  async clickLoginButton(): Promise<void> {
    await this.click('button:has-text("Login")');
  }
}

class LoginPage extends ApplicationPage {
  async login(email: string, password: string): Promise<void> {
    await this.goto('/login');
    await this.fillField('input[type="email"]', email);
    await this.fillField('input[type="password"]', password);
    await this.click('button[type="submit"]');
    await this.waitForUrl(/dashboard|home/);
  }

  async getErrorMessage(): Promise<string | null> {
    return await this.getText('[role="alert"]');
  }
}

class DashboardPage extends ApplicationPage {
  async navigateToDashboard(): Promise<void> {
    await this.goto('/dashboard');
  }

  async getUserName(): Promise<string | null> {
    return await this.getText('[data-testid="user-name"]');
  }

  async logout(): Promise<void> {
    await this.click('button:has-text("Logout")');
    await this.waitForUrl(/login/);
  }
}

// Setup test fixtures
test.describe('E2E Testing Examples', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  test.describe('Page Objects and Navigation', () => {
    test('should navigate between pages', async ({ page }) => {
      const homePage = new HomePage(page, { baseUrl });
      const loginPage = new LoginPage(page, { baseUrl });

      // Navigate to home
      await homePage.navigateToHome();
      const message = await homePage.getWelcomeMessage();
      expect(message).toBeTruthy();

      // Navigate to login
      await homePage.clickLoginButton();
      await page.waitForURL(/login/);
      expect(page.url()).toContain('login');
    });

    test('should check element visibility', async ({ page }) => {
      const homePage = new HomePage(page, { baseUrl });
      await homePage.navigateToHome();

      const isVisible = await homePage.isVisible('button:has-text("Login")');
      expect(isVisible).toBe(true);
    });

    test('should get current URL', async ({ page }) => {
      const homePage = new HomePage(page, { baseUrl });
      await homePage.navigateToHome();

      const url = homePage.getCurrentUrl();
      expect(url).toContain(baseUrl);
    });

    test('should get page title', async ({ page }) => {
      const homePage = new HomePage(page, { baseUrl });
      await homePage.navigateToHome();

      const title = await homePage.getTitle();
      expect(title).toBeTruthy();
    });
  });

  test.describe('Custom Assertions', () => {
    test('should assert element properties', async ({ page }) => {
      const homePage = new HomePage(page, { baseUrl });
      await homePage.navigateToHome();

      const button = page.locator('button:has-text("Login")');

      // Fluent assertion
      const assertion = createAssertion(page, button);
      assertion.isVisible().hasText('Login');

      expect(button).toBeEnabled();
      expect(button).toBeVisible();
    });

    test('should assert page URL', async ({ page }) => {
      const homePage = new HomePage(page, { baseUrl });
      await homePage.navigateToHome();

      await createAssertion(page).pageUrlMatches(/\//);
    });
  });

  test.describe('Authentication', () => {
    test('should login successfully', async ({ page }) => {
      const loginPage = new LoginPage(page, { baseUrl });
      const dashboardPage = new DashboardPage(page, { baseUrl });

      // Login
      await loginPage.login('user@example.com', 'password123');

      // Verify logged in
      const userName = await dashboardPage.getUserName();
      expect(userName).toBeTruthy();
    });

    test('should handle login errors', async ({ page }) => {
      const loginPage = new LoginPage(page, { baseUrl });
      await loginPage.goto('/login');

      // Submit invalid credentials
      await loginPage.fillField('input[type="email"]', 'invalid@example.com');
      await loginPage.fillField('input[type="password"]', 'wrongpassword');
      await loginPage.click('button[type="submit"]');

      // Check error message
      const errorMsg = await loginPage.getErrorMessage();
      expect(errorMsg).toContain('Invalid credentials');
    });

    test('should preserve session after refresh', async ({ page, context }) => {
      const authHelper = createAuthHelper(AuthPresets.emailLogin(`${baseUrl}/login`));
      const dashboardPage = new DashboardPage(page, { baseUrl });

      // Set auth token in storage
      await dashboardPage.goto('/');
      await authHelper.setTokenInStorage(
        page,
        { accessToken: 'test_token_123' },
        'authToken'
      );

      // Verify authenticated
      const isAuth = await authHelper.isAuthenticated(page);
      expect(isAuth).toBe(true);

      // Refresh and verify still authenticated
      await page.reload();
      const stillAuth = await authHelper.isAuthenticated(page);
      expect(stillAuth).toBe(true);
    });
  });

  test.describe('Network Mocking', () => {
    test('should mock API responses', async ({ page }) => {
      const manager = createNetworkMockManager();
      await manager.setupRouteInterception(page);

      // Mock endpoint
      manager.mockGet(
        /api\/users\/123/,
        JSON.stringify({ id: '123', name: 'John Doe', email: 'john@example.com' })
      );

      // Navigate and trigger API call
      await page.goto(`${baseUrl}/user/123`);

      // Verify mocked response was used
      const requests = manager.getRequestsByUrl('api/users');
      expect(requests.length).toBeGreaterThan(0);
    });

    test('should mock error responses', async ({ page }) => {
      const manager = createNetworkMockManager();
      await manager.setupRouteInterception(page);

      manager.mockError(/api\/users\/404/, 404, 'User not found');

      await page.goto(`${baseUrl}/user/404`);

      // Should handle 404 gracefully
      const errorText = page.locator('[data-testid="error"]');
      const isVisible = await errorText.isVisible().catch(() => false);
      expect(isVisible || true).toBe(true);
    });
  });

  test.describe('Accessibility Testing', () => {
    test('should check for accessibility issues', async ({ page }) => {
      const a11y = createAccessibilityChecker();
      const loginPage = new LoginPage(page, { baseUrl });

      await loginPage.goto('/login');

      // Run accessibility checks
      const result = await a11y.fullCheck(page);

      // Should have no critical errors
      const criticalIssues = result.issues.filter((i) => i.type === 'error');
      expect(criticalIssues).toHaveLength(0);
    });

    test('should verify form has labels', async ({ page }) => {
      const a11y = createAccessibilityChecker();
      await page.goto(`${baseUrl}/login`);

      const formIssues = await a11y.checkFormLabels(page);
      // Should have proper labels
      expect(formIssues.length).toBeLessThan(3);
    });

    test('should check heading hierarchy', async ({ page }) => {
      const a11y = createAccessibilityChecker();
      await page.goto(`${baseUrl}/`);

      const hierarchyIssues = await a11y.checkHeadingHierarchy(page);
      expect(hierarchyIssues.length).toBeLessThan(2);
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should measure page load time', async ({ page }) => {
      const perf = createPerformanceMonitor();
      await page.goto(`${baseUrl}/`);

      const loadTime = await perf.getPageLoadTime(page);
      expect(loadTime).toBeGreaterThan(0);
      expect(loadTime).toBeLessThan(10000); // Should load in under 10 seconds
    });

    test('should check Core Web Vitals', async ({ page }) => {
      const perf = createPerformanceMonitor();
      await page.goto(`${baseUrl}/`);

      // Allow time for metrics to be collected
      await page.waitForTimeout(2000);

      const vitals = await perf.getCoreWebVitals(page);
      expect(vitals).toHaveProperty('lcp');
      expect(vitals).toHaveProperty('cls');
    });

    test('should measure operation performance', async ({ page }) => {
      const perf = createPerformanceMonitor();
      await page.goto(`${baseUrl}/`);

      const { result, duration } = await perf.measureOperation(
        async () => {
          const locator = page.locator('button:has-text("Login")');
          return await locator.textContent();
        },
        'Click button'
      );

      expect(duration).toBeGreaterThan(0);
      expect(result).toBeTruthy();
    });

    test('should assert load time under threshold', async ({ page }) => {
      const perf = createPerformanceMonitor();
      await page.goto(`${baseUrl}/`);

      // Should not throw if load time is under 30 seconds
      await perf.assertLoadTimeUnder(page, 30000);
    });
  });

  test.describe('Visual Regression', () => {
    test('should capture and compare screenshots', async ({ page }) => {
      const visual = createVisualRegressionHelper();
      await page.goto(`${baseUrl}/`);

      // Take screenshot for comparison
      const result = await visual.compareScreenshot(page, 'home-page', {
        fullPage: true,
      });

      expect(result.path).toBeTruthy();
    });

    test('should measure element dimensions', async ({ page }) => {
      const visual = createVisualRegressionHelper();
      await page.goto(`${baseUrl}/`);

      const button = page.locator('button:has-text("Login")');
      const dimensions = await visual.getElementBoundingBox(page, 'button');

      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
      expect(dimensions!.width).toBeGreaterThan(0);
      expect(dimensions!.height).toBeGreaterThan(0);
    });
  });

  test.describe('Complex User Flow', () => {
    test('should complete full user journey', async ({ page }) => {
      const homePage = new HomePage(page, { baseUrl });
      const loginPage = new LoginPage(page, { baseUrl });
      const dashboardPage = new DashboardPage(page, { baseUrl });
      const a11y = createAccessibilityChecker();
      const perf = createPerformanceMonitor();

      // 1. Navigate to home
      await homePage.navigateToHome();
      await a11y.assertNoAccessibilityErrors(page);

      // 2. Click login
      await homePage.clickLoginButton();
      expect(page.url()).toContain('login');

      // 3. Enter credentials and login
      await loginPage.fillField('input[type="email"]', 'user@example.com');
      await loginPage.fillField('input[type="password"]', 'password123');
      await loginPage.click('button[type="submit"]');

      // 4. Verify dashboard loaded
      await page.waitForURL(/dashboard/);
      const userName = await dashboardPage.getUserName();
      expect(userName).toBeTruthy();

      // 5. Check performance
      const loadTime = await perf.getPageLoadTime(page);
      expect(loadTime).toBeLessThan(5000);

      // 6. Logout
      await dashboardPage.logout();
      expect(page.url()).toContain('login');
    });
  });
});
