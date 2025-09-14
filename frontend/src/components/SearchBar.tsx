import { useState, useCallback, useEffect, useRef } from 'react';
import { searchAlbums, getFullAlbum, splitAlbumIntoSides } from '../utils/spotify';
import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import { SpotifyAlbum } from '../types';

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchRef = useRef<HTMLDivElement>(null);
  const {
    setCurrentAlbum,
    setAlbumTracks,
    setAlbumLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
  } = useUIStore();
  const { player } = usePlayerStore();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await searchAlbums(searchQuery);
      setResults(data.albums.items);
      setShowResults(true);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    },
    [performSearch]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleAlbumSelect = async (album: SpotifyAlbum) => {
    try {
      setAlbumLoading(true);

      // Get full album with tracks
      const fullAlbum = await getFullAlbum(album.id);

      // Split tracks into sides A and B
      const { sideA, sideB } = splitAlbumIntoSides(fullAlbum.tracks.items, fullAlbum);

      // Update stores
      setCurrentAlbum(fullAlbum);
      setAlbumTracks(sideA, sideB);

      // Start playback of the first track from side A
      if (sideA.length > 0 && player && sideA[0]?.uri) {
        try {
          // Use the Web API to start playback
          const response = await fetch('/api/spotify/play', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              uris: sideA.map(track => track.uri),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Playback failed:', errorData);
            setError(errorData.error || 'Failed to start playback');
            return;
          }
        } catch (playError) {
          console.error('Failed to start playback:', playError);
          setError('Failed to start playback. Please try again.');
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load album:', err);
      setError('Failed to load album. Please try again.');
    } finally {
      setAlbumLoading(false);
      setShowResults(false);
      setQuery('');
    }
  };

  const handleFavoriteToggle = (e: React.MouseEvent, album: SpotifyAlbum) => {
    e.stopPropagation(); // Prevent album selection when clicking favorite button
    if (isFavorite(album.id)) {
      removeFavorite(album.id);
    } else {
      addFavorite(album);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      setQuery('');
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={searchRef} className={`search-bar ${className}`}>
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search for albums..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="search-input"
          autoComplete="off"
        />
        {isLoading && <div className="search-loading">⟳</div>}
      </div>

      {showResults && (
        <div className="search-results">
          {error ? (
            <div className="search-error">{error}</div>
          ) : results.length > 0 ? (
            <ul className="results-list">
              {results.map(album => (
                <li key={album.id} className="result-item" onClick={() => handleAlbumSelect(album)}>
                  <div className="album-info">
                    {album.images[0] && (
                      <img src={album.images[0].url} alt={album.name} className="album-thumbnail" />
                    )}
                    <div className="album-details">
                      <div className="album-name">{album.name}</div>
                      <div className="album-artist">
                        {album.artists.map(a => a.name).join(', ')}
                      </div>
                      <div className="album-year">{new Date(album.release_date).getFullYear()}</div>
                      <div className="album-tracks">{album.total_tracks} tracks</div>
                    </div>
                    <button
                      className={`favorite-toggle ${isFavorite(album.id) ? 'is-favorite' : ''}`}
                      onClick={e => handleFavoriteToggle(e, album)}
                      title={isFavorite(album.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      ♥
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.trim() && !isLoading ? (
            <div className="no-results">No albums found for "{query}"</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
