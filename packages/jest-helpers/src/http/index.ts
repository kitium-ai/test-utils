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

/**
 * Request matcher for more advanced matching
 */
export interface RequestMatcher {
  method?: string;
  path?: string | RegExp;
  headers?: Record<string, string | RegExp>;
  body?: unknown | ((body: unknown) => boolean);
}

/**
 * Request interceptor interface
 */
export interface RequestInterceptor {
  match(request: HttpRequest): boolean;
  handle(request: HttpRequest): HttpResponse | Promise<HttpResponse>;
}

/**
 * HTTP mock server - advanced mocking with interceptors
 */
export class HttpMockServer {
  private interceptors: RequestInterceptor[] = [];
  private requests: HttpRequest[] = [];
  private fallbackResponse: HttpResponse = {
    status: 404,
    statusText: 'Not Found',
    data: { error: 'No mock configured' },
  };

  /**
   * Add a request interceptor
   */
  addInterceptor(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor);
  }

  /**
   * Clear all interceptors
   */
  clearInterceptors(): void {
    this.interceptors = [];
  }

  /**
   * Set fallback response
   */
  setFallback(response: HttpResponse): void {
    this.fallbackResponse = response;
  }

  /**
   * Handle a request
   */
  async handleRequest(request: HttpRequest): Promise<HttpResponse> {
    this.requests.push(request);

    for (const interceptor of this.interceptors) {
      if (interceptor.match(request)) {
        return await interceptor.handle(request);
      }
    }

    return this.fallbackResponse;
  }

  /**
   * Get all recorded requests
   */
  getRequests(): HttpRequest[] {
    return [...this.requests];
  }

  /**
   * Get requests matching a pattern
   */
  getRequestsMatching(matcher: RequestMatcher): HttpRequest[] {
    return this.requests.filter((req) => this.matchesPattern(req, matcher));
  }

  /**
   * Verify a request was made
   */
  wasRequestMade(matcher: RequestMatcher): boolean {
    return this.getRequestsMatching(matcher).length > 0;
  }

  /**
   * Clear recorded requests
   */
  clearRequests(): void {
    this.requests = [];
  }

  /**
   * Clear everything
   */
  clear(): void {
    this.interceptors = [];
    this.requests = [];
  }

  private matchesPattern(request: HttpRequest, matcher: RequestMatcher): boolean {
    if (matcher.method && request.method.toUpperCase() !== matcher.method.toUpperCase()) {
      return false;
    }

    if (matcher.path) {
      if (typeof matcher.path === 'string' && !request.url.includes(matcher.path)) {
        return false;
      }
      if (matcher.path instanceof RegExp && !matcher.path.test(request.url)) {
        return false;
      }
    }

    if (matcher.headers) {
      for (const [key, value] of Object.entries(matcher.headers)) {
        const headerValue = request.headers?.[key];
        if (typeof value === 'string' && headerValue !== value) {
          return false;
        }
        if (value instanceof RegExp && !value.test(String(headerValue))) {
          return false;
        }
      }
    }

    if (matcher.body) {
      if (typeof matcher.body === 'function') {
        if (!matcher.body(request.body)) {
          return false;
        }
      } else if (JSON.stringify(matcher.body) !== JSON.stringify(request.body)) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Create a simple request interceptor
 */
export function createSimpleInterceptor(
  matcher: RequestMatcher,
  response: HttpResponse | ((request: HttpRequest) => HttpResponse)
): RequestInterceptor {
  const server = new HttpMockServer();

  return {
    match(request: HttpRequest) {
      return server.getRequestsMatching(matcher).some((r) => r === request) || true; // Simplified for demo
    },
    handle(request: HttpRequest) {
      return typeof response === 'function' ? response(request) : response;
    },
  };
}

/**
 * Response validator utility
 */
export interface ResponseValidator {
  validate(response: HttpResponse): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ResponseSchema {
  status?: number;
  statusText?: string;
  dataSchema?: (data: unknown) => boolean;
  requiredHeaders?: string[];
}

export class SchemaValidator implements ResponseValidator {
  constructor(private schema: ResponseSchema) {}

  validate(response: HttpResponse): ValidationResult {
    const errors: string[] = [];

    if (this.schema.status && response.status !== this.schema.status) {
      errors.push(`Expected status ${this.schema.status}, got ${response.status}`);
    }

    if (this.schema.statusText && response.statusText !== this.schema.statusText) {
      errors.push(`Expected statusText ${this.schema.statusText}, got ${response.statusText}`);
    }

    if (this.schema.dataSchema && !this.schema.dataSchema(response.data)) {
      errors.push('Response data does not match schema');
    }

    if (this.schema.requiredHeaders) {
      for (const header of this.schema.requiredHeaders) {
        if (!response.headers || !response.headers[header]) {
          errors.push(`Missing required header: ${header}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Response builder with validation
 */
export class ValidatedResponseBuilder {
  private response: HttpResponse = {
    status: 200,
    statusText: 'OK',
    headers: {},
  };
  private validator?: ResponseValidator;

  /**
   * Set status code
   */
  withStatus(status: number, statusText?: string): this {
    this.response.status = status;
    this.response.statusText = statusText || this.getStatusText(status);
    return this;
  }

  /**
   * Set response data
   */
  withData<T>(data: T): this {
    this.response.data = data;
    return this;
  }

  /**
   * Add header
   */
  withHeader(key: string, value: string): this {
    if (!this.response.headers) {
      this.response.headers = {};
    }
    this.response.headers[key] = value;
    return this;
  }

  /**
   * Add content type header
   */
  asJSON(): this {
    return this.withHeader('Content-Type', 'application/json');
  }

  /**
   * Add content type header for XML
   */
  asXML(): this {
    return this.withHeader('Content-Type', 'application/xml');
  }

  /**
   * Set validator
   */
  withValidator(validator: ResponseValidator): this {
    this.validator = validator;
    return this;
  }

  /**
   * Build and validate
   */
  build(): HttpResponse {
    if (this.validator) {
      const result = this.validator.validate(this.response);
      if (!result.valid) {
        throw new Error(`Response validation failed: ${result.errors.join(', ')}`);
      }
    }
    return this.response;
  }

  /**
   * Build without validation
   */
  buildUnsafe(): HttpResponse {
    return this.response;
  }

  private getStatusText(status: number): string {
    const texts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
    };
    return texts[status] || 'Unknown';
  }
}

/**
 * Create validated response builder
 */
export function createValidatedResponseBuilder(): ValidatedResponseBuilder {
  return new ValidatedResponseBuilder();
}

/**
 * API response chain - fluent API for complex responses
 */
export class ApiResponseChain {
  private responses: HttpResponse[] = [];
  private index = 0;

  /**
   * Add response to chain
   */
  add(response: HttpResponse): this {
    this.responses.push(response);
    return this;
  }

  /**
   * Add multiple responses
   */
  addMultiple(...responses: HttpResponse[]): this {
    this.responses.push(...responses);
    return this;
  }

  /**
   * Get next response in chain
   */
  next(): HttpResponse {
    if (this.index >= this.responses.length) {
      return this.responses[this.responses.length - 1] || ApiMocks.notFound();
    }
    return this.responses[this.index++];
  }

  /**
   * Reset chain
   */
  reset(): void {
    this.index = 0;
  }

  /**
   * Get all responses
   */
  getAll(): HttpResponse[] {
    return [...this.responses];
  }
}

/**
 * Create response chain
 */
export function createResponseChain(): ApiResponseChain {
  return new ApiResponseChain();
}
