import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export function PremiumWarning() {
  const { user } = useAuthStore();
  const [isVisible, setIsVisible] = useState(true);

  if (!user || user.product === 'premium' || !isVisible) {
    return null;
  }

  return (
    <div className="premium-warning">
      <div className="premium-warning-content">
        <div className="premium-warning-header">
          <h3>🎵 Spotify Premium Required</h3>
          <button
            className="premium-warning-close"
            onClick={() => setIsVisible(false)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
        <p>
          Playback control requires a Spotify Premium account. You can still browse albums and see
          track listings, but you'll need to upgrade to Premium to control playback.
        </p>
        <a
          href="https://www.spotify.com/premium/"
          target="_blank"
          rel="noopener noreferrer"
          className="premium-upgrade-link"
        >
          Upgrade to Premium
        </a>
      </div>
    </div>
  );
}
