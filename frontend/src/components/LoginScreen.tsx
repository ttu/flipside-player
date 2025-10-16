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
          <h3>🔒 Permissions & Privacy</h3>
          <div className="privacy-details">
            <p>
              <strong>Spotify permissions requested:</strong>
            </p>
            <ul>
              <li>Music streaming (play songs in the web player)</li>
              <li>Playback position (read currently playing position)</li>
              <li>Playback control (play, pause, skip tracks)</li>
              <li>Playback state (read current playback state)</li>
              <li>Private profile (access profile info)</li>
            </ul>
            <p>
              <strong>What we don't access:</strong>
            </p>
            <ul>
              <li>No listening history or saved tracks</li>
              <li>No playlists modification</li>
              <li>No followers or social data</li>
              <li>No library modification</li>
            </ul>
            <p className="privacy-summary">
              FlipSide Player only requests the permissions needed for playback control and basic
              user identification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
