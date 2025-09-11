import { create } from 'zustand';
import {
  ViewState,
  ArtworkState,
  DevicesState,
  VinylState,
  AlbumState,
  ViewMode,
  VinylSide,
  SpotifyDevice,
  SpotifyAlbum,
  SpotifyTrack,
} from '../types';

interface UIStore {
  view: ViewState;
  artwork: ArtworkState;
  devices: DevicesState;
  vinyl: VinylState;
  album: AlbumState;

  // View actions
  setViewMode: (mode: ViewMode) => void;
  toggleView: () => void;

  // Artwork actions
  setArtwork: (url: string) => void;
  setArtworkLoading: (loading: boolean) => void;
  setArtworkError: (error?: string) => void;

  // Devices actions
  setDevices: (devices: SpotifyDevice[]) => void;
  setDevicesLoading: (loading: boolean) => void;

  // Vinyl actions
  setActiveSide: (side: VinylSide) => void;
  flipSide: () => void;

  // Album actions
  setCurrentAlbum: (album: SpotifyAlbum | null) => void;
  setAlbumTracks: (sideA: SpotifyTrack[], sideB: SpotifyTrack[]) => void;
  setAlbumLoading: (loading: boolean) => void;
  getCurrentSideTracks: () => SpotifyTrack[];
}

export const useUIStore = create<UIStore>((set, get) => ({
  view: { mode: 'vinyl' },
  artwork: { loading: false },
  devices: { devices: [], loading: false },
  vinyl: { activeSide: 'A', isFlipping: false, flipProgress: 0 },
  album: {
    currentAlbum: null,
    sideATracks: [],
    sideBTracks: [],
    loading: false,
  },

  // View actions
  setViewMode: mode => set(state => ({ view: { ...state.view, mode } })),

  toggleView: () => {
    const currentMode = get().view.mode;
    set(state => ({
      view: {
        ...state.view,
        mode: currentMode === 'vinyl' ? 'cover' : 'vinyl',
      },
    }));
  },

  // Artwork actions
  setArtwork: coverUrl =>
    set(state => ({
      artwork: { ...state.artwork, coverUrl, loading: false, error: undefined },
    })),

  setArtworkLoading: loading =>
    set(state => ({
      artwork: { ...state.artwork, loading },
    })),

  setArtworkError: error =>
    set(state => ({
      artwork: { ...state.artwork, error, loading: false },
    })),

  // Devices actions
  setDevices: devices =>
    set(state => ({
      devices: { ...state.devices, devices, loading: false },
    })),

  setDevicesLoading: loading =>
    set(state => ({
      devices: { ...state.devices, loading },
    })),

  // Vinyl actions
  setActiveSide: activeSide =>
    set(state => ({
      vinyl: { ...state.vinyl, activeSide },
    })),

  flipSide: () => {
    const { vinyl } = get();
    if (vinyl.isFlipping) return; // Prevent multiple flips

    const currentSide = vinyl.activeSide;

    // Start flip animation
    set(state => ({
      vinyl: { ...state.vinyl, isFlipping: true, flipProgress: 0 },
    }));

    // Animate flip
    const duration = 800; // 800ms flip animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      set(state => ({
        vinyl: { ...state.vinyl, flipProgress: progress },
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Complete the flip
        set(state => ({
          vinyl: {
            ...state.vinyl,
            activeSide: currentSide === 'A' ? 'B' : 'A',
            isFlipping: false,
            flipProgress: 0,
          },
        }));
      }
    };

    requestAnimationFrame(animate);
  },

  // Album actions
  setCurrentAlbum: currentAlbum =>
    set(state => ({
      album: { ...state.album, currentAlbum },
    })),

  setAlbumTracks: (sideATracks, sideBTracks) =>
    set(state => ({
      album: { ...state.album, sideATracks, sideBTracks },
    })),

  setAlbumLoading: loading =>
    set(state => ({
      album: { ...state.album, loading },
    })),

  getCurrentSideTracks: () => {
    const { vinyl, album } = get();
    return vinyl.activeSide === 'A' ? album.sideATracks : album.sideBTracks;
  },
}));
