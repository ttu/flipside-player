# FlipSide Player - Claude Code Reference

## Project Overview

FlipSide Player is a Spotify music player built with React (frontend) and Fastify (backend), featuring session-based authentication and flexible deployment architectures.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Fastify + TypeScript + Redis sessions
- **Authentication**: Spotify OAuth 2.0 with PKCE flow
- **Session Management**: @fastify/secure-session with Redis storage
- **Development**: Vite proxy for same-origin requests (no CORS)
- **Production**: Supports both single-origin (reverse proxy) and cross-domain (CORS) deployments

## Development Commands

### Backend

```bash
cd backend/
npm run dev        # Start development server with hot reload
npm run dev:build  # Build frontend then start backend dev server
npm run build      # Build TypeScript to JavaScript
npm run type-check # Run TypeScript type checking
npm run lint       # Run ESLint
```

### Frontend

```bash
cd frontend/
npm run dev        # Start Vite dev server (not used in reverse proxy setup)
npx vite build     # Build for production (required for reverse proxy)
npm run lint       # Run ESLint
npm run type-check # Run TypeScript type checking
npm run format     # Run Prettier formatting
```

### Full Application

```bash
# Start the complete application (from backend directory)
npm run dev        # Serves both frontend and API from localhost:3001
```

## Environment Variables

### Backend (.env)

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/api/auth/spotify/callback
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your_secure_session_secret_key_must_be_at_least_32_characters
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=5174
```

### Frontend (.env)

```
VITE_API_BASE_URL=/api
VITE_AUTH_BASE_URL=/api
VITE_APP_NAME="FlipSide Player"
```

## Key Implementation Details

### Authentication Flow

1. User clicks login → redirects to backend `/api/auth/spotify/start`
2. Backend generates PKCE challenge, stores in Redis, redirects to Spotify
3. Spotify redirects back to backend `/api/auth/spotify/callback`
4. Backend exchanges code for tokens, stores session data, redirects to frontend
5. Frontend uses session cookies for subsequent API calls

### Session Management

- Uses @fastify/secure-session with Redis backend
- Session data includes: userId, accessToken, refreshToken, tokenExpires
- Automatic token refresh when tokens expire
- Supports both same-origin and cross-domain cookie configurations

### Deployment Options

#### Option 1: Single Origin (Reverse Proxy)
- Backend serves frontend static files from `/Users/ttu/src/github/flipside-player/frontend/dist`
- API routes prefixed with `/api`
- Frontend uses relative URLs (`/api/...`) - no CORS needed
- Single origin: http://localhost:3001

#### Option 2: Cross-Domain (CORS)
- Frontend and backend deployed separately
- Backend includes CORS headers for cross-domain requests
- Frontend uses absolute URLs to backend domain
- Session cookies configured for cross-domain sharing

### API Routes

- `GET /api/auth/spotify/start` - Initiate OAuth flow
- `GET /api/auth/spotify/callback` - OAuth callback handler
- `POST /api/auth/logout` - Clear session
- `GET /api/me` - Get current user (with token refresh)
- `GET /api/spotify/token` - Get access token for Spotify Web SDK
- `GET /api/spotify/search` - Search Spotify catalog
- `GET /api/spotify/devices` - Get available playback devices
- `GET /api/health` - Health check endpoint

## Prerequisites

- Redis server running on localhost:6379
- Spotify app configured with correct redirect URI
- Node.js and npm installed

## Development Workflow

### Option 1: Fast Development (Recommended)

Use Vite dev server with proxy for fast hot-reload development:

1. Ensure Redis is running: `docker start redis-flipside`
2. Start backend: `cd backend && npm run dev` (runs on port 5174)
3. Start frontend: `cd frontend && npm run dev` (runs on port 5173, listens on all interfaces)
4. Access app at http://127.0.0.1:5173 or http://localhost:5173 (Vite dev server)

The Vite dev server proxies `/api` requests to the backend at `localhost:5174`. This creates a same-origin setup where all requests appear to come from the frontend port, enabling session cookies to work without CORS issues.

### Option 2: Production-like (with build)

Use this for testing the production build:

1. Ensure Redis is running: `docker start redis-flipside`
2. Start with auto-build: `cd backend && npm run dev:build`
3. Access app at http://localhost:3001

### Option 3: Manual Build

1. Ensure Redis is running: `docker start redis-flipside`
2. Build frontend: `cd frontend && npm run build`
3. Start backend: `cd backend && npm run dev`
4. Access app at http://localhost:3001

## Production Deployment

### Cross-Domain Deployment (e.g., Render)

When deploying frontend and backend as separate services:

**Backend Environment Variables:**
```
NODE_ENV=production
SPOTIFY_REDIRECT_URI=https://your-backend-domain.com/api/auth/spotify/callback
FRONTEND_URL=https://your-frontend-domain.com
SESSION_SECRET=your_secure_session_secret_key_must_be_at_least_32_characters
REDIS_URL=your_redis_connection_string
```

**Frontend Environment Variables:**
```
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_AUTH_BASE_URL=https://your-backend-domain.com/api
```

**Spotify App Settings:**
- Add redirect URI: `https://your-backend-domain.com/api/auth/spotify/callback`

### Single-Origin Deployment (Docker Compose)

Use the included docker-compose.yml for single-origin deployment with reverse proxy.

## Common Issues & Solutions

### CORS Errors (Cross-Domain Deployment)

- **Problem**: Frontend making requests to different origins
- **Solution**: Ensure VITE_API_BASE_URL points to backend domain, verify CORS headers in backend

### CORS Errors (Same-Origin Deployment)

- **Problem**: Frontend making requests to different origins
- **Solution**: Use reverse proxy setup, ensure VITE_API_BASE_URL=/api

### Session Not Persisting

- **Problem**: Sessions not working across requests
- **Solution**:
  - Ensure Redis is running, check session secret length (≥32 chars)
  - For cross-domain: Verify FRONTEND_URL is set correctly in backend
  - Check browser allows cross-domain cookies (sameSite: 'none' with secure: true)

### OAuth Callback Issues

- **Problem**: "Invalid redirect URI" or "Site can't be reached"
- **Solution**: Update Spotify app settings to use `http://127.0.0.1:5173/api/auth/spotify/callback` and ensure Vite dev server is configured with `host: '0.0.0.0'`

### TypeScript Build Errors

- **Problem**: TS errors preventing build
- **Solution**: Use `npx vite build` to skip TS check, or fix errors individually

## Testing Commands

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test OAuth start (should return redirect URL)
curl http://localhost:3001/api/auth/spotify/start

# Test authentication status
curl http://localhost:3001/api/me -H "Cookie: sessionId=..."
```

## Docker Commands

```bash
# Start Redis
docker run --rm -d --name redis-flipside -p 6379:6379 redis:alpine

# Or start existing container
docker start redis-flipside
```

## Notes

- No JWT tokens used - pure session-based authentication
- Development uses Vite proxy for same-origin requests (no CORS)
- Production supports both reverse proxy (single-origin) and CORS (cross-domain) deployments
- Session cookies work in both same-origin and cross-domain configurations
- Backend includes security headers and CORS configuration for production deployment

## Documentation

Comprehensive documentation is available in the `/docs` folder. Use these files for understanding the project architecture and development practices:

- **`README.md`**: Documentation overview and organization guide
- **`description.md`**: App description, use cases, target users, and core purpose
- **`architecture.md`**: Complete application architecture, tech stack
- **`frontend.md`**: Views/screens, UI/UX patterns, navigation flow, and styling guidelines.
- **`backend.md`**: API endpoints, authentication, service architecture.
- **`datamodel.md`**: Entities, attributes, relationships, and data storage architecture
- **`changelog.md`**: Detailed history of changes, fixes, and improvements (keep updated with AI changes)
- **`project-notes.md`**: Project discussions, requirements, and key decisions
- **`debugging.md`**: Troubleshooting guide, common issues, and debugging notes
- **`learnings.md`**: Technical insights, best practices, and solutions discovered during development
- **`todo.md`**: Current tasks and planned improvements (✅ done, ⏳ in progress, ❌ not started)

important files at root folder

- `README.md`: **Comprehensive setup guide**, tool descriptions, usage examples, and API key instructions

When making changes, update relevant documentation files to keep them current with the codebase.

## Code Quality Workflow

**IMPORTANT**: Always run these commands after making code changes:

```bash
# After making changes to code:
npm run format     # Format code with Prettier
npm run lint:fix   # Fix linting errors automatically
npm run build      # Verify TypeScript compilation and build

# Full project build verification:
npm run build      # Build both frontend and backend
```

This ensures code consistency, catches errors early, and maintains build integrity.
