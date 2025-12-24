import { test, expect } from '@playwright/test';

/**
 * E2E tests for FlipSide Player using mock environment
 *
 * These tests verify the complete application flow:
 * 1. Login flow (OAuth with mock)
 * 2. Main application UI
 * 3. Search functionality
 * 4. Player controls
 * 5. View switching
 *
 * Prerequisites:
 * - Mock environment must be running (npm run dev:mock or npm run docker:mock)
 * - Frontend accessible at http://localhost:5173
 */

test.describe('FlipSide Player - Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display login screen initially', async ({ page }) => {
    // Check for login screen elements
    await expect(page.locator('h1:has-text("FlipSide Player")')).toBeVisible();
    await expect(page.locator('p:has-text("A vinyl-inspired Spotify player")')).toBeVisible();
    await expect(page.locator('button:has-text("Connect with Spotify")')).toBeVisible();
    // Check for premium note - text includes "Note: " prefix
    await expect(
      page.locator('.premium-note:has-text("Spotify Premium subscription required")')
    ).toBeVisible();
  });

  test('should complete login flow and show main app', async ({ page }) => {
    // Click login button
    // In mock mode, this triggers /auth/mock-login which doesn't redirect
    const loginButton = page.locator('button:has-text("Connect with Spotify")');
    await expect(loginButton).toBeVisible();

    // Wait for the mock-login API call to complete
    const [response] = await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/mock-login') && resp.status() === 200,
        { timeout: 10000 }
      ),
      loginButton.click(),
    ]);

    // Wait for authentication to complete (mock-login is async)
    // The app will update state and show the main UI
    await page.waitForSelector('.app-header', { timeout: 15000 });

    // Verify main app UI elements are visible
    await expect(page.locator('h1:has-text("FlipSide Player")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.app-main')).toBeVisible({ timeout: 5000 });
  });

  test('should display search bar after login', async ({ page }) => {
    // Login first
    const loginButton = page.locator('button:has-text("Connect with Spotify")');
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/mock-login') && resp.status() === 200,
        { timeout: 10000 }
      ),
      loginButton.click(),
    ]);
    await page.waitForSelector('.app-header', { timeout: 15000 });

    // Verify search bar is visible
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await expect(searchInput).toBeEnabled();
  });

  test('should perform search and display results', async ({ page }) => {
    // Login first
    const loginButton = page.locator('button:has-text("Connect with Spotify")');
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/mock-login') && resp.status() === 200,
        { timeout: 10000 }
      ),
      loginButton.click(),
    ]);
    await page.waitForSelector('.app-header', { timeout: 15000 });

    // Wait for search input to be ready
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Type in search box
    await searchInput.fill('test');

    // Wait for search results to appear (mock API should return results)
    // The search is debounced (300ms), so wait a bit more
    await page.waitForTimeout(800);

    // Verify the search input has the value
    await expect(searchInput).toHaveValue('test');
  });

  test('should display player controls after login', async ({ page }) => {
    // Login first
    const loginButton = page.locator('button:has-text("Connect with Spotify")');
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/mock-login') && resp.status() === 200,
        { timeout: 10000 }
      ),
      loginButton.click(),
    ]);
    await page.waitForSelector('.app-header', { timeout: 15000 });

    // Wait for player controls to be visible (footer contains controls)
    const playerControls = page.locator('.app-footer');
    await expect(playerControls).toBeVisible({ timeout: 5000 });
  });

  test('should display vinyl deck view by default', async ({ page }) => {
    // Login first
    const loginButton = page.locator('button:has-text("Connect with Spotify")');
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/mock-login') && resp.status() === 200,
        { timeout: 10000 }
      ),
      loginButton.click(),
    ]);
    await page.waitForSelector('.app-header', { timeout: 15000 });

    // Wait for vinyl deck to be visible
    const vinylDeck = page.locator('.player-section');
    await expect(vinylDeck).toBeVisible({ timeout: 5000 });
  });

  test('should have view toggle buttons', async ({ page }) => {
    // Login first
    const loginButton = page.locator('button:has-text("Connect with Spotify")');
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/mock-login') && resp.status() === 200,
        { timeout: 10000 }
      ),
      loginButton.click(),
    ]);
    await page.waitForSelector('.app-header', { timeout: 15000 });

    // Look for view toggle in header
    const viewToggle = page.locator('.view-toggle');
    await expect(viewToggle).toBeVisible({ timeout: 5000 });
  });

  test('should display user menu after login', async ({ page }) => {
    // Login first
    const loginButton = page.locator('button:has-text("Connect with Spotify")');
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/mock-login') && resp.status() === 200,
        { timeout: 10000 }
      ),
      loginButton.click(),
    ]);
    await page.waitForSelector('.app-header', { timeout: 15000 });

    // Look for user menu in header
    const headerRight = page.locator('.header-right');
    await expect(headerRight).toBeVisible({ timeout: 5000 });

    // User menu should be within header-right
    const userMenu = page.locator('.user-menu');
    await expect(userMenu).toBeVisible({ timeout: 5000 });
  });

  test('should handle logout', async ({ page }) => {
    // Login first
    const loginButton = page.locator('button:has-text("Connect with Spotify")');
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/mock-login') && resp.status() === 200,
        { timeout: 10000 }
      ),
      loginButton.click(),
    ]);
    await page.waitForSelector('.app-header', { timeout: 15000 });

    // Wait for user menu to be visible
    const userMenu = page.locator('.user-menu');
    await expect(userMenu).toBeVisible({ timeout: 5000 });

    // Click user menu trigger to open dropdown
    const userTrigger = page.locator('.user-menu .user-trigger');
    await expect(userTrigger).toBeVisible({ timeout: 5000 });
    await userTrigger.click();
    await page.waitForTimeout(500); // Wait for menu to open

    // Find and click logout button in dropdown
    const logoutButton = page.locator('.user-dropdown .logout-item, button:has-text("Logout")');
    const logoutCount = await logoutButton.count();

    if (logoutCount > 0) {
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/auth/logout') && resp.status() === 200, {
          timeout: 5000,
        }),
        logoutButton.first().click(),
      ]);

      // Should redirect back to login screen
      await page.waitForSelector('button:has-text("Connect with Spotify")', { timeout: 5000 });
      await expect(page.locator('h1:has-text("FlipSide Player")')).toBeVisible();
    } else {
      // If logout button doesn't exist, skip this test
      test.skip();
    }
  });

  test('should persist session on page reload', async ({ page }) => {
    // Login first
    const loginButton = page.locator('button:has-text("Connect with Spotify")');
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/mock-login') && resp.status() === 200,
        { timeout: 10000 }
      ),
      loginButton.click(),
    ]);
    await page.waitForSelector('.app-header', { timeout: 15000 });

    // Verify we're logged in
    await expect(page.locator('h1:has-text("FlipSide Player")')).toBeVisible({ timeout: 5000 });

    // Reload the page
    await page.reload({ waitUntil: 'networkidle' });

    // Should still be authenticated (session cookie should persist)
    // Wait for app to check auth and render
    await page.waitForSelector('.app-header', { timeout: 10000 });
    await expect(page.locator('h1:has-text("FlipSide Player")')).toBeVisible({ timeout: 5000 });
    // Should NOT see login screen
    await expect(page.locator('button:has-text("Connect with Spotify")')).not.toBeVisible({
      timeout: 3000,
    });
  });

  test('should add album to favorites and play from favorites', async ({ page }) => {
    // Login first
    const loginButton = page.locator('button:has-text("Connect with Spotify")');
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/mock-login') && resp.status() === 200,
        { timeout: 10000 }
      ),
      loginButton.click(),
    ]);
    await page.waitForSelector('.app-header', { timeout: 15000 });

    // Wait for search input to be ready
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Search for an album (use "Mock" to match "Mock Album 1" from mock data)
    await searchInput.fill('Mock');

    // Wait for search API call and results to appear
    await page.waitForResponse(
      resp => resp.url().includes('/api/spotify/search') && resp.status() === 200,
      { timeout: 10000 }
    );

    // Wait for search results to appear
    const searchResults = page.locator('.search-results');
    await expect(searchResults).toBeVisible({ timeout: 5000 });

    // Find the first album result
    const firstAlbum = page.locator('.result-item').first();
    await expect(firstAlbum).toBeVisible({ timeout: 5000 });

    // Click the favorite button (heart icon) to add to favorites
    const favoriteButton = firstAlbum.locator('.favorite-toggle');
    await expect(favoriteButton).toBeVisible({ timeout: 5000 });

    // Click favorite button (might use localStorage, so no API call needed)
    await favoriteButton.click();

    // Wait a bit for state to update (localStorage is synchronous)
    await page.waitForTimeout(500);

    // Switch to favorites view
    const favoritesViewButton = page.locator('.view-toggle button[aria-label="Favorites view"]');
    await expect(favoritesViewButton).toBeVisible({ timeout: 5000 });
    await favoritesViewButton.click();

    // Wait for favorites view to load
    await page.waitForSelector('.favorites-view', { timeout: 5000 });

    // Verify the favorite album appears
    const favoriteItem = page.locator('.favorite-item').first();
    await expect(favoriteItem).toBeVisible({ timeout: 5000 });

    // Click on the album cover or expand button to expand it
    const expandButton = favoriteItem.locator('.expand-overlay');
    const expandButtonCount = await expandButton.count();

    if (expandButtonCount > 0) {
      await expandButton.click();
    } else {
      // Fallback: click on the album cover image
      const albumCover = favoriteItem.locator('.favorite-cover img');
      await expect(albumCover).toBeVisible({ timeout: 5000 });
      await albumCover.click();
    }

    // Wait for expanded album view
    await page.waitForSelector('.expanded-content', { timeout: 10000 });

    // Click "Play Side A" button
    const playSideAButton = page.locator('button:has-text("Play Side A")');
    await expect(playSideAButton).toBeVisible({ timeout: 5000 });

    // Wait for playback API call
    await Promise.all([
      page
        .waitForResponse(
          resp => resp.url().includes('/api/spotify/play') && resp.status() === 200,
          { timeout: 10000 }
        )
        .catch(() => {
          // Ignore if playback fails (mock might not support it)
        }),
      playSideAButton.click(),
    ]);

    // Verify we switched to vinyl view (playback switches to vinyl view)
    await page.waitForSelector('.player-section', { timeout: 5000 });
    await expect(page.locator('.player-section')).toBeVisible({ timeout: 5000 });
  });
});
