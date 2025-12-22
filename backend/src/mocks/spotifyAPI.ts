/**
 * Mock Spotify API
 *
 * This mock can be used for testing and development without requiring
 * a real Spotify connection or API credentials.
 *
 * Usage:
 *   import { MockSpotifyAPI } from './mocks/spotifyAPI';
 *   const spotify = new MockSpotifyAPI();
 */

import {
  SpotifyToken,
  SpotifyUser,
  SpotifyDevice,
  SpotifySearchResult,
  SpotifyTrack,
} from '../types';

// Placeholder image as data URI (works offline)
const PLACEHOLDER_IMAGE_640 =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjY0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjY0MCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BbGJ1bSBDb3ZlcjwvdGV4dD48L3N2Zz4=';

const PLACEHOLDER_IMAGE_300 =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Vc2VyPC90ZXh0Pjwvc3ZnPg==';

export interface MockSpotifyAPIOptions {
  simulateErrors?: boolean;
  delay?: number; // Simulate network delay in ms
}

export class MockSpotifyAPI {
  private simulateErrors: boolean;
  private delay: number;
  private mockDevices: SpotifyDevice[] = [];
  private mockTracks: SpotifyTrack[] = [];
  private mockAlbums: any[] = [];

  constructor(options: MockSpotifyAPIOptions = {}) {
    this.simulateErrors = options.simulateErrors || false;
    this.delay = options.delay || 0;

    // Initialize with some mock data
    this.initializeMockData();
  }

  private async simulateDelay(): Promise<void> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
  }

  private initializeMockData(): void {
    // Mock devices
    this.mockDevices = [
      {
        id: 'mock-web-player',
        name: 'Mock Web Player',
        type: 'Computer',
        is_active: true,
        is_private_session: false,
        is_restricted: false,
        volume_percent: 50,
        supports_volume: true,
      },
      {
        id: 'mock-phone',
        name: 'Mock Phone',
        type: 'Smartphone',
        is_active: false,
        is_private_session: false,
        is_restricted: false,
        volume_percent: 75,
        supports_volume: true,
      },
    ];

    // Mock tracks - diverse set for testing with multiple tracks per album
    this.mockTracks = [
      // Mock Album 1 - 4 tracks
      {
        id: 'mock-track-1',
        name: 'Mock Track 1',
        artists: [{ name: 'Mock Artist' }],
        album: {
          id: 'mock-album-1',
          name: 'Mock Album 1',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-1',
        duration_ms: 180000,
      },
      {
        id: 'mock-track-2',
        name: 'Mock Track 2',
        artists: [{ name: 'Mock Artist' }],
        album: {
          id: 'mock-album-1',
          name: 'Mock Album 1',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-2',
        duration_ms: 200000,
      },
      {
        id: 'mock-track-1-3',
        name: 'Mock Track 3',
        artists: [{ name: 'Mock Artist' }],
        album: {
          id: 'mock-album-1',
          name: 'Mock Album 1',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-1-3',
        duration_ms: 195000,
      },
      {
        id: 'mock-track-1-4',
        name: 'Mock Track 4',
        artists: [{ name: 'Mock Artist' }],
        album: {
          id: 'mock-album-1',
          name: 'Mock Album 1',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-1-4',
        duration_ms: 220000,
      },
      // Jazz Collection - 5 tracks
      {
        id: 'mock-track-3',
        name: 'Jazz Night',
        artists: [{ name: 'Smooth Jazz Band' }],
        album: {
          id: 'mock-album-2',
          name: 'Jazz Collection',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-3',
        duration_ms: 240000,
      },
      {
        id: 'mock-track-3-2',
        name: 'Midnight Blues',
        artists: [{ name: 'Smooth Jazz Band' }],
        album: {
          id: 'mock-album-2',
          name: 'Jazz Collection',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-3-2',
        duration_ms: 255000,
      },
      {
        id: 'mock-track-3-3',
        name: 'Smooth Saxophone',
        artists: [{ name: 'Smooth Jazz Band' }],
        album: {
          id: 'mock-album-2',
          name: 'Jazz Collection',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-3-3',
        duration_ms: 230000,
      },
      {
        id: 'mock-track-3-4',
        name: 'City Lights',
        artists: [{ name: 'Smooth Jazz Band' }],
        album: {
          id: 'mock-album-2',
          name: 'Jazz Collection',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-3-4',
        duration_ms: 245000,
      },
      {
        id: 'mock-track-3-5',
        name: 'Evening Breeze',
        artists: [{ name: 'Smooth Jazz Band' }],
        album: {
          id: 'mock-album-2',
          name: 'Jazz Collection',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-3-5',
        duration_ms: 250000,
      },
      // Rock Hits - 6 tracks
      {
        id: 'mock-track-4',
        name: 'Rock Anthem',
        artists: [{ name: 'Rock Band' }],
        album: {
          id: 'mock-album-3',
          name: 'Rock Hits',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-4',
        duration_ms: 210000,
      },
      {
        id: 'mock-track-4-2',
        name: 'Thunder Road',
        artists: [{ name: 'Rock Band' }],
        album: {
          id: 'mock-album-3',
          name: 'Rock Hits',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-4-2',
        duration_ms: 225000,
      },
      {
        id: 'mock-track-4-3',
        name: 'Guitar Solo',
        artists: [{ name: 'Rock Band' }],
        album: {
          id: 'mock-album-3',
          name: 'Rock Hits',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-4-3',
        duration_ms: 195000,
      },
      {
        id: 'mock-track-4-4',
        name: 'Power Chord',
        artists: [{ name: 'Rock Band' }],
        album: {
          id: 'mock-album-3',
          name: 'Rock Hits',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-4-4',
        duration_ms: 200000,
      },
      {
        id: 'mock-track-4-5',
        name: 'Stage Dive',
        artists: [{ name: 'Rock Band' }],
        album: {
          id: 'mock-album-3',
          name: 'Rock Hits',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-4-5',
        duration_ms: 215000,
      },
      {
        id: 'mock-track-4-6',
        name: 'Encore',
        artists: [{ name: 'Rock Band' }],
        album: {
          id: 'mock-album-3',
          name: 'Rock Hits',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-4-6',
        duration_ms: 240000,
      },
      // Electronic Vibes - 4 tracks
      {
        id: 'mock-track-5',
        name: 'Electronic Dreams',
        artists: [{ name: 'DJ Producer' }],
        album: {
          id: 'mock-album-4',
          name: 'Electronic Vibes',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-5',
        duration_ms: 195000,
      },
      {
        id: 'mock-track-5-2',
        name: 'Bass Drop',
        artists: [{ name: 'DJ Producer' }],
        album: {
          id: 'mock-album-4',
          name: 'Electronic Vibes',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-5-2',
        duration_ms: 210000,
      },
      {
        id: 'mock-track-5-3',
        name: 'Synth Wave',
        artists: [{ name: 'DJ Producer' }],
        album: {
          id: 'mock-album-4',
          name: 'Electronic Vibes',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-5-3',
        duration_ms: 185000,
      },
      {
        id: 'mock-track-5-4',
        name: 'Digital Pulse',
        artists: [{ name: 'DJ Producer' }],
        album: {
          id: 'mock-album-4',
          name: 'Electronic Vibes',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-5-4',
        duration_ms: 205000,
      },
      // Classical Masterpieces - 5 tracks
      {
        id: 'mock-track-6',
        name: 'Classical Symphony',
        artists: [{ name: 'Orchestra' }],
        album: {
          id: 'mock-album-5',
          name: 'Classical Masterpieces',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-6',
        duration_ms: 300000,
      },
      {
        id: 'mock-track-6-2',
        name: 'Moonlight Sonata',
        artists: [{ name: 'Orchestra' }],
        album: {
          id: 'mock-album-5',
          name: 'Classical Masterpieces',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-6-2',
        duration_ms: 320000,
      },
      {
        id: 'mock-track-6-3',
        name: 'Four Seasons',
        artists: [{ name: 'Orchestra' }],
        album: {
          id: 'mock-album-5',
          name: 'Classical Masterpieces',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-6-3',
        duration_ms: 280000,
      },
      {
        id: 'mock-track-6-4',
        name: 'Canon in D',
        artists: [{ name: 'Orchestra' }],
        album: {
          id: 'mock-album-5',
          name: 'Classical Masterpieces',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-6-4',
        duration_ms: 310000,
      },
      {
        id: 'mock-track-6-5',
        name: 'Requiem',
        artists: [{ name: 'Orchestra' }],
        album: {
          id: 'mock-album-5',
          name: 'Classical Masterpieces',
          images: [{ url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 }],
        },
        uri: 'spotify:track:mock-track-6-5',
        duration_ms: 350000,
      },
    ];

    // Create mock albums from tracks
    const albumMap = new Map<string, any>();
    this.mockTracks.forEach(track => {
      if (!albumMap.has(track.album.id)) {
        albumMap.set(track.album.id, {
          id: track.album.id,
          name: track.album.name,
          artists: track.artists,
          images: track.album.images,
          uri: `spotify:album:${track.album.id}`,
          release_date: '2024-01-01',
          total_tracks: this.mockTracks.filter(t => t.album.id === track.album.id).length,
        });
      }
    });
    this.mockAlbums = Array.from(albumMap.values());
  }

  generatePKCEChallenge(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = 'mock-code-verifier-' + Math.random().toString(36).substr(2, 9);
    const codeChallenge = 'mock-code-challenge-' + Math.random().toString(36).substr(2, 9);
    return { codeVerifier, codeChallenge };
  }

  getAuthUrl(codeChallenge: string, state: string): string {
    return `https://accounts.spotify.com/authorize?mock=true&state=${state}&code_challenge=${codeChallenge}`;
  }

  async exchangeCodeForToken(_code: string, _codeVerifier: string): Promise<SpotifyToken> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Mock token exchange failed');
    }

    return {
      access_token: 'mock-access-token-' + Math.random().toString(36).substr(2, 9),
      refresh_token: 'mock-refresh-token-' + Math.random().toString(36).substr(2, 9),
      expires_in: 3600,
      token_type: 'Bearer',
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<SpotifyToken> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Mock token refresh failed');
    }

    return {
      access_token: 'mock-access-token-refreshed-' + Math.random().toString(36).substr(2, 9),
      refresh_token: refreshToken, // Keep same refresh token
      expires_in: 3600,
      token_type: 'Bearer',
    };
  }

  async getCurrentUser(_accessToken: string): Promise<SpotifyUser> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Failed to get user profile');
    }

    return {
      id: 'mock-user-id',
      display_name: 'Mock User',
      images: [{ url: PLACEHOLDER_IMAGE_300, width: 300, height: 300 }],
      product: 'premium',
    };
  }

  async search(
    _accessToken: string,
    query: string,
    type = 'track',
    limit = 20
  ): Promise<SpotifySearchResult> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Search failed');
    }

    const queryLower = query ? query.toLowerCase() : '';

    // Handle album search
    if (type === 'album') {
      let filteredAlbums = this.mockAlbums;

      if (query && query.trim().length >= 2) {
        filteredAlbums = this.mockAlbums.filter(
          album =>
            album.name.toLowerCase().includes(queryLower) ||
            album.artists.some((artist: any) => artist.name.toLowerCase().includes(queryLower))
        );
      }

      // If no matches found, return all albums (for testing)
      if (filteredAlbums.length === 0) {
        filteredAlbums = this.mockAlbums;
      }

      return {
        albums: {
          items: filteredAlbums.slice(0, limit),
          total: filteredAlbums.length,
        },
      };
    }

    // Handle track search (default)
    // If query is empty or very short, return all tracks (for testing)
    if (!query || query.trim().length < 2) {
      return {
        tracks: {
          items: this.mockTracks.slice(0, limit),
          total: this.mockTracks.length,
        },
      };
    }

    // Filter mock tracks based on query
    let filteredTracks = this.mockTracks.filter(
      track =>
        track.name.toLowerCase().includes(queryLower) ||
        track.artists.some(artist => artist.name.toLowerCase().includes(queryLower)) ||
        track.album.name.toLowerCase().includes(queryLower)
    );

    // If no matches found, return all tracks (for testing purposes)
    // This makes mock mode more useful for UI testing
    if (filteredTracks.length === 0) {
      filteredTracks = this.mockTracks;
    }

    return {
      tracks: {
        items: filteredTracks.slice(0, limit),
        total: filteredTracks.length,
      },
    };
  }

  async getDevices(_accessToken: string): Promise<{ devices: SpotifyDevice[] }> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Failed to get devices');
    }

    return { devices: [...this.mockDevices] };
  }

  async transferPlayback(_accessToken: string, deviceId: string, _play = true): Promise<void> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Failed to transfer playback');
    }

    // Update device active state
    this.mockDevices.forEach(device => {
      device.is_active = device.id === deviceId;
    });
  }

  async getAlbum(accessToken: string, albumId: string): Promise<any> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Failed to get album');
    }

    const albumTracks = this.mockTracks.filter(track => track.album.id === albumId);

    return {
      id: albumId,
      name: albumTracks[0]?.album.name || 'Mock Album',
      artists: [{ name: 'Mock Artist' }],
      images: albumTracks[0]?.album.images || [
        { url: PLACEHOLDER_IMAGE_640, width: 640, height: 640 },
      ],
      tracks: {
        items: albumTracks,
        total: albumTracks.length,
      },
    };
  }

  async startPlayback(
    _accessToken: string,
    _options: {
      deviceId?: string;
      uris?: string[];
      offset?: { position: number };
      position_ms?: number;
    } = {}
  ): Promise<void> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Failed to start playback');
    }

    // Mock implementation
  }

  async pausePlayback(_accessToken: string, _deviceId?: string): Promise<void> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Failed to pause playback');
    }

    // Mock implementation
  }

  async getPlaybackState(_accessToken: string): Promise<any> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Failed to get playback state');
    }

    return {
      device: this.mockDevices.find(d => d.is_active),
      is_playing: false,
      item: this.mockTracks[0] || null,
      progress_ms: 0,
    };
  }

  async nextTrack(_accessToken: string, _deviceId?: string): Promise<void> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Failed to skip to next');
    }

    // Mock implementation
  }

  async previousTrack(_accessToken: string, _deviceId?: string): Promise<void> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Failed to skip to previous');
    }

    // Mock implementation
  }

  async setVolume(_accessToken: string, volumePercent: number, deviceId?: string): Promise<void> {
    await this.simulateDelay();

    if (this.simulateErrors) {
      throw new Error('Failed to set volume');
    }

    // Update device volume
    const device = deviceId
      ? this.mockDevices.find(d => d.id === deviceId)
      : this.mockDevices.find(d => d.is_active);

    if (device) {
      device.volume_percent = Math.max(0, Math.min(100, Math.round(volumePercent)));
    }
  }

  // Helper methods for testing
  addMockTrack(track: SpotifyTrack): void {
    this.mockTracks.push(track);
  }

  addMockDevice(device: SpotifyDevice): void {
    this.mockDevices.push(device);
  }

  clearMockData(): void {
    this.mockTracks = [];
    this.mockDevices = [];
    this.initializeMockData();
  }

  setSimulateErrors(simulate: boolean): void {
    this.simulateErrors = simulate;
  }
}
