import { useState } from 'react';
import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import { getFullAlbum, splitAlbumIntoSides } from '../utils/spotify';
import { FavoriteAlbum, SpotifyAlbum, SpotifyTrack } from '../types';
import { StorageSettings, StorageType } from './StorageSettings';

interface FavoritesViewProps {
  className?: string;
}

interface ExpandedAlbumData {
  album: SpotifyAlbum;
  sideA: SpotifyTrack[];
  sideB: SpotifyTrack[];
}

export function FavoritesView({ className = '' }: FavoritesViewProps) {
  const {
    favorites,
    removeFavorite,
    setCurrentAlbum,
    setAlbumTracks,
    setAlbumLoading,
    album,
    storageType,
    setStorageType,
  } = useUIStore();
  const { player } = usePlayerStore();
  const [expandedAlbum, setExpandedAlbum] = useState<ExpandedAlbumData | null>(null);
  const [loadingExpand, setLoadingExpand] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleExpandAlbum = async (favorite: FavoriteAlbum) => {
    try {
      setLoadingExpand(favorite.album.id);

      // Get full album with tracks
      const fullAlbum = await getFullAlbum(favorite.album.id);

      // Split tracks into sides A and B
      const { sideA, sideB } = splitAlbumIntoSides(fullAlbum.tracks.items, fullAlbum);

      setExpandedAlbum({
        album: fullAlbum,
        sideA,
        sideB,
      });
    } catch (err) {
      console.error('Failed to load album from favorites:', err);
    } finally {
      setLoadingExpand(null);
    }
  };

  const handlePlaySide = async (side: 'A' | 'B') => {
    if (!expandedAlbum) return;

    try {
      setAlbumLoading(true);

      const tracks = side === 'A' ? expandedAlbum.sideA : expandedAlbum.sideB;

      // Update stores
      setCurrentAlbum(expandedAlbum.album);
      setAlbumTracks(expandedAlbum.sideA, expandedAlbum.sideB);

      // Start playback of the selected side
      if (tracks.length > 0 && player && tracks[0]?.uri) {
        try {
          const response = await fetch('/api/spotify/play', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              uris: tracks.map(track => track.uri),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Playback failed:', errorData);
            return;
          }
        } catch (playError) {
          console.error('Failed to start playback:', playError);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to start playback:', err);
    } finally {
      setAlbumLoading(false);
    }
  };

  const handleCloseExpanded = () => {
    setExpandedAlbum(null);
  };

  const handleRemoveFavorite = (albumId: string) => {
    removeFavorite(albumId);
  };

  const handleStorageChange = async (newStorageType: StorageType) => {
    await setStorageType(newStorageType);
    setShowSettings(false);
  };

  const formatArtists = (artists: { name: string }[]) => {
    return artists.map(artist => artist.name).join(', ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (durationMs: number) => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateSideDuration = (tracks: SpotifyTrack[]) => {
    const totalMs = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
    return formatDuration(totalMs);
  };

  if (expandedAlbum) {
    return (
      <div className={`favorites-view expanded ${className}`}>
        <div className="expanded-header">
          <button onClick={handleCloseExpanded} className="back-button">
            ← Back to Favorites
          </button>
          <h2>{expandedAlbum.album.name}</h2>
          <p>{formatArtists(expandedAlbum.album.artists)}</p>
        </div>

        <div className="expanded-content">
          <div className="expanded-album-cover">
            <img
              src={expandedAlbum.album.images[0]?.url || '/default-album.png'}
              alt={expandedAlbum.album.name}
            />
          </div>

          <div className="sides-container">
            <div className="side-section">
              <div className="side-header">
                <div className="side-title">
                  <h3>Side A</h3>
                  <span className="side-duration">
                    {calculateSideDuration(expandedAlbum.sideA)}
                  </span>
                </div>
                <button
                  onClick={() => handlePlaySide('A')}
                  className="play-side-btn primary"
                  disabled={album.loading}
                >
                  {album.loading ? '⟳' : '▶ Play Side A'}
                </button>
              </div>
              <div className="track-list">
                {expandedAlbum.sideA.map((track, index) => (
                  <div key={track.id} className="track-item">
                    <span className="track-number">{index + 1}</span>
                    <span className="track-name">{track.name}</span>
                    <span className="track-duration">{formatDuration(track.duration_ms)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="side-section">
              <div className="side-header">
                <div className="side-title">
                  <h3>Side B</h3>
                  <span className="side-duration">
                    {calculateSideDuration(expandedAlbum.sideB)}
                  </span>
                </div>
                <button
                  onClick={() => handlePlaySide('B')}
                  className="play-side-btn primary"
                  disabled={album.loading}
                >
                  {album.loading ? '⟳' : '▶ Play Side B'}
                </button>
              </div>
              <div className="track-list">
                {expandedAlbum.sideB.map((track, index) => (
                  <div key={track.id} className="track-item">
                    <span className="track-number">{index + 1}</span>
                    <span className="track-name">{track.name}</span>
                    <span className="track-duration">{formatDuration(track.duration_ms)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`favorites-view ${className}`}>
      <div className="favorites-header">
        <div className="favorites-title">
          <h2>Favorite Albums</h2>
          <p className="favorites-count">{favorites.length} favorite albums</p>
        </div>
        <button
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
          title="Storage Settings"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <StorageSettings currentStorage={storageType} onStorageChange={handleStorageChange} />
      )}

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <div className="empty-icon">♥</div>
          <h3>No favorite albums yet</h3>
          <p>Click the heart icon next to any album to add it to your favorites</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map(favorite => (
            <div key={favorite.id} className="favorite-item">
              <div className="favorite-cover">
                <img
                  src={favorite.album.images[0]?.url || '/default-album.png'}
                  alt={favorite.album.name}
                  onClick={() => handleExpandAlbum(favorite)}
                />
                <button
                  className="expand-overlay"
                  onClick={() => handleExpandAlbum(favorite)}
                  title="View album tracks"
                  disabled={loadingExpand === favorite.album.id}
                >
                  {loadingExpand === favorite.album.id ? '⟳' : '👁'}
                </button>
              </div>
              <div className="favorite-info">
                <h3 className="album-title">{favorite.album.name}</h3>
                <p className="album-artist">{formatArtists(favorite.album.artists)}</p>
                <p className="album-year">{new Date(favorite.album.release_date).getFullYear()}</p>
                <p className="date-added">Added {formatDate(favorite.dateAdded)}</p>
              </div>
              <div className="favorite-actions">
                <button
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  className="remove-favorite-btn"
                  title="Remove from favorites"
                >
                  ♥
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
