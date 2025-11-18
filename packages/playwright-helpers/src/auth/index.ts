/**
 * Authentication helpers for Playwright tests
 */

import { Page, BrowserContext } from '@playwright/test';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthConfig {
  loginUrl: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
  successIndicator?: string | RegExp;
  timeout?: number;
}

/**
 * Authentication helper
 */
export class AuthHelper {
  private tokens: Map<string, AuthToken> = new Map();
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Login with credentials
   */
  async login(page: Page, credentials: LoginCredentials): Promise<void> {
    await page.goto(this.config.loginUrl);

    // Fill credentials
    await page.locator(this.config.usernameSelector).fill(credentials.username);
    await page.locator(this.config.passwordSelector).fill(credentials.password);

    // Submit form
    const submitButton = page.locator(this.config.submitSelector);
    await submitButton.click();

    // Wait for success
    if (this.config.successIndicator) {
      if (typeof this.config.successIndicator === 'string') {
        await page.waitForSelector(this.config.successIndicator, { timeout: this.config.timeout });
      } else {
        await page.waitForURL(this.config.successIndicator, { timeout: this.config.timeout });
      }
    } else {
      await page.waitForNavigation();
    }
  }

  /**
   * Set authentication token via localStorage
   */
  async setTokenInStorage(
    page: Page,
    token: AuthToken,
    storageKey: string = 'authToken'
  ): Promise<void> {
    await page.evaluate(
      ({ key, token }) => {
        localStorage.setItem(key, JSON.stringify(token));
      },
      { key: storageKey, token }
    );

    // Store for reference
    this.tokens.set(storageKey, token);
  }

  /**
   * Set authentication header
   */
  async setAuthHeader(context: BrowserContext, token: string, headerName: string = 'Authorization'): Promise<void> {
    await context.setExtraHTTPHeaders({
      [headerName]: `Bearer ${token}`,
    });
  }

  /**
   * Set authentication cookie
   */
  async setAuthCookie(context: BrowserContext, cookieName: string, token: string, domain: string): Promise<void> {
    await context.addCookies([
      {
        name: cookieName,
        value: token,
        domain,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
      },
    ]);
  }

  /**
   * Get stored token
   */
  getToken(storageKey: string = 'authToken'): AuthToken | undefined {
    return this.tokens.get(storageKey);
  }

  /**
   * Clear authentication
   */
  async clearAuth(page: Page, storageKey: string = 'authToken'): Promise<void> {
    await page.evaluate((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }, storageKey);

    this.tokens.delete(storageKey);
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated(page: Page, storageKey: string = 'authToken'): Promise<boolean> {
    const token = await page.evaluate((key) => {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    }, storageKey);

    return !!token;
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(page: Page, storageKey: string = 'authToken'): Promise<unknown> {
    const user = await page.evaluate((key) => {
      const token = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!token) return null;

      try {
        return JSON.parse(token);
      } catch {
        return token;
      }
    }, storageKey);

    return user;
  }

  /**
   * Logout
   */
  async logout(page: Page): Promise<void> {
    await this.clearAuth(page);
    await page.reload();
  }
}

/**
 * Create auth helper
 */
export function createAuthHelper(config: AuthConfig): AuthHelper {
  return new AuthHelper(config);
}

/**
 * Common authentication presets
 */
export const AuthPresets = {
  /**
   * Standard form-based login
   */
  formLogin(loginUrl: string): AuthConfig {
    return {
      loginUrl,
      usernameSelector: 'input[name="username"]',
      passwordSelector: 'input[name="password"]',
      submitSelector: 'button[type="submit"]',
      successIndicator: /dashboard|home/,
      timeout: 30000,
    };
  },

  /**
   * Email/password form
   */
  emailLogin(loginUrl: string): AuthConfig {
    return {
      loginUrl,
      usernameSelector: 'input[type="email"]',
      passwordSelector: 'input[type="password"]',
      submitSelector: 'button[type="submit"]',
      successIndicator: /dashboard|home/,
      timeout: 30000,
    };
  },

  /**
   * OAuth-style login
   */
  oauthLogin(loginUrl: string): AuthConfig {
    return {
      loginUrl,
      usernameSelector: 'input[id*="username"], input[id*="email"]',
      passwordSelector: 'input[id*="password"]',
      submitSelector: 'button[type="submit"]',
      successIndicator: /authorize|consent/,
      timeout: 30000,
    };
  },
};

/**
 * Session manager for test authentication
 */
export class SessionManager {
  private sessions: Map<string, { context: BrowserContext; token: AuthToken }> = new Map();

  /**
   * Create authenticated session
   */
  async createSession(
    context: BrowserContext,
    sessionId: string,
    token: AuthToken
  ): Promise<void> {
    this.sessions.set(sessionId, { context, token });
  }

  /**
   * Get session
   */
  getSession(sessionId: string): { context: BrowserContext; token: AuthToken } | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Apply session to page
   */
  async applySession(page: Page, sessionId: string, storageKey: string = 'authToken'): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session '${sessionId}' not found`);
    }

    await page.evaluate(
      ({ key, token }) => {
        localStorage.setItem(key, JSON.stringify(token));
      },
      { key: storageKey, token: session.token }
    );
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.context.clearCookies();
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Clear all sessions
   */
  async clearAll(): Promise<void> {
    for (const [sessionId] of this.sessions) {
      await this.endSession(sessionId);
    }
  }
}

/**
 * Create session manager
 */
export function createSessionManager(): SessionManager {
  return new SessionManager();
}
