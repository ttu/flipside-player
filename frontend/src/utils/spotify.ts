const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function searchTracks(query: string, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: limit.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/spotify/search?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
}

export async function searchAlbums(query: string, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    type: 'album',
    limit: limit.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/spotify/search?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Album search failed');
  }

  return response.json();
}

export async function getAlbumTracks(albumId: string) {
  const response = await fetch(`${API_BASE_URL}/spotify/albums/${albumId}/tracks`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get album tracks');
  }

  return response.json();
}

export async function getFullAlbum(albumId: string) {
  const response = await fetch(`${API_BASE_URL}/spotify/albums/${albumId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get album');
  }

  return response.json();
}

export async function getDevices() {
  const response = await fetch(`${API_BASE_URL}/spotify/devices`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get devices');
  }

  return response.json();
}

export async function transferPlayback(deviceId: string, play = true) {
  const response = await fetch(`${API_BASE_URL}/spotify/transfer-playback`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ deviceId, play }),
  });

  if (!response.ok) {
    throw new Error('Failed to transfer playback');
  }

  return response.json();
}

export async function getSpotifyToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/spotify/token`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify token');
  }

  return response.text();
}

// Playback control helpers
export async function pausePlayback() {
  const res = await fetch(`${API_BASE_URL}/spotify/pause`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Pause failed');
}

export async function resumePlayback(deviceId?: string) {
  const res = await fetch(`${API_BASE_URL}/spotify/play`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deviceId ? { deviceId } : {}),
  });
  if (!res.ok) throw new Error('Play failed');
}

export async function nextTrack() {
  const res = await fetch(`${API_BASE_URL}/spotify/next`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Next failed');
}

export async function previousTrack() {
  const res = await fetch(`${API_BASE_URL}/spotify/previous`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Previous failed');
}

export async function setVolumePercent(volume0to1: number) {
  const res = await fetch(`${API_BASE_URL}/spotify/volume`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volume: Math.round(volume0to1 * 100) }),
  });
  if (!res.ok) throw new Error('Volume failed');
}

export async function startPlayback(deviceId?: string, uris?: string[]) {
  const res = await fetch(`${API_BASE_URL}/spotify/play`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, uris }),
  });
  if (!res.ok) throw new Error('Start playback failed');
}

export async function getPlaybackState() {
  const res = await fetch(`${API_BASE_URL}/spotify/state`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Get state failed');
  return res.json();
}

export function splitAlbumIntoSides(tracks: any[], albumInfo?: any) {
  if (!tracks || tracks.length === 0) {
    return { sideA: [], sideB: [] };
  }

  // Transform tracks to have complete SpotifyTrack structure
  const transformedTracks = tracks.map(track => ({
    id: track.id,
    name: track.name,
    artists: track.artists || [],
    album: albumInfo
      ? {
          id: albumInfo.id,
          name: albumInfo.name,
          images: albumInfo.images || [],
        }
      : track.album || {},
    uri: track.uri,
    duration_ms: track.duration_ms,
    track_number: track.track_number,
  }));

  // Sort tracks by track number to ensure correct order
  const sortedTracks = transformedTracks.sort(
    (a, b) => (a.track_number || 0) - (b.track_number || 0)
  );

  const totalTracks = sortedTracks.length;
  const midpoint = Math.ceil(totalTracks / 2);

  return {
    sideA: sortedTracks.slice(0, midpoint),
    sideB: sortedTracks.slice(midpoint),
  };
}
