/**
 * Mock Spotify Web Playback SDK
 *
 * This mock can be used for testing and development without requiring
 * a real Spotify connection or Premium account.
 *
 * Usage:
 *   import { setupSpotifySDKMock } from './mocks/spotifySDK';
 *   setupSpotifySDKMock();
 */

/// <reference types="../types/spotify" />

// Placeholder image as data URI (works offline)
const PLACEHOLDER_IMAGE_640 =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjY0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjY0MCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BbGJ1bSBDb3ZlcjwvdGV4dD48L3N2Zz4=';

export interface MockPlayerState {
  paused: boolean;
  position: number;
  duration: number;
  track: Spotify.WebPlaybackTrack | null;
}

export interface MockPlayerOptions {
  deviceId?: string;
  initialState?: Partial<MockPlayerState>;
  simulateErrors?: boolean;
}

class MockSpotifyPlayer implements Spotify.Player {
  private listeners: Map<string, Set<Function>> = new Map();
  private state: MockPlayerState;
  private deviceId: string;
  private connected: boolean = false;
  private volume: number = 0.5;
  private positionInterval: number | null = null;
  private simulateErrors: boolean;

  constructor(_init: Spotify.PlayerInit, options: MockPlayerOptions = {}) {
    this.deviceId = options.deviceId || 'mock-device-id-' + Math.random().toString(36).substr(2, 9);
    this.simulateErrors = options.simulateErrors || false;

    // Initialize state
    this.state = {
      paused: true,
      position: 0,
      duration: 180000, // 3 minutes default
      track: options.initialState?.track || null,
      ...options.initialState,
    };

    // Simulate SDK ready callback
    setTimeout(() => {
      if (window.onSpotifyWebPlaybackSDKReady) {
        window.onSpotifyWebPlaybackSDKReady();
      }
    }, 100);
  }

  addListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  async connect(): Promise<boolean> {
    if (this.simulateErrors) {
      this.emit('initialization_error', { message: 'Mock initialization error' });
      return false;
    }

    this.connected = true;

    // Simulate ready event after connection
    setTimeout(() => {
      this.emit('ready', { device_id: this.deviceId });
    }, 200);

    return true;
  }

  disconnect(): void {
    this.connected = false;
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
    this.emit('not_ready', { device_id: this.deviceId });
  }

  async getCurrentState(): Promise<Spotify.WebPlaybackState | null> {
    if (!this.connected) {
      return null;
    }

    // If no track is set but we're playing, try to get track from backend
    if (!this.state.track && !this.state.paused) {
      // In mock mode, create a default track if none exists
      const defaultTrack: Spotify.WebPlaybackTrack = {
        id: 'mock-track-default',
        uri: 'spotify:track:mock-track-default',
        name: 'Mock Track',
        artists: [{ name: 'Mock Artist', uri: 'spotify:artist:mock' }],
        album: {
          uri: 'spotify:album:mock-album',
          name: 'Mock Album',
          images: [
            {
              url: PLACEHOLDER_IMAGE_640,
              width: 640,
              height: 640,
            },
          ],
        },
        duration_ms: 180000,
      };
      this.setTrack(defaultTrack);
    }

    if (!this.state.track) {
      return null;
    }

    // Update duration from track if available
    if (this.state.track.duration_ms) {
      this.state.duration = this.state.track.duration_ms;
    }

    const albumId = this.state.track.album.uri.split(':')[2] || 'mock-album';
    return {
      context: {
        uri: `spotify:album:${albumId}`,
        metadata: {},
      },
      disallows: {
        pausing: false,
        peeking_next: false,
        peeking_prev: false,
        resuming: false,
        seeking: false,
        skipping_next: false,
        skipping_prev: false,
      },
      paused: this.state.paused,
      position: this.state.position,
      repeat_mode: 0,
      shuffle: false,
      track_window: {
        current_track: this.state.track,
        next_tracks: [],
        previous_tracks: [],
      },
      duration: this.state.duration,
    };
  }

  async getVolume(): Promise<number> {
    return this.volume;
  }

  async nextTrack(): Promise<void> {
    if (this.simulateErrors) {
      this.emit('playback_error', { message: 'Mock playback error' });
      throw new Error('Mock playback error');
    }
    // Simulate track change
    this.emit('player_state_changed', await this.getCurrentState());
  }

  async pause(): Promise<void> {
    if (this.simulateErrors) {
      throw new Error('Mock pause error');
    }
    this.state.paused = true;
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
    this.emit('player_state_changed', await this.getCurrentState());
  }

  async previousTrack(): Promise<void> {
    if (this.simulateErrors) {
      this.emit('playback_error', { message: 'Mock playback error' });
      throw new Error('Mock playback error');
    }
    // Simulate track change
    this.emit('player_state_changed', await this.getCurrentState());
  }

  async resume(): Promise<void> {
    if (this.simulateErrors) {
      throw new Error('Mock resume error');
    }
    this.state.paused = false;

    // Try to get track from player store if not set
    if (!this.state.track) {
      const playerStore = (window as any).__PLAYER_STORE__;
      if (playerStore) {
        const storeState = playerStore.getState();
        if (storeState.track) {
          const track = storeState.track;
          const mockTrack: Spotify.WebPlaybackTrack = {
            id: track.id,
            uri: track.uri,
            name: track.name,
            artists: track.artists.map((a: any) => ({
              name: a.name,
              uri: `spotify:artist:${a.name.toLowerCase().replace(/\s+/g, '-')}`,
            })),
            album: {
              uri: track.album?.id ? `spotify:album:${track.album.id}` : 'spotify:album:mock-album',
              name: track.album?.name || 'Mock Album',
              images: track.album?.images?.map((img: any) => ({
                url: img.url,
                width: img.width || 640,
                height: img.height || 640,
              })) || [
                {
                  url: PLACEHOLDER_IMAGE_640,
                  width: 640,
                  height: 640,
                },
              ],
            },
            duration_ms: track.duration_ms || 180000,
          };
          this.setTrack(mockTrack);
        }
      }
    }

    this.startPositionUpdates();
    const state = await this.getCurrentState();
    if (state) {
      this.emit('player_state_changed', state);
    }
  }

  async seek(positionMs: number): Promise<void> {
    if (this.simulateErrors) {
      throw new Error('Mock seek error');
    }
    this.state.position = Math.max(0, Math.min(positionMs, this.state.duration));
    this.emit('player_state_changed', await this.getCurrentState());
  }

  async setName(_name: string): Promise<void> {
    // Mock implementation - no-op
  }

  async setVolume(volume: number): Promise<void> {
    if (this.simulateErrors) {
      throw new Error('Mock volume error');
    }
    this.volume = Math.max(0, Math.min(1, volume));
  }

  async togglePlay(): Promise<void> {
    if (this.state.paused) {
      await this.resume();
    } else {
      await this.pause();
    }
  }

  startPositionUpdates(): void {
    // Clear any existing interval
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }

    // Only start if we have a track and are not paused
    if (!this.state.track || this.state.paused) {
      return;
    }

    this.positionInterval = window.setInterval(async () => {
      if (!this.state.paused && this.state.track) {
        this.state.position += 1000; // Update every second

        // Ensure duration is set from track
        if (this.state.track.duration_ms && this.state.duration !== this.state.track.duration_ms) {
          this.state.duration = this.state.track.duration_ms;
        }

        if (this.state.position >= this.state.duration) {
          this.state.position = this.state.duration;
          this.state.paused = true;
          if (this.positionInterval) {
            clearInterval(this.positionInterval);
            this.positionInterval = null;
          }
        }

        const state = await this.getCurrentState();
        if (state) {
          this.emit('player_state_changed', state);
        }
      } else if (this.state.paused) {
        // Stop updates if paused
        if (this.positionInterval) {
          clearInterval(this.positionInterval);
          this.positionInterval = null;
        }
      }
    }, 1000);
  }

  // Mock helper methods for testing
  setState(state: Partial<MockPlayerState>): void {
    this.state = { ...this.state, ...state };
    if (this.connected) {
      this.emit('player_state_changed', this.getCurrentState());
    }
  }

  setTrack(track: Spotify.WebPlaybackTrack): void {
    this.state.track = track;
    this.state.position = 0;
    // Update duration from track
    if (track.duration_ms) {
      this.state.duration = track.duration_ms;
    }
    // Restart position updates if playing
    if (!this.state.paused) {
      this.startPositionUpdates();
    }
    if (this.connected) {
      this.getCurrentState().then(state => {
        if (state) {
          this.emit('player_state_changed', state);
        }
      });
    }
  }

  getState(): MockPlayerState {
    return { ...this.state };
  }

  // Method to simulate track change from API
  async simulateTrackChange(
    trackUri: string,
    trackName?: string,
    durationMs?: number
  ): Promise<void> {
    // Try to find track in mock data or create a default one
    const trackId = trackUri.split(':').pop() || 'mock-track';
    const mockTrack: Spotify.WebPlaybackTrack = {
      id: trackId,
      uri: trackUri,
      name: trackName || `Mock Track ${trackId}`,
      artists: [{ name: 'Mock Artist', uri: 'spotify:artist:mock' }],
      album: {
        uri: 'spotify:album:mock-album',
        name: 'Mock Album',
        images: [
          {
            url: 'https://via.placeholder.com/640',
            width: 640,
            height: 640,
          },
        ],
      },
      duration_ms: durationMs || 180000, // 3 minutes default
    };

    this.setTrack(mockTrack);
    // If not paused, start position updates
    if (!this.state.paused) {
      this.startPositionUpdates();
    }
  }
}

// Global instance for API access
let globalMockPlayerInstance: MockSpotifyPlayer | null = null;

/**
 * Setup mock Spotify SDK
 */
export function setupSpotifySDKMock(options: MockPlayerOptions = {}): void {
  // Create mock Spotify namespace
  const mockSpotify = {
    Player: class extends MockSpotifyPlayer {
      constructor(init: Spotify.PlayerInit) {
        super(init, options);
        // Store global instance for API access
        globalMockPlayerInstance = this as any;
      }
    } as typeof Spotify.Player,
  };

  // Attach to window
  (window as any).Spotify = mockSpotify;
  (window as any).onSpotifyWebPlaybackSDKReady = options.deviceId
    ? () => {
        // SDK ready callback
      }
    : undefined;

  // Intercept startPlayback API calls to update mock SDK
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const [url, options] = args;
    const urlString = typeof url === 'string' ? url : url.toString();

    // Intercept playback start requests
    if (
      urlString.includes('/api/spotify/play') &&
      options?.method === 'PUT' &&
      globalMockPlayerInstance
    ) {
      try {
        const body = options?.body ? JSON.parse(options.body as string) : {};
        const uris = body.uris || [];

        if (uris.length > 0) {
          // Extract track info from URI
          const firstUri = uris[0];
          const trackId = firstUri.split(':').pop() || 'mock-track';

          // Create mock track from URI
          const mockTrack: Spotify.WebPlaybackTrack = {
            id: trackId,
            uri: firstUri,
            name: `Mock Track ${trackId}`,
            artists: [{ name: 'Mock Artist', uri: 'spotify:artist:mock' }],
            album: {
              uri: 'spotify:album:mock-album',
              name: 'Mock Album',
              images: [
                {
                  url: PLACEHOLDER_IMAGE_640,
                  width: 640,
                  height: 640,
                },
              ],
            },
            duration_ms: 180000, // Default 3 minutes
          };

          // Update mock SDK state
          globalMockPlayerInstance.setTrack(mockTrack);
          globalMockPlayerInstance.setState({ paused: false });
          globalMockPlayerInstance.startPositionUpdates();
        }
      } catch (e) {
        console.warn('Failed to intercept playback start:', e);
      }
    }

    // Call original fetch
    return originalFetch.apply(this, args);
  };

  console.log('✅ Spotify SDK Mock initialized');
}

/**
 * Create a mock track for testing
 */
export function createMockTrack(
  overrides: Partial<Spotify.WebPlaybackTrack> = {}
): Spotify.WebPlaybackTrack {
  return {
    id: overrides.id || 'mock-track-id',
    uri: overrides.uri || 'spotify:track:mock-track-id',
    name: overrides.name || 'Mock Track',
    artists: overrides.artists || [{ name: 'Mock Artist', uri: 'spotify:artist:mock-artist' }],
    album: {
      uri: overrides.album?.uri || 'spotify:album:mock-album',
      name: overrides.album?.name || 'Mock Album',
      images: overrides.album?.images || [
        {
          url: 'https://via.placeholder.com/640',
          width: 640,
          height: 640,
        },
      ],
    },
    duration_ms: overrides.duration_ms || 180000,
  };
}

/**
 * Cleanup mock SDK
 */
export function cleanupSpotifySDKMock(): void {
  delete (window as any).Spotify;
  delete (window as any).onSpotifyWebPlaybackSDKReady;
}
