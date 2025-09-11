import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import { SpotifyTrack } from '../types';

interface AlbumTrackListProps {
  className?: string;
}

export function AlbumTrackList({ className = '' }: AlbumTrackListProps) {
  const { album, vinyl } = useUIStore();
  const { track: currentTrack } = usePlayerStore();

  const currentTracks = vinyl.activeSide === 'A' ? album.sideATracks : album.sideBTracks;

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
        </div>
        <div className="album-info">
          <h2 className="album-title">{album.currentAlbum.name}</h2>
          <p className="album-artist">{album.currentAlbum.artists.map(a => a.name).join(', ')}</p>
          <p className="album-year">{new Date(album.currentAlbum.release_date).getFullYear()}</p>
          <p className="album-side">Side {vinyl.activeSide}</p>
        </div>
      </div>

      <div className="track-list">
        <h3 className="side-title">Side {vinyl.activeSide} Tracks</h3>
        <ul className="tracks">
          {currentTracks.map((track, index) => (
            <li
              key={track.id}
              className={`track-item ${isCurrentTrack(track) ? 'current' : ''}`}
              onClick={() => handleTrackClick(track)}
            >
              <div className="track-number">{index + 1}</div>
              <div className="track-name">{track.name}</div>
              <div className="track-duration">
                {Math.floor(track.duration_ms / 60000)}:
                {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
              </div>
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
