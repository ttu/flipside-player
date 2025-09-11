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