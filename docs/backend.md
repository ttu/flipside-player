# FlipSide Player - Backend Documentation

## API Endpoints & Service Architecture

This document covers the backend API design, authentication flow, service architecture, and implementation details for FlipSide Player's Fastify server.

## API Overview

### Base URL & Structure

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`
- **Route Prefix**: All API routes use `/api` prefix for reverse proxy compatibility

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

Returns current authenticated user profile with automatic token refresh.

**Authentication**: Required (session cookie)  
**Response**: Spotify user profile object

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
        'streaming user-read-playback-state user-modify-playback-state user-read-email user-read-private',
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
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/api/auth/spotify/callback

# Session Management
SESSION_SECRET=your_secure_session_secret_key_must_be_at_least_32_characters_long_for_security

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=3001
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
