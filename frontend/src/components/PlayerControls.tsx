import { useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';

interface PlayerControlsProps {
  className?: string;
}

export function PlayerControls({ className = '' }: PlayerControlsProps) {
  const { player, isPlaying, positionMs, durationMs, volume } = usePlayerStore();

  const handlePlayPause = useCallback(async () => {
    if (!player) return;

    try {
      if (isPlaying) {
        await player.pause();
      } else {
        await player.resume();
      }
    } catch (error) {
      console.error('Play/pause failed:', error);
    }
  }, [player, isPlaying]);

  const handlePrevious = useCallback(async () => {
    if (!player) return;

    try {
      await player.previousTrack();
    } catch (error) {
      console.error('Previous track failed:', error);
    }
  }, [player]);

  const handleNext = useCallback(async () => {
    if (!player) return;

    try {
      await player.nextTrack();
    } catch (error) {
      console.error('Next track failed:', error);
    }
  }, [player]);

  const handleVolumeChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return;

    const newVolume = parseFloat(e.target.value);
    
    try {
      await player.setVolume(newVolume);
      usePlayerStore.getState().setVolume(newVolume);
    } catch (error) {
      console.error('Volume change failed:', error);
    }
  }, [player]);

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
          disabled={!player}
          aria-label="Previous track"
        >
          ⏮
        </button>
        
        <button 
          className="control-button play-pause-button"
          onClick={handlePlayPause}
          disabled={!player}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <button 
          className="control-button next-button"
          onClick={handleNext}
          disabled={!player}
          aria-label="Next track"
        >
          ⏭
        </button>
      </div>

      <div className="progress-section">
        <span className="time-display current-time">
          {formatTime(positionMs)}
        </span>
        
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        <span className="time-display total-time">
          {formatTime(durationMs)}
        </span>
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