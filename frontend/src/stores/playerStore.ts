import { create } from 'zustand';
import { PlaybackState, SpotifyTrack } from '../types';
import {
  pausePlayback,
  resumePlayback,
  nextTrack as apiNext,
  previousTrack as apiPrevious,
  setVolumePercent,
  startPlayback,
  transferPlayback,
} from '../utils/spotify';

interface PlayerStore extends PlaybackState {
  player: Spotify.Player | null;
  playerReady: boolean;
  setPlayer: (player: Spotify.Player | null) => void;
  setPlayerReady: (ready: boolean) => void;
  updatePlaybackState: (state: Partial<PlaybackState>) => void;
  setTrack: (track: SpotifyTrack | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPosition: (positionMs: number) => void;
  setVolume: (volume: number) => void;
  setDeviceId: (deviceId: string) => void;
  // Actions
  play: (deviceId?: string) => Promise<void>;
  pause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  setVolumeLocal: (volume: number) => void;
  setVolumeServer: (volume: number) => Promise<void>;
  playUris: (uris: string[], deviceId?: string) => Promise<void>;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  track: null,
  deviceId: undefined,
  volume: 0.8,
  player: null,
  playerReady: false,

  setPlayer: player => set({ player }),

  setPlayerReady: playerReady => set({ playerReady }),

  updatePlaybackState: state => set(current => ({ ...current, ...state })),

  setTrack: track => set({ track, durationMs: track?.duration_ms || 0 }),

  setIsPlaying: isPlaying => set({ isPlaying }),

  setPosition: positionMs => set({ positionMs }),

  setVolume: volume => set({ volume }),

  setDeviceId: deviceId => set({ deviceId }),

  // Actions
  play: async (deviceId?: string) => {
    await resumePlayback(deviceId ?? get().deviceId);
    set({ isPlaying: true });
  },

  pause: async () => {
    await pausePlayback();
    set({ isPlaying: false });
  },

  next: async () => {
    await apiNext();
  },

  previous: async () => {
    await apiPrevious();
  },

  setVolumeLocal: (volume: number) => set({ volume }),

  setVolumeServer: async (volume: number) => {
    set({ volume });
    await setVolumePercent(volume);
  },

  playUris: async (uris: string[], deviceId?: string) => {
    const state = get();
    const targetDeviceId = deviceId ?? state.deviceId;

    if (!targetDeviceId) {
      throw new Error('No device available for playback');
    }

    // Check if player is ready
    if (!state.playerReady) {
      throw new Error('Spotify Player not ready yet. Please wait a moment.');
    }

    // Ensure device is active before starting playback
    try {
      // Transfer playback to make device active (don't auto-play yet)
      await transferPlayback(targetDeviceId, false);
      // Wait for Spotify backend to register the device as active
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.warn('Failed to activate device before playback:', err);
      // Still try to play - the device might already be active
    }

    // Start playback WITHOUT device_id since we just made it active
    // Spotify will use the currently active device
    await startPlayback(undefined, uris);
    set({ isPlaying: true });
  },
}));
