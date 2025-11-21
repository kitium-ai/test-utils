# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-21

### Added

#### Mock Data Generators
- **20+ new data generator methods** in `DataGenerators`:
  - Personal: `firstName()`, `lastName()`, `fullName()`, `companyName()`
  - Address: `address()`, `city()`, `country()`, `zipCode()`
  - Internet/Technical: `ipAddress()`, `creditCardNumber()`, `slug()`, `locale()`
  - Dates: `pastDate()`, `futureDate()`, `isoTimestamp()`
  - Advanced: `enum()`, `weighted()`, `hexColor()`, `json()`
  - Utility: `phoneNumber()`, `username()`, `url()`

- **7 new pre-built factories**:
  - `Factories.company()` - Company entity with address and contact info
  - `Factories.product()` - Product with price and stock
  - `Factories.order()` - Order with user and status
  - `Factories.todo()` - Todo item with completion status
  - `Factories.article()` - Article with publication status
  - `Factories.profile()` - User profile with location
  - Updated `Factories.user()` with `name` field

- **Factory builder pattern** with `createFactoryWithBuilder()`:
  - Support for entity relationships
  - Automatic field generation with custom overrides
  - Consistent seeding across related entities

#### API Request/Response Testing (`@kitiumai/jest-helpers/http`)
- **`HttpMockServer`** - Advanced HTTP mock server with interceptors
  - Request interceptor pattern for flexible matching
  - `addInterceptor()` method for custom request handling
  - `setFallback()` for default responses
  - Request matching by method, path, headers, and body
  - Request recording and retrieval by pattern

- **Request matcher interface** (`RequestMatcher`):
  - Method matching (GET, POST, PUT, DELETE, PATCH)
  - Path matching with string or RegExp
  - Header matching with string or RegExp patterns
  - Body matching with value comparison or custom functions

- **Response validation utilities**:
  - `SchemaValidator` class for response schema validation
  - `ResponseSchema` interface for defining expected responses
  - `ValidationResult` interface for validation feedback
  - `ValidatedResponseBuilder` with fluent API:
    - `withStatus()`, `withData()`, `withHeader()`
    - `asJSON()`, `asXML()` convenience methods
    - `withValidator()` for schema validation
    - `build()` with validation, `buildUnsafe()` without

- **Response chaining** (`ApiResponseChain`):
  - `add()` and `addMultiple()` methods for sequential responses
  - `next()` for retrieving responses in order
  - `reset()` to restart the chain
  - Supports different responses per API call

#### Integration Testing (`@kitiumai/jest-helpers/integration`)
- **`IntegrationTestEnvironment`** - Resource lifecycle management
  - `registerResource()` for declaring test resources
  - `setupAll()` and `teardownAll()` for batch operations
  - `onSetup()` and `onTeardown()` hooks for custom initialization
  - `getResource()` for accessing registered resources

- **`TestScenario`** - Builder for sequential test operations
  - `beforeEach()` and `afterEach()` lifecycle methods
  - `step()` method for named test steps with logging
  - `execute()` to run the complete scenario

- **`TestDataBuilder`** - Complex test data construction
  - `set()` for direct value assignment
  - `addRelated()` for managing related entities
  - `build()` to generate final test data object
  - `reset()` to clear builder state

- **`IntegrationAssertions`** - Integration-specific assertions
  - `assertResourceAccessible()` - Null/undefined checks
  - `assertChanged()` - Verify state changes
  - `assertUnchanged()` - Verify no state changes
  - `assertEventuallyConsistent()` - Eventual consistency checks
  - `assertNoSideEffects()` - Side effect detection

- **Parallel/Sequential execution helpers**:
  - `runTestsInParallel()` with configurable concurrency
  - `runTestsSequentially()` for dependent tests
  - `retryTestWithReport()` with automatic retry logging
  - `withTimeout()` for operation timeouts

- **`TestCleanupManager`** - Resource cleanup orchestration
  - `onCleanup()` for registering cleanup functions
  - `cleanup()` executes functions in reverse order
  - Automatic error handling and logging

#### E2E Testing Utilities (`@kitiumai/playwright-helpers/testing`)
- **`E2ETestData`** - Test data management
  - In-memory storage with `store()` and `retrieve()`
  - Page context storage with `storeInPage()` and `retrieveFromPage()`
  - `clear()` for cleanup

- **`FormHelper`** - Form interaction utilities
  - `fillField()` and `fillFields()` for text input
  - `selectOption()` for dropdowns
  - `check()` and `uncheck()` for checkboxes
  - `getFormData()` for form state extraction
  - `submit()` and `reset()` for form operations

- **`TableHelper`** - Table data extraction
  - `getTableData()` for full table extraction
  - `getRowCount()` for row counting
  - `findRow()` for content-based row search
  - `getCellValue()` for individual cell access

- **`DialogHelper`** - Modal/dialog management
  - `waitForDialog()` with timeout support
  - `isDialogVisible()` for visibility checks
  - `closeDialog()` and `confirmDialog()` for interactions
  - `getDialogContent()` for content extraction

- **`NavigationHelper`** - Page navigation
  - `navigateTo()` with wait state options
  - `goBack()`, `goForward()`, `reload()`
  - `getCurrentURL()` and `waitForURLChange()`
  - `clickLink()` with automatic navigation wait

- **`WaitHelper`** - Advanced wait conditions
  - `waitForStableElement()` - Wait for element position stability
  - `waitForElementCount()` - Count-based waiting
  - `waitForText()` - Text appearance waiting
  - `waitForCondition()` - Custom condition waiting
  - `waitForNetworkIdle()` - Network idle state

- **`ScreenshotHelper`** - Visual testing utilities
  - `takeFullPageScreenshot()` for complete page captures
  - `takeElementScreenshot()` for element-specific captures
  - `compareScreenshots()` for visual regression

- **`StorageHelper`** - Browser storage management
  - Cookie operations: `setCookie()`, `getCookie()`, `clearCookies()`
  - LocalStorage operations: `setLocalStorage()`, `getLocalStorage()`, `clearLocalStorage()`
  - SessionStorage operations: `setSessionStorage()`, `clearSessionStorage()`

- **`ConsoleHelper`** - Console output monitoring
  - `getLogs()`, `getErrors()`, `getWarnings()` for retrieval
  - `assertNoErrors()` for error validation
  - Automatic console message capture on page

- **`E2ETestHelper`** - Composite helper combining all utilities
  - Single entry point for all E2E helpers
  - Properties: `data`, `form`, `table`, `dialog`, `navigation`, `wait`, `screenshot`, `storage`, `console`
  - Factory function `createE2ETestHelper(page)`

#### Documentation
- **`TESTING_HELPERS_GUIDE.md`** - Comprehensive testing guide
  - API reference for all generators and factories
  - Usage examples for integration testing
  - E2E testing patterns and best practices
  - Complete example scenarios
  - Migration and troubleshooting sections

### Changed

- **Package naming**: Renamed scope from `@org` to `@kitiumai` across all packages:
  - `@org/test-core` → `@kitiumai/test-core`
  - `@org/jest-helpers` → `@kitiumai/jest-helpers`
  - `@org/playwright-helpers` → `@kitiumai/playwright-helpers`

- **TypeScript configuration**:
  - Added `"DOM"` to `lib` in `tsconfig.json` for browser API support
  - Fixed type compatibility for `deepMerge()` utility

- **Package exports**:
  - Added `./integration` export to `@kitiumai/jest-helpers`
  - Added `./testing` export to `@kitiumai/playwright-helpers`

- **Enhanced existing utilities**:
  - Updated `Factories.user()` with additional `name` field
  - Improved HTTP mock registry with interceptor support

### Fixed

- Fixed TypeScript strict mode issues in `deepMerge()` function
- Fixed missing type definitions for DOM and Node.js APIs
- Fixed export ambiguity issues in package exports

### Development

- All new code follows TypeScript strict mode
- Comprehensive JSDoc documentation for IDE support
- Full type safety across all modules
- Backward compatible with existing API

## Repository

- **Repository**: https://github.com/kitium-ai/test-utils
- **Branch**: `claude/implement-following-01Fn8SHha3o7ymzdjvriQ5rU`
- **Commit**: `512ff3e` - "feat: Implement comprehensive shared testing helpers library"

## Installation

```bash
npm install @kitiumai/test-core @kitiumai/jest-helpers @kitiumai/playwright-helpers
```

## Usage

See [TESTING_HELPERS_GUIDE.md](TESTING_HELPERS_GUIDE.md) for comprehensive examples and patterns.

## Credits

Implemented as part of the Kitium AI test utilities library enhancement initiative.
