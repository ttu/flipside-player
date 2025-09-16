# FlipSide Player

A browser-based Spotify player with a unique split-vinyl UI that lets you interact with music like a real vinyl record. Users can search, queue, play/pause/seek, flip sides, and switch Spotify Connect devices.

## Features

### MVP Features ✅

- **Spotify OAuth 2.0 Authentication** - Secure PKCE flow with token management
- **Vinyl Interface** - Interactive vinyl disk split into Side A and Side B
- **Needle Drop Seeking** - Click/drag on active vinyl side to seek through tracks
- **Side Flipping** - Toggle between Side A (first half) and Side B (second half)
- **Album Artwork** - Displays largest available Spotify album art
- **Cover View Toggle** - Switch between vinyl and full-cover views
- **Search & Queue** - Search Spotify catalog and build playback queue
- **Playback Controls** - Play/pause, skip, volume, progress tracking
- **Spotify Connect** - List and switch between available devices
- **Keyboard Controls** - Full keyboard navigation support
  - `Space` - Play/pause
  - `F` - Flip vinyl sides
  - `C` - Toggle vinyl/cover view
  - `←/→` - Seek ±5 seconds
  - `Shift + ←/→` - Seek ±30 seconds

### Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Fastify + TypeScript
- **Audio**: Spotify Web Playback SDK (loaded via CDN)
- **State**: Zustand for client state management
- **Storage**: Redis for sessions and caching
- **Styling**: Custom CSS with responsive design

## Prerequisites

- Node.js 18+
- Redis server
- Spotify Premium account
- Spotify app registration

## Setup

### 1. Spotify App Registration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URIs (following Spotify's security requirements):
   - Development: `http://127.0.0.1:5173/api/auth/spotify/callback`
   - Production Single-Origin: `https://yourdomain.com/api/auth/spotify/callback`
   - Production Cross-Domain: `https://your-backend-domain.com/api/auth/spotify/callback`

   **Note**: Spotify requires explicit loopback IPs - `localhost` is not allowed

4. Note your Client ID and Client Secret

### 2. Quick Install

Use the install script to set up everything automatically:

```bash
# Make install script executable and run
chmod +x install.sh
./install.sh
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Environment Configuration

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/api/auth/spotify/callback
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your_secure_random_session_secret_32_chars_minimum
REDIS_URL=redis://localhost:6379
PORT=5174
```

**Important**: The `SESSION_SECRET` must be at least 32 characters long. Generate one with:

```bash
# Generate a secure session secret
openssl rand -hex 32
```

#### Frontend (.env)

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_BASE_URL=/api
VITE_AUTH_BASE_URL=/api
VITE_APP_NAME="FlipSide Player"
```

### 4. Start Redis

Make sure Redis is running:

```bash
redis-server
# or
brew services start redis  # macOS with Homebrew
```

### 5. Run the Application

#### Development Mode

From the root directory:

```bash
# Start both backend and frontend
npm run dev

# Or start separately:
npm run backend:dev   # Backend on :3001
npm run frontend:dev  # Frontend on :5173
```

#### Production Mode (Docker)

For production deployment using Docker:

```bash
# Build and start all services
npm run docker:prod
# or: docker-compose up --build -d

# View logs
npm run docker:logs
# or: docker-compose logs -f

# Stop services
npm run docker:stop
# or: docker-compose down

# Clean up (remove volumes and orphaned containers)
npm run docker:clean
```

#### Development Mode (Docker)

For development with Docker (hot reloading):

```bash
# Build and start development environment
npm run docker:dev
# or: docker-compose -f docker-compose.dev.yml up --build
```

**Production Environment Variables:**

Create production environment files:

`backend/.env.production`:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://yourdomain.com/api/auth/spotify/callback
SESSION_SECRET=your_secure_random_session_secret_32_chars_minimum
REDIS_URL=redis://redis:6379
PORT=3001
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

`frontend/.env.production`:

```env
VITE_API_BASE_URL=/api
VITE_AUTH_BASE_URL=/api
VITE_APP_NAME="FlipSide Player"
```

**Docker Services:**

- **Redis**: Session storage and caching on port 6379
- **Backend**: API server on port 3001
- **Frontend**: React app on port 5173 (dev) or served via reverse proxy (prod)

## Deployment

### Cross-Domain Deployment (e.g., Render, Vercel + Railway)

For separate frontend and backend services on different domains:

**Backend Environment Variables:**
```env
NODE_ENV=production
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-backend-domain.com/api/auth/spotify/callback
FRONTEND_URL=https://your-frontend-domain.com
SESSION_SECRET=your_secure_session_secret_32_chars_minimum
REDIS_URL=your_redis_connection_string
```

**Frontend Environment Variables:**
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_AUTH_BASE_URL=https://your-backend-domain.com/api
```

**Spotify App Settings:**
- Add redirect URI: `https://your-backend-domain.com/api/auth/spotify/callback`

### Single-Domain Deployment (Docker Compose)

Use the included docker-compose.yml for single-origin deployment with reverse proxy.

## Usage

1. **Login**: Click "Connect with Spotify" (requires Spotify Premium)
2. **Search**: Use the search bar to find tracks
3. **Queue**: Click search results to add to queue
4. **Play**: Use transport controls or click queue items
5. **Vinyl Interaction**:
   - Click/drag on active vinyl half to seek
   - Use flip button or press `F` to switch sides
6. **Views**: Toggle between vinyl and cover views with `C`
7. **Devices**: Use device picker to switch playback devices

## Development

### Project Structure

```
flipside-player/
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── routes/    # Auth and Spotify API routes
│   │   ├── types/     # TypeScript definitions
│   │   └── utils/     # Spotify API client, Redis
│   └── package.json
├── frontend/          # React application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── stores/    # Zustand state stores
│   │   ├── types/     # TypeScript definitions
│   │   └── utils/     # API utilities
│   └── package.json
└── package.json       # Workspace root
```

### Key Components

- **VinylDeck**: Canvas-based vinyl interface with seeking
- **CoverView**: Full album artwork display
- **SearchBar**: Debounced Spotify search with results
- **PlayerControls**: Transport controls and progress
- **QueueStrip**: Draggable queue management
- **DevicePicker**: Spotify Connect device switcher

### API Endpoints

- `GET /auth/spotify/start` - Start OAuth flow
- `GET /auth/spotify/callback` - Handle OAuth callback
- `POST /auth/logout` - Clear session
- `GET /me` - Get current user
- `GET /spotify/token` - Get access token for SDK
- `GET /spotify/search` - Search catalog
- `GET /spotify/devices` - List devices
- `PUT /spotify/transfer-playback` - Transfer playback

## Future Enhancements

- **MusicBrainz Integration**: Vinyl-specific album artwork
- **Favorites System**: Star albums and browse collection
- **Edition Metadata**: Display release info (year, label, country)
- **Advanced Interactions**: Beat detection, loop regions
- **Mobile Support**: Touch gestures, responsive design

## Troubleshooting

### Common Issues

1. **"Web Playback SDK not available"**
   - Ensure Spotify Premium subscription
   - Check browser compatibility (Chrome/Firefox/Safari)

2. **Authentication fails**
   - Verify Spotify app redirect URI matches exactly
   - Check client ID/secret in backend .env

3. **No devices found**
   - Start Spotify on another device first
   - Refresh device list in picker

4. **Playback doesn't start**
   - Transfer playback to browser device first
   - Check if another app is using Spotify

### Browser Requirements

- Modern browsers with Web Audio API support
- Spotify Premium account
- Third-party cookies enabled

## License

This project is for educational/demonstration purposes. Spotify integration requires compliance with Spotify's Developer Terms of Service.

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

For issues or feature requests, please use the GitHub issue tracker.
