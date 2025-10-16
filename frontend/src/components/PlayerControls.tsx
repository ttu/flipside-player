import { useCallback, useRef } from 'react';
import { usePlayerStore } from '../stores/playerStore';
// API calls are handled inside store actions now

interface PlayerControlsProps {
  className?: string;
}

export function PlayerControls({ className = '' }: PlayerControlsProps) {
  const {
    isPlaying,
    positionMs,
    durationMs,
    volume,
    deviceId,
    play,
    pause,
    next,
    previous,
    setVolumeLocal,
    setVolumeServer,
  } = usePlayerStore();
  const volumeDebounceRef = useRef<number | undefined>(undefined);

  const handlePlayPause = useCallback(async () => {
    try {
      if (isPlaying) await pause();
      else await play(deviceId);
    } catch (error) {
      console.error('Play/pause failed:', error);
    }
  }, [isPlaying, deviceId, play, pause]);

  const handlePrevious = useCallback(async () => {
    try {
      await previous();
    } catch (error) {
      console.error('Previous track failed:', error);
    }
  }, [previous]);

  const handleNext = useCallback(async () => {
    try {
      await next();
    } catch (error) {
      console.error('Next track failed:', error);
    }
  }, [next]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      // Optimistically update local volume
      setVolumeLocal(newVolume);

      // Debounce server volume updates to avoid 429 rate limits
      if (volumeDebounceRef.current) {
        window.clearTimeout(volumeDebounceRef.current);
      }
      volumeDebounceRef.current = window.setTimeout(() => {
        setVolumeServer(newVolume).catch(err => console.error('Volume change failed:', err));
      }, 250);
    },
    [setVolumeLocal, setVolumeServer]
  );

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  return (
    <div className={`player-controls ${className}`}>
      <div className="transport-controls">
        <button
          className="control-button prev-button"
          onClick={handlePrevious}
          aria-label="Previous track"
        >
          ⏮
        </button>

        <button
          className="control-button play-pause-button"
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button className="control-button next-button" onClick={handleNext} aria-label="Next track">
          ⏭
        </button>
      </div>

      <div className="progress-section">
        <span className="time-display current-time">{formatTime(positionMs)}</span>

        <div className="progress-bar-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        <span className="time-display total-time">{formatTime(durationMs)}</span>
      </div>

      <div className="volume-section">
        <span className="volume-icon">🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
