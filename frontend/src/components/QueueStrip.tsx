import { useCallback } from 'react';
import { useQueueStore } from '../stores/queueStore';
import { usePlayerStore } from '../stores/playerStore';

interface QueueStripProps {
  className?: string;
}

export function QueueStrip({ className = '' }: QueueStripProps) {
  const { items, removeTrack, reorderQueue } = useQueueStore();
  const { player } = usePlayerStore();

  const handlePlayTrack = useCallback(async (uri: string) => {
    if (!player) return;

    try {
      // Note: For now, we'll add to Spotify queue
      // In a full implementation, you'd use the Web API to add to queue
      console.log('Playing track:', uri);
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  }, [player]);

  const handleRemoveTrack = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeTrack(id);
  }, [removeTrack]);

  if (items.length === 0) {
    return (
      <div className={`queue-strip empty ${className}`}>
        <p>Queue is empty. Search for tracks to add them here.</p>
      </div>
    );
  }

  return (
    <div className={`queue-strip ${className}`}>
      <div className="queue-header">
        <h3>Queue ({items.length})</h3>
      </div>
      
      <div className="queue-items">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="queue-item"
            onClick={() => handlePlayTrack(item.spotifyUri)}
          >
            {item.albumArt && (
              <img
                src={item.albumArt}
                alt={`${item.title} album cover`}
                className="queue-item-thumbnail"
              />
            )}
            
            <div className="queue-item-info">
              <div className="queue-item-title">{item.title}</div>
              <div className="queue-item-artist">{item.artist}</div>
            </div>

            <button
              className="remove-button"
              onClick={(e) => handleRemoveTrack(item.id, e)}
              aria-label={`Remove ${item.title} from queue`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}