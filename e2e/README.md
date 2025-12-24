# E2E Tests with Playwright

This directory contains end-to-end tests for FlipSide Player using Playwright. The tests use the mock environment to verify the complete application flow without requiring real Spotify credentials or Premium accounts.

## Prerequisites

1. **Install Playwright browsers** (first time only):

   ```bash
   npm run test:e2e:install
   ```

2. **Docker must be installed** (Redis will be started automatically using Docker)

## Running Tests

### Automated Test Run (Recommended)

The easiest way to run tests is using the automated script that handles everything:

```bash
npm run test:e2e:full
```

This script will:

- ✅ Start Redis using Docker (creates/uses container named `flipside-redis-test`)
- ✅ Start backend in mock mode
- ✅ Start frontend in mock mode
- ✅ Wait for services to be ready
- ✅ Run Playwright tests
- ✅ Clean up by stopping services and Redis container

**Note**: Docker must be installed and running. The script will automatically:

- Check if Redis container already exists and reuse it
- Create a new Redis container if needed
- Stop the container when tests complete

### Manual Test Run

If you prefer to run services manually:

1. **Start the mock environment** in one terminal:

   ```bash
   # Option 1: Local development with mocks
   npm run dev:mock

   # Option 2: Docker with mocks
   npm run docker:mock
   ```

   The tests expect:
   - Frontend running on `http://localhost:5173`
   - Backend API accessible at `http://localhost:5173/api` (via Vite proxy)

2. **Run tests** in another terminal:

   ```bash
   npm run test:e2e
   ```

### Run tests in headed mode (see browser)

```bash
npm run test:e2e:headed
```

### Run tests with UI mode (interactive)

```bash
npm run test:e2e:ui
```

### Debug tests

```bash
npm run test:e2e:debug
```

### Run specific test file

```bash
npx playwright test e2e/app-flow.spec.ts
```

### Run tests in specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Coverage

The current test suite (`app-flow.spec.ts`) covers:

- ✅ Login screen display
- ✅ OAuth login flow (mock mode)
- ✅ Main application UI after login
- ✅ Search functionality
- ✅ Player controls visibility
- ✅ Vinyl deck view
- ✅ View toggle
- ✅ User menu
- ✅ Logout functionality
- ✅ Session persistence

## Writing New Tests

When adding new tests:

1. Create test files in the `e2e/` directory with `.spec.ts` extension
2. Use Playwright's test API:

   ```typescript
   import { test, expect } from '@playwright/test';

   test('my test', async ({ page }) => {
     await page.goto('/');
     // Your test code
   });
   ```

3. Follow the existing patterns:
   - Use `test.beforeEach` for common setup
   - Wait for elements with `waitForSelector` or `waitForURL`
   - Use descriptive test names
   - Group related tests with `test.describe`

## Configuration

Test configuration is in `playwright.config.ts` at the project root. Key settings:

- **Base URL**: `http://localhost:5173`
- **Browsers**: Chromium, Firefox, WebKit
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Taken on failure
- **Traces**: Collected on retry

## Troubleshooting

### Tests fail with "Navigation timeout"

- Ensure the mock environment is running (`npm run dev:mock`)
- Check that frontend is accessible at `http://localhost:5173`
- Verify backend API is accessible

### Tests fail with "Element not found"

- Check if the UI has changed (selectors may need updating)
- Use Playwright's codegen to find correct selectors: `npx playwright codegen http://localhost:5173`
- Increase timeout if element takes time to appear

### Tests are flaky

- Add explicit waits for async operations
- Use `waitForSelector` instead of fixed `waitForTimeout`
- Check for race conditions in test logic

## CI/CD Integration

For CI/CD pipelines:

1. Install dependencies and browsers:

   ```bash
   npm install
   npx playwright install --with-deps
   ```

2. Start the mock environment (or use `webServer` in config)

3. Run tests:
   ```bash
   npm run test:e2e
   ```

The config automatically adjusts retries and workers for CI environments.

## See Also

- [Playwright Documentation](https://playwright.dev/)
- [Mock Development Guide](../docs/mock-development.md)
- [Testing Documentation](../docs/testing.md) (if exists)
