# FlipSide Player - Debugging Guide

## Common Issues & Solutions

This guide covers the most frequently encountered issues during development and deployment of FlipSide Player, along with step-by-step solutions.

---

## Authentication Issues

### Issue: "Not authenticated" errors despite successful login

**Symptoms:**

- User completes Spotify OAuth but API calls return 401
- Browser shows session cookies but backend doesn't recognize them
- `/api/me` endpoint returns authentication failure

**Diagnostic Steps:**

```bash
# 1. Check if session exists in Redis
docker exec -it redis-flipside redis-cli
> KEYS session:*
> GET session:YOUR_SESSION_ID

# 2. Verify cookie is being sent
# In browser DevTools → Application → Cookies
# Look for 'sessionId' cookie with proper domain

# 3. Check backend logs for session validation
tail -f backend_logs.log | grep "session"
```

**Common Causes & Solutions:**

1. **Redis Connection Issues**

   ```bash
   # Check Redis is running
   docker ps | grep redis

   # Start Redis if not running
   docker start redis-flipside

   # Test Redis connection
   redis-cli ping
   ```

2. **Session Secret Mismatch**

   ```bash
   # Verify session secret is at least 32 characters
   echo $SESSION_SECRET | wc -c

   # Generate new secure secret if needed
   openssl rand -hex 32
   ```

3. **Cookie Domain/Path Issues**
   - Ensure frontend and backend are served from same origin
   - Check cookie settings in browser DevTools
   - Verify `sameSite` and `secure` cookie settings

### Issue: OAuth callback returns 404 "Route not found"

**Symptoms:**

- Spotify redirects to callback URL but gets 404 error
- URL shows `/auth/spotify/callback` instead of `/api/auth/spotify/callback`

**Solution:**

1. **Update Spotify App Settings**

   **Same-Origin Deployment:**
   - Go to https://developer.spotify.com/dashboard
   - Select your app → Settings
   - Update Redirect URI to: `http://127.0.0.1:3001/api/auth/spotify/callback`

   **Cross-Domain Deployment:**
   - Update Redirect URI to: `https://your-backend-domain.com/api/auth/spotify/callback`
   - Note: Must point to backend domain, not frontend

2. **Verify Environment Variables**

   ```bash
   # Same-origin setup
   grep SPOTIFY_REDIRECT_URI backend/.env
   # Should show: SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/api/auth/spotify/callback

   # Cross-domain setup
   grep SPOTIFY_REDIRECT_URI backend/.env
   # Should show: SPOTIFY_REDIRECT_URI=https://your-backend-domain.com/api/auth/spotify/callback
   ```

3. **Check for Temporary Fallback Routes**
   - Ensure no old fallback routes exist in server.ts
   - Restart backend server after changes

### Issue: OAuth callback redirects to wrong domain

**Symptoms:**

- Callback succeeds but redirects to backend domain instead of frontend
- User sees backend response instead of frontend app
- CORS errors after successful authentication

**Solution:**

1. **Verify Frontend URL Environment Variable**

   ```bash
   # Backend environment should specify frontend domain
   echo $FRONTEND_URL
   # Same-origin: http://localhost:3001 (or empty)
   # Cross-domain: https://your-frontend-domain.com
   ```

2. **Check Auth Route Configuration**

   ```typescript
   // In auth route callback handler
   const frontendUrl = process.env.FRONTEND_URL || '/';
   return reply.redirect(frontendUrl);
   ```

3. **Validate Redirect Logic**
   - Backend should redirect to frontend domain after successful auth
   - Frontend should handle the redirect and check authentication state

---

## CORS and Network Issues

### Issue: CORS errors in cross-domain deployment

**Symptoms:**

- `Access to fetch at 'https://backend.com/api/...' from origin 'https://frontend.com' has been blocked by CORS policy`
- `Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'`
- Authentication cookies not being sent with requests

**Root Cause:**
Frontend and backend deployed on different domains without proper CORS configuration

**Solution:**

1. **Verify CORS Headers**

   ```bash
   # Test CORS headers with curl
   curl -H "Origin: https://your-frontend-domain.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://your-backend-domain.com/api/me

   # Should return:
   # Access-Control-Allow-Origin: https://your-frontend-domain.com
   # Access-Control-Allow-Credentials: true
   ```

2. **Check Environment Variables**

   ```bash
   # Backend environment
   echo $FRONTEND_URL  # Should match your frontend domain exactly
   echo $NODE_ENV      # Should be 'production' for cross-domain

   # Frontend environment
   echo $VITE_API_BASE_URL   # Should be full backend URL
   echo $VITE_AUTH_BASE_URL  # Should be full backend URL
   ```

3. **Validate Session Configuration**

   ```typescript
   // Check session options in backend
   // Should include for cross-domain:
   sameSite: 'none',
   secure: true,  // Required for cross-domain cookies
   httpOnly: false
   ```

### Issue: CORS errors in same-origin deployment

**Symptoms:**

- `Access to fetch at 'http://localhost:3001/...' from origin 'http://127.0.0.1:3001' has been blocked by CORS policy`
- Network requests fail with CORS errors

**Root Cause:**
Different origins (localhost vs 127.0.0.1) treated as separate domains by browsers

**Solution:**

1. **Use Consistent URLs**

   ```bash
   # Always use the same origin for both frontend and backend
   # Either http://localhost:3001 OR http://127.0.0.1:3001, not mixed
   ```

2. **Verify Frontend Configuration**

   ```bash
   # Check frontend .env
   cat frontend/.env
   # Should show: VITE_API_BASE_URL=/api

   # Rebuild frontend if changed
   cd frontend && npx vite build
   ```

3. **Ensure Reverse Proxy Setup**
   - Backend should serve frontend static files
   - API routes should use `/api` prefix
   - No separate Vite dev server running

### Issue: Authentication cookies not working in cross-domain

**Symptoms:**

- Login appears successful but `/api/me` returns 401
- Cookies visible in DevTools but not sent with requests
- "SameSite" warnings in browser console

**Diagnostic Steps:**

```bash
# 1. Check cookie attributes in browser DevTools
# Application → Cookies → Look for sessionId cookie
# Should show: SameSite=None; Secure=true for cross-domain

# 2. Verify HTTPS configuration
# Cross-domain cookies require HTTPS in production

# 3. Test authentication endpoint
curl -X GET https://your-backend.com/api/me \
     -H "Cookie: sessionId=your-session-id" \
     -H "Origin: https://your-frontend.com"
```

**Solutions:**

1. **Enable Secure Cookies**

   ```bash
   # Ensure HTTPS is properly configured
   # Backend must use secure: true for cross-domain cookies
   ```

2. **Update Session Configuration**

   ```typescript
   // In backend session config
   secure: process.env.NODE_ENV === 'production',
   sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
   ```

3. **Check Domain Configuration**

   ```bash
   # Verify domains match exactly (including subdomains)
   # No trailing slashes in FRONTEND_URL
   ```

### Issue: "Failed to fetch" errors for API calls

**Symptoms:**

- Network requests fail silently
- Browser DevTools show failed requests
- No specific error messages in console

**Diagnostic Steps:**

```bash
# 1. Test API endpoints directly
curl http://localhost:3001/api/health

# 2. Check if backend is running
lsof -i :3001

# 3. Verify route registration
grep -r "register.*Routes" backend/src/
```

**Solutions:**

1. **Backend Not Running**

   ```bash
   cd backend && npm run dev
   ```

2. **Port Conflicts**

   ```bash
   # Kill processes using port 3001
   lsof -ti:3001 | xargs kill -9

   # Start backend
   npm run dev
   ```

3. **Route Configuration Issues**
   - Verify routes are registered with correct `/api` prefix
   - Check Fastify route logs during startup

---

## Spotify Integration Issues

### Issue: "Premium account required" for playback

**Symptoms:**

- Search works but playback controls don't function
- Spotify Web SDK fails to initialize player
- Device doesn't appear in Spotify Connect list

**Solution:**

- Spotify Web SDK requires Premium subscription
- Inform users about Premium requirement
- Consider fallback to preview clips for free users

### Issue: No devices available for playback

**Symptoms:**

- Device selector shows no available devices
- "No active device" errors when trying to play music

**Solutions:**

1. **Open Spotify App**
   - Open Spotify desktop app or mobile app
   - Start playing any track to make device active
   - Device should appear in FlipSide Player

2. **Initialize Web SDK Device**

   ```javascript
   // Ensure Spotify Web SDK is properly initialized
   // Check browser console for SDK errors
   window.Spotify.Player.getInstance().connect();
   ```

3. **Check Device Permissions**
   - Ensure Spotify app settings allow remote control
   - Check if device is in private session (won't appear)

### Issue: Token refresh failures

**Symptoms:**

- User logged in but API calls return 401 after some time
- "Token expired" errors in backend logs
- Automatic token refresh not working

**Diagnostic Steps:**

```bash
# Check token expiration in session
redis-cli GET session:YOUR_SESSION_ID | jq '.tokenExpires'

# Compare with current timestamp
date +%s
```

**Solutions:**

1. **Verify Refresh Token Logic**

   ```typescript
   // Check if refresh token is being stored and used
   // Verify token refresh endpoint is working
   ```

2. **Check Spotify API Errors**
   - Look for specific error codes in API responses
   - Ensure refresh token hasn't been revoked

---

## Development Environment Issues

### Issue: Frontend build fails with TypeScript errors

**Symptoms:**

- `npm run build` fails with TS errors
- Development works but production build fails

**Solution:**

```bash
# Skip TypeScript checking for build (temporary)
cd frontend && npx vite build

# Fix TypeScript errors individually
# Or update tsconfig.json for less strict checking
```

### Issue: Hot reload not working in development

**Symptoms:**

- Changes to code don't reflect in browser
- Need to manually refresh page for updates

**Solutions:**

1. **Use Correct Development Setup**

   ```bash
   # Don't run Vite dev server separately
   # Only run backend dev server which serves built frontend
   cd backend && npm run dev
   ```

2. **Rebuild Frontend After Changes**
   ```bash
   # After making frontend changes
   cd frontend && npx vite build
   # Backend will automatically serve updated files
   ```

### Issue: Redis connection failures

**Symptoms:**

- Backend fails to start with Redis connection errors
- "ECONNREFUSED" errors in logs

**Solutions:**

1. **Start Redis**

   ```bash
   # Start Redis container
   docker start redis-flipside

   # Or create new one if doesn't exist
   docker run --rm -d --name redis-flipside -p 6379:6379 redis:alpine
   ```

2. **Check Redis Configuration**

   ```bash
   # Verify Redis URL in environment
   echo $REDIS_URL
   # Should be: redis://localhost:6379

   # Test Redis connectivity
   redis-cli ping
   ```

---

## Performance Issues

### Issue: Slow page loading

**Symptoms:**

- Initial page load takes several seconds
- Large bundle sizes in network tab

**Solutions:**

1. **Optimize Bundle Size**

   ```bash
   # Analyze bundle size
   cd frontend && npx vite build --analyze

   # Implement code splitting if needed
   ```

2. **Image Optimization**
   - Use Spotify's CDN for album artwork
   - Implement lazy loading for images
   - Consider WebP format with fallbacks

### Issue: Memory leaks in browser

**Symptoms:**

- Browser memory usage increases over time
- Page becomes slow after extended use

**Solutions:**

1. **Check for Memory Leaks**

   ```javascript
   // Use browser DevTools → Memory tab
   // Take heap snapshots to identify leaks
   ```

2. **Component Cleanup**
   - Ensure useEffect cleanup functions
   - Remove event listeners on unmount
   - Clear intervals and timeouts

---

## Production Deployment Issues

### Issue: Environment variables not loading

**Symptoms:**

- Backend fails to start with missing environment variables
- Features work in development but fail in production

**Solutions:**

1. **Verify Environment Files**

   ```bash
   # Check all required variables are set
   grep -v "^#" backend/.env | grep -v "^$"

   # Validate variable lengths (session secret, etc.)
   ```

2. **Docker Environment**
   ```bash
   # If using Docker, ensure env vars are passed
   docker run -e SPOTIFY_CLIENT_ID=... -e SPOTIFY_CLIENT_SECRET=...
   ```

### Issue: Cross-domain deployment configuration errors

**Symptoms:**

- Authentication works in development but fails in production
- CORS errors only appear in production environment
- Cookies not being sent between frontend and backend

**Diagnostic Steps:**

```bash
# 1. Verify deployment-specific environment variables
echo $NODE_ENV          # Must be 'production' for cross-domain
echo $FRONTEND_URL      # Must match frontend domain exactly
echo $SPOTIFY_REDIRECT_URI  # Must point to backend domain

# 2. Test CORS configuration
curl -H "Origin: https://your-frontend.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-backend.com/api/me

# 3. Check SSL/HTTPS configuration
curl -I https://your-backend.com/api/health
```

**Solutions:**

1. **Same-Origin Deployment (Docker Compose)**

   ```bash
   # Use reverse proxy setup
   # Backend serves frontend static files
   VITE_API_BASE_URL=/api
   FRONTEND_URL=http://localhost:3001  # or empty
   ```

2. **Cross-Domain Deployment (Render, Vercel, etc.)**

   ```bash
   # Backend environment
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   SPOTIFY_REDIRECT_URI=https://your-backend-domain.com/api/auth/spotify/callback

   # Frontend environment
   VITE_API_BASE_URL=https://your-backend-domain.com/api
   VITE_AUTH_BASE_URL=https://your-backend-domain.com/api
   ```

### Issue: HTTPS redirect loops

**Symptoms:**

- Site redirects infinitely between HTTP and HTTPS
- SSL certificate errors

**Solutions:**

1. **Configure Reverse Proxy**

   ```nginx
   # Nginx configuration example
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   ```

2. **Update Spotify OAuth URLs**
   - Change redirect URI to HTTPS in Spotify app settings
   - Update environment variables accordingly

### Issue: Session cookies not working in production

**Symptoms:**

- Authentication appears successful but session is lost
- Browser shows "SameSite" warnings in production
- API calls return 401 despite recent login

**Solutions:**

1. **Cross-Domain Cookie Configuration**

   ```typescript
   // Ensure production session config includes:
   secure: true,        // Required for HTTPS
   sameSite: 'none',    // Required for cross-domain
   httpOnly: false      // Allows frontend access if needed
   ```

2. **Verify HTTPS Setup**

   ```bash
   # Ensure both domains use HTTPS in production
   # HTTP cookies won't work for cross-domain
   ```

3. **Check Domain Configuration**

   ```bash
   # Ensure FRONTEND_URL matches exactly (no trailing slash)
   # Subdomains matter: www.example.com != example.com
   ```

---

## Debugging Tools & Commands

### Backend Debugging

```bash
# View backend logs with timestamps
npm run dev | tee backend.log

# Monitor Redis activity
redis-cli MONITOR

# Check session data
redis-cli KEYS "session:*"
redis-cli GET "session:your-session-id"

# Test API endpoints
curl -H "Cookie: sessionId=your-session" http://localhost:3001/api/me
```

### Frontend Debugging

```javascript
// Access state stores in browser console
window.__ZUSTAND_AUTH_STORE__ = useAuthStore.getState();
window.__ZUSTAND_PLAYER_STORE__ = usePlayerStore.getState();

// Check localStorage/sessionStorage
localStorage.getItem('key');
sessionStorage.getItem('key');

// Monitor network requests
// DevTools → Network → Filter by XHR/Fetch
```

### Environment Validation

```bash
# Validate all environment variables
./scripts/validate-env.sh

# Check service health
curl http://localhost:3001/api/health
curl http://localhost:3001/api/me
```

---

## Getting Help

### Information to Include in Bug Reports

1. **Environment Details**
   - Operating system and version
   - Node.js version (`node --version`)
   - Browser version and type
   - Docker version if using containers

2. **Error Information**
   - Complete error messages from console
   - Backend server logs
   - Network requests from DevTools
   - Screenshots if UI-related

3. **Reproduction Steps**
   - Exact steps to reproduce the issue
   - Expected vs actual behavior
   - Whether issue is consistent or intermittent

4. **Configuration**
   - Environment variable values (redact secrets)
   - Browser DevTools console output
   - Network connectivity status

### Debug Mode Activation

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run dev

# Frontend debug mode
export VITE_DEBUG=true
npm run build
```

This debugging guide should help resolve most common issues. For persistent problems, refer to the project's issue tracker or consult the development team.
