import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import { SpotifyTrack } from '../types';

interface AlbumTrackListProps {
  className?: string;
}

export function AlbumTrackList({ className = '' }: AlbumTrackListProps) {
  const { album, vinyl, addFavorite, removeFavorite, isFavorite } = useUIStore();
  const { track: currentTrack } = usePlayerStore();

  const currentTracks = vinyl.activeSide === 'A' ? album.sideATracks : album.sideBTracks;

  const formatDuration = (durationMs: number) => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateSideDuration = (tracks: SpotifyTrack[]) => {
    const totalMs = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
    return formatDuration(totalMs);
  };

  const handleTrackClick = async (track: SpotifyTrack) => {
    try {
      // Get all tracks from current side and start from clicked track
      const trackIndex = currentTracks.findIndex(t => t.id === track.id);
      const tracksFromHere = currentTracks.slice(trackIndex);

      const response = await fetch('/api/spotify/play', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uris: tracksFromHere.map(t => t.uri),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Playback failed:', errorData);
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('Failed to start playback:', error);
    }
  };

  const isCurrentTrack = (track: SpotifyTrack) => {
    return currentTrack?.id === track.id;
  };

  const handleFavoriteToggle = () => {
    if (!album.currentAlbum) return;

    if (isFavorite(album.currentAlbum.id)) {
      removeFavorite(album.currentAlbum.id);
    } else {
      addFavorite(album.currentAlbum);
    }
  };

  if (!album.currentAlbum) {
    return (
      <div className={`album-track-list ${className}`}>
        <div className="no-album">
          <p>Search for an album to see track listing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`album-track-list ${className}`}>
      <div className="album-header">
        <div className="album-cover">
          <img
            src={album.currentAlbum.images[0]?.url}
            alt={album.currentAlbum.name}
            className="cover-image"
          />
          <button
            className={`album-favorite-toggle ${isFavorite(album.currentAlbum.id) ? 'is-favorite' : ''}`}
            onClick={handleFavoriteToggle}
            title={isFavorite(album.currentAlbum.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            ♥
          </button>
        </div>
        <div className="album-info">
          <h2 className="album-title">{album.currentAlbum.name}</h2>
          <p className="album-artist">{album.currentAlbum.artists.map(a => a.name).join(', ')}</p>
          <p className="album-year">{new Date(album.currentAlbum.release_date).getFullYear()}</p>
        </div>
      </div>

      <div className="track-list">
        <div className="side-title">
          <h3>Side {vinyl.activeSide} Tracks</h3>
          <span className="side-duration">{calculateSideDuration(currentTracks)}</span>
        </div>
        <ul className="tracks">
          {currentTracks.map((track, index) => (
            <li
              key={track.id}
              className={`track-item ${isCurrentTrack(track) ? 'current' : ''}`}
              onClick={() => handleTrackClick(track)}
            >
              <div className="track-number">{index + 1}</div>
              <div className="track-name">{track.name}</div>
              <div className="track-duration">{formatDuration(track.duration_ms)}</div>
              {isCurrentTrack(track) && <div className="currently-playing">♪</div>}
            </li>
          ))}
        </ul>

        {currentTracks.length === 0 && (
          <div className="no-tracks">
            <p>No tracks on side {vinyl.activeSide}</p>
          </div>
        )}
      </div>
    </div>
  );
}
