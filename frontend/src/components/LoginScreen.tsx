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
      </div>
    </div>
  );
}
