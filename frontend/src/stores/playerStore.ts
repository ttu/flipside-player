import { create } from 'zustand';
import { PlaybackState, SpotifyTrack } from '../types';

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
}

export const usePlayerStore = create<PlayerStore>((set, _get) => ({
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
}));
