import { useState, useCallback, useEffect, useRef } from 'react';
import { searchTracks } from '../utils/spotify';
import { useQueueStore } from '../stores/queueStore';
import { SpotifyTrack } from '../types';

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchRef = useRef<HTMLDivElement>(null);
  const { addTrack } = useQueueStore();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await searchTracks(searchQuery);
      setResults(data.tracks.items);
      setShowResults(true);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
  }, [performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleTrackSelect = (track: SpotifyTrack) => {
    addTrack(track);
    setShowResults(false);
    setQuery('');
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
          placeholder="Search for tracks..."
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
              {results.map((track) => (
                <li
                  key={track.id}
                  className="result-item"
                  onClick={() => handleTrackSelect(track)}
                >
                  <div className="track-info">
                    {track.album.images[0] && (
                      <img
                        src={track.album.images[0].url}
                        alt={track.album.name}
                        className="track-thumbnail"
                      />
                    )}
                    <div className="track-details">
                      <div className="track-name">{track.name}</div>
                      <div className="track-artist">
                        {track.artists.map(a => a.name).join(', ')}
                      </div>
                      <div className="track-album">{track.album.name}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.trim() && !isLoading ? (
            <div className="no-results">No tracks found for "{query}"</div>
          ) : null}
        </div>
      )}
    </div>
  );
}