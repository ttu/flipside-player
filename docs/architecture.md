# FlipSide Player - Tech Stack & Architecture

## Technology Stack

FlipSide Player is built as a modern, single-page application (SPA) with a clear separation between frontend and backend, connected via a reverse proxy for seamless same-origin communication and session management.

### Frontend Technologies

| Technology          | Version | Purpose                                        |
| ------------------- | ------- | ---------------------------------------------- |
| **React**           | 18.x    | UI library for building interactive components |
| **TypeScript**      | 5.x     | Type safety and enhanced developer experience  |
| **Vite**            | 5.x     | Build tool and development server              |
| **Zustand**         | 4.x     | Lightweight state management                   |
| **Tailwind CSS**    | 3.x     | Utility-first CSS framework                    |
| **Spotify Web SDK** | Latest  | Direct browser-based Spotify playback          |

### Backend Technologies

| Technology                  | Version | Purpose                                       |
| --------------------------- | ------- | --------------------------------------------- |
| **Fastify**                 | 4.x     | High-performance web framework                |
| **TypeScript**              | 5.x     | Type safety and enhanced developer experience |
| **@fastify/secure-session** | 7.x     | Session management with Redis                 |
| **@fastify/static**         | 6.x     | Static file serving for reverse proxy         |
| **Redis**                   | 7.x     | Session storage and caching                   |
| **Zod**                     | 3.x     | Runtime schema validation                     |

### Development & Deployment

| Tool               | Purpose                              |
| ------------------ | ------------------------------------ |
| **tsx**            | TypeScript execution for development |
| **ESLint**         | Code linting and formatting          |
| **Docker**         | Redis containerization               |
| **npm workspaces** | Monorepo management                  |

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            React Frontend (SPA)                     │   │
│  │        Served as Static Files                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/HTTPS
                              │ Same Origin (localhost:3001)
┌─────────────────────────────────────────────────────────────┐
│                 Fastify Backend Server                     │
│  ┌─────────────────┐    ┌─────────────────────────────┐   │
│  │  Static File    │    │       API Routes            │   │
│  │   Serving       │    │      (/api/*)               │   │
│  │   (Frontend)    │    │  - Auth                     │   │
│  └─────────────────┘    │  - Spotify Proxy            │   │
│                         │  - Session Management       │   │
│                         └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │                   │
        ┌─────────────────────┐    ┌─────────────────┐
        │    Redis Server     │    │  Spotify API    │
        │  Session Storage    │    │  Web Services   │
        └─────────────────────┘    └─────────────────┘
```

## Architectural Patterns

### Reverse Proxy Pattern

FlipSide Player uses a reverse proxy architecture where the Fastify backend serves both the static frontend files and API endpoints from the same origin.

**Benefits:**

- No CORS issues (same-origin requests)
- Simplified session cookie management
- Single deployment target
- Better security (no cross-origin concerns)

**Implementation:**

```typescript
// Backend serves frontend static files
await fastify.register(fastifyStatic, {
  root: frontendDistPath,
  prefix: '/',
});

// API routes with /api prefix
await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(spotifyRoutes, { prefix: '/api' });
```

### Monorepo Structure

```
flipside-player/
├── backend/                 # Fastify backend application
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── utils/          # Utilities and helpers
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state management
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript type definitions
│   └── package.json
└── package.json           # Root workspace configuration
```

### Development Workflow

1. **Frontend Development**: Build static files with Vite
2. **Backend Development**: Serve built frontend + API with Fastify
3. **Integration**: Single origin eliminates development CORS issues
4. **Testing**: API endpoints accessible at localhost:3001/api/\*

## Authentication Architecture

### OAuth 2.0 PKCE Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │  Frontend   │    │   Backend   │    │   Spotify   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Click Login    │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │ 2. Request Auth   │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │ 3. Generate PKCE  │
       │                   │                   │   & State         │
       │                   │                   │                   │
       │                   │ 4. Auth URL       │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │ 5. Redirect to Spotify Auth           │                   │
       │─────────────────────────────────────────────────────────▶│
       │                   │                   │                   │
       │ 6. User Authorizes │                   │                   │
       │◀──────────────────────────────────────────────────────────│
       │                   │                   │                   │
       │ 7. Redirect to Backend with Auth Code │                   │
       │─────────────────────────────────────▶│                   │
       │                   │                   │ 8. Exchange Code  │
       │                   │                   │   for Tokens      │
       │                   │                   │──────────────────▶│
       │                   │                   │                   │
       │                   │                   │ 9. Access &       │
       │                   │                   │    Refresh Tokens │
       │                   │                   │◀──────────────────│
       │                   │                   │                   │
       │                   │                   │ 10. Create Session│
       │                   │                   │     Store in Redis│
       │                   │                   │                   │
       │ 11. Redirect to Frontend with Session Cookie              │
       │◀─────────────────────────────────────│                   │
       │                   │                   │                   │
       │ 12. Authenticated │                   │                   │
       │    Frontend Load  │                   │                   │
       │──────────────────▶│                   │                   │
```

**Flow Details:**

1. **User clicks login** - Frontend presents login button
2. **Frontend requests auth URL** - `GET /api/auth/spotify/start`
3. **Backend generates PKCE** - Creates code_verifier, code_challenge, and state
4. **Backend returns auth URL** - Spotify authorization URL with PKCE parameters
5. **User redirected to Spotify** - Browser navigates to Spotify's authorization page
6. **User authorizes application** - Grants requested permissions
7. **Spotify redirects to callback** - `GET /api/auth/spotify/callback?code=...&state=...`
8. **Backend exchanges authorization code** - Uses PKCE verifier to get tokens
9. **Spotify returns tokens** - Access token, refresh token, and expiration info
10. **Backend creates session** - Stores tokens and user info in Redis with session ID
11. **User redirected to frontend** - With secure session cookie set
12. **Frontend loads authenticated** - User is now logged in and ready to use the app

### Session Management

- **Storage**: Redis with @fastify/secure-session
- **Security**: HttpOnly cookies (configurable), secure session secrets
- **Persistence**: 7-day session expiration
- **Token Refresh**: Automatic access token refresh when needed

```typescript
interface SessionData {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpires: number;
}
```

## State Management Architecture

### Frontend State (Zustand)

```typescript
// Authentication State
interface AuthState {
  isAuthenticated: boolean;
  user?: SpotifyUser;
  loading: boolean;
}

// Player State
interface PlayerState {
  currentTrack?: SpotifyTrack;
  isPlaying: boolean;
  position: number;
  volume: number;
  device?: SpotifyDevice;
}

// Queue State
interface QueueState {
  tracks: SpotifyTrack[];
  currentIndex: number;
}
```

### Session State (Backend)

- **Storage**: Redis with TTL
- **Structure**: User sessions with Spotify tokens
- **Management**: Automatic cleanup and refresh

## Integration Architecture

### Spotify API Integration

- **Web API**: Search, user data, and device management
- **Web SDK**: Direct browser playback control
- **Connect API**: Cross-device playback management

### External Dependencies

- **Spotify Services**: Core music functionality
- **Redis**: Session and cache storage
- **Browser APIs**: Local storage, Web Audio API

## Music Playback Flow

### Track Search and Queue Management

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │   Backend   │    │ Spotify API │    │ Spotify SDK │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Search Query   │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │ 2. Search Request│                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │ 3. Search Results │                   │
       │                   │◀──────────────────│                   │
       │ 4. Display Results│                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │ 5. Add to Queue   │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │ 6. Update Queue   │                   │
       │                   │   State in Zustand│                   │
       │                   │                   │                   │
       │ 7. Queue Updated  │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │ 8. Play Track     │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │ 9. Start Playback│                   │
       │                   │──────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │                   │ 10. Track State   │
       │                   │                   │     Updates       │
       │◀────────────────────────────────────────────────────────── │
       │                   │                   │                   │
```

### Real-time Playback Synchronization

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │ Zustand     │    │ Spotify SDK │    │   Spotify   │
│  Components │    │ Stores      │    │ (Browser)   │    │  Connect    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │ 1. Player Ready   │
       │                   │                   │◀──────────────────│
       │                   │                   │                   │
       │                   │ 2. Player Ready   │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │ 3. Play Button    │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │ 4. Play Command   │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │ 5. Start Playback │
       │                   │                   │──────────────────▶│
       │                   │                   │                   │
       │                   │                   │ 6. State Change   │
       │                   │                   │◀──────────────────│
       │                   │                   │                   │
       │                   │ 7. Update State   │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │ 8. UI Update      │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │ 9. Position       │                   │ 10. Position      │
       │   Updates (1s)    │◀─────────────────▶│     Updates       │
       │◀──────────────────│                   │◀──────────────────│
       │                   │                   │                   │
```

### Cross-Device Playback Control

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ FlipSide    │    │   Backend   │    │ Spotify API │    │   Device    │
│ Frontend    │    │   Server    │    │ Web Service │    │ (Phone/etc) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Get Devices    │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │ 2. Fetch Devices │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │ 3. Device List    │                   │
       │                   │◀──────────────────│                   │
       │ 4. Show Devices   │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │ 5. Select Device  │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │ 6. Transfer       │                   │
       │                   │   Playback        │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │ 7. Connect &      │
       │                   │                   │   Start Playing   │
       │                   │                   │──────────────────▶│
       │                   │                   │                   │
       │                   │                   │ 8. Playback       │
       │                   │                   │   Transferred     │
       │                   │                   │◀──────────────────│
       │                   │ 9. Success        │                   │
       │                   │◀──────────────────│                   │
       │ 10. Update UI     │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
```

**Key Flow Characteristics:**

1. **Search & Discovery**: Real-time search with debounced API calls
2. **Queue Management**: Client-side queue state with persistent backend sync
3. **Playback Control**: Dual control via Spotify SDK (direct) and Web API (cross-device)
4. **State Synchronization**: Automatic state updates via SDK event listeners
5. **Device Management**: Seamless transfer between Spotify Connect devices
6. **Error Handling**: Graceful fallbacks and retry mechanisms throughout

## Performance Characteristics

### Frontend Optimization

- **Code Splitting**: Vite handles automatic code splitting
- **Asset Optimization**: Minification and compression in production
- **State Management**: Zustand provides minimal re-renders
- **Image Handling**: Spotify CDN for album artwork

### Backend Optimization

- **Fastify Performance**: High-performance web framework
- **Redis Caching**: Session data cached for fast access
- **Connection Pooling**: Redis connection management
- **Static File Serving**: Efficient static asset delivery

### Network Optimization

- **Single Origin**: Reduces connection overhead
- **HTTP/2 Ready**: Supports multiplexed connections
- **Compression**: Gzip compression for responses
- **CDN Ready**: Static assets can be CDN-served in production

## Security Architecture

### Authentication Security

- **OAuth 2.0 PKCE**: Secure authorization code flow with PKCE challenge
- **Session Management**: Server-side sessions with Redis storage
- **Token Storage**: Access/refresh tokens stored server-side only
- **CSRF Protection**: SameSite cookie attributes and origin validation

### API Security

- **Session Validation**: All API routes require valid session
- **Token Refresh**: Automatic refresh prevents expired token issues
- **Input Validation**: Zod schemas validate all API inputs
- **Environment Secrets**: All secrets stored in environment variables

### Network Security

- **Same-Origin Policy**: Reverse proxy eliminates CORS concerns
- **HTTPS Ready**: Production configuration supports TLS termination
- **Secure Cookies**: HttpOnly and Secure flags for production

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────┐
│           Development Machine            │
│  ┌─────────────────────────────────────┐ │
│  │        Docker Container             │ │
│  │      Redis Server :6379             │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │      Node.js Process                │ │
│  │    Fastify Server :3001             │ │
│  │  - Serves React build               │ │
│  │  - Handles API routes               │ │
│  │  - Manages sessions                 │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Production Architecture (Future)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     CDN     │    │    Load     │    │   Redis     │
│   (Static   │    │  Balancer   │    │  Cluster    │
│   Assets)   │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                 │
              ┌─────────────────────────────────────┐
              │        Application Servers          │
              │  ┌───────────┐  ┌───────────┐     │
              │  │ Fastify   │  │ Fastify   │     │
              │  │ Instance  │  │ Instance  │     │
              │  │    :3001  │  │    :3002  │ ... │
              │  └───────────┘  └───────────┘     │
              └─────────────────────────────────────┘
```

## Technology Decision Rationale

### Frontend Framework Choice: React

**Chosen**: React with TypeScript and Vite  
**Alternatives Considered**: Vue.js, Vanilla JavaScript

**Reasons**:

- Excellent ecosystem for interactive UIs
- Strong TypeScript support
- Extensive third-party libraries
- Team familiarity and community support

### Backend Framework Choice: Fastify

**Chosen**: Fastify with TypeScript  
**Alternatives Considered**: Express.js, NestJS

**Reasons**:

- Superior performance characteristics
- Built-in TypeScript support
- Schema-based validation
- Plugin ecosystem
- Appropriate for high-throughput music applications

### State Management Choice: Zustand

**Chosen**: Zustand  
**Alternatives Considered**: Redux Toolkit, React Context

**Reasons**:

- Minimal boilerplate
- Excellent performance for real-time updates
- TypeScript-first design
- Perfect size for application complexity

### Session Management Choice: Redis Sessions

**Chosen**: Session-based authentication with Redis  
**Alternatives Considered**: JWT tokens

**Reasons**:

- Eliminates CORS complexity with reverse proxy
- Secure server-side token storage
- Established session management patterns
- Easy development and debugging
- Better security for sensitive Spotify tokens

This architecture provides a robust, scalable foundation for FlipSide Player while maintaining simplicity in development and deployment.
