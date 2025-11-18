/**
 * HTTP and API mocking helpers
 */

export interface HttpResponse {
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  data?: unknown;
}

export interface HttpRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface MockHttpHandler {
  method: string;
  path: string | RegExp;
  response: HttpResponse | (() => HttpResponse);
  delay?: number;
}

/**
 * HTTP mock handler registry
 */
export class HttpMockRegistry {
  private handlers: Map<string, MockHttpHandler[]> = new Map();
  private requests: HttpRequest[] = [];

  /**
   * Register a mock handler
   */
  register(handler: MockHttpHandler): void {
    const key = `${handler.method.toUpperCase()}:${handler.path}`;
    const handlers = this.handlers.get(key) || [];
    handlers.push(handler);
    this.handlers.set(key, handlers);
  }

  /**
   * Mock GET request
   */
  mockGet(
    path: string | RegExp,
    response: HttpResponse | (() => HttpResponse),
    delay?: number
  ): void {
    this.register({ method: 'GET', path, response, delay });
  }

  /**
   * Mock POST request
   */
  mockPost(
    path: string | RegExp,
    response: HttpResponse | (() => HttpResponse),
    delay?: number
  ): void {
    this.register({ method: 'POST', path, response, delay });
  }

  /**
   * Mock PUT request
   */
  mockPut(
    path: string | RegExp,
    response: HttpResponse | (() => HttpResponse),
    delay?: number
  ): void {
    this.register({ method: 'PUT', path, response, delay });
  }

  /**
   * Mock DELETE request
   */
  mockDelete(
    path: string | RegExp,
    response: HttpResponse | (() => HttpResponse),
    delay?: number
  ): void {
    this.register({ method: 'DELETE', path, response, delay });
  }

  /**
   * Mock PATCH request
   */
  mockPatch(
    path: string | RegExp,
    response: HttpResponse | (() => HttpResponse),
    delay?: number
  ): void {
    this.register({ method: 'PATCH', path, response, delay });
  }

  /**
   * Get handler for request
   */
  getHandler(request: HttpRequest): MockHttpHandler | undefined {
    const key = `${request.method.toUpperCase()}:*`;
    const handlers = this.handlers.get(key) || [];

    for (const handler of handlers) {
      if (this.pathMatches(request.url, handler.path)) {
        return handler;
      }
    }

    return undefined;
  }

  /**
   * Record a request
   */
  recordRequest(request: HttpRequest): void {
    this.requests.push(request);
  }

  /**
   * Get all recorded requests
   */
  getRequests(): HttpRequest[] {
    return [...this.requests];
  }

  /**
   * Get requests by method
   */
  getRequestsByMethod(method: string): HttpRequest[] {
    return this.requests.filter((req) => req.method.toUpperCase() === method.toUpperCase());
  }

  /**
   * Get requests by path
   */
  getRequestsByPath(path: string): HttpRequest[] {
    return this.requests.filter((req) => req.url.includes(path));
  }

  /**
   * Verify a request was made
   */
  wasRequestMade(method: string, path: string): boolean {
    return this.requests.some(
      (req) => req.method.toUpperCase() === method.toUpperCase() && req.url.includes(path)
    );
  }

  /**
   * Clear all mocks
   */
  clear(): void {
    this.handlers.clear();
    this.requests = [];
  }

  private pathMatches(url: string, pathPattern: string | RegExp): boolean {
    if (typeof pathPattern === 'string') {
      return url.includes(pathPattern);
    }
    return pathPattern.test(url);
  }
}

/**
 * Create HTTP mock registry
 */
export const createHttpMockRegistry = (): HttpMockRegistry => new HttpMockRegistry();

/**
 * Global HTTP mock registry
 */
let globalRegistry: HttpMockRegistry | null = null;

export function getGlobalHttpMockRegistry(): HttpMockRegistry {
  if (!globalRegistry) {
    globalRegistry = createHttpMockRegistry();
  }
  return globalRegistry;
}

export function resetGlobalHttpMockRegistry(): void {
  globalRegistry = null;
}

/**
 * Convenience function for mocking common API responses
 */
export const ApiMocks = {
  /**
   * Success response
   */
  success<T>(data: T, status = 200): HttpResponse {
    return {
      status,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
      data,
    };
  },

  /**
   * Error response
   */
  error(message: string, status = 400): HttpResponse {
    return {
      status,
      statusText: 'Error',
      headers: { 'Content-Type': 'application/json' },
      data: { error: message },
    };
  },

  /**
   * Not found response
   */
  notFound(resource = 'Resource'): HttpResponse {
    return this.error(`${resource} not found`, 404);
  },

  /**
   * Server error response
   */
  serverError(message = 'Internal Server Error'): HttpResponse {
    return this.error(message, 500);
  },

  /**
   * Unauthorized response
   */
  unauthorized(): HttpResponse {
    return this.error('Unauthorized', 401);
  },

  /**
   * Forbidden response
   */
  forbidden(): HttpResponse {
    return this.error('Forbidden', 403);
  },

  /**
   * Validation error response
   */
  validationError(errors: Record<string, string>): HttpResponse {
    return {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: { 'Content-Type': 'application/json' },
      data: { errors },
    };
  },

  /**
   * Empty successful response
   */
  empty(status = 204): HttpResponse {
    return {
      status,
      statusText: 'No Content',
      data: null,
    };
  },

  /**
   * Paginated response
   */
  paginated<T>(items: T[], page = 1, pageSize = 10, total = items.length): HttpResponse {
    return this.success({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
};

/**
 * Request/Response builder for fluent API
 */
export class HttpMockBuilder {
  private registry: HttpMockRegistry;
  private method: string = 'GET';
  private path: string = '';
  private responseData: HttpResponse | (() => HttpResponse) = { status: 200, statusText: 'OK' };
  private delay: number = 0;

  constructor(registry?: HttpMockRegistry) {
    this.registry = registry || getGlobalHttpMockRegistry();
  }

  forGet(path: string): this {
    this.method = 'GET';
    this.path = path;
    return this;
  }

  forPost(path: string): this {
    this.method = 'POST';
    this.path = path;
    return this;
  }

  forPut(path: string): this {
    this.method = 'PUT';
    this.path = path;
    return this;
  }

  forDelete(path: string): this {
    this.method = 'DELETE';
    this.path = path;
    return this;
  }

  forPatch(path: string): this {
    this.method = 'PATCH';
    this.path = path;
    return this;
  }

  thenRespond(response: HttpResponse | (() => HttpResponse)): this {
    this.responseData = response;
    return this;
  }

  thenSuccess<T>(data: T): this {
    this.responseData = ApiMocks.success(data);
    return this;
  }

  thenError(message: string, status?: number): this {
    this.responseData = ApiMocks.error(message, status);
    return this;
  }

  withDelay(ms: number): this {
    this.delay = ms;
    return this;
  }

  register(): void {
    this.registry.register({
      method: this.method,
      path: this.path,
      response: this.responseData,
      delay: this.delay,
    });
  }
}

/**
 * Create HTTP mock builder
 */
export function createHttpMockBuilder(registry?: HttpMockRegistry): HttpMockBuilder {
  return new HttpMockBuilder(registry);
}
