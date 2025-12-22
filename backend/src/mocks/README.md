# Spotify API Mock

This directory contains mocks for the Spotify Web API, allowing you to test and develop the backend without requiring real Spotify API credentials or network connections.

## Usage

### Basic Setup

```typescript
import { MockSpotifyAPI } from './mocks/spotifyAPI';

// Create mock instance
const spotify = new MockSpotifyAPI();

// Use like real SpotifyAPI
const token = await spotify.exchangeCodeForToken('code', 'verifier');
const user = await spotify.getCurrentUser(token.access_token);
const results = await spotify.search(token.access_token, 'test');
```

### With Options

```typescript
import { MockSpotifyAPI } from './mocks/spotifyAPI';

const spotify = new MockSpotifyAPI({
  simulateErrors: false, // Set to true to test error handling
  delay: 100, // Simulate network delay in milliseconds
});
```

### In Route Handlers

You can conditionally use the mock in development:

```typescript
// In routes/spotify.ts
import { SpotifyAPI } from '../utils/spotify';
import { MockSpotifyAPI } from '../mocks/spotifyAPI';

const useMock = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_SPOTIFY === 'true';

const spotify = useMock
  ? new MockSpotifyAPI()
  : new SpotifyAPI(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!,
      process.env.SPOTIFY_REDIRECT_URI!
    );
```

Then set in `.env`:

```
USE_MOCK_SPOTIFY=true
```

### In Tests

```typescript
import { MockSpotifyAPI } from './mocks/spotifyAPI';
import { SpotifyTrack } from '../types';

describe('Spotify API', () => {
  let mockAPI: MockSpotifyAPI;

  beforeEach(() => {
    mockAPI = new MockSpotifyAPI();
  });

  test('search returns results', async () => {
    const results = await mockAPI.search('mock-token', 'test');
    expect(results.tracks.items.length).toBeGreaterThan(0);
  });

  test('can add custom tracks', async () => {
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
    const results = await mockAPI.search('mock-token', 'Custom');
    expect(results.tracks.items).toContainEqual(customTrack);
  });
});
```

## Mock Features

- ✅ All SpotifyAPI methods implemented
- ✅ Mock data (tracks, devices, albums)
- ✅ Error simulation
- ✅ Network delay simulation
- ✅ Customizable mock data
- ✅ Helper methods for testing

## Helper Methods

```typescript
// Add custom tracks
mockAPI.addMockTrack(customTrack);

// Add custom devices
mockAPI.addMockDevice(customDevice);

// Clear all mock data
mockAPI.clearMockData();

// Toggle error simulation
mockAPI.setSimulateErrors(true);
```

## Mock Data

The mock comes with default data:

- 2 mock tracks
- 2 mock devices (Web Player and Phone)
- Mock user profile
- Mock albums

You can extend this data using the helper methods above.
