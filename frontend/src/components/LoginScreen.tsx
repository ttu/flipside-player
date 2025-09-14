import { useAuthStore } from '../stores/authStore';

export function LoginScreen() {
  const { login, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="login-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-content">
        <h1>FlipSide Player</h1>
        <p>A vinyl-inspired Spotify player</p>
        <button onClick={login} className="login-button">
          Connect with Spotify
        </button>
        <p className="premium-note">Note: Spotify Premium subscription required for playback</p>

        <div className="privacy-notice">
          <h3>🔒 Minimal Permissions & Privacy</h3>
          <div className="privacy-details">
            <p>
              <strong>Spotify permissions requested:</strong>
            </p>
            <ul>
              <li>Music streaming (to play songs)</li>
              <li>Playback control (to start/stop/skip tracks)</li>
              <li>Basic profile (user ID, name, avatar for display)</li>
            </ul>
            <p>
              <strong>What we don't access:</strong>
            </p>
            <ul>
              <li>No email address</li>
              <li>No listening history or playlists</li>
              <li>No followers or social data</li>
              <li>No current playback state</li>
            </ul>
            <p className="privacy-summary">
              FlipSide Player uses minimal Spotify permissions - just enough to play music and
              nothing more. Your privacy is protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
