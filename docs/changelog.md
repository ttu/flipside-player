# FlipSide Player - Changelog

## Version History & Changes

This document tracks all significant changes, improvements, and fixes made to FlipSide Player. Each entry includes the date, type of change, and detailed description of modifications.

---

## 2025-01-17 - Cross-Domain Deployment Support 🌐

### Major Features Added

- **ADDED**: Full CORS support for cross-domain deployment (separate frontend/backend services)
- **ADDED**: Environment-aware session configuration (secure/sameSite handling)
- **ADDED**: Cross-domain authentication flow with proper cookie handling
- **ADDED**: Dual deployment architecture support (same-origin and cross-domain)
- **ENHANCED**: Device discovery with fallback handling for better user experience

### Deployment Patterns

**Same-Origin Deployment (Docker Compose):**
- Backend serves frontend static files via reverse proxy
- All requests appear from single origin
- Traditional session cookies work seamlessly

**Cross-Domain Deployment (Render, Vercel, Railway):**
- Frontend and backend on separate domains/services
- CORS headers enable cross-domain requests
- Secure cookies with SameSite=none for cross-domain authentication

### Technical Implementation

- **ADDED**: CORS middleware with origin-specific headers
- **ADDED**: Security headers for production deployment
- **ENHANCED**: Session configuration for cross-domain cookie support
- **ADDED**: Environment-based URL configuration (FRONTEND_URL, AUTH_BASE_URL)
- **FIXED**: OAuth callback to redirect to correct frontend domain
- **IMPROVED**: Device initialization with Web SDK fallback logic

### Environment Variables Added

**Backend:**
- `FRONTEND_URL` - Frontend domain for OAuth redirects and CORS
- Enhanced `NODE_ENV` handling for production cross-domain mode

**Frontend:**
- `VITE_AUTH_BASE_URL` - Separate auth URL for cross-domain deployments
- Enhanced `VITE_API_BASE_URL` handling for full URLs

### Files Modified

- `backend/src/server.ts` - Added CORS and security headers middleware
- `backend/src/routes/auth.ts` - OAuth callback redirect to frontend domain
- `backend/src/utils/spotify.ts` - Added user-read-playback-state scope
- `frontend/src/stores/authStore.ts` - Separated API and auth URLs
- `frontend/src/components/AlbumTrackList.tsx` - Device fallback handling
- `frontend/src/components/DevicePicker.tsx` - Enhanced device initialization
- `frontend/src/hooks/useSpotifyPlayer.ts` - Improved Web SDK error handling
- `backend/Dockerfile` - Fixed multi-stage build for production deployment
- `docker-compose.yml` - Added cross-domain environment variables

### Bug Fixes

- **FIXED**: "No Spotify device found" error with fallback device detection
- **FIXED**: Missing permissions error by adding required Spotify scopes
- **FIXED**: Session persistence in cross-domain production environments
- **FIXED**: Docker build issues with native module compilation (sodium-native)
- **FIXED**: Chrome security warnings with proper security headers

### Documentation Updates

- **UPDATED**: All documentation files for CORS cross-domain support
- **ENHANCED**: Setup instructions for both deployment patterns
- **ADDED**: Comprehensive debugging guide for CORS issues
- **IMPROVED**: Environment variable documentation with examples

---

## 2025-01-11 - UI/UX Improvements & Premium Account Handling ✨

### Major Features Added

- **ADDED**: Premium account detection and warning system
- **ADDED**: Dismissible premium warning notification with close button
- **ADDED**: Enhanced Spotify API error handling with user-friendly messages
- **ADDED**: Improved album image sizing in track listings
- **ADDED**: Fixed search results layout (album cover left, info right)

### UI/UX Improvements

- **FIXED**: Record listing size changes when switching vinyl sides
- **FIXED**: Song listing position stability during side switches
- **REMOVED**: Obsolete A/B text labels and center line from vinyl display
- **IMPROVED**: Album cover image sizing - now 300px max-width for better prominence
- **ENHANCED**: Search results layout with proper horizontal alignment
- **FIXED**: CSS z-index conflicts between premium warning and track listings

### Technical Enhancements

- **ADDED**: `product` field to `SpotifyUser` interface for premium detection
- **IMPROVED**: Error handling in Spotify API calls with specific error codes
- **ENHANCED**: CSS layout with consistent min-heights and flex properties
- **FIXED**: CSS selector conflicts between search results and track listings
- **ADDED**: Proper z-index hierarchy for UI elements

### Files Modified

- `backend/src/types/index.ts` - Added premium detection field
- `backend/src/routes/spotify.ts` - Enhanced error handling
- `backend/src/utils/spotify.ts` - Improved API error messages
- `frontend/src/components/PremiumWarning.tsx` - New premium warning component
- `frontend/src/types/index.ts` - Updated user interface
- `frontend/src/App.css` - Major styling improvements and fixes
- `frontend/src/components/VinylDeck.tsx` - Removed obsolete visual elements
- `frontend/src/App.tsx` - Integrated premium warning component

### Bug Fixes

- Fixed horizontal scrolling in album search results
- Resolved layout jumping when switching between vinyl sides
- Fixed close button positioning in premium warning
- Eliminated CSS conflicts between different UI components
- Improved text overflow handling in search results

---

## 2025-01-15 - Session Authentication Migration 🔐

### Major Changes

- **REMOVED**: JWT token-based authentication system
- **ADDED**: Session-based authentication with Redis storage
- **ADDED**: Reverse proxy architecture for same-origin serving
- **UPDATED**: Frontend to use `/api` base URL instead of full origin URLs

### Technical Implementation

- Migrated from `jsonwebtoken` library to `@fastify/secure-session`
- Added Redis integration for session storage with 7-day TTL
- Configured reverse proxy to serve frontend static files from backend
- Updated OAuth flow to store session data instead of returning JWT tokens
- Fixed CORS issues by eliminating cross-origin requests

### Authentication Flow Changes

**Before:**

```
Frontend (localhost:5173) → Backend (localhost:3001) → JWT tokens
```

**After:**

```
Single Origin (localhost:3001) → Session cookies → Redis storage
```

### Files Modified

- `backend/src/routes/auth.ts` - Removed JWT logic, added session management
- `backend/src/server.ts` - Added reverse proxy and static file serving
- `frontend/src/stores/authStore.ts` - Updated API calls to use relative URLs
- `frontend/.env` - Changed `VITE_API_BASE_URL` from full URL to `/api`
- `backend/.env` - Updated `SPOTIFY_REDIRECT_URI` to include `/api` prefix

### Cleanup Performed

- Removed `jsonwebtoken` dependency from package.json
- Removed temporary fallback route for old OAuth callback
- Removed debugging console.log statements
- Removed unused `@fastify/cors` package
- Fixed TypeScript warnings for unused parameters

---

## 2025-01-15 - Initial Project Setup 🚀

### Project Foundation

- **CREATED**: Monorepo structure with frontend and backend workspaces
- **SETUP**: React + TypeScript + Vite frontend application
- **SETUP**: Fastify + TypeScript backend API server
- **CONFIGURED**: Spotify OAuth 2.0 PKCE authentication flow

### Frontend Implementation

- **ADDED**: React components for vinyl player interface
- **ADDED**: Zustand stores for state management (auth, player, queue)
- **ADDED**: Tailwind CSS for styling and responsive design
- **ADDED**: Spotify Web SDK integration for playback control
- **IMPLEMENTED**: Search functionality for Spotify catalog
- **IMPLEMENTED**: Queue management with drag-and-drop support

### Backend Implementation

- **ADDED**: Fastify server with TypeScript configuration
- **ADDED**: Spotify API integration for user data and search
- **ADDED**: OAuth 2.0 PKCE flow for secure authentication
- **ADDED**: Session management with Redis storage
- **ADDED**: API routes for auth, user profile, and Spotify proxy

### Key Components Created

- `VinylDeck.tsx` - Main player interface with spinning record animation
- `SearchModal.tsx` - Music search and discovery interface
- `QueueStrip.tsx` - Horizontal queue management component
- `DeviceSelector.tsx` - Spotify Connect device management
- `useSpotifyPlayer.ts` - Custom hook for Spotify Web SDK integration
- `SpotifyAPI.ts` - Backend utility for Spotify API calls

### Environment Configuration

- **SETUP**: Development environment variables for Spotify API
- **SETUP**: Redis configuration for session storage
- **SETUP**: TypeScript configuration for both frontend and backend
- **SETUP**: ESLint configuration for code quality

---

## 2025-01-15 - Documentation System 📚

### Documentation Creation

- **ADDED**: Comprehensive documentation system in `/docs` folder
- **CREATED**: 10 focused documentation files covering all aspects of the project
- **ESTABLISHED**: Documentation standards and maintenance guidelines

### Documentation Files

- `docs/README.md` - Documentation overview and navigation guide
- `docs/description.md` - Product description, use cases, and target users
- `docs/architecture.md` - Technical architecture and system design
- `docs/application.md` - UI/UX patterns and component design system
- `docs/datamodel.md` - Data entities, relationships, and storage architecture
- `docs/changelog.md` - This change history document
- `docs/project-notes.md` - Requirements, decisions, and discussions
- `docs/debugging.md` - Troubleshooting guide and common issues
- `docs/learnings.md` - Technical insights and best practices
- `docs/todo.md` - Current tasks and planned improvements

### CLAUDE.md Integration

- **ADDED**: Claude Code reference file with project setup and commands
- **DOCUMENTED**: Development workflow and architecture patterns
- **ESTABLISHED**: Guidelines for AI-assisted development sessions

---

## Change Categories

### 🚀 **New Features**

Major new functionality added to the application

### 🔐 **Security**

Authentication, authorization, and security improvements

### 🐛 **Bug Fixes**

Resolution of issues and unexpected behavior

### ⚡ **Performance**

Speed, memory, or efficiency improvements

### 🎨 **UI/UX**

User interface and experience enhancements

### 🔧 **Technical**

Infrastructure, tooling, and development improvements

### 📚 **Documentation**

Documentation creation, updates, and improvements

### 🧹 **Cleanup**

Code cleanup, refactoring, and maintenance

---

## Change Log Format

Each entry follows this format:

```markdown
## YYYY-MM-DD - Change Title [Category Icon]

### [Change Type]

- **ACTION**: Description of what was changed
- **DETAIL**: Specific technical details
- **IMPACT**: How this affects the application

### Files Modified

- List of files changed
- Brief description of changes in each file

### [Additional Sections as Needed]

- Migration notes
- Breaking changes
- Dependencies updated
- Performance metrics
```

---

## Future Changes

### Planned Features

- Enhanced vinyl animations and visual effects
- Social features for sharing playlists and tracks
- Advanced queue management with smart suggestions
- Offline capability and caching improvements
- Mobile app versions for iOS and Android

### Technical Improvements

- Performance optimizations for large playlists
- Enhanced error handling and retry logic
- Comprehensive test suite implementation
- CI/CD pipeline setup for automated deployment
- Monitoring and analytics integration

---

## Maintenance Notes

- **Update Frequency**: Changelog updated with each significant change
- **Review Schedule**: Monthly review for accuracy and completeness
- **Archive Policy**: Entries older than 2 years may be archived
- **Format Standards**: Follow established format for consistency

This changelog serves as both historical record and reference for understanding the evolution of FlipSide Player's architecture and features.
