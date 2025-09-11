export interface SpotifyUser {
  id: string;
  display_name: string;
  images: { url: string; width: number; height: number }[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  uri: string;
  duration_ms: number;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  volume_percent: number;
  supports_volume: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  track: SpotifyTrack | null;
  deviceId?: string;
  volume: number; // 0..1
}

export type ViewMode = 'vinyl' | 'cover';

export interface ViewState {
  mode: ViewMode;
}

export interface ArtworkState {
  coverUrl?: string;
  loading: boolean;
  error?: string;
}

export interface QueueItem {
  type: 'track';
  spotifyUri: string;
  title: string;
  artist: string;
  albumId: string;
  albumArt?: string;
  id: string;
}

export interface QueueState {
  items: QueueItem[];
}

export interface DevicesState {
  devices: SpotifyDevice[];
  loading: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: SpotifyUser;
  loading: boolean;
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

export type VinylSide = 'A' | 'B';

export interface VinylState {
  activeSide: VinylSide;
}