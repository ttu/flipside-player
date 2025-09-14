import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useUIStore } from './stores/uiStore';
import { LoginScreen } from './components/LoginScreen';
import { VinylDeck } from './components/VinylDeck';
import { FavoritesView } from './components/FavoritesView';
import { SearchBar } from './components/SearchBar';
import { PlayerControls } from './components/PlayerControls';
import { DevicePicker } from './components/DevicePicker';
import { ViewToggle } from './components/ViewToggle';
import { FlipButton } from './components/FlipButton';
import { AlbumTrackList } from './components/AlbumTrackList';
import { PremiumWarning } from './components/PremiumWarning';
import './App.css';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: typeof Spotify;
  }
}

function App() {
  const { isAuthenticated, loading, checkAuth, user } = useAuthStore();
  const { view } = useUIStore();

  // Initialize auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Load Spotify Web Playback SDK from CDN
  // Note: The SDK is not available as an npm package, it must be loaded via script tag
  useEffect(() => {
    if (!isAuthenticated) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify Web Playback SDK Ready');
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isAuthenticated]);

  // Initialize player and keyboard controls
  useSpotifyPlayer();
  useKeyboardControls();

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">FlipSide Player</h1>
          <SearchBar className="header-search" />
        </div>

        <div className="header-right">
          <ViewToggle />
          <div className="user-menu">
            <img
              src={user?.images?.[0]?.url || '/default-avatar.png'}
              alt={user?.display_name || 'User'}
              className="user-avatar"
            />
            <span className="user-name">{user?.display_name}</span>
          </div>
        </div>
      </header>

      <PremiumWarning />

      <main className="app-main">
        <div className={`player-section ${view.mode}`}>
          <div className={`view-container ${view.mode}`}>
            {view.mode === 'vinyl' ? (
              <VinylDeck className="main-view" />
            ) : (
              <FavoritesView className="main-view" />
            )}
          </div>

          {view.mode === 'vinyl' && (
            <div className="vinyl-controls">
              <FlipButton />
            </div>
          )}
        </div>

        {view.mode === 'vinyl' && (
          <div className="album-info-section">
            <AlbumTrackList />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <PlayerControls className="main-controls" />
        <div className="footer-right">
          <DevicePicker />
        </div>
      </footer>
    </div>
  );
}

export default App;
