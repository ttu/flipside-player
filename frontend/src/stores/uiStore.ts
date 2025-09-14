import { create } from 'zustand';
import {
  ViewState,
  ArtworkState,
  DevicesState,
  VinylState,
  AlbumState,
  FavoriteAlbum,
  ViewMode,
  VinylSide,
  SpotifyDevice,
  SpotifyAlbum,
  SpotifyTrack,
} from '../types';

export type StorageType = 'localStorage' | 'redis';

// Storage persistence helpers
const FAVORITES_STORAGE_KEY = 'flipside-favorites';
const STORAGE_TYPE_KEY = 'flipside-storage-type';

const loadFavoritesFromStorage = (): FavoriteAlbum[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load favorites from localStorage:', error);
    return [];
  }
};

const saveFavoritesToStorage = (favorites: FavoriteAlbum[]): void => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorites to localStorage:', error);
  }
};

const getStorageType = (): StorageType => {
  try {
    const stored = localStorage.getItem(STORAGE_TYPE_KEY);
    return (stored as StorageType) || 'localStorage';
  } catch (error) {
    return 'localStorage';
  }
};

const setStorageType = (storageType: StorageType): void => {
  try {
    localStorage.setItem(STORAGE_TYPE_KEY, storageType);
  } catch (error) {
    console.error('Failed to save storage type:', error);
  }
};

// Redis API functions
const loadFavoritesFromRedis = async (): Promise<FavoriteAlbum[]> => {
  try {
    const response = await fetch('/api/favorites', {
      credentials: 'include',
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to load from Redis');
  } catch (error) {
    console.error('Failed to load favorites from Redis:', error);
    return [];
  }
};

const saveFavoriteToRedis = async (favorite: FavoriteAlbum): Promise<boolean> => {
  try {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(favorite),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to save favorite to Redis:', error);
    return false;
  }
};

const removeFavoriteFromRedis = async (albumId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/favorites/${albumId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to remove favorite from Redis:', error);
    return false;
  }
};

interface UIStore {
  view: ViewState;
  artwork: ArtworkState;
  devices: DevicesState;
  vinyl: VinylState;
  album: AlbumState;
  favorites: FavoriteAlbum[];
  storageType: StorageType;

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

  // Favorites actions
  addFavorite: (album: SpotifyAlbum) => void;
  removeFavorite: (albumId: string) => void;
  isFavorite: (albumId: string) => boolean;
  loadFavorites: () => Promise<void>;

  // Storage actions
  setStorageType: (storageType: StorageType) => Promise<void>;
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
  favorites: loadFavoritesFromStorage(),
  storageType: getStorageType(),

  // View actions
  setViewMode: mode => set(state => ({ view: { ...state.view, mode } })),

  toggleView: () => {
    const currentMode = get().view.mode;
    set(state => ({
      view: {
        ...state.view,
        mode: currentMode === 'vinyl' ? 'favorites' : 'vinyl',
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

  // Favorites actions
  addFavorite: async album => {
    const favorite: FavoriteAlbum = {
      id: album.id,
      album,
      dateAdded: new Date().toISOString(),
    };

    const { storageType } = get();

    if (storageType === 'redis') {
      const success = await saveFavoriteToRedis(favorite);
      if (success) {
        set(state => ({ favorites: [...state.favorites, favorite] }));
      }
    } else {
      set(state => {
        const newFavorites = [...state.favorites, favorite];
        saveFavoritesToStorage(newFavorites);
        return { favorites: newFavorites };
      });
    }
  },

  removeFavorite: async albumId => {
    const { storageType } = get();

    if (storageType === 'redis') {
      const success = await removeFavoriteFromRedis(albumId);
      if (success) {
        set(state => ({
          favorites: state.favorites.filter(fav => fav.id !== albumId),
        }));
      }
    } else {
      set(state => {
        const newFavorites = state.favorites.filter(fav => fav.id !== albumId);
        saveFavoritesToStorage(newFavorites);
        return { favorites: newFavorites };
      });
    }
  },

  isFavorite: albumId => {
    const { favorites } = get();
    return favorites.some(fav => fav.id === albumId);
  },

  loadFavorites: async () => {
    const { storageType } = get();

    if (storageType === 'redis') {
      const favorites = await loadFavoritesFromRedis();
      set({ favorites });
    } else {
      const favorites = loadFavoritesFromStorage();
      set({ favorites });
    }
  },

  // Storage actions
  setStorageType: async (newStorageType: StorageType) => {
    const { favorites: currentFavorites, storageType: oldStorageType } = get();

    // Save storage type preference
    setStorageType(newStorageType);

    // Handle migration between storage types
    if (oldStorageType === 'localStorage' && newStorageType === 'redis') {
      // Switching TO Redis: Upload current favorites to Redis
      if (currentFavorites.length > 0) {
        for (const favorite of currentFavorites) {
          await saveFavoriteToRedis(favorite);
        }
      }
    } else if (oldStorageType === 'redis' && newStorageType === 'localStorage') {
      // Switching TO localStorage: Save current favorites locally and clear Redis
      if (currentFavorites.length > 0) {
        saveFavoritesToStorage(currentFavorites);

        // Clear Redis data
        try {
          for (const favorite of currentFavorites) {
            await removeFavoriteFromRedis(favorite.id);
          }
        } catch (error) {
          console.error('Failed to clear some Redis favorites:', error);
          // Continue anyway - local storage still has the data
        }
      }
    }

    // Update state and reload favorites from new storage
    set({ storageType: newStorageType });

    // Load favorites from the new storage type
    if (newStorageType === 'redis') {
      const favorites = await loadFavoritesFromRedis();
      set({ favorites });
    } else {
      const favorites = loadFavoritesFromStorage();
      set({ favorites });
    }
  },
}));
