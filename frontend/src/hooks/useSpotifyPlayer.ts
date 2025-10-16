import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';
import { getSpotifyToken, transferPlayback, getDevices } from '../utils/spotify';

export function useSpotifyPlayer(sdkReady?: boolean) {
  const playerStore = usePlayerStore();
  const uiStore = useUIStore();
  const playerInitialized = useRef(false);
  const pollingIntervalRef = useRef<number | null>(null);
  const ensuringDeviceRef = useRef<boolean>(false);

  const ensureActiveDeviceWithRetry = useCallback(
    async (maxAttempts = 5, delayMs = 1000) => {
      if (ensuringDeviceRef.current) return;
      ensuringDeviceRef.current = true;
      try {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const devices = await getDevices();
            const list = devices?.devices || [];
            if (list.length > 0) {
              // Prefer the Web Player (SDK) device if present
              const sdkId = playerStore.deviceId;
              const webPlayer =
                list.find((d: any) => d.id === sdkId) ||
                list.find((d: any) => (d.name || '').toLowerCase().includes('flipside')) ||
                list.find((d: any) => (d.name || '').toLowerCase().startsWith('web player'));
              const target = webPlayer || list[0];
              await transferPlayback(target.id, true);
              playerStore.setDeviceId(target.id);
              return;
            }
          } catch (_) {
            // ignore and retry
          }
          await new Promise(res => setTimeout(res, delayMs));
        }
      } finally {
        ensuringDeviceRef.current = false;
      }
    },
    [playerStore]
  );

  useEffect(() => {
    console.log('useSpotifyPlayer effect running', {
      playerInitialized: playerInitialized.current,
      spotifyExists: !!window.Spotify,
      sdkReady,
    });

    if (playerInitialized.current || !window.Spotify || !sdkReady) {
      console.log('Skipping player initialization:', {
        reason: playerInitialized.current
          ? 'already initialized'
          : !window.Spotify
            ? 'Spotify SDK not loaded'
            : 'SDK not ready',
      });
      return;
    }

    console.log('Initializing Spotify Player...');
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

      // Ensure this web player becomes the active device so state updates flow here
      transferPlayback(device_id, true).catch(err => {
        console.error('Failed to transfer playback to Web Player:', err);
      });

      // Also try the generic fallback in case transfer above is rejected
      ensureActiveDeviceWithRetry();
    });

    // Player not ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Spotify Player device has gone offline:', device_id);
      playerStore.setPlayerReady(false);
      // Attempt to re-activate this device after a short delay
      setTimeout(() => {
        const id = playerStore.deviceId;
        if (id) {
          transferPlayback(id, true).catch(() => {});
        }
      }, 1500);
    });

    // Player state changed
    player.addListener('player_state_changed', state => {
      if (!state) {
        return;
      }

      const track = state.track_window.current_track;
      const spotifyTrack = track
        ? {
            id: track.id || '',
            name: track.name || '',
            artists: track.artists || [],
            album: {
              id: track.album?.uri?.split(':')[2] || '',
              name: track.album?.name || '',
              images:
                track.album?.images?.map(img => ({
                  url: img.url,
                  width: img.width || 640,
                  height: img.height || 640,
                })) || [],
            },
            uri: track.uri || '',
            duration_ms: track.duration_ms || 0,
          }
        : null;

      playerStore.updatePlaybackState({
        isPlaying: !state.paused,
        positionMs: state.position,
        durationMs: state.duration,
        track: spotifyTrack,
      });

      // Update artwork
      if (spotifyTrack?.album.images.length) {
        const largestImage = spotifyTrack.album.images.sort(
          (a, b) => (b.width || 0) - (a.width || 0)
        )[0];
        uiStore.setArtwork(largestImage.url);
      }
    });

    playerStore.setPlayer(player);

    // Connect to the player
    player.connect().then(success => {
      if (success) {
        console.log('Successfully connected to Spotify Player');
        // Start polling as a safety net for state updates and device monitoring
        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = window.setInterval(async () => {
            try {
              const state = await player.getCurrentState();
              if (!state) {
                // Player state is null - device might be disconnected
                console.warn('Web Player state is null - checking device connectivity');
                return;
              }

              const track = state.track_window.current_track;
              const spotifyTrack = track
                ? {
                    id: track.id || '',
                    name: track.name || '',
                    artists: track.artists || [],
                    album: {
                      id: track.album?.uri?.split(':')[2] || '',
                      name: track.album?.name || '',
                      images:
                        track.album?.images?.map(img => ({
                          url: img.url,
                          width: img.width || 640,
                          height: img.height || 640,
                        })) || [],
                    },
                    uri: track.uri || '',
                    duration_ms: track.duration_ms || 0,
                  }
                : null;

              playerStore.updatePlaybackState({
                isPlaying: !state.paused,
                positionMs: state.position,
                durationMs: state.duration,
                track: spotifyTrack,
              });
            } catch (err) {
              console.warn('Polling error - device may be disconnected:', err);
              // Try to ensure device is still active
              ensureActiveDeviceWithRetry(2, 500);
            }
          }, 1000);
        }

        // Fallback: ensure some device is active (retry a few times)
        ensureActiveDeviceWithRetry();
      } else {
        console.error('Failed to connect to Spotify Player');
      }
    });

    // Cleanup
    return () => {
      player.disconnect();
      playerStore.setPlayer(null);
      playerStore.setPlayerReady(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

  // Handle browser visibility changes to reconnect when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && playerStore.player && playerStore.deviceId) {
        console.log('Tab became visible - ensuring Web Player is active');
        // Wait a bit for the player to reconnect, then ensure it's active
        setTimeout(() => {
          ensureActiveDeviceWithRetry(3, 1000);
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [playerStore.player, playerStore.deviceId, ensureActiveDeviceWithRetry]);

  return playerStore;
}
