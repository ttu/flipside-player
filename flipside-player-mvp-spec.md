# FlipSide Player — MVP Specifications (Markdown)

> **Goal:** A browser-based Spotify player with a split-vinyl UI, using **Spotify album art only**. Users can search, queue, play/pause/seek, flip sides, and switch Spotify Connect devices.  
> **Out of scope for MVP:** MusicBrainz/CAA artwork, Favourites/Collection, multi-source playback.

---

## 1. Product Overview

- **Platform:** Web (desktop-first, responsive for tablet)
- **Core metaphor:** A large **vinyl disk** split into **Side A** and **Side B**.
- **Audio engine:** **Spotify Web Playback SDK** (user must have **Premium**).
- **Artwork:** **Spotify album art** (largest available image from the track’s album).

---

## 2. Scope

### 2.1 Must-have (MVP)

- **Auth**: Spotify OAuth 2.0 (PKCE). Backend exchanges code; stores/rotates refresh tokens.
- **Playback**: Initialize Web Playback SDK; control play/pause, seek, previous/next, volume.
- **Vinyl UI**:
  - Click/drag on the active half to **needle-drop** (seek).
  - **Flip** between Side A/B (button + hotkey).
- **Search & Queue**: Search Spotify catalog; add to queue; reorder; skip.
- **Album Art**: Render largest Spotify album image; **Cover Maximize** (toggle between vinyl and cover).
- **Connect Picker**: List and switch **Spotify Connect** devices.
- **Keyboard controls**:  
  `Space` play/pause · `F` flip sides · `←/→` ±5s · `Shift+←/→` ±30s · `C` cover/vinyl toggle.

### 2.2 Nice-to-have (post-MVP)

- **MusicBrainz + Cover Art Archive** integration for vinyl covers (ISRC → MB → CAA).
- **Favourites & Record Collection** (⭐ albums, grid browsing).
- **Edition switching** (country/year/label badges).
- **Beat/chorus heuristics**, haptics, shareable loop cards (if loops reintroduced).

---

## 3. UX & UI

### 3.1 Main Screen (Player)

- **Top bar:** App name/logo, search input, account menu (avatar), view toggle (Vinyl/Cover).
- **Center:**
  - **VinylDeck** (default view): large canvas with grooves & needle; Side A/B indicator; flip button.
  - **Cover View**: edge-to-edge album cover (`object-fit: contain`), controls overlaid on a translucent bar.
- **Bottom bar:** Transport controls (prev, play/pause, next), position & duration, volume slider, Connect device picker.
- **Bottom strip:** Queue (h-scroll), draggable reordering, context menu (remove from queue).

### 3.2 Interactions

- **Needle drop:** click/drag on active half → convert radial angle to track time; call `seek(ms)`.
- **Flip:** button + hotkey `F` toggles active semicircle; subtle rotation/label animation.
- **Cover toggle:** button + hotkey `C`; 200–300ms crossfade/scale between views.

### 3.3 Accessibility

- Full keyboard nav; visible focus outlines; adequate contrast.
- ARIA roles for buttons/sliders; announce play/pause state changes.
- Respect reduced motion (disable heavy animations).

---

## 4. Architecture

```
Frontend (React + TypeScript)
 ├─ VinylDeck (Canvas)
 ├─ PlayerChrome (transport, volume, timeline)
 ├─ QueueStrip
 ├─ SearchBar
 ├─ ConnectPicker
 ├─ ViewToggle (Vinyl/Cover)
 └─ State (Zustand/Redux): auth, playback, queue, artwork, view, devices

Backend (Node.js + Fastify/Express, TypeScript)
 ├─ Auth routes (PKCE start/callback, logout)
 ├─ Spotify proxy (search, transfer, me)
 ├─ Token refresh, session (Redis)
 └─ Observability, security, rate limiting

3rd-Party
 └─ Spotify Web Playback SDK + Web API
```

---

## 5. State & Data Models (Frontend)

```ts
type PlaybackState = {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  track: {
    id: string;
    name: string;
    artists: string[];
    album: {
      id: string;
      name: string;
      images: { url: string; width: number; height: number }[];
    };
  } | null;
  deviceId?: string;
  volume: number; // 0..1
};

type ViewState = { mode: 'vinyl' | 'cover' };

type ArtworkState = {
  coverUrl?: string; // largest Spotify image, typically 640px
  loading: boolean;
  error?: string;
};

type QueueItem = {
  type: 'track';
  spotifyUri: string;
  title: string;
  artist: string;
  albumId: string;
  albumArt?: string;
};
type QueueState = { items: QueueItem[] };

type DevicesState = {
  devices: { id: string; name: string; isActive: boolean }[];
  loading: boolean;
};

type AuthState = {
  isAuthenticated: boolean;
  user?: { id: string; name: string; avatar?: string };
};
```

---

## 6. Backend API (MVP)

> All endpoints are **authenticated** (session cookie / bearer from server). Backend proxies Spotify to keep secrets off the client.

### 6.1 Auth

```http
GET /auth/spotify/start        # begins PKCE flow (returns redirect)
GET /auth/spotify/callback     # handles code, sets session cookie (httpOnly, SameSite=Lax/Strict)
POST /auth/logout              # clears session
GET /me                        # returns { id, display_name, images[] }
```

### 6.2 Spotify Proxy

```http
GET /spotify/search?q=...&type=track,album&limit=20
POST /spotify/transfer-playback { "deviceId": "abc123", "play": true }
GET /spotify/devices
GET /spotify/player            # minimal now-playing snapshot (optional)
```

**Notes**

- The **Web Playback SDK** receives short-lived access tokens via a backend endpoint (`/spotify/token`) or callback in the SDK init function; refresh handled server-side.
- Cache search results (Redis) for 30–120s to reduce rate pressure.

---

## 7. Spotify Web Playback SDK Integration

### 7.1 Init

```ts
const player = new Spotify.Player({
  name: 'FlipSide Player',
  getOAuthToken: cb =>
    fetch('/spotify/token')
      .then(r => r.text())
      .then(cb),
  volume: 0.8,
});
player.addListener('ready', ({ device_id }) => setDeviceId(device_id));
player.addListener('player_state_changed', onPlayerStateChanged);
player.connect();
```

### 7.2 Map state → UI

- On `player_state_changed`, update: `positionMs`, `durationMs`, `isPlaying`, current `track`.
- **Artwork:** pick **largest** `track.album.images`:

```ts
const cover = (track?.album?.images ?? []).sort((a, b) => b.width - a.width)[0]?.url;
setArtwork({ coverUrl: cover, loading: false });
```

### 7.3 Controls

```ts
await player.resume();
await player.pause();
await player.seek(ms);
await player.previousTrack();
await player.nextTrack();
await player.setVolume(v); // 0..1
```

---

## 8. Vinyl Interaction Model

- **Time mapping (simple):**
  - Map **Side A** to `0 → duration/2`, **Side B** to `duration/2 → duration`.
  - Convert pointer angle along the active semicircle → target time; call `seek(ms)`.
- **Flip logic:** toggles the active semicircle; highlight the active side with subtle glow.
- **Animation:** disk rotates at constant speed proportional to playback progress; needle drops with eased interpolation.

---

## 9. Error Handling

- **Unsupported browser / EME:** Show modal with supported versions guidance.
- **Token expiry:** Auto-refresh; on failure, prompt re-login.
- **Playback transfer errors:** Retry with exponential backoff; show toast on persistent failure.
- **Networking:** Graceful fallbacks; offline indicators for transient failures.
- **Queue ops:** Optimistic UI; revert on backend failure with toast.

---

## 10. Security & Compliance

- HTTPS-only; HSTS.
- Session cookie: `httpOnly`, `Secure`, `SameSite=Lax/Strict`.
- CORS allowlist for your frontends.
- Input validation (zod) for all params.
- Least-privilege scopes: `streaming`, `user-read-playback-state`, `user-modify-playback-state`, basic profile.
- Do **not** expose refresh tokens to the client.

---

## 11. Performance

- Lazy-load Spotify SDK script only after login.
- Debounce search input (250–350ms).
- Use `requestAnimationFrame` for VinylDeck rendering; respect `prefers-reduced-motion`.
- Memoize artwork; reuse 640px cover for both views; avoid layout thrash.

---

## 12. Telemetry & Logging

- **Frontend:** capture errors and key events (play, pause, flip, seek, device transfer).
- **Backend:** structured logs (pino) with request IDs; monitor rate limits and token refresh outcomes.

---

## 13. Acceptance Criteria

- **Auth:** User can sign in with Spotify; session persists across reloads.
- **Playback:** After search and selecting a track, audio plays in-browser; play/pause/seek/skip/volume work.
- **Vinyl UI:** Clicking/dragging on the active semicircle seeks correctly; flip changes the seekable half.
- **Artwork:** Largest Spotify album image appears; **Cover Maximize** toggles instantly (≤300ms transition).
- **Queue:** Add, reorder (drag), remove; next/previous respects queue order.
- **Devices:** List devices; transfer playback to browser device and back to another device.
- **A11y:** Keyboard shortcuts work; focus states visible.

---

## 14. Out of Scope (MVP)

- MusicBrainz/CAA covers
- Favourites / Record Collection
- A/B loops
- YouTube or other providers

---

## 15. Milestones

1. **Week 1–2** — Auth + SDK bootstrap
   - PKCE flow, token exchange, SDK init, device ready, basic transport.
2. **Week 3** — VinylDeck + Search/Queue
   - Canvas rendering, flip & seek mapping, search → queue → play wiring.
3. **Week 4** — Artwork + Devices + Polish
   - Album art binding + Cover toggle, Connect picker, keyboard controls, telemetry, QA.

---

## 16. Environment & Config

- **Frontend env:** `VITE_API_BASE_URL`, `VITE_APP_NAME="FlipSide Player"`
- **Backend env:** `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `SESSION_SECRET`, `REDIS_URL`
- **Build/deploy:** Docker images; CI with lint/test/build; deploy to your infra (Vercel/Render/Fly.io etc.)

---

## 17. Future Extensions (Nice-to-have detail)

- **CAA Integration:** `/art/resolve` backend that maps Spotify album → MBID (via ISRC/artist+album), fetches CAA art (250/500/1200), caches in Redis, progressive image swap in UI.
- **Favourites/Collection:** `POST /favorites/toggle`, `GET /favorites` with grid UI (500px thumbs), sorting and filters.
- **Edition Picker:** surface MB metadata (year/country/label) to switch sleeves.

---

### Hand-off Notes

- Keep interfaces stable (`PlaybackState`, `QueueItem`), and gate Nice-to-have features behind flags to minimize merge pain.
- Provide a **mock player** implementation for local UI dev without Spotify credentials.
