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

const useSpotifyPlayer = (accessToken: string): UseSpotifyPlayerReturn => {
  // Implementation handles Spotify Web SDK integration
  // State synchronization with Zustand stores
  // Error handling and reconnection logic
};
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
