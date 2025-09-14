export interface SpotifyUser {
  id: string;
  display_name: string;
  images: { url: string; width: number; height: number }[];
  product: string; // "premium" or "free"
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
  track_number?: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string; width: number; height: number }[];
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
  uri: string;
  release_date: string;
  total_tracks: number;
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

export type ViewMode = 'vinyl' | 'favorites';

export interface ViewState {
  mode: ViewMode;
}

export interface ArtworkState {
  coverUrl?: string;
  loading: boolean;
  error?: string;
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
  albums: {
    items: SpotifyAlbum[];
    total: number;
  };
}

export type VinylSide = 'A' | 'B';

export interface VinylState {
  activeSide: VinylSide;
  isFlipping: boolean;
  flipProgress: number; // 0 to 1, for animation
}

export interface AlbumState {
  currentAlbum: SpotifyAlbum | null;
  sideATracks: SpotifyTrack[];
  sideBTracks: SpotifyTrack[];
  loading: boolean;
}

export interface FavoriteAlbum {
  id: string;
  album: SpotifyAlbum;
  dateAdded: string;
}
