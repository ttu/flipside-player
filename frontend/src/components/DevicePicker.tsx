import { useEffect, useState, useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import { getDevices, transferPlayback } from '../utils/spotify';

interface DevicePickerProps {
  className?: string;
}

export function DevicePicker({ className = '' }: DevicePickerProps) {
  const { devices, setDevices, setDevicesLoading } = useUIStore();
  const { deviceId: currentDeviceId } = usePlayerStore();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setDevicesLoading(true);
      setError(null);
      const data = await getDevices();
      setDevices(data.devices);
    } catch (err) {
      setError('Failed to load devices');
      console.error('Failed to fetch devices:', err);
    } finally {
      setDevicesLoading(false);
    }
  }, [setDevices, setDevicesLoading]);

  const handleDeviceSelect = useCallback(async (deviceId: string) => {
    try {
      await transferPlayback(deviceId, true);
      setIsOpen(false);
      // Refresh devices to get updated active state
      setTimeout(fetchDevices, 1000);
    } catch (err) {
      setError('Failed to transfer playback');
      console.error('Failed to transfer playback:', err);
    }
  }, [fetchDevices]);

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen, fetchDevices]);

  const activeDevice = devices.devices.find(d => d.is_active) || 
                      devices.devices.find(d => d.id === currentDeviceId);

  return (
    <div className={`device-picker ${className}`}>
      <button
        className="device-picker-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select playback device"
      >
        <span className="device-icon">🎵</span>
        <span className="device-name">
          {activeDevice?.name || 'Select Device'}
        </span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="device-dropdown">
          {error && (
            <div className="device-error">{error}</div>
          )}
          
          {devices.loading ? (
            <div className="device-loading">Loading devices...</div>
          ) : devices.devices.length > 0 ? (
            <ul className="device-list">
              {devices.devices.map((device) => (
                <li
                  key={device.id}
                  className={`device-item ${device.is_active || device.id === currentDeviceId ? 'active' : ''}`}
                  onClick={() => handleDeviceSelect(device.id)}
                >
                  <div className="device-info">
                    <span className="device-type-icon">
                      {device.type === 'Computer' ? '💻' : 
                       device.type === 'Smartphone' ? '📱' : 
                       device.type === 'Speaker' ? '🔊' : '🎵'}
                    </span>
                    <span className="device-name">{device.name}</span>
                    {(device.is_active || device.id === currentDeviceId) && (
                      <span className="active-indicator">●</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-devices">
              No devices found. Make sure Spotify is open on another device.
            </div>
          )}
        </div>
      )}
    </div>
  );
}