import { create } from 'zustand';
import { ViewState, ArtworkState, DevicesState, VinylState, ViewMode, VinylSide, SpotifyDevice } from '../types';

interface UIStore {
  view: ViewState;
  artwork: ArtworkState;
  devices: DevicesState;
  vinyl: VinylState;
  
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
}

export const useUIStore = create<UIStore>((set, get) => ({
  view: { mode: 'vinyl' },
  artwork: { loading: false },
  devices: { devices: [], loading: false },
  vinyl: { activeSide: 'A' },

  // View actions
  setViewMode: (mode) => set((state) => ({ view: { ...state.view, mode } })),
  
  toggleView: () => {
    const currentMode = get().view.mode;
    set((state) => ({
      view: { ...state.view, mode: currentMode === 'vinyl' ? 'cover' : 'vinyl' }
    }));
  },

  // Artwork actions
  setArtwork: (coverUrl) => set((state) => ({
    artwork: { ...state.artwork, coverUrl, loading: false, error: undefined }
  })),

  setArtworkLoading: (loading) => set((state) => ({
    artwork: { ...state.artwork, loading }
  })),

  setArtworkError: (error) => set((state) => ({
    artwork: { ...state.artwork, error, loading: false }
  })),

  // Devices actions
  setDevices: (devices) => set((state) => ({
    devices: { ...state.devices, devices, loading: false }
  })),

  setDevicesLoading: (loading) => set((state) => ({
    devices: { ...state.devices, loading }
  })),

  // Vinyl actions
  setActiveSide: (activeSide) => set((state) => ({
    vinyl: { ...state.vinyl, activeSide }
  })),

  flipSide: () => {
    const currentSide = get().vinyl.activeSide;
    set((state) => ({
      vinyl: { ...state.vinyl, activeSide: currentSide === 'A' ? 'B' : 'A' }
    }));
  },
}));