# FlipSide Player

A browser-based Spotify player with a unique split-vinyl UI that lets you interact with music like a real vinyl record.

![FlipSide Player](https://img.shields.io/badge/Spotify-Premium%20Required-1DB954?logo=spotify&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Fastify%20%7C%20Redis-blue)

## Features

- **Interactive Vinyl Interface** - Split-vinyl UI with Side A/B navigation
- **Needle Drop Seeking** - Click anywhere on the vinyl to seek
- **Side Flipping** - Toggle between first and second half of tracks
- **Album Artwork Display** - Full-screen cover view mode
- **Spotify Search** - Find and queue tracks from the catalog
- **Full Keyboard Controls** - Navigate without touching the mouse
- **Spotify Connect** - Switch playback between devices
- **Secure OAuth 2.0** - PKCE flow with session management

## Documentation

**Quick Links:**

- [Full Setup Guide](#setup) (below)
- [Architecture & Tech Stack](docs/architecture.md)
- [UI/UX & Components](docs/frontend.md)
- [API Documentation](docs/backend.md)
- [Troubleshooting Guide](docs/debugging.md)
- [Complete Documentation Index](docs/README.md)

## Prerequisites

- Node.js 22.x (LTS)
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

**Required Spotify Scopes**: streaming, playback position/control/state, private profile access. See [Architecture docs](docs/architecture.md) for details.

### 2. Quick Install

Use the install script to set up everything automatically:

```bash
# Make install script executable and run
chmod +x install.sh
./install.sh
```

Or install manually:

```bash
# Install all dependencies (root, backend, and frontend)
npm install

# Or install workspaces individually
cd backend && npm install
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

**Development (with real Spotify):**

```bash
npm run dev          # Start both backend and frontend
```

**Development (with mocks - no Spotify account needed):**

```bash
npm run dev:mock     # Start with mock Spotify SDK and API
```

**Docker:**

```bash
npm run docker:dev   # Development with hot reloading (real Spotify)
npm run docker:mock  # Development with mocks (no Spotify account needed)
npm run docker:prod  # Production deployment
```

Access the app at `http://localhost:5173` (dev) or `http://localhost:3001` (production).

**Mock Mode Benefits:**

- ✅ No Spotify Premium account required
- ✅ No API credentials needed
- ✅ No network connection to Spotify
- ✅ Faster development iteration
- ✅ Consistent test data

For production environment configuration, see the [Deployment](#deployment) section below.

## Deployment

**Docker Compose (Recommended):**

```bash
npm run docker:prod   # Single-origin deployment with reverse proxy
```

**Cross-Domain Deployment** (separate frontend/backend hosts):

- Set `NODE_ENV=production`
- Configure `FRONTEND_URL` and redirect URIs appropriately
- Update Spotify app settings with production redirect URI

For detailed deployment configuration and troubleshooting, see:

- [Architecture Documentation](docs/architecture.md) - Deployment options
- [Debugging Guide](docs/debugging.md) - Production issues

## Usage

1. Login with Spotify (Premium required)
2. Search and queue tracks
3. Click vinyl to seek, press `F` to flip sides, `C` to toggle cover view
4. Switch devices via device picker

See [Frontend Documentation](docs/frontend.md) for full UI guide and keyboard shortcuts.

## Development

**Quick Commands:**

```bash
npm install          # Install all dependencies
npm run dev          # Start both frontend and backend
npm run build        # Build for production
npm run clean        # Remove all node_modules
npm run format       # Format code with Prettier
npm run lint         # Lint all code
```

For detailed architecture, components, and API documentation, see:

- [Architecture Documentation](docs/architecture.md)
- [Frontend Documentation](docs/frontend.md)
- [Backend Documentation](docs/backend.md)

## Troubleshooting

**Common Issues:**

- **Authentication fails** → Check redirect URI matches exactly in Spotify dashboard
- **No devices found** → Open Spotify on another device first
- **Playback doesn't start** → Requires Spotify Premium account

For complete troubleshooting guide, see [Debugging Documentation](docs/debugging.md)

**Browser Requirements:**

- Modern browser (Chrome, Firefox, Safari)
- Spotify Premium account
- Third-party cookies enabled

## License

This project is for educational/demonstration purposes. Spotify integration requires compliance with [Spotify's Developer Terms of Service](https://developer.spotify.com/terms).

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow code style (run `npm run format` and `npm run lint`)
4. Update relevant documentation in `/docs`
5. Submit a pull request

See [docs/README.md](docs/README.md) for documentation guidelines.

## Support

- [Issue Tracker](https://github.com/yourusername/flipside-player/issues)
- [Documentation](docs/README.md)
- [Debugging Guide](docs/debugging.md)
