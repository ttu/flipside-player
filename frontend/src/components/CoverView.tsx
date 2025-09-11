import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import { SpotifyTrack } from '../types';

interface CoverViewProps {
  className?: string;
}

export function CoverView({ className = '' }: CoverViewProps) {
  const { artwork, album } = useUIStore();
  const { track: currentTrack } = usePlayerStore();

  const handleTrackClick = async (track: SpotifyTrack, side: 'A' | 'B') => {
    try {
      // Get tracks from the specific side and start from clicked track
      const sideTracksArray = side === 'A' ? album.sideATracks : album.sideBTracks;
      const trackIndex = sideTracksArray.findIndex(t => t.id === track.id);
      const tracksFromHere = sideTracksArray.slice(trackIndex);

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

  // Use album cover if available, fallback to artwork
  const coverUrl = album.currentAlbum?.images?.[0]?.url || artwork.coverUrl;

  if (!coverUrl && !album.currentAlbum) {
    return (
      <div className={`cover-view ${className}`}>
        <div className="no-album">
          <div className="placeholder-cover">♪</div>
          <p>Search for an album to see cover art</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cover-view ${className}`}>
      <div className="cover-display">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={
              album.currentAlbum
                ? `${album.currentAlbum.name} by ${album.currentAlbum.artists.map(a => a.name).join(', ')}`
                : 'Album cover'
            }
            className="album-cover-large"
          />
        ) : (
          <div className="placeholder-cover-large">♪</div>
        )}

        {album.currentAlbum && (
          <div className="album-details">
            <h2 className="album-title">{album.currentAlbum.name}</h2>
            <h3 className="album-artist">
              {album.currentAlbum.artists.map(a => a.name).join(', ')}
            </h3>
            <p className="album-year">{new Date(album.currentAlbum.release_date).getFullYear()}</p>
            <p className="album-track-count">{album.currentAlbum.total_tracks} tracks</p>
          </div>
        )}
      </div>

      {album.currentAlbum && (
        <div className="cover-tracklist">
          <div className="sides-container">
            <div className="side-column">
              <h4 className="side-title">Side A</h4>
              <ul className="side-tracks">
                {album.sideATracks.map((track, index) => (
                  <li
                    key={track.id}
                    className={`track-item ${isCurrentTrack(track) ? 'current' : ''}`}
                    onClick={() => handleTrackClick(track, 'A')}
                  >
                    <span className="track-number">{index + 1}</span>
                    <span className="track-name">{track.name}</span>
                    <span className="track-duration">
                      {Math.floor(track.duration_ms / 60000)}:
                      {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                    </span>
                    {isCurrentTrack(track) && <span className="playing-indicator">♪</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="side-column">
              <h4 className="side-title">Side B</h4>
              <ul className="side-tracks">
                {album.sideBTracks.map((track, index) => (
                  <li
                    key={track.id}
                    className={`track-item ${isCurrentTrack(track) ? 'current' : ''}`}
                    onClick={() => handleTrackClick(track, 'B')}
                  >
                    <span className="track-number">{index + 1}</span>
                    <span className="track-name">{track.name}</span>
                    <span className="track-duration">
                      {Math.floor(track.duration_ms / 60000)}:
                      {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                    </span>
                    {isCurrentTrack(track) && <span className="playing-indicator">♪</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
