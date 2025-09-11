export interface SpotifyUser {
  id: string;
  display_name: string;
  images: { url: string; width: number; height: number }[];
}

export interface SpotifyToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface SessionData {
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpires?: number;
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

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}