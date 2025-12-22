# FlipSide Player - Frontend Documentation

## UI/UX Overview

FlipSide Player recreates the tangible, ritualistic experience of vinyl record playing through a modern web interface. The design emphasizes large visuals, tactile interactions, and a focus on the music and artwork rather than overwhelming controls.

## Design Philosophy

### Core Principles

1. **Vinyl-First Aesthetics**: Visual design inspired by turntables, vinyl records, and analog equipment
2. **Content-Forward**: Album artwork and music information take center stage
3. **Tactile Interactions**: Controls feel physical and responsive, mimicking real equipment
4. **Minimal Distraction**: Clean interface that doesn't compete with the music experience
5. **Responsive Design**: Works beautifully on both desktop and mobile devices

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                   Primary Focus                         │
│              Album Art + Vinyl Deck                     │
│                  (60% of screen)                        │
├─────────────────────────────────────────────────────────┤
│                 Secondary Focus                         │
│            Track Listing + Controls                     │
│                  (25% of screen)                        │
├─────────────────────────────────────────────────────────┤
│                 Tertiary Focus                          │
│         Premium Warning + Search + Device Controls      │
│                  (15% of screen)                        │
└─────────────────────────────────────────────────────────┘
```

## Screen Layouts & Components

### Main Player View

The primary interface focusing on current track playback and control.

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  [🔍 Search] [🔊 Device] [👤 Profile] [⚙️ Settings]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              ┌─────────────────┐                        │
│              │                 │                        │
│              │   Vinyl Deck    │                        │
│              │   Component     │                        │
│              │  (Spinning      │                        │
│              │   Record +      │                        │
│              │  Album Art)     │                        │
│              │                 │                        │
│              └─────────────────┘                        │
│                                                         │
│         Artist Name - Track Title                       │
│              Album Name                                 │
│                                                         │
│    [⏮️] [⏯️] [⏭️]     [🔀] [🔁] [💖]                  │
│                                                         │
│ ═══════════════════════════════                         │
│  0:32 ────●──────── -2:45      [🔊──●────]           │
├─────────────────────────────────────────────────────────┤
│                Queue Strip                              │
│  [Track] [Track] [Track] [▶️Current] [Track] [Track]   │
└─────────────────────────────────────────────────────────┘
```

#### Key Components

**Vinyl Deck Component**

- Large circular vinyl record with album artwork as label
- Smooth rotation animation during playback
- Responsive size (scales with screen size)
- Subtle shadows and 3D effects for depth

**Track Information**

- Artist name (primary, larger font)
- Track title (secondary, medium font)
- Album name (tertiary, smaller font)
- Clean, hierarchical typography

**Playback Controls**

- Large, circular play/pause button (primary action)
- Skip forward/backward (secondary actions)
- Shuffle, repeat, favorite (tertiary actions)
- Spotify Connect device selector
- Volume slider

**Progress Indicator**

- Visual progress bar with current position
- Time elapsed and remaining
- Draggable position control

**Premium Warning**

- Dismissible notification for non-premium Spotify accounts
- Explains premium requirement for playbook control
- Direct link to Spotify Premium upgrade page
- Close button for user dismissal

### Search Interface

Modal or slide-out interface for discovering and adding music.

#### Search Layout

```
┌─────────────────────────────────────────────────────────┐
│  🔍 [Search Spotify catalog...]          [✕ Close]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────┐  Artist Name - Track Title                     │
│  │ Art │  Album Name • Year                             │
│  └─────┘  Duration    [▶️ Play Album]                   │
│                                                         │
│  ┌─────┐  Artist Name - Album Title                     │
│  │ Art │  Artist Name • Year • Track Count              │
│  └─────┘  Duration    [▶️ Play Album]                   │
│                                                         │
│  ┌─────┐  Artist Name - Album Title                     │
│  │ Art │  Artist Name • Year • Track Count              │
│  └─────┘  Duration    [▶️ Play Album]                   │
│                                                         │
│                    [Load More]                          │
└─────────────────────────────────────────────────────────┘
```

### Device Selection Interface

Interface for managing Spotify Connect devices.

#### Device Layout

```
┌─────────────────────────────────────────────────────────┐
│         Available Devices          [✕ Close]           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🖥️  MacBook Pro                    [▶️ Playing]       │
│      This Device                                        │
│                                                         │
│  📱  iPhone                         [Connect]           │
│      Available                                          │
│                                                         │
│  🔊  Living Room Speaker            [Connect]           │
│      Available                                          │
│                                                         │
│  🎧  AirPods Pro                    [Connect]           │
│      Available                                          │
└─────────────────────────────────────────────────────────┘
```

## Component Design System

### Typography

```css
/* Primary Text (Artist Names) */
font-family: Inter, sans-serif;
font-size: 2rem;
font-weight: 600;
line-height: 1.2;

/* Secondary Text (Track Titles) */
font-family: Inter, sans-serif;
font-size: 1.5rem;
font-weight: 500;
line-height: 1.3;

/* Tertiary Text (Album Names, Meta) */
font-family: Inter, sans-serif;
font-size: 1rem;
font-weight: 400;
line-height: 1.4;

/* UI Text (Buttons, Labels) */
font-family: Inter, sans-serif;
font-size: 0.875rem;
font-weight: 500;
line-height: 1.4;
```

### Color Palette

```css
/* Primary Colors */
--primary-bg: #0f0f0f; /* Deep black background */
--secondary-bg: #1a1a1a; /* Card/component backgrounds */
--accent-bg: #2a2a2a; /* Hover states, borders */

/* Text Colors */
--text-primary: #ffffff; /* Main text, artist names */
--text-secondary: #b3b3b3; /* Secondary text, track info */
--text-tertiary: #6b7280; /* Meta text, timestamps */

/* Accent Colors */
--spotify-green: #1db954; /* Primary actions, Spotify branding */
--vinyl-gold: #d4af37; /* Vinyl-inspired accent color */
--error-red: #ef4444; /* Error states */
--warning-yellow: #f59e0b; /* Warning states */

/* Component Colors */
--vinyl-black: #1c1c1c; /* Vinyl record surface */
--vinyl-label: #8b5a2b; /* Vinyl record label */
--progress-bg: #404040; /* Progress bar background */
--progress-fill: #1db954; /* Progress bar fill */
```

### Button Styles

```css
/* Primary Button (Play/Pause) */
.btn-primary {
  background: linear-gradient(145deg, #1db954, #1ed760);
  border-radius: 50%;
  width: 4rem;
  height: 4rem;
  box-shadow: 0 4px 20px rgba(29, 185, 84, 0.3);
}

/* Secondary Button (Skip, Controls) */
.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  backdrop-filter: blur(10px);
}

/* Text Button (Add to Queue) */
.btn-text {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
}
```

## State Management (Frontend)

### Zustand Store Architecture

```typescript
// Authentication Store
interface AuthState {
  isAuthenticated: boolean;
  user?: SpotifyUser;
  loading: boolean;
  // Actions
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Player Store
interface PlayerState {
  // Current Track
  currentTrack?: SpotifyTrack;
  isPlaying: boolean;
  position: number;
  duration: number;

  // Playback Settings
  volume: number;
  shuffleState: boolean;
  repeatState: 'off' | 'context' | 'track';

  // Device Information
  device?: SpotifyDevice;
  availableDevices: SpotifyDevice[];

  // Actions
  play: () => void;
  pause: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  setVolume: (volume: number) => void;
}

// Queue Store
interface QueueState {
  tracks: SpotifyTrack[];
  currentIndex: number;
  history: SpotifyTrack[];

  // Actions
  addToQueue: (track: SpotifyTrack) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
}
```

## Interaction Patterns

### Vinyl Deck Interactions

**Visual States:**

- **Stopped**: Static record, no rotation
- **Playing**: Smooth 33⅓ RPM rotation animation
- **Loading**: Subtle pulse effect while loading track

**Interactive Elements:**

- **Click to Play/Pause**: Center of vinyl acts as play button
- **Hover Effects**: Subtle scale and glow on hover
- **Loading States**: Shimmer effect while track loads

### Queue Management

**Drag and Drop:**

- Visual feedback during drag operations
- Drop zones with clear visual indicators
- Smooth animations for reordering

**Add to Queue:**

- Instant visual feedback when adding tracks
- Toast notifications for user confirmation
- Queue updates with smooth transitions

### Device Switching

**Connection Flow:**

- Clear status indicators for each device
- Loading states during connection
- Success/error feedback for connection attempts

## Responsive Design

### Breakpoints

```css
/* Mobile: 320px - 767px */
@media (max-width: 767px) {
  /* Vertical layout, stacked components */
  /* Smaller vinyl deck, simplified controls */
}

/* Tablet: 768px - 1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  /* Adjusted proportions for tablet viewing */
  /* Side-by-side layout for some components */
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  /* Full layout with all components visible */
  /* Optimal spacing and proportions */
}
```

### Mobile Adaptations

- **Vinyl Deck**: Reduced size but remains central focus
- **Controls**: Larger touch targets for finger interaction
- **Queue**: Horizontal scrolling with swipe gestures
- **Search**: Full-screen modal for better mobile experience
- **Navigation**: Tab-based bottom navigation

## Animation & Transitions

### Vinyl Rotation

```css
@keyframes vinyl-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.vinyl-playing {
  animation: vinyl-spin 1.8s linear infinite;
}
```

### Page Transitions

- **Smooth fade-in**: New content appears with gentle opacity transition
- **Slide transitions**: Modal and drawer-style components slide in/out
- **Micro-animations**: Button presses, hover effects, loading states

### Loading States

- **Skeleton screens**: Content placeholders during loading
- **Progressive loading**: Images and data load in priority order
- **Smooth state changes**: No jarring jumps between loading/loaded states

## Spotify Web Playback SDK Integration

FlipSide Player uses the **Spotify Web Playback SDK** for direct browser-based music playback. The SDK provides real-time playback control, state synchronization, and device management without requiring the Spotify desktop app.

### SDK Loading & Initialization

The SDK is loaded dynamically from Spotify's CDN when the user is authenticated:

```typescript
// App.tsx - SDK Loading
useEffect(() => {
  if (!isAuthenticated) return;

  const script = document.createElement('script');
  script.src = 'https://sdk.scdn.co/spotify-player.js';
  script.async = true;
  document.body.appendChild(script);

  window.onSpotifyWebPlaybackSDKReady = () => {
    console.log('Spotify Web Playback SDK Ready');
    setSdkReady(true);
  };

  return () => {
    if (document.body.contains(script)) {
      document.body.removeChild(script);
    }
    setSdkReady(false);
  };
}, [isAuthenticated]);
```

**Key Points:**

- SDK is **not available as an npm package** - must be loaded via script tag
- Loaded only after user authentication
- Global callback `onSpotifyWebPlaybackSDKReady` signals when SDK is ready
- Script is cleaned up on component unmount

### Player Initialization

The player is initialized in the `useSpotifyPlayer` hook once the SDK is ready:

```typescript
// useSpotifyPlayer.ts - Player Setup
const player = new window.Spotify.Player({
  name: 'FlipSide Player',
  getOAuthToken: async (cb: (token: string) => void) => {
    try {
      const token = await getSpotifyToken(); // Fetches from backend /api/spotify/token
      cb(token);
    } catch (error) {
      console.error('Failed to get OAuth token:', error);
    }
  },
  volume: playerStore.volume,
});
```

**Configuration:**

- **name**: Device name shown in Spotify Connect
- **getOAuthToken**: Callback that provides fresh access tokens (required for SDK)
- **volume**: Initial volume level (0.0 to 1.0)

### Event Listeners

The SDK uses an event-driven architecture for state updates:

#### Ready Event

```typescript
player.addListener('ready', ({ device_id }) => {
  console.log('Spotify Player ready with device ID:', device_id);
  playerStore.setDeviceId(device_id);
  playerStore.setPlayerReady(true);

  // Transfer playback to this web player
  transferPlayback(device_id, true).catch(err => {
    console.error('Failed to transfer playback to Web Player:', err);
  });
});
```

#### Player State Changed

```typescript
player.addListener('player_state_changed', state => {
  if (!state) return;

  const track = state.track_window.current_track;
  const spotifyTrack = track
    ? {
        id: track.id || '',
        name: track.name || '',
        artists: track.artists || [],
        album: {
          id: track.album?.uri?.split(':')[2] || '',
          name: track.album?.name || '',
          images:
            track.album?.images?.map(img => ({
              url: img.url,
              width: img.width || 640,
              height: img.height || 640,
            })) || [],
        },
        uri: track.uri || '',
        duration_ms: track.duration_ms || 0,
      }
    : null;

  playerStore.updatePlaybackState({
    isPlaying: !state.paused,
    positionMs: state.position,
    durationMs: state.duration,
    track: spotifyTrack,
  });
});
```

#### Error Events

```typescript
player.addListener('initialization_error', ({ message }) => {
  console.error('Spotify Player initialization error:', message);
});

player.addListener('authentication_error', ({ message }) => {
  console.error('Spotify Player authentication error:', message);
});

player.addListener('account_error', ({ message }) => {
  console.error('Spotify Player account error:', message);
  // Usually indicates Premium subscription required
});

player.addListener('playback_error', ({ message }) => {
  console.error('Spotify Player playback error:', message);
});
```

### Playback Control Methods

The SDK provides direct methods for playback control:

```typescript
// Play/Pause
await player.togglePlay();
await player.resume();
await player.pause();

// Track Navigation
await player.nextTrack();
await player.previousTrack();

// Seeking
await player.seek(positionMs); // Position in milliseconds

// Volume Control
await player.setVolume(volume); // 0.0 to 1.0
const currentVolume = await player.getVolume();

// State Queries
const state = await player.getCurrentState();
```

**Note**: These SDK methods control the **Web Player device** directly. For controlling other Spotify Connect devices, use the Web API endpoints (see Backend documentation).

### State Synchronization

The app uses a **dual-state approach**:

1. **SDK State (Primary)**: Real-time updates from `player_state_changed` events
2. **Polling (Fallback)**: Periodic `getCurrentState()` calls every 1 second as a safety net

```typescript
// Polling interval for state updates
pollingIntervalRef.current = window.setInterval(async () => {
  try {
    const state = await player.getCurrentState();
    if (!state) {
      console.warn('Web Player state is null - device might be disconnected');
      return;
    }
    // Update Zustand store with current state
    playerStore.updatePlaybackState({...});
  } catch (err) {
    console.warn('Polling error - device may be disconnected:', err);
    ensureActiveDeviceWithRetry(2, 500);
  }
}, 1000);
```

### Device Management

The Web Player appears as a Spotify Connect device. The app ensures it becomes the active device:

```typescript
const ensureActiveDeviceWithRetry = async (maxAttempts = 5, delayMs = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const devices = await getDevices(); // Backend API call
      const list = devices?.devices || [];

      if (list.length > 0) {
        // Prefer the Web Player (SDK) device
        const sdkId = playerStore.deviceId;
        const webPlayer =
          list.find((d: any) => d.id === sdkId) ||
          list.find((d: any) => (d.name || '').toLowerCase().includes('flipside')) ||
          list.find((d: any) => (d.name || '').toLowerCase().startsWith('web player'));

        const target = webPlayer || list[0];
        await transferPlayback(target.id, true); // Backend API call
        playerStore.setDeviceId(target.id);
        return;
      }
    } catch (_) {
      // Retry on error
    }
    await new Promise(res => setTimeout(res, delayMs));
  }
};
```

### Connection Management

The player connects and disconnects based on component lifecycle:

```typescript
// Connect to player
player.connect().then(success => {
  if (success) {
    console.log('Successfully connected to Spotify Player');
    // Start polling and ensure device is active
  } else {
    console.error('Failed to connect to Spotify Player');
  }
});

// Cleanup on unmount
return () => {
  player.disconnect();
  playerStore.setPlayer(null);
  playerStore.setPlayerReady(false);
  if (pollingIntervalRef.current) {
    clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = null;
  }
};
```

### Browser Visibility Handling

The app handles browser tab visibility changes to reconnect when the tab becomes visible:

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && playerStore.player && playerStore.deviceId) {
      console.log('Tab became visible - ensuring Web Player is active');
      setTimeout(() => {
        ensureActiveDeviceWithRetry(3, 1000);
      }, 2000);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [playerStore.player, playerStore.deviceId, ensureActiveDeviceWithRetry]);
```

### SDK Capabilities & Limitations

**What the SDK CAN do:**

- Control playback on the **Web Player device only** (play, pause, skip, seek, volume)
- Receive real-time state updates via event listeners
- Get current playback state (track, position, duration)
- Manage the Web Player device connection

**What the SDK CANNOT do:**

- ❌ **Search** for tracks, albums, or artists (requires Web API)
- ❌ **Fetch album data** or track metadata (requires Web API)
- ❌ **List devices** or manage Spotify Connect devices (requires Web API)
- ❌ **Transfer playback** to other devices (requires Web API)
- ❌ **Control other devices** (phone, desktop app, etc.) - only the Web Player

**SDK Requirements:**

1. **Premium Subscription Required**: The Web Playback SDK only works with Spotify Premium accounts
2. **Browser Support**: Modern browsers with Web Audio API support
3. **Token Refresh**: Tokens must be refreshed via `getOAuthToken` callback when expired
4. **Single Device**: One Web Player instance per browser tab/window
5. **No Offline Playback**: Requires active internet connection

### Integration with Backend API

The frontend uses **both** SDK and Web API for different purposes:

**Spotify Web Playback SDK:**

- Direct playback control of the Web Player device
- Real-time state updates via event listeners
- Current track information and playback position

**Spotify Web API (via backend):**

- Search functionality (tracks, albums, artists)
- Album data and track metadata
- Device management (list devices, transfer playback)
- Cross-device control (control phone, desktop app, etc.)

**Why Both Are Needed:**
The SDK is **limited to controlling only the Web Player device**. For all other functionality (search, device management, cross-device control), the app must use the Web API through the backend proxy.

#### Frontend API Utilities

The frontend provides utility functions that call backend endpoints:

```typescript
// frontend/src/utils/spotify.ts

// Search functionality
export async function searchTracks(query: string, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: limit.toString(),
  });
  const response = await fetch(`${API_BASE_URL}/spotify/search?${params.toString()}`, {
    credentials: 'include', // Sends session cookie
  });
  return response.json();
}

export async function searchAlbums(query: string, limit = 20) {
  // Similar to searchTracks with type: 'album'
}

// Album data
export async function getFullAlbum(albumId: string) {
  const response = await fetch(`${API_BASE_URL}/spotify/albums/${albumId}`, {
    credentials: 'include',
  });
  return response.json();
}

// Device management
export async function getDevices() {
  const response = await fetch(`${API_BASE_URL}/spotify/devices`, {
    credentials: 'include',
  });
  return response.json();
}

export async function transferPlayback(deviceId: string, play = true) {
  const response = await fetch(`${API_BASE_URL}/spotify/transfer-playback`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ deviceId, play }),
  });
  return response.json();
}

// Token for SDK
export async function getSpotifyToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/spotify/token`, {
    credentials: 'include',
  });
  return response.text(); // Returns plain text token
}

// Playback control (Web API - for cross-device)
export async function pausePlayback() {
  const res = await fetch(`${API_BASE_URL}/spotify/pause`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Pause failed');
}

export async function resumePlayback(deviceId?: string) {
  const res = await fetch(`${API_BASE_URL}/spotify/play`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deviceId ? { deviceId } : {}),
  });
  if (!res.ok) throw new Error('Play failed');
}

export async function nextTrack() {
  const res = await fetch(`${API_BASE_URL}/spotify/next`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Next failed');
}

export async function previousTrack() {
  const res = await fetch(`${API_BASE_URL}/spotify/previous`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Previous failed');
}

export async function setVolumePercent(volume0to1: number) {
  const res = await fetch(`${API_BASE_URL}/spotify/volume`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volume: Math.round(volume0to1 * 100) }),
  });
  if (!res.ok) throw new Error('Volume failed');
}

export async function startPlayback(deviceId?: string, uris?: string[]) {
  const res = await fetch(`${API_BASE_URL}/spotify/play`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, uris }),
  });
  if (!res.ok) throw new Error('Start playback failed');
}
```

**Key Points:**

- All requests use `credentials: 'include'` to send session cookies
- Backend handles authentication and token refresh automatically
- Errors are thrown for failed requests (handled by components)
- API base URL is configurable via `VITE_API_BASE_URL` environment variable

#### When to Use SDK vs Web API

**Use Spotify Web Playback SDK when:**

- ✅ Controlling the **Web Player device** directly (the only device it can control)
- ✅ Needing real-time state updates via event listeners
- ✅ Playing music in the browser through the Web Player
- ✅ Requiring immediate playback feedback for the Web Player

**Use Web API (via backend) when:**

- ✅ **Searching** for tracks/albums/artists (SDK cannot do this)
- ✅ **Fetching album data** or track metadata (SDK cannot do this)
- ✅ **Listing devices** or managing Spotify Connect devices (SDK cannot do this)
- ✅ **Transferring playback** to other devices (SDK cannot do this)
- ✅ **Controlling other devices** (phone, desktop app, speakers) - SDK only controls Web Player
- ✅ Starting playback with specific URIs or positions on any device

**Important Distinction:**

- **SDK**: Only controls the **Web Player device** (the browser-based player)
- **Web API**: Required for **everything else** - search, data fetching, device management, cross-device control

**Hybrid Approach:**
The app uses both simultaneously because they serve different purposes:

- **SDK**: Web Player control and real-time state (limited to one device)
- **Web API**: All other functionality (search, data, device management, cross-device control)
- Backend ensures tokens are valid for both SDK and API calls

See Backend documentation for detailed Web API endpoint documentation.

## Custom Hooks

### useSpotifyPlayer Hook

```typescript
interface UseSpotifyPlayerReturn {
  player: Spotify.Player | null;
  isReady: boolean;
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  position: number;
  device: SpotifyDevice | null;

  // Controls
  play: () => Promise<void>;
  pause: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
}

const useSpotifyPlayer = (sdkReady?: boolean): UseSpotifyPlayerReturn => {
  // Implementation handles Spotify Web SDK integration
  // State synchronization with Zustand stores
  // Error handling and reconnection logic
  // Device management and state polling
};
```

**Usage:**

```typescript
// In App.tsx
const [sdkReady, setSdkReady] = useState(false);
useSpotifyPlayer(sdkReady); // Hook manages SDK initialization
```

### useDebounce Hook

```typescript
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

## Performance Optimization

### Component Optimization

```typescript
// Memoized components for expensive renders
const VinylDeck = memo(({ track, isPlaying }) => {
  return (
    <div className={`vinyl-deck ${isPlaying ? 'playing' : ''}`}>
      <img src={track.album.images[0]?.url} alt={track.album.name} />
    </div>
  );
});

// Optimized list rendering
const QueueList = ({ tracks }) => {
  return (
    <div className="queue-list">
      {tracks.map((track, index) => (
        <QueueItem
          key={track.id}
          track={track}
          index={index}
        />
      ))}
    </div>
  );
};
```

### Image Handling

```typescript
const AlbumArt = ({ src, alt, size = 'medium' }) => (
  <img
    src={src}
    alt={alt}
    className={`album-art album-art-${size}`}
    loading="lazy"
    decoding="async"
    onError={(e) => {
      e.target.src = '/fallback-album.png';
    }}
  />
);
```

## Error Handling

### Error Boundaries

```typescript
class MusicPlayerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Music player error:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### API Error Handling

```typescript
const useSpotifyAPI = () => {
  const handleAPIError = (error: Error) => {
    if (error.name === 'NetworkError') {
      // Show network error message
      toast.error('Network connection lost. Please check your internet.');
    } else if (error.message.includes('401')) {
      // Redirect to login
      window.location.href = '/api/auth/spotify/start';
    } else {
      // Generic error
      toast.error('Something went wrong. Please try again.');
    }
  };

  return { handleAPIError };
};
```

## Configuration

### Environment Variables

The frontend uses Vite environment variables for configuration:

```bash
# API Configuration
VITE_API_BASE_URL=/api                    # Development (same-origin)
# VITE_API_BASE_URL=https://backend.com/api  # Production (cross-domain)

# Authentication Configuration
VITE_AUTH_BASE_URL=/api                   # Development (same-origin)
# VITE_AUTH_BASE_URL=https://backend.com/api # Production (cross-domain)

# App Configuration
VITE_APP_NAME="FlipSide Player"
```

### Deployment Configurations

#### Single-Origin Deployment

```bash
VITE_API_BASE_URL=/api
VITE_AUTH_BASE_URL=/api
```

#### Cross-Domain Deployment

```bash
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_AUTH_BASE_URL=https://your-backend-domain.com/api
```

### Build-Time Variables

All `VITE_*` variables are embedded at build time and become available via `import.meta.env`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || API_BASE_URL;
```

## Accessibility Features

### Keyboard Navigation

- Full keyboard navigation support with Tab/Shift+Tab
- Focus indicators on all interactive elements
- Skip links for screen readers
- Arrow key navigation in lists

### Screen Reader Support

- Proper ARIA labels and descriptions
- Live regions for dynamic content updates
- Semantic HTML structure
- Role attributes for custom controls

### Visual Accessibility

- High contrast ratios (WCAG AA compliant)
- Color is not the only way to convey information
- Scalable interface for zoom levels up to 200%
- Reduced motion preferences respected

### Motor Accessibility

- Large touch targets (minimum 44px)
- No required precise movements
- All functionality available via keyboard
- Generous click/tap areas

This frontend documentation provides comprehensive guidance for developing, maintaining, and extending FlipSide Player's user interface while ensuring accessibility and performance standards are met.
