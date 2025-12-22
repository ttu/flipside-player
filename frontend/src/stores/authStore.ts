import { create } from 'zustand';
import { AuthState, SpotifyUser } from '../types';

interface AuthStore extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: SpotifyUser) => void;
  setLoading: (loading: boolean) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || API_BASE_URL;

export const useAuthStore = create<AuthStore>((set, _get) => ({
  isAuthenticated: false,
  user: undefined,
  loading: true,

  login: async () => {
    // In mock mode, use auto-login endpoint
    const useMock = import.meta.env.VITE_USE_MOCK_SDK === 'true';

    if (useMock) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/mock-login`, {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          set({ isAuthenticated: true, user: data.user, loading: false });
          return;
        }
      } catch (error) {
        console.error('Mock login failed, falling back to OAuth flow:', error);
      }
    }

    // Real OAuth flow or fallback
    window.location.href = `${AUTH_BASE_URL}/auth/spotify/start`;
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      set({ isAuthenticated: false, user: undefined });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  checkAuth: async () => {
    try {
      set({ loading: true });

      const response = await fetch(`${API_BASE_URL}/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        set({ isAuthenticated: true, user, loading: false });
      } else {
        set({ isAuthenticated: false, user: undefined, loading: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ isAuthenticated: false, user: undefined, loading: false });
    }
  },

  setUser: (user: SpotifyUser) => {
    set({ user, isAuthenticated: true });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },
}));
