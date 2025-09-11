# FlipSide Player - Claude Code Reference

## Project Overview
FlipSide Player is a Spotify music player built with React (frontend) and Fastify (backend), featuring session-based authentication and a reverse proxy architecture.

## Architecture
- **Frontend**: React + TypeScript + Vite (served via reverse proxy)
- **Backend**: Fastify + TypeScript + Redis sessions
- **Authentication**: Spotify OAuth 2.0 with PKCE flow
- **Session Management**: @fastify/secure-session with Redis storage
- **Deployment**: Single origin via reverse proxy (no CORS issues)

## Development Commands

### Backend
```bash
cd backend/
npm run dev        # Start development server with hot reload
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
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/api/auth/spotify/callback
SESSION_SECRET=your_secure_session_secret_key_must_be_at_least_32_characters
REDIS_URL=redis://localhost:6379
PORT=3001
```

### Frontend (.env)
```
VITE_API_BASE_URL=/api
VITE_APP_NAME="FlipSide Player"
```

## Key Implementation Details

### Authentication Flow
1. User clicks login → redirects to `/api/auth/spotify/start`
2. Backend generates PKCE challenge, stores in Redis, redirects to Spotify
3. Spotify redirects back to `/api/auth/spotify/callback`
4. Backend exchanges code for tokens, stores session data, redirects to `/`
5. Frontend uses session cookies for subsequent API calls

### Session Management
- Uses @fastify/secure-session with Redis backend
- Session data includes: userId, accessToken, refreshToken, tokenExpires
- Automatic token refresh when tokens expire
- httpOnly: false for debugging (consider true for production)

### Reverse Proxy Setup
- Backend serves frontend static files from `/Users/ttu/src/github/flipside-player/frontend/dist`
- API routes prefixed with `/api`
- Frontend uses relative URLs (`/api/...`) to avoid CORS
- Single origin: http://localhost:3001

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
1. Ensure Redis is running: `docker start redis-flipside`
2. Build frontend: `cd frontend && npx vite build`
3. Start backend: `cd backend && npm run dev`
4. Access app at http://localhost:3001

## Common Issues & Solutions

### CORS Errors
- **Problem**: Frontend making requests to different origins
- **Solution**: Use reverse proxy setup, ensure VITE_API_BASE_URL=/api

### Session Not Persisting
- **Problem**: Sessions not working across requests
- **Solution**: Ensure Redis is running, check session secret length (≥32 chars)

### OAuth Callback 404
- **Problem**: Spotify redirect URI mismatch
- **Solution**: Update Spotify app settings to use `/api/auth/spotify/callback`

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
- Frontend build required before backend serves static files
- All temporary debugging code has been removed
- CORS package removed (not needed with reverse proxy)


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