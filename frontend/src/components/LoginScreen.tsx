import { useAuthStore } from '../stores/authStore';

interface LoginScreenProps {
  authError?: string | null;
}

export function LoginScreen({ authError }: LoginScreenProps) {
  const { login, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="login-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'access_denied':
        return 'Authorization was cancelled. You need to authorize the app to use FlipSide Player.';
      default:
        return `Authentication error: ${error}`;
    }
  };

  return (
    <div className="login-screen">
      <div className="login-content">
        <h1>FlipSide Player</h1>
        <p>A vinyl-inspired Spotify player</p>

        {authError && (
          <div className="auth-error">
            <p className="error-message">{getErrorMessage(authError)}</p>
          </div>
        )}

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
              <li>Music streaming (to play songs on any of your devices)</li>
              <li>Playback control (to start/stop/skip tracks on your devices)</li>
              <li>Playback state (to see available devices and current playback)</li>
              <li>Basic profile (user ID, name, avatar for display)</li>
            </ul>
            <p>
              <strong>What we don't access:</strong>
            </p>
            <ul>
              <li>No email address</li>
              <li>No listening history or playlists</li>
              <li>No followers or social data</li>
              <li>No personal data beyond basic profile</li>
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
