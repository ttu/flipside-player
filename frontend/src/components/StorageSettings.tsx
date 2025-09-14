import { useState } from 'react';

export type StorageType = 'localStorage' | 'redis';

interface StorageSettingsProps {
  onStorageChange: (storageType: StorageType) => void;
  currentStorage: StorageType;
}

export function StorageSettings({ onStorageChange, currentStorage }: StorageSettingsProps) {
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<StorageType | null>(null);

  const handleStorageChange = (storageType: StorageType) => {
    if (storageType === 'redis') {
      setSwitchingTo('redis');
      setShowPrivacyInfo(true);
    } else if (currentStorage === 'redis') {
      // Switching from Redis to localStorage - show data cleanup info
      setSwitchingTo('localStorage');
      setShowPrivacyInfo(true);
    } else {
      onStorageChange(storageType);
    }
  };

  const handleConfirm = () => {
    if (switchingTo) {
      onStorageChange(switchingTo);
    }
    setShowPrivacyInfo(false);
    setSwitchingTo(null);
  };

  const handleCancel = () => {
    setShowPrivacyInfo(false);
    setSwitchingTo(null);
  };

  if (showPrivacyInfo) {
    return (
      <div className="storage-settings">
        <div className="privacy-modal">
          <div className="privacy-content">
            {switchingTo === 'redis' ? (
              <>
                <h3>🔒 Privacy Information</h3>
                <div className="privacy-details">
                  <p>
                    <strong>What data will be stored in the cloud:</strong>
                  </p>
                  <ul>
                    <li>Your Spotify user ID</li>
                    <li>Album IDs of your favorite albums</li>
                    <li>Album metadata (names, artists, images, release dates)</li>
                    <li>Date when albums were added to favorites</li>
                  </ul>

                  <p>
                    <strong>What is NOT stored:</strong>
                  </p>
                  <ul>
                    <li>No personal identifiable information (PII)</li>
                    <li>No email addresses or real names</li>
                    <li>No listening history or usage patterns</li>
                    <li>No Spotify access tokens or credentials</li>
                  </ul>

                  <p className="privacy-note">
                    This data is only used to sync your favorites across devices and sessions. You
                    can switch back to local storage at any time - when you do, all your cloud data
                    will be automatically removed for privacy protection.
                  </p>
                </div>

                <div className="privacy-actions">
                  <button onClick={handleConfirm} className="confirm-button">
                    I Understand, Enable Cloud Sync
                  </button>
                  <button onClick={handleCancel} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>📱 Switch to Local Storage</h3>
                <div className="privacy-details">
                  <p>
                    <strong>What will happen:</strong>
                  </p>
                  <ul>
                    <li>
                      All your current favorites will be saved to local storage on this device
                    </li>
                    <li>Your favorites data will be removed from our cloud storage</li>
                    <li>Favorites will only be available on this browser/device</li>
                    <li>No more syncing across devices</li>
                  </ul>

                  <p className="privacy-note">
                    Your favorites will be preserved on this device, but removed from cloud storage
                    for privacy. You can switch back to cloud sync anytime.
                  </p>
                </div>

                <div className="privacy-actions">
                  <button onClick={handleConfirm} className="confirm-button">
                    Switch to Local Storage
                  </button>
                  <button onClick={handleCancel} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="storage-settings">
      <h3>⚙️ Favorites Storage</h3>
      <div className="storage-options">
        <div className="storage-option">
          <label className="storage-label">
            <input
              type="radio"
              name="storage"
              value="localStorage"
              checked={currentStorage === 'localStorage'}
              onChange={() => handleStorageChange('localStorage')}
            />
            <div className="storage-info">
              <div className="storage-title">📱 Local Storage</div>
              <div className="storage-description">
                Favorites stored only on this device/browser
              </div>
            </div>
          </label>
        </div>

        <div className="storage-option">
          <label className="storage-label">
            <input
              type="radio"
              name="storage"
              value="redis"
              checked={currentStorage === 'redis'}
              onChange={() => handleStorageChange('redis')}
            />
            <div className="storage-info">
              <div className="storage-title">☁️ Cloud Sync</div>
              <div className="storage-description">Favorites synced across all your devices</div>
            </div>
          </label>
        </div>
      </div>

      <div className="storage-current">
        Current: {currentStorage === 'localStorage' ? 'Local Storage' : 'Cloud Sync'}
      </div>
    </div>
  );
}
