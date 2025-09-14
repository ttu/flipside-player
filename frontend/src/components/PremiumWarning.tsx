import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { registerPremiumWarningCallback } from '../utils/premiumWarning';

const PREMIUM_WARNING_DISMISSED_KEY = 'flipside-premium-warning-dismissed';

export function PremiumWarning() {
  const { user } = useAuthStore();
  const [isVisible, setIsVisible] = useState(true);
  const [showDueToPlayAttempt, setShowDueToPlayAttempt] = useState(false);

  // Check localStorage on mount and register callback for play attempts
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(PREMIUM_WARNING_DISMISSED_KEY);
      if (dismissed === 'true') {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Failed to read premium warning dismissal from localStorage:', error);
    }

    // Register callback for triggering warning on play attempts
    registerPremiumWarningCallback(() => {
      if (user && user.product !== 'premium') {
        setShowDueToPlayAttempt(true);
        setIsVisible(true);
      }
    });

    // Cleanup callback on unmount
    return () => {
      registerPremiumWarningCallback(null);
    };
  }, [user]);

  const handleDismiss = () => {
    if (showDueToPlayAttempt) {
      // If shown due to play attempt, just hide for now (don't save to localStorage)
      setIsVisible(false);
      setShowDueToPlayAttempt(false);
    } else {
      // If shown normally, save dismissal to localStorage
      try {
        localStorage.setItem(PREMIUM_WARNING_DISMISSED_KEY, 'true');
        setIsVisible(false);
      } catch (error) {
        console.error('Failed to save premium warning dismissal to localStorage:', error);
        // Still dismiss the warning for this session even if localStorage fails
        setIsVisible(false);
      }
    }
  };

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
            onClick={handleDismiss}
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
