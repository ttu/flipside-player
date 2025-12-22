# FlipSide Player - Backend Documentation

## API Endpoints & Service Architecture

This document covers the backend API design, authentication flow, service architecture, and implementation details for FlipSide Player's Fastify server.

## Session Management

### Frontend-Backend Authentication

**No Custom Tokens**: FlipSide Player does **not** use custom JWT tokens or application-specific tokens for frontend-backend communication. Instead, it uses **session-based authentication** with HttpOnly cookies.

**Authentication Flow:**

1. User logs in via Spotify OAuth
2. Backend creates a session and stores Spotify tokens server-side
3. Backend sets an HttpOnly session cookie in the browser
4. Frontend sends this cookie with every request (`credentials: 'include'`)
5. Backend validates the session cookie and retrieves stored Spotify tokens

**Why Session Cookies Instead of Tokens?**

- ✅ **Security**: Tokens never exposed to frontend JavaScript (HttpOnly cookies)
- ✅ **Simplicity**: No token management in frontend code
- ✅ **Server-Side Control**: Backend manages all Spotify token refresh logic
- ✅ **No CORS Issues**: Same-origin requests eliminate CORS complexity (with reverse proxy)

### Session Cookie Implementation

FlipSide Player uses `@fastify/secure-session` for secure, server-side session management with the following configuration:

**Session Configuration:**

```typescript
await fastify.register(secureSession, {
  key: Buffer.from(sessionSecret, 'utf8').subarray(0, 32), // 32-byte cryptographic key
  cookieName: 'sessionId',
  cookie: {
    secure: isProduction, // HTTPS-only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    sameSite: isProduction ? 'none' : 'lax', // Cross-domain support in production
    path: '/',
  },
});
```

**Session Storage & Retrieval:**

```typescript
// Store session data (OAuth callback)
request.session.set('user', {
  userId: user.id,
  accessToken: tokens.access_token,
  refreshToken: tokens.refresh_token,
  tokenExpires: Date.now() + tokens.expires_in * 1000,
});

// Retrieve session data (API endpoints)
const sessionData = request.session.get('user');
if (!sessionData?.userId) {
  return reply.code(401).send({ error: 'Not authenticated' });
}
```

**Cross-Domain Cookie Considerations:**

- Production uses `sameSite: 'none'` + `secure: true` for cross-domain HTTPS
- Development uses `sameSite: 'lax'` for same-origin requests
- `httpOnly: true` prevents JavaScript access (security best practice)
- Session key must be exactly 32 bytes for proper encryption

**Environment Variables:**

- `SESSION_SECRET`: Minimum 32 characters for key generation
- `FRONTEND_URL`: Sets CORS origin for cross-domain cookie support

## API Overview

### Base URL & Structure

- **Development**: `http://localhost:5174/api`
- **Production Single-Origin**: `https://your-domain.com/api`
- **Production Cross-Domain**: `https://your-backend-domain.com/api`
- **Route Prefix**: All API routes use `/api` prefix for routing consistency

### Response Format

All API responses follow a consistent JSON structure:

```typescript
// Success Response
{
  data?: any;           // Response payload
  message?: string;     // Optional success message
}

// Error Response
{
  error: string;        // Error message
  statusCode: number;   // HTTP status code
  details?: string;     // Additional error details (development only)
}
```

## Authentication API

### OAuth 2.0 PKCE Flow Endpoints

#### `GET /api/auth/spotify/start`

Initiates the Spotify OAuth flow with PKCE challenge.

**Parameters**: None  
**Response**: HTTP 302 Redirect to Spotify authorization URL

**Implementation**:

```typescript
fastify.get('/auth/spotify/start', async (request, reply) => {
  const state = crypto.randomBytes(16).toString('hex');
  const { codeVerifier, codeChallenge } = spotify.generatePKCEChallenge();

  // Store PKCE challenge in Redis (5 min TTL)
  const redis = getRedisClient();
  await redis.setEx(`pkce:${state}`, 300, codeVerifier);

  const authUrl = spotify.getAuthUrl(codeChallenge, state);
  return reply.redirect(authUrl);
});
```

#### `GET /api/auth/spotify/callback`

Handles OAuth callback and creates user session.

**Query Parameters**:

- `code` (string): Authorization code from Spotify
- `state` (string): CSRF protection state parameter
- `error` (string, optional): OAuth error from Spotify

**Response**: HTTP 302 Redirect to frontend with session cookie

- **Single-Origin**: Redirects to `/` (same domain)
- **Cross-Domain**: Redirects to `FRONTEND_URL` environment variable

**Implementation**:

```typescript
const callbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
});

fastify.get('/auth/spotify/callback', async (request, reply) => {
  const { code, state, error } = callbackSchema.parse(request.query);

  if (error) {
    throw new Error(`Spotify auth error: ${error}`);
  }

  // Retrieve and validate PKCE challenge
  const redis = getRedisClient();
  const codeVerifier = await redis.get(`pkce:${state}`);
  if (!codeVerifier) {
    throw new Error('Invalid or expired state parameter');
  }
  await redis.del(`pkce:${state}`);

  // Exchange code for tokens
  const tokenData = await spotify.exchangeCodeForToken(code, codeVerifier);
  const user = await spotify.getCurrentUser(tokenData.access_token);

  // Create session
  const sessionData: SessionData = {
    userId: user.id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenExpires: Date.now() + tokenData.expires_in * 1000,
  };

  (request.session as any).set('user', sessionData);
  return reply.redirect('/');
});
```

#### `POST /api/auth/logout`

Destroys user session and clears cookies.

**Parameters**: None  
**Response**: `{ success: true }`

**Implementation**:

```typescript
fastify.post('/auth/logout', async (request, reply) => {
  request.session.delete();
  return reply.send({ success: true });
});
```

## User API

#### `GET /api/me`

Returns current authenticated user profile with automatic token refresh and premium account detection.

**Authentication**: Required (session cookie)  
**Response**: Spotify user profile object including `product` field for premium detection

**Implementation**:

```typescript
fastify.get('/me', async (request, reply) => {
  const sessionData = (request.session as any).get('user') as SessionData;

  if (!sessionData?.userId) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }

  let accessToken = sessionData.accessToken;

  // Proactive token refresh (1 minute before expiration)
  if (sessionData.tokenExpires && Date.now() > sessionData.tokenExpires - 60000) {
    const tokenData = await spotify.refreshAccessToken(sessionData.refreshToken);

    sessionData.accessToken = tokenData.access_token;
    sessionData.tokenExpires = Date.now() + tokenData.expires_in * 1000;

    if (tokenData.refresh_token) {
      sessionData.refreshToken = tokenData.refresh_token;
    }

    // Update session
    (request.session as any).set('user', sessionData);
    accessToken = tokenData.access_token;
  }

  const user = await spotify.getCurrentUser(accessToken);
  return reply.send(user);
});
```

## Spotify Web API Integration

FlipSide Player uses the **Spotify Web API** for music catalog access, device management, and cross-device playback control. The backend acts as a secure proxy, handling authentication and token management while exposing a simplified API to the frontend.

### SpotifyAPI Service Class

All Spotify API interactions are handled through the `SpotifyAPI` utility class:

```typescript
// backend/src/utils/spotify.ts
export class SpotifyAPI {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }
}
```

### Access Token Handling

FlipSide Player uses OAuth 2.0 access tokens to authenticate with Spotify's APIs. This section explains the complete token lifecycle, storage, and refresh mechanism.

#### Authentication Architecture

**Important**: The app does **not** use custom JWT tokens or application-specific tokens. The authentication architecture is:

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend ↔ Backend Authentication                          │
│                                                             │
│ Method: Session Cookies (HttpOnly)                        │
│ - No custom tokens                                         │
│ - Session ID stored in HttpOnly cookie                    │
│ - Session data stored server-side in Redis                 │
│ - Frontend sends: credentials: 'include'                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend ↔ Spotify API Authentication                       │
│                                                             │
│ Method: Spotify Access Tokens                              │
│ - Stored in session (server-side only)                     │
│ - Used in Authorization: Bearer <token> header            │
│ - Automatically refreshed before expiration                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend ↔ Spotify SDK Authentication                      │
│                                                             │
│ Method: Spotify Access Tokens (provided by backend)        │
│ - Frontend requests: GET /api/spotify/token                │
│ - Backend returns: Plain text access token                 │
│ - SDK uses token via getOAuthToken callback                │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**

- **No Custom Tokens**: The app does not generate its own JWT or application tokens
- **Session-Based**: Frontend-backend uses session cookies (managed by `@fastify/secure-session`)
- **Spotify Tokens Only**: All API authentication uses Spotify's OAuth tokens
- **Server-Side Storage**: Spotify tokens are stored server-side in Redis sessions, never exposed to frontend JavaScript
- **Secure Proxy Pattern**: Backend acts as a secure proxy, managing Spotify tokens and exposing a simplified API

#### Token Lifecycle Overview

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Initial Token Acquisition (OAuth Flow)                  │
│    - User authorizes app                                    │
│    - Backend exchanges code for tokens                      │
│    - Tokens stored in session                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Token Storage (Session)                                  │
│    - Stored in Redis-backed session                         │
│    - HttpOnly cookie for security                           │
│    - Contains: accessToken, refreshToken, tokenExpires      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Token Usage                                              │
│    - Web API calls: Bearer token in Authorization header    │
│    - SDK initialization: Token via /api/spotify/token        │
│    - Automatic refresh before expiration                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Token Refresh (Automatic)                               │
│    - Checked before each API call                           │
│    - Refreshed 1 minute before expiration                   │
│    - New tokens stored back in session                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Token Expiration                                         │
│    - Access tokens expire after 1 hour                      │
│    - Refresh tokens are long-lived                          │
│    - Session expires after 7 days                           │
└─────────────────────────────────────────────────────────────┘
```

#### Token Storage

Tokens are stored server-side in Redis-backed sessions for security:

```typescript
// backend/src/types/index.ts
export interface SessionData {
  userId?: string; // Spotify user ID
  accessToken?: string; // Current access token (expires in 1 hour)
  refreshToken?: string; // Refresh token (long-lived)
  tokenExpires?: number; // Unix timestamp when access token expires
}
```

**Storage Details:**

- **Location**: Redis (via `@fastify/secure-session`)
- **Session Duration**: 7 days
- **Cookie**: HttpOnly, Secure (production), SameSite (configurable)
- **Security**: Tokens never exposed to frontend JavaScript

**Initial Token Storage:**

```70:80:backend/src/routes/auth.ts
      const sessionData: SessionData = {
        userId: user.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpires: Date.now() + tokenData.expires_in * 1000,
      };

      fastify.log.info(`Authentication successful for user: ${user.id}`);

      // Store session data
      (request.session as any).set('user', sessionData);
```

#### Token Usage

Access tokens are used in two ways:

**1. Web API Calls (Backend → Spotify)**
All Spotify Web API calls include the access token in the Authorization header:

```typescript
// Example: Search API call
const response = await fetch(`${SPOTIFY_BASE_URL}/search?${params}`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

**2. Web Playback SDK (Frontend → Spotify)**
The frontend SDK requires a token, which is provided via a backend endpoint:

```typescript
// Frontend requests token
const token = await fetch('/api/spotify/token', {
  credentials: 'include', // Sends session cookie
});

// SDK uses token
const player = new Spotify.Player({
  getOAuthToken: async cb => {
    const token = await getSpotifyToken();
    cb(token);
  },
});
```

#### Automatic Token Refresh

The app uses **proactive token refresh** to prevent expired token errors. Tokens are refreshed 1 minute before expiration.

**Refresh Mechanism:**

```46:71:backend/src/routes/spotify.ts
async function getValidAccessToken(request: any): Promise<string> {
  const sessionData = (request.session as any).get('user') as SessionData;

  if (!sessionData?.accessToken) {
    throw new Error('Not authenticated');
  }

  let accessToken = sessionData.accessToken;

  // Check if token needs refresh
  if (sessionData.tokenExpires && Date.now() > sessionData.tokenExpires - 60000) {
    const tokenData = await spotify.refreshAccessToken(sessionData.refreshToken!);

    sessionData.accessToken = tokenData.access_token;
    sessionData.tokenExpires = Date.now() + tokenData.expires_in * 1000;

    if (tokenData.refresh_token) {
      sessionData.refreshToken = tokenData.refresh_token;
    }

    (request.session as any).set('user', sessionData);
    accessToken = tokenData.access_token;
  }

  return accessToken;
}
```

**Refresh Logic:**

1. **Check Expiration**: If `Date.now() > tokenExpires - 60000` (1 minute before expiration)
2. **Call Refresh API**: Use refresh token to get new access token
3. **Update Session**: Store new tokens and expiration time
4. **Return Token**: Return fresh access token for API call

**Where Refresh Happens:**

- `getValidAccessToken()` helper function in `spotify.ts` routes
- Called at the start of each Spotify API route handler
- Also in `/api/me` and `/api/spotify/token` endpoints

**Example Usage:**

```74:77:backend/src/routes/spotify.ts
  fastify.get('/spotify/search', async (request, reply) => {
    try {
      const { q, type, limit } = searchSchema.parse(request.query);
      const accessToken = await getValidAccessToken(request);
```

#### Token Expiration

**Access Token:**

- **Lifetime**: 1 hour (3600 seconds)
- **Refresh Window**: Refreshed 1 minute before expiration (at 59 minutes)
- **Expiration Check**: `Date.now() > tokenExpires - 60000`

**Refresh Token:**

- **Lifetime**: Long-lived (typically valid until revoked)
- **Rotation**: Spotify may issue a new refresh token on refresh (optional)
- **Storage**: Stored in session, updated if new token provided

**Session:**

- **Lifetime**: 7 days
- **Expiration**: Managed by `@fastify/secure-session`
- **Cleanup**: Automatic via Redis TTL

#### Security Considerations

**Token Security:**

- ✅ **Server-Side Storage**: Tokens never exposed to frontend
- ✅ **HttpOnly Cookies**: Session cookies not accessible to JavaScript
- ✅ **Secure Cookies**: HTTPS-only in production
- ✅ **No Token in URLs**: Tokens only in Authorization headers
- ✅ **Automatic Refresh**: Prevents expired token usage

**Token Refresh Security:**

- ✅ **PKCE Flow**: Initial authorization uses PKCE for security
- ✅ **Refresh Token Rotation**: New refresh tokens stored if provided
- ✅ **Error Handling**: Failed refreshes result in 401 (user must re-authenticate)

**Session Security:**

- ✅ **Encrypted Sessions**: Session data encrypted with secret key
- ✅ **SameSite Cookies**: CSRF protection via cookie attributes
- ✅ **Redis Storage**: Session data stored securely in Redis

#### Error Handling

**Token Refresh Failures:**

```typescript
try {
  const tokenData = await spotify.refreshAccessToken(sessionData.refreshToken!);
  // ... update session
} catch (error) {
  // Refresh failed - user must re-authenticate
  return reply.code(401).send({ error: 'Token refresh failed' });
}
```

**Common Scenarios:**

- **Expired Refresh Token**: User must log in again
- **Revoked Access**: User revoked app permissions
- **Network Error**: Retry logic or user re-authentication

### Authentication & Token Management

#### PKCE Challenge Generation

The app uses OAuth 2.0 PKCE (Proof Key for Code Exchange) for secure authentication:

```typescript
generatePKCEChallenge(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(96).toString('base64url');
  const codeChallenge = crypto.createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}
```

**Security Benefits:**

- Prevents authorization code interception attacks
- No client secret exposure in frontend
- Required for public clients (browser-based apps)

#### Token Exchange

After user authorization, the backend exchanges the authorization code for tokens:

```typescript
async exchangeCodeForToken(code: string, codeVerifier: string): Promise<SpotifyToken> {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  return response.json() as Promise<SpotifyToken>;
}
```

#### Token Refresh

Access tokens expire after 1 hour. The backend automatically refreshes them:

```typescript
async refreshAccessToken(refreshToken: string): Promise<SpotifyToken> {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  return response.json() as Promise<SpotifyToken>;
}
```

**Automatic Refresh Logic:**

- Tokens are refreshed **1 minute before expiration** (proactive refresh)
- Refresh happens in a helper function (`getValidAccessToken`) called at the start of each route handler
- Updated tokens are stored back in the session

### Required Spotify Scopes

The app requests the following OAuth scopes:

```typescript
scope: 'streaming user-read-playback-position user-modify-playback-state user-read-playback-state user-read-private';
```

**Scope Breakdown:**

- `streaming`: Required for Web Playback SDK playback
- `user-read-playback-position`: Read current playback position
- `user-modify-playback-state`: Control playback (play, pause, skip, seek)
- `user-read-playback-state`: Read current playback state and track info
- `user-read-private`: Access user profile information

### API Endpoints & Functionality

#### Search API

Search Spotify's music catalog for tracks, albums, artists, and playlists:

```typescript
async search(
  accessToken: string,
  query: string,
  type = 'track',
  limit = 20
): Promise<SpotifySearchResult> {
  const params = new URLSearchParams({
    q: query,
    type,
    limit: limit.toString(),
  });

  const response = await fetch(`${SPOTIFY_BASE_URL}/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.json() as Promise<SpotifySearchResult>;
}
```

**Features:**

- Supports multiple search types: `track`, `album`, `artist`, `playlist`
- Results are cached in Redis for 2 minutes to reduce API calls
- Query validation and sanitization via Zod schemas

#### Device Management

Get available Spotify Connect devices and transfer playback:

```typescript
async getDevices(accessToken: string): Promise<{ devices: SpotifyDevice[] }> {
  const response = await fetch(`${SPOTIFY_BASE_URL}/me/player/devices`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json() as Promise<{ devices: SpotifyDevice[] }>;
}

async transferPlayback(accessToken: string, deviceId: string, play = true): Promise<void> {
  const response = await fetch(`${SPOTIFY_BASE_URL}/me/player`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_ids: [deviceId],
      play,
    }),
  });
  // Error handling...
}
```

**Use Cases:**

- List all available devices (Web Player, phone, desktop app, etc.)
- Transfer playback between devices
- Ensure Web Player is active for SDK control

#### Playback Control

Control playback via Web API (for cross-device control):

```typescript
async startPlayback(
  accessToken: string,
  options: {
    deviceId?: string;
    uris?: string[];
    offset?: { position: number };
    position_ms?: number;
  } = {}
): Promise<void> {
  const body: any = {};
  if (options.uris) body.uris = options.uris;
  if (options.offset) body.offset = options.offset;
  if (typeof options.position_ms === 'number') body.position_ms = options.position_ms;
  if (options.deviceId) body.device_id = options.deviceId;

  const response = await fetch(`${SPOTIFY_BASE_URL}/me/player/play`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  // Error handling...
}

async pausePlayback(accessToken: string, deviceId?: string): Promise<void> {
  const url = new URL(`${SPOTIFY_BASE_URL}/me/player/pause`);
  if (deviceId) {
    url.searchParams.set('device_id', deviceId);
  }
  // PUT request...
}

async nextTrack(accessToken: string, deviceId?: string): Promise<void> {
  const url = new URL(`${SPOTIFY_BASE_URL}/me/player/next`);
  if (deviceId) url.searchParams.set('device_id', deviceId);
  // POST request...
}

async previousTrack(accessToken: string, deviceId?: string): Promise<void> {
  // Similar to nextTrack...
}

async setVolume(accessToken: string, volumePercent: number, deviceId?: string): Promise<void> {
  const url = new URL(`${SPOTIFY_BASE_URL}/me/player/volume`);
  url.searchParams.set('volume_percent', String(Math.max(0, Math.min(100, Math.round(volumePercent)))));
  if (deviceId) url.searchParams.set('device_id', deviceId);
  // PUT request...
}
```

**Key Features:**

- All methods support optional `deviceId` parameter for targeting specific devices
- Volume is clamped to 0-100% range
- Position seeking via `position_ms` parameter
- Track offset for starting at specific track in album/playlist

#### Playback State

Get current playback state:

```typescript
async getPlaybackState(accessToken: string): Promise<any> {
  const response = await fetch(`${SPOTIFY_BASE_URL}/me/player`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}
```

**Returns:**

- Current track information
- Playback position and duration
- Device information
- Shuffle and repeat state
- `null` if no active device

#### Album Data

Fetch album information and tracks:

```typescript
async getAlbum(accessToken: string, albumId: string): Promise<any> {
  const response = await fetch(`${SPOTIFY_BASE_URL}/albums/${albumId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}
```

**Features:**

- Album metadata (name, artist, images, release date)
- Track list with full track details
- Results cached in Redis for 5 minutes

### Error Handling

All API methods include comprehensive error handling:

```typescript
if (!response.ok) {
  const errorText = await response.text();
  let errorDetails = `HTTP ${response.status}: ${response.statusText}`;

  try {
    const errorJson = JSON.parse(errorText);
    errorDetails = `${errorDetails} - ${errorJson.error?.message || errorText}`;
  } catch {
    errorDetails = `${errorDetails} - ${errorText}`;
  }

  throw new Error(`Failed to start playback: ${errorDetails}`);
}
```

**Common Error Codes:**

- `401`: Unauthorized - token expired or invalid
- `403`: Forbidden - Premium subscription required
- `404`: Not Found - No active device
- `429`: Too Many Requests - Rate limit exceeded

### Caching Strategy

The backend uses Redis for response caching:

```typescript
// Search results cached for 2 minutes
const cacheKey = `search:${q}:${type}:${limit}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return reply.send(JSON.parse(cached));
}
const results = await spotify.search(accessToken, q, type, limit);
await redis.setEx(cacheKey, 120, JSON.stringify(results)); // 2 minutes

// Album data cached for 5 minutes
const albumCacheKey = `album:${id}`;
await redis.setEx(albumCacheKey, 300, JSON.stringify(album)); // 5 minutes
```

**Benefits:**

- Reduces Spotify API rate limit usage
- Faster response times for repeated queries
- Lower server load

### Token Management in Routes

All Spotify API routes use a helper function to ensure valid tokens. This function is called at the start of each route handler (not as middleware):

**Location:** `backend/src/routes/spotify.ts`

```46:71:backend/src/routes/spotify.ts
async function getValidAccessToken(request: any): Promise<string> {
  const sessionData = (request.session as any).get('user') as SessionData;

  if (!sessionData?.accessToken) {
    throw new Error('Not authenticated');
  }

  let accessToken = sessionData.accessToken;

  // Check if token needs refresh
  if (sessionData.tokenExpires && Date.now() > sessionData.tokenExpires - 60000) {
    const tokenData = await spotify.refreshAccessToken(sessionData.refreshToken!);

    sessionData.accessToken = tokenData.access_token;
    sessionData.tokenExpires = Date.now() + tokenData.expires_in * 1000;

    if (tokenData.refresh_token) {
      sessionData.refreshToken = tokenData.refresh_token;
    }

    (request.session as any).set('user', sessionData);
    accessToken = tokenData.access_token;
  }

  return accessToken;
}
```

**Usage in Routes:**
Each route handler calls this function at the beginning:

```74:77:backend/src/routes/spotify.ts
fastify.get('/spotify/search', async (request, reply) => {
  try {
    const { q, type, limit } = searchSchema.parse(request.query);
    const accessToken = await getValidAccessToken(request);
```

**Note:** This is not Fastify middleware (like `preHandler`), but rather a helper function that each route calls manually. This pattern ensures tokens are refreshed before making Spotify API calls.

## Spotify Proxy API

### Token Management

#### `GET /api/spotify/token`

Returns current access token for Spotify Web SDK initialization.

**Authentication**: Required  
**Response**: Access token string (plain text)

**Implementation**:

```typescript
fastify.get('/spotify/token', async (request, reply) => {
  const sessionData = (request.session as any).get('user') as SessionData;

  if (!sessionData?.accessToken) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }

  // Handle token refresh if needed
  let accessToken = sessionData.accessToken;
  if (sessionData.tokenExpires && Date.now() > sessionData.tokenExpires - 60000) {
    const tokenData = await spotify.refreshAccessToken(sessionData.refreshToken);

    sessionData.accessToken = tokenData.access_token;
    sessionData.tokenExpires = Date.now() + tokenData.expires_in * 1000;

    if (tokenData.refresh_token) {
      sessionData.refreshToken = tokenData.refresh_token;
    }

    (request.session as any).set('user', sessionData);
    accessToken = tokenData.access_token;
  }

  return reply.send(accessToken);
});
```

### Music Catalog

#### `GET /api/spotify/search`

Searches Spotify's music catalog.

**Authentication**: Required  
**Query Parameters**:

- `q` (string): Search query
- `type` (string): Search type (track, artist, album, playlist)
- `limit` (number, optional): Results limit (1-50, default: 20)
- `offset` (number, optional): Results offset for pagination

**Response**: Spotify search results object

**Implementation**:

```typescript
const searchSchema = z.object({
  q: z.string().min(1),
  type: z.enum(['track', 'artist', 'album', 'playlist']).default('track'),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

fastify.get(
  '/spotify/search',
  {
    preHandler: [getValidAccessToken],
  },
  async (request, reply) => {
    const { q, type, limit, offset } = searchSchema.parse(request.query);
    const accessToken = request.accessToken;

    const results = await spotify.search(accessToken, q, type, limit, offset);
    return reply.send(results);
  }
);
```

### Device Management

#### `GET /api/spotify/devices`

Returns available Spotify Connect devices.

**Authentication**: Required  
**Response**: `{ devices: SpotifyDevice[] }`

#### `PUT /api/spotify/transfer-playback`

Transfers playback to specified device.

**Authentication**: Required  
**Body Parameters**:

- `device_id` (string): Target device ID
- `play` (boolean, optional): Start playback after transfer

**Response**: `{ success: true }`

**Implementation**:

```typescript
const transferPlaybackSchema = z.object({
  device_id: z.string(),
  play: z.boolean().default(true),
});

fastify.put(
  '/spotify/transfer-playback',
  {
    preHandler: [getValidAccessToken],
  },
  async (request, reply) => {
    const { device_id, play } = transferPlaybackSchema.parse(request.body);
    const accessToken = request.accessToken;

    await spotify.transferPlayback(accessToken, device_id, play);
    return reply.send({ success: true });
  }
);
```

## Service Architecture

### Session Management Service

```typescript
interface SessionData {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpires: number;
}

class SessionManager {
  private redis: RedisClientType;

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  async createSession(sessionData: SessionData): Promise<string> {
    const sessionId = crypto.randomUUID();
    await this.redis.setEx(
      `session:${sessionId}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify(sessionData)
    );
    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async updateSession(sessionId: string, sessionData: SessionData): Promise<void> {
    await this.redis.setEx(`session:${sessionId}`, 7 * 24 * 60 * 60, JSON.stringify(sessionData));
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}
```

### Spotify API Service

```typescript
export class SpotifyAPI {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  generatePKCEChallenge(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(96).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  getAuthUrl(codeChallenge: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope:
        'streaming user-read-playback-position user-modify-playback-state user-read-playback-state user-read-private',
      redirect_uri: this.redirectUri,
      state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<SpotifyToken> {
    const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed (${response.status}): ${error}`);
    }

    return response.json() as Promise<SpotifyToken>;
  }

  async refreshAccessToken(refreshToken: string): Promise<SpotifyToken> {
    const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return response.json() as Promise<SpotifyToken>;
  }
}
```

### Redis Connection Management

```typescript
let redisClient: RedisClientType | null = null;

export async function initRedis(url?: string): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  const client = createClient({
    url: url || process.env.REDIS_URL || 'redis://localhost:6379',
  });

  client.on('error', err => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('Redis client connected');
  });

  client.on('ready', () => {
    console.log('Redis client ready');
  });

  await client.connect();
  redisClient = client;
  return client;
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}
```

## Middleware & Hooks

### Authentication Middleware

```typescript
async function getValidAccessToken(request: FastifyRequest, reply: FastifyReply) {
  const sessionData = (request.session as any).get('user') as SessionData;

  if (!sessionData?.accessToken) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }

  let accessToken = sessionData.accessToken;

  // Check if token needs refresh
  if (sessionData.tokenExpires && Date.now() > sessionData.tokenExpires - 60000) {
    try {
      const spotify = new SpotifyAPI(
        process.env.SPOTIFY_CLIENT_ID!,
        process.env.SPOTIFY_CLIENT_SECRET!,
        process.env.SPOTIFY_REDIRECT_URI!
      );

      const tokenData = await spotify.refreshAccessToken(sessionData.refreshToken);

      sessionData.accessToken = tokenData.access_token;
      sessionData.tokenExpires = Date.now() + tokenData.expires_in * 1000;

      if (tokenData.refresh_token) {
        sessionData.refreshToken = tokenData.refresh_token;
      }

      // Update session
      (request.session as any).set('user', sessionData);
      accessToken = tokenData.access_token;
    } catch (error) {
      return reply.code(401).send({ error: 'Token refresh failed' });
    }
  }

  // Attach token to request for route handlers
  (request as any).accessToken = accessToken;
}
```

### Error Handler

```typescript
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  // Validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      statusCode: 400,
      details: error.validation,
    });
  }

  // Authentication errors
  if (error.statusCode === 401) {
    return reply.status(401).send({
      error: 'Unauthorized',
      statusCode: 401,
    });
  }

  // Generic server errors
  const statusCode = error.statusCode || 500;
  const response: any = {
    error: error.message || 'Internal Server Error',
    statusCode,
  };

  // Include details in development
  if (process.env.NODE_ENV !== 'production') {
    response.details = error.stack;
  }

  return reply.status(statusCode).send(response);
});
```

## Environment Configuration

### Required Environment Variables

```bash
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/api/auth/spotify/callback

# Cross-Domain Configuration
FRONTEND_URL=http://localhost:5173

# Session Management
SESSION_SECRET=your_secure_session_secret_key_must_be_at_least_32_characters_long_for_security

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=5174
HOST=0.0.0.0
LOG_LEVEL=info

# Development/Production Flags
NODE_ENV=development
```

### Environment Validation

```typescript
function validateEnvironment() {
  const requiredEnvVars = [
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'SPOTIFY_REDIRECT_URI',
    'SESSION_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error(
      '\n💡 Please check your backend/.env file and ensure all Spotify credentials are set.'
    );
    process.exit(1);
  }

  // Validate session secret length
  if (process.env.SESSION_SECRET!.length < 32) {
    console.error('❌ SESSION_SECRET must be at least 32 characters long for security');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
}
```

## Logging & Monitoring

### Request Logging

```typescript
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
  },
});
```

### Health Check Endpoint

```typescript
fastify.get('/api/health', async (_, reply) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    redis: 'unknown',
  };

  // Check Redis connectivity
  try {
    const redis = getRedisClient();
    await redis.ping();
    health.redis = 'connected';
  } catch (error) {
    health.redis = 'disconnected';
    health.status = 'degraded';
  }

  return reply.send(health);
});
```

## Performance Optimization

### Response Caching

```typescript
// Cache user profile data
const profileCache = new Map<string, { data: SpotifyUser; expires: number }>();

async function getCachedUserProfile(userId: string, accessToken: string): Promise<SpotifyUser> {
  const cached = profileCache.get(userId);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  const profile = await spotify.getCurrentUser(accessToken);
  profileCache.set(userId, {
    data: profile,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  return profile;
}
```

### Connection Pooling

```typescript
// Redis connection pool handled automatically by ioredis
const redisConfig = {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  keepAlive: 30000,
};
```

This backend documentation provides comprehensive coverage of FlipSide Player's API design, service architecture, and implementation details necessary for development and maintenance.
