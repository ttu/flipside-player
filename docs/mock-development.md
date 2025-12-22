# Mock Development Guide

This guide explains how to develop and test FlipSide Player without requiring a real Spotify connection, Premium account, or API credentials.

## Overview

FlipSide Player includes comprehensive mocks for:

- **Spotify Web Playback SDK** (frontend)
- **Spotify Web API** (backend)

These mocks allow you to:

- Develop without Spotify Premium
- Test without network connection
- Work without API credentials
- Test error scenarios
- Use consistent test data

## Quick Start

### Local Development with Mocks

```bash
# Start development with mocks enabled
npm run dev:mock
```

This will:

- Start backend with `USE_MOCK_SPOTIFY=true`
- Start frontend with `VITE_USE_MOCK_SDK=true`
- Use mock implementations instead of real Spotify APIs

### Docker Development with Mocks

```bash
# Start Docker containers with mocks
npm run docker:mock
```

This uses `docker-compose.mock.yml` which automatically enables mocks.

## Setup

### Environment Variables

**No setup required!** Environment variables are automatically configured:

- **Local development**: Set via npm scripts (`npm run dev:mock`)
- **Docker**: Set in `docker-compose.mock.yml` environment section

### Optional: Custom Environment Variables

If you need to override default values, you can:

1. **For Docker**: Uncomment the `env_file` sections in `docker-compose.mock.yml` and create `.env.mock` files
2. **For local dev**: Set environment variables inline when running commands

### Manual Setup

If you want to manually enable mocks without npm scripts:

**Backend:**

```bash
USE_MOCK_SPOTIFY=true npm run dev --workspace=backend
```

**Frontend:**

```bash
VITE_USE_MOCK_SDK=true npm run dev --workspace=frontend
```

## Available Commands

### Root Level Commands

```bash
# Development with mocks
npm run dev:mock

# Individual services with mocks
npm run backend:dev:mock
npm run frontend:dev:mock

# Docker with mocks
npm run docker:mock
```

### Docker Commands

```bash
# Start mock development environment
npm run docker:mock

# View logs
docker-compose -f docker-compose.mock.yml logs -f

# Stop containers
docker-compose -f docker-compose.mock.yml down

# Clean volumes
docker-compose -f docker-compose.mock.yml down -v
```

## Mock Features

### Frontend SDK Mock

The mock SDK provides:

- ✅ Full Player API implementation
- ✅ Event listeners (ready, state_changed, errors)
- ✅ Playback control (play, pause, skip, seek, volume)
- ✅ Position updates (simulated)
- ✅ Error simulation
- ✅ Custom device IDs

**Default Mock Track:**

- Name: "Mock Track"
- Artist: "Mock Artist"
- Duration: 3 minutes
- Album artwork: Placeholder image

### Backend API Mock

The mock API provides:

- ✅ All SpotifyAPI methods
- ✅ Mock search results
- ✅ Mock devices (Web Player, Phone)
- ✅ Mock user profile
- ✅ Mock albums and tracks
- ✅ Error simulation
- ✅ Network delay simulation

**Default Mock Data:**

- 2 mock tracks
- 2 mock devices
- 1 mock user profile
- Mock albums

## Customizing Mocks

### Frontend: Custom Tracks

```typescript
import { setupSpotifySDKMock, createMockTrack } from './mocks/spotifySDK';

const customTrack = createMockTrack({
  name: 'My Custom Track',
  artists: [{ name: 'My Artist', uri: 'spotify:artist:custom' }],
  duration_ms: 240000,
  album: {
    uri: 'spotify:album:custom',
    name: 'Custom Album',
    images: [{ url: 'https://example.com/artwork.jpg', width: 640, height: 640 }],
  },
});

setupSpotifySDKMock({
  initialState: {
    track: customTrack,
  },
});
```

### Backend: Custom Data

```typescript
import { MockSpotifyAPI } from './mocks/spotifyAPI';
import { SpotifyTrack } from '../types';

const mockAPI = new MockSpotifyAPI();

// Add custom track
const customTrack: SpotifyTrack = {
  id: 'custom-track',
  name: 'Custom Track',
  artists: [{ name: 'Custom Artist' }],
  album: {
    id: 'custom-album',
    name: 'Custom Album',
    images: [],
  },
  uri: 'spotify:track:custom-track',
  duration_ms: 180000,
};

mockAPI.addMockTrack(customTrack);
```

## Testing with Mocks

### Unit Tests

```typescript
import { setupSpotifySDKMock } from './mocks/spotifySDK';
import { MockSpotifyAPI } from './mocks/spotifyAPI';

beforeEach(() => {
  setupSpotifySDKMock();
});

test('player initializes', () => {
  // Test with mock SDK
});
```

### Integration Tests

```typescript
import { MockSpotifyAPI } from './mocks/spotifyAPI';

const mockAPI = new MockSpotifyAPI({
  simulateErrors: false,
  delay: 0,
});

test('search returns results', async () => {
  const results = await mockAPI.search('mock-token', 'test');
  expect(results.tracks.items.length).toBeGreaterThan(0);
});
```

## Switching Between Mock and Real

### Development Workflow

1. **Start with mocks** for initial development

   ```bash
   npm run dev:mock
   ```

2. **Switch to real** when testing Spotify integration

   ```bash
   npm run dev
   ```

3. **Use mocks** for automated testing
   ```bash
   npm test  # (when tests are set up)
   ```

### Environment-Based Switching

The app automatically detects mock mode via environment variables:

- `USE_MOCK_SPOTIFY=true` → Backend uses mock API
- `VITE_USE_MOCK_SDK=true` → Frontend uses mock SDK

If these are not set, the app uses real Spotify APIs.

## Limitations

### Mock SDK Limitations

- No real audio playback
- Simulated position updates (not real-time)
- Limited device management
- No cross-device synchronization

### Mock API Limitations

- No real search results
- Limited catalog data
- No real user data
- No actual playback control

## Troubleshooting

### Mocks Not Loading

1. **Check environment variables:**
   - Local dev: Verify you're using `npm run dev:mock` (not `npm run dev`)
   - Docker: Check `docker-compose.mock.yml` has `USE_MOCK_SPOTIFY=true` and `VITE_USE_MOCK_SDK=true`

2. **Check console logs:**
   - Backend: Look for "🎭 Using Mock Spotify API"
   - Frontend: Look for "🎭 Using Mock Spotify SDK"

3. **Verify mock mode is enabled:**
   - Local: Use `npm run dev:mock` or `npm run backend:dev:mock` / `npm run frontend:dev:mock`
   - Docker: Use `npm run docker:mock` (not `npm run docker:dev`)

### Mock Data Not Appearing

- Clear browser cache
- Restart development servers
- Check mock initialization in console

### Switching Back to Real APIs

1. Remove or set to `false`:
   - `USE_MOCK_SPOTIFY=false`
   - `VITE_USE_MOCK_SDK=false`

2. Restart servers

3. Ensure real Spotify credentials are in `.env` files

## Best Practices

1. **Use mocks for:**
   - Initial development
   - UI/UX testing
   - Automated tests
   - Offline development

2. **Use real APIs for:**
   - Integration testing
   - End-to-end testing
   - Production deployment
   - Spotify feature validation

3. **Keep mocks updated:**
   - Match real API interfaces
   - Update when Spotify API changes
   - Test mock implementations

## See Also

- [Frontend Mock README](../frontend/src/mocks/README.md)
- [Backend Mock README](../backend/src/mocks/README.md)
- [Debugging Guide](debugging.md)
- [Development Guide](development.md)
