import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';
import { getSpotifyToken } from '../utils/spotify';

export function useSpotifyPlayer() {
  const playerStore = usePlayerStore();
  const uiStore = useUIStore();
  const playerInitialized = useRef(false);

  useEffect(() => {
    if (playerInitialized.current || !window.Spotify) {
      return;
    }

    playerInitialized.current = true;

    const player = new window.Spotify.Player({
      name: 'FlipSide Player',
      getOAuthToken: async (cb: (token: string) => void) => {
        try {
          const token = await getSpotifyToken();
          cb(token);
        } catch (error) {
          console.error('Failed to get OAuth token:', error);
        }
      },
      volume: playerStore.volume,
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
      console.error('Spotify Player initialization error:', message);
    });

    player.addListener('authentication_error', ({ message }) => {
      console.error('Spotify Player authentication error:', message);
    });

    player.addListener('account_error', ({ message }) => {
      console.error('Spotify Player account error:', message);
    });

    player.addListener('playback_error', ({ message }) => {
      console.error('Spotify Player playback error:', message);
    });

    // Player ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Spotify Player ready with device ID:', device_id);
      playerStore.setDeviceId(device_id);
      playerStore.setPlayerReady(true);
    });

    // Player not ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Spotify Player device has gone offline:', device_id);
      playerStore.setPlayerReady(false);
    });

    // Player state changed
    player.addListener('player_state_changed', (state) => {
      if (!state) {
        return;
      }

      const track = state.track_window.current_track;
      const spotifyTrack = track ? {
        id: track.id || '',
        name: track.name || '',
        artists: track.artists || [],
        album: {
          id: track.album?.id || '',
          name: track.album?.name || '',
          images: track.album?.images || [],
        },
        uri: track.uri || '',
        duration_ms: track.duration_ms || 0,
      } : null;

      playerStore.updatePlaybackState({
        isPlaying: !state.paused,
        positionMs: state.position,
        durationMs: state.duration,
        track: spotifyTrack,
      });

      // Update artwork
      if (spotifyTrack?.album.images.length) {
        const largestImage = spotifyTrack.album.images
          .sort((a, b) => (b.width || 0) - (a.width || 0))[0];
        uiStore.setArtwork(largestImage.url);
      }
    });

    playerStore.setPlayer(player);

    // Connect to the player
    player.connect().then((success) => {
      if (success) {
        console.log('Successfully connected to Spotify Player');
      } else {
        console.error('Failed to connect to Spotify Player');
      }
    });

    // Cleanup
    return () => {
      player.disconnect();
      playerStore.setPlayer(null);
      playerStore.setPlayerReady(false);
    };
  }, []);

  return playerStore;
}