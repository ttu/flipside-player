# FlipSide Player - Data Model

## Data Model Overview

FlipSide Player operates primarily as a client for Spotify's services, managing session state, user preferences, and temporary playback data. The application does not store music content but manages user sessions, authentication tokens, and application state.

## Data Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client State                         │
│              (Frontend - Zustand)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Auth Store  │  │Player Store │  │Queue Store  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                              │
                        API Requests
                              │
┌─────────────────────────────────────────────────────────┐
│                  Session Storage                        │
│                 (Backend - Redis)                       │
│           ┌─────────────────────────┐                   │
│           │    User Sessions        │                   │
│           │  - Authentication       │                   │
│           │  - Spotify Tokens       │                   │
│           │  - PKCE Challenges      │                   │
│           └─────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
                              │
                        API Calls
                              │
┌─────────────────────────────────────────────────────────┐
│                  External APIs                          │
│                 (Spotify Services)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Web API    │  │   Web SDK   │  │ Connect API │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Core Entities

### User Session Entity

**Location**: Redis (Server-side)  
**Lifecycle**: 7 days or until logout  
**Purpose**: Maintains authentication and token state

```typescript
interface SessionData {
  userId: string;           // Spotify user ID
  accessToken: string;      // Current access token
  refreshToken: string;     // Token for refreshing access
  tokenExpires: number;     // Token expiration timestamp
}
```

**Key Properties:**
- **userId**: Unique Spotify user identifier
- **accessToken**: Bearer token for Spotify API calls
- **refreshToken**: Long-lived token for obtaining new access tokens
- **tokenExpires**: Unix timestamp indicating when access token expires

**Storage Details:**
- **Redis Key Pattern**: `session:${sessionId}`
- **TTL**: 7 days (604,800 seconds)
- **Serialization**: JSON string
- **Security**: Server-side only, never exposed to client

### PKCE Challenge Entity

**Location**: Redis (Server-side)  
**Lifecycle**: 5 minutes (OAuth flow duration)  
**Purpose**: Secure OAuth code exchange

```typescript
interface PKCEChallenge {
  codeVerifier: string;     // PKCE code verifier
  state: string;           // OAuth state parameter
  createdAt: number;       // Creation timestamp
}
```

**Storage Details:**
- **Redis Key Pattern**: `pkce:${state}`
- **TTL**: 300 seconds (5 minutes)
- **Cleanup**: Automatic expiration and manual deletion after use

## Frontend State Models

### Authentication Store

**Location**: Client memory (Zustand)  
**Lifecycle**: Session duration  
**Purpose**: Track authentication status and user info

```typescript
interface AuthState {
  isAuthenticated: boolean;    // User login status
  user?: SpotifyUser;         // Current user profile
  loading: boolean;           // Authentication check status
}

interface SpotifyUser {
  id: string;                 // Spotify user ID
  display_name?: string;      // User display name
  email?: string;            // User email address
  images?: SpotifyImage[];   // Profile images
  country?: string;          // User country
  followers?: {              // Follower information
    total: number;
  };
  product?: string;          // Subscription type
}
```

### Player Store

**Location**: Client memory (Zustand)  
**Lifecycle**: Session duration  
**Purpose**: Current playback state and control

```typescript
interface PlayerState {
  // Current Track
  currentTrack?: SpotifyTrack;    // Currently playing track
  isPlaying: boolean;             // Playback status
  position: number;               // Current position (ms)
  duration: number;               // Track duration (ms)
  
  // Playback Settings
  volume: number;                 // Volume level (0-100)
  shuffleState: boolean;          // Shuffle enabled
  repeatState: 'off' | 'context' | 'track'; // Repeat mode
  
  // Device Information
  device?: SpotifyDevice;         // Current playback device
  availableDevices: SpotifyDevice[]; // All available devices
  
  // Control State
  loading: boolean;               // Loading/buffering status
  error?: string;                // Playback error message
}

interface SpotifyTrack {
  id: string;                     // Track ID
  name: string;                   // Track name
  artists: SpotifyArtist[];       // Track artists
  album: SpotifyAlbum;           // Album information
  uri: string;                    // Spotify URI
  duration_ms: number;           // Track duration
  preview_url?: string;          // Preview URL
  explicit: boolean;             // Explicit content flag
  popularity: number;            // Track popularity
  is_local: boolean;             // Local file flag
}

interface SpotifyArtist {
  id: string;                     // Artist ID
  name: string;                   // Artist name
  uri: string;                    // Spotify URI
}

interface SpotifyAlbum {
  id: string;                     // Album ID
  name: string;                   // Album name
  images: SpotifyImage[];        // Album artwork
  release_date: string;          // Release date
  total_tracks: number;          // Track count
  uri: string;                    // Spotify URI
}

interface SpotifyImage {
  url: string;                   // Image URL
  width: number;                 // Image width
  height: number;                // Image height
}

interface SpotifyDevice {
  id: string;                    // Device ID
  name: string;                  // Device name
  type: string;                  // Device type
  is_active: boolean;            // Current active device
  is_private_session: boolean;   // Private session flag
  is_restricted: boolean;        // Restricted device
  volume_percent: number;        // Device volume
}
```

### Queue Store

**Location**: Client memory (Zustand)  
**Lifecycle**: Session duration  
**Purpose**: Manage playback queue and track ordering

```typescript
interface QueueState {
  // Queue Management
  tracks: SpotifyTrack[];        // Queued tracks
  currentIndex: number;          // Current track index
  history: SpotifyTrack[];       // Previous tracks
  
  // Queue Operations
  isShuffled: boolean;          // Queue shuffle state
  originalOrder?: SpotifyTrack[]; // Pre-shuffle order
  
  // UI State
  loading: boolean;             // Queue loading status
  error?: string;              // Queue error message
}
```

## Data Relationships

### User → Session Relationship

```
User (Spotify)
    ├── 1:1 Session (Redis)
    │   ├── Authentication Tokens
    │   └── User Preferences
    └── 1:* PKCE Challenges (temporary)
```

### Session → Player State Relationship

```
Session (Server)
    └── 1:1 Player State (Client)
        ├── Current Track
        ├── Playback Settings
        └── Device Information
```

### Player → Queue Relationship

```
Player State (Client)
    └── 1:1 Queue State (Client)
        ├── Upcoming Tracks
        ├── Track History
        └── Queue Metadata
```

## External Data Sources

### Spotify Web API

**Endpoints Used:**
- `GET /me` - User profile information
- `GET /search` - Music catalog search  
- `GET /me/player/devices` - Available playback devices
- `PUT /me/player` - Transfer playback to device
- `GET /me/player/currently-playing` - Current playback state
- `POST /api/token` - Token refresh and exchange

**Data Formats:**
- All responses in JSON format
- Standard Spotify API response schemas
- Rate limited (varies by endpoint)

### Spotify Web SDK

**Real-time Data:**
- Playback state changes
- Track position updates
- Device status changes
- Volume level changes

**Local Storage:**
- Temporary playback tokens
- Device registration data

## Data Flow Patterns

### Authentication Flow

```
1. User clicks login
2. Generate PKCE challenge → Store in Redis (5 min TTL)
3. Redirect to Spotify OAuth
4. Spotify callback with code
5. Exchange code + PKCE for tokens
6. Store session data → Redis (7 day TTL)
7. Delete PKCE challenge from Redis
8. Set session cookie → Client
```

### Token Refresh Flow

```
1. API call detects expired token
2. Retrieve refresh token from session
3. Call Spotify token refresh API
4. Update session with new tokens
5. Retry original API call
6. Return response to client
```

### Playback State Sync

```
1. User action (play, pause, skip)
2. Update client state immediately (optimistic)
3. Send command to Spotify Web SDK
4. Receive state change event from SDK
5. Update client state with confirmed data
6. Handle any conflicts or errors
```

## Data Persistence Strategy

### Session Data
- **Storage**: Redis with TTL
- **Backup**: None (recreated on login)
- **Cleanup**: Automatic expiration
- **Security**: Server-side encryption in transit

### Client State
- **Storage**: Memory only
- **Persistence**: None (rebuilt on page load)
- **Synchronization**: API calls on initialization
- **Cleanup**: Automatic garbage collection

### Temporary Data
- **PKCE Challenges**: 5-minute Redis TTL
- **Search Results**: Client memory, cleared on new search
- **Error States**: Client memory, cleared on retry

## Data Validation

### Runtime Validation

```typescript
// Using Zod for runtime schema validation
const spotifyCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
});

const sessionDataSchema = z.object({
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenExpires: z.number(),
});
```

### Type Safety

- **TypeScript**: Compile-time type checking
- **Zod**: Runtime validation for API boundaries  
- **Interface Contracts**: Consistent data shapes across components

## Performance Considerations

### Data Loading
- **Lazy Loading**: Search results loaded on demand
- **Pagination**: Large datasets split into pages
- **Caching**: Session data cached in Redis

### Memory Management
- **State Cleanup**: Unused data removed from stores
- **Image Optimization**: Album art loaded progressively
- **Queue Limits**: Prevent memory bloat from large queues

### Network Optimization
- **Request Batching**: Multiple API calls combined where possible
- **Debouncing**: Search requests debounced to reduce API calls
- **Error Retry**: Exponential backoff for failed requests

This data model ensures efficient, secure, and performant data management while maintaining clean separation between client state, session persistence, and external API integration.