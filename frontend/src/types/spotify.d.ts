// Spotify Web Playbook SDK Types
// The SDK is loaded via CDN script tag, not npm package

declare namespace Spotify {
  interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    getCurrentState(): Promise<WebPlaybackState | null>;
    getVolume(): Promise<number>;
    nextTrack(): Promise<void>;
    pause(): Promise<void>;
    previousTrack(): Promise<void>;
    resume(): Promise<void>;
    seek(positionMs: number): Promise<void>;
    setName(name: string): Promise<void>;
    setVolume(volume: number): Promise<void>;
    togglePlay(): Promise<void>;

    addListener(event: 'ready', callback: (data: { device_id: string }) => void): void;
    addListener(event: 'not_ready', callback: (data: { device_id: string }) => void): void;
    addListener(
      event: 'player_state_changed',
      callback: (state: WebPlaybackState | null) => void
    ): void;
    addListener(event: 'initialization_error', callback: (data: { message: string }) => void): void;
    addListener(event: 'authentication_error', callback: (data: { message: string }) => void): void;
    addListener(event: 'account_error', callback: (data: { message: string }) => void): void;
    addListener(event: 'playback_error', callback: (data: { message: string }) => void): void;
  }

  interface PlayerInit {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface WebPlaybackState {
    context: {
      uri: string;
      metadata: Record<string, any>;
    };
    disallows: {
      pausing: boolean;
      peeking_next: boolean;
      peeking_prev: boolean;
      resuming: boolean;
      seeking: boolean;
      skipping_next: boolean;
      skipping_prev: boolean;
    };
    paused: boolean;
    position: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: WebPlaybackTrack;
      next_tracks: WebPlaybackTrack[];
      previous_tracks: WebPlaybackTrack[];
    };
    duration: number;
  }

  interface WebPlaybackTrack {
    id: string | null;
    uri: string;
    name: string;
    artists: Array<{ name: string; uri: string }>;
    album: {
      uri: string;
      name: string;
      images: Array<{
        url: string;
        size?: number;
        width?: number;
        height?: number;
      }>;
    };
    duration_ms: number;
  }

  const Player: {
    new (init: PlayerInit): Player;
  };
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: typeof Spotify;
  }
}
