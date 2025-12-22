# Spotify SDK Mock

This directory contains mocks for the Spotify Web Playback SDK, allowing you to test and develop the application without requiring a real Spotify connection or Premium account.

## Usage

### Basic Setup

```typescript
import { setupSpotifySDKMock, createMockTrack } from './mocks/spotifySDK';

// Setup mock SDK
setupSpotifySDKMock();

// Create a mock track
const mockTrack = createMockTrack({
  name: 'Test Track',
  artists: [{ name: 'Test Artist', uri: 'spotify:artist:test' }],
  duration_ms: 200000,
});
```

### With Options

```typescript
import { setupSpotifySDKMock } from './mocks/spotifySDK';

setupSpotifySDKMock({
  deviceId: 'custom-device-id',
  initialState: {
    paused: false,
    position: 5000,
    track: createMockTrack({ name: 'Currently Playing' }),
  },
  simulateErrors: false, // Set to true to test error handling
});
```

### In Development

You can conditionally load the mock in development:

```typescript
// In App.tsx or main.tsx
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_SDK === 'true') {
  import('./mocks/spotifySDK').then(({ setupSpotifySDKMock }) => {
    setupSpotifySDKMock();
  });
}
```

Then set in `.env`:

```
VITE_USE_MOCK_SDK=true
```

### In Tests

```typescript
import { render, screen } from '@testing-library/react';
import { setupSpotifySDKMock, createMockTrack } from './mocks/spotifySDK';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

beforeEach(() => {
  setupSpotifySDKMock({
    initialState: {
      track: createMockTrack({ name: 'Test Track' }),
    },
  });
});

test('player initializes correctly', async () => {
  // Your test code
});
```

## Mock Features

- ✅ Full Player API implementation
- ✅ Event listeners (ready, state_changed, errors)
- ✅ Playback control (play, pause, skip, seek)
- ✅ Position updates (simulated)
- ✅ Volume control
- ✅ Error simulation
- ✅ Custom device IDs
- ✅ State management

## Cleanup

```typescript
import { cleanupSpotifySDKMock } from './mocks/spotifySDK';

// Cleanup after tests
afterEach(() => {
  cleanupSpotifySDKMock();
});
```
