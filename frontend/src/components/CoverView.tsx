import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';

interface CoverViewProps {
  className?: string;
}

export function CoverView({ className = '' }: CoverViewProps) {
  const { artwork } = useUIStore();
  const { track } = usePlayerStore();

  if (!artwork.coverUrl && !track) {
    return (
      <div className={`cover-view ${className}`}>
        <div className="no-track">
          <div className="placeholder-cover">♪</div>
          <p>No track selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cover-view ${className}`}>
      {artwork.coverUrl ? (
        <img
          src={artwork.coverUrl}
          alt={
            track
              ? `${track.album.name} by ${track.artists.map(a => a.name).join(', ')}`
              : 'Album cover'
          }
          className="album-cover"
          style={{ objectFit: 'contain' }}
        />
      ) : (
        <div className="placeholder-cover">♪</div>
      )}

      {track && (
        <div className="track-info-overlay">
          <div className="track-info">
            <h2 className="track-title">{track.name}</h2>
            <h3 className="track-artist">{track.artists.map(a => a.name).join(', ')}</h3>
            <h4 className="track-album">{track.album.name}</h4>
          </div>
        </div>
      )}
    </div>
  );
}
