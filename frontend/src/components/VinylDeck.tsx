import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';
import { triggerPremiumWarning } from '../utils/premiumWarning';
import type { SpotifyTrack } from '../types';

interface VinylDeckProps {
  className?: string;
}

export function VinylDeck({ className = '' }: VinylDeckProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { isPlaying, positionMs, durationMs, player, track } = usePlayerStore();
  const actualTrackRef = useRef<any>(null);
  const { vinyl, artwork, album } = useUIStore();
  // Smoothly animated playback position between SDK updates
  const animatedPositionMsRef = useRef<number>(0);
  const lastTimestampRef = useRef<number | null>(null);
  const lastPollRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(true);
  // Cache for album artwork to prevent repeated requests
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const loadingImages = useRef<Set<string>>(new Set());
  // Throttle debug logging to once per second
  const lastDebugLog = useRef<number>(0);
  // Drag state
  const isDraggingRef = useRef<boolean>(false);
  const dragPositionRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);
  // Track mismatch spam guard
  const lastSyncedTrackIdRef = useRef<string | null>(null);

  const mapSdkTrackToSpotifyTrack = useCallback((sdkTrack: any): SpotifyTrack => {
    return {
      id: sdkTrack.id,
      name: sdkTrack.name,
      artists: (sdkTrack.artists ?? []).map((artist: any) => ({ name: artist.name })),
      album: {
        id: sdkTrack.album?.id ?? '',
        name: sdkTrack.album?.name ?? '',
        images: sdkTrack.album?.images ?? [],
      },
      uri: sdkTrack.uri,
      duration_ms: sdkTrack.duration_ms,
      track_number: sdkTrack.track_number,
    };
  }, []);

  const getRadiusFromPointer = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = event.clientX - rect.left - centerX;
    const y = event.clientY - rect.top - centerY;
    return Math.sqrt(x * x + y * y);
  }, []);

  const getTimeFromRadius = useCallback(
    (radius: number, canvasRadius: number) => {
      const sideTracks = vinyl.activeSide === 'A' ? album.sideATracks : album.sideBTracks;
      const sideTotalMs = sideTracks.reduce((sum, t) => sum + (t?.duration_ms || 0), 0);

      if (sideTotalMs === 0) return 0;

      const outerRadius = canvasRadius - 10;
      const innerRadius = canvasRadius * 0.3;

      // Clamp radius to valid range
      const clampedRadius = Math.max(innerRadius, Math.min(outerRadius, radius));

      // Calculate progress from radius (outer = start, inner = end)
      const progress = 1 - (clampedRadius - innerRadius) / (outerRadius - innerRadius);

      return progress * sideTotalMs;
    },
    [vinyl.activeSide, album.sideATracks, album.sideBTracks]
  );

  const seekToPosition = useCallback(
    async (sideElapsedMs: number) => {
      if (!player) return;

      const sideTracks = vinyl.activeSide === 'A' ? album.sideATracks : album.sideBTracks;
      let accumulatedMs = 0;
      let targetTrackIndex = 0;
      let positionInTrack = 0;

      // Find which track and position within that track
      for (let i = 0; i < sideTracks.length; i++) {
        const trackDuration = sideTracks[i].duration_ms;
        if (accumulatedMs + trackDuration > sideElapsedMs) {
          targetTrackIndex = i;
          positionInTrack = sideElapsedMs - accumulatedMs;
          break;
        }
        accumulatedMs += trackDuration;
      }

      // If we're in a different track, switch to it
      const currentTrackIndex = sideTracks.findIndex(t => t.id === track?.id);

      try {
        if (currentTrackIndex !== targetTrackIndex) {
          // Switch to the target track
          await fetch('/api/spotify/play', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              deviceId: usePlayerStore.getState().deviceId,
              uris: sideTracks.map(t => t.uri),
              offset: { position: targetTrackIndex },
              position_ms: Math.round(positionInTrack),
            }),
          });
          // Update animated position to prevent jump back
          animatedPositionMsRef.current = positionInTrack;
          lastTimestampRef.current = performance.now();
        } else {
          // Same track, just seek
          await player.seek(Math.round(positionInTrack));
          // Update animated position to prevent jump back
          animatedPositionMsRef.current = positionInTrack;
          lastTimestampRef.current = performance.now();
        }
      } catch (error) {
        console.error('Seek failed:', error);
      }
    },
    [player, vinyl.activeSide, album.sideATracks, album.sideBTracks, track]
  );

  const handleCanvasClick = useCallback(
    async (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !player) return;

      const rect = canvas.getBoundingClientRect();
      const canvasRadius = Math.min(rect.width, rect.height) / 2 - 20;
      const radius = getRadiusFromPointer(event, canvas);
      const sideElapsedMs = getTimeFromRadius(radius, canvasRadius);

      await seekToPosition(sideElapsedMs);
    },
    [player, getRadiusFromPointer, getTimeFromRadius, seekToPosition]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !player) return;

      const rect = canvas.getBoundingClientRect();
      const canvasRadius = Math.min(rect.width, rect.height) / 2 - 20;
      const radius = getRadiusFromPointer(event, canvas);

      // Check if click is near the needle (within reasonable distance)
      const sideTracks = vinyl.activeSide === 'A' ? album.sideATracks : album.sideBTracks;
      const sideTotalMs = sideTracks.reduce((sum, t) => sum + (t?.duration_ms || 0), 0);

      if (sideTotalMs > 0 && track) {
        let elapsedBeforeCurrent = 0;
        for (const t of sideTracks) {
          if (t.id === track.id) break;
          elapsedBeforeCurrent += t.duration_ms;
        }
        const sideElapsedMs = elapsedBeforeCurrent + animatedPositionMsRef.current;
        const progress = sideElapsedMs / sideTotalMs;

        const outerRadius = canvasRadius - 10;
        const innerRadius = canvasRadius * 0.3;
        const needleRadius = outerRadius - progress * (outerRadius - innerRadius);

        // If within 30px of needle, start dragging
        if (Math.abs(radius - needleRadius) < 30) {
          isDraggingRef.current = true;
          event.preventDefault();
        }
      }
    },
    [player, getRadiusFromPointer, vinyl.activeSide, album.sideATracks, album.sideBTracks, track]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasRadius = Math.min(rect.width, rect.height) / 2 - 20;
      const radius = getRadiusFromPointer(event, canvas);
      const sideElapsedMs = getTimeFromRadius(radius, canvasRadius);

      // Update drag position immediately for visual feedback
      dragPositionRef.current = sideElapsedMs;

      // Throttle actual seek requests to every 100ms
      const now = performance.now();
      if (now - lastSeekTimeRef.current > 100) {
        lastSeekTimeRef.current = now;
        seekToPosition(sideElapsedMs);
      }
    },
    [getRadiusFromPointer, getTimeFromRadius, seekToPosition]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current && dragPositionRef.current !== null) {
      // Final seek to the exact position
      seekToPosition(dragPositionRef.current);
    }
    isDraggingRef.current = false;
    dragPositionRef.current = null;
  }, [seekToPosition]);

  const drawVinyl = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply flip transformation if flipping
      if (vinyl.isFlipping) {
        const flipScale = Math.cos(vinyl.flipProgress * Math.PI);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(flipScale, 1);
        ctx.translate(-centerX, -centerY);
      }

      // Draw vinyl background
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw grooves
      const grooveCount = 15;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;

      for (let i = 1; i <= grooveCount; i++) {
        const grooveRadius = (radius / grooveCount) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, grooveRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw center hole (scaled to vinyl size)
      const holeRadius = radius * 0.02; // About 2% of vinyl radius
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
      ctx.fill();

      // (Needle is drawn after artwork to keep it visible)

      // Album artwork in center if available (scaled to vinyl size like real vinyl labels)
      const albumCover = album.currentAlbum?.images?.[0]?.url || artwork.coverUrl;
      if (albumCover) {
        // Check if image is already cached
        let img = imageCache.current.get(albumCover);

        if (img && img.complete) {
          // Use cached image
          const coverRadius = radius * 0.25;
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, coverRadius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            img,
            centerX - coverRadius,
            centerY - coverRadius,
            coverRadius * 2,
            coverRadius * 2
          );
          ctx.restore();
        } else if (!loadingImages.current.has(albumCover)) {
          // Load image only if not already loading
          loadingImages.current.add(albumCover);
          img = new Image();
          img.onload = () => {
            // Cache the loaded image
            imageCache.current.set(albumCover, img!);
            loadingImages.current.delete(albumCover);
            // Trigger a redraw to show the loaded image
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && canvasRef.current) {
              drawVinyl(ctx, canvasRef.current);
            }
          };
          img.onerror = () => {
            loadingImages.current.delete(albumCover);
          };
          img.src = albumCover;
        }
      }

      // Reserve center measurement values (kept for future layout tuning)

      // Draw needle/progress indicator AFTER artwork so it remains visible
      // Computes progress as (sum(previous track durations) + current position) / side total
      {
        const sideTracks = vinyl.activeSide === 'A' ? album.sideATracks : album.sideBTracks;
        const sideTotalMs = sideTracks.reduce((sum, t) => sum + (t?.duration_ms || 0), 0);

        // Throttle debug logging to once per five seconds
        const now = performance.now();
        const shouldLog = now - lastDebugLog.current > 5000;

        if (shouldLog) {
          lastDebugLog.current = now;

          console.log('🔍 Side Debug:', {
            activeSide: vinyl.activeSide,
            sideTracksCount: sideTracks.length,
            sideATracksRaw: album.sideATracks.length,
            sideBTracksRaw: album.sideBTracks.length,
            sideTracks: sideTracks.map(t => ({
              id: t.id,
              name: t.name,
              duration_ms: t.duration_ms,
            })),
            sideTotalMs,
            currentTrack: track ? { id: track.id, name: track.name } : null,
            albumData: {
              hasCurrentAlbum: !!album.currentAlbum,
              albumName: album.currentAlbum?.name,
            },
          });
        }

        if (sideTotalMs > 0) {
          let sideElapsedMs: number;

          // If dragging, use the drag position instead of actual playback position
          if (isDraggingRef.current && dragPositionRef.current !== null) {
            sideElapsedMs = dragPositionRef.current;
          } else {
            // Use actual track from Spotify player if available and different from store
            const currentTrack =
              actualTrackRef.current && track && actualTrackRef.current.id !== track.id
                ? {
                    id: actualTrackRef.current.id,
                    name: actualTrackRef.current.name,
                    duration_ms: actualTrackRef.current.duration_ms,
                  }
                : track;

            if (currentTrack) {
              let elapsedBeforeCurrent = 0;
              let trackFoundInSide = false;
              for (const t of sideTracks) {
                if (t.id === currentTrack.id) {
                  trackFoundInSide = true;
                  break;
                }
                elapsedBeforeCurrent += t.duration_ms;
              }

              if (shouldLog) {
                console.log('📍 Track Matching:', {
                  currentTrackId: currentTrack.id,
                  currentTrackName: currentTrack.name,
                  trackFoundInSide,
                  elapsedBeforeCurrent,
                  sideTrackIds: sideTracks.map(t => t.id),
                  usingActualTrack:
                    actualTrackRef.current && track && actualTrackRef.current.id !== track.id,
                });
              }
              // Use the animated position within the current track
              const currentTrackPosition = Math.min(
                animatedPositionMsRef.current,
                currentTrack.duration_ms
              );

              if (trackFoundInSide) {
                sideElapsedMs = Math.max(
                  0,
                  Math.min(sideTotalMs, elapsedBeforeCurrent + currentTrackPosition)
                );
              } else {
                // Fallback: if track not found in side, assume it's the first track on this side
                // This helps during track transitions when state is temporarily out of sync
                sideElapsedMs = Math.max(0, Math.min(sideTotalMs, currentTrackPosition));
                if (shouldLog) {
                  console.log('🔄 Using fallback calculation for track not in side');
                }
              }

              // Add a warning if there's a potential track sync issue
              if (!trackFoundInSide && shouldLog) {
                console.warn('⚠️ TRACK SYNC ISSUE: Current track not found in side tracks!', {
                  currentTrack: currentTrack.name,
                  currentTrackId: currentTrack.id,
                  activeSide: vinyl.activeSide,
                  sideTrackNames: sideTracks.map(t => t.name),
                });
              }

              if (shouldLog) {
                console.log('🎵 Needle Debug:', {
                  trackName: currentTrack.name,
                  activeSide: vinyl.activeSide,
                  sideTotalMs,
                  elapsedBeforeCurrent,
                  currentTrackPosition: Math.round(currentTrackPosition),
                  animatedPositionMs: Math.round(animatedPositionMsRef.current),
                  sideElapsedMs: Math.round(sideElapsedMs),
                  progress: Math.round((sideElapsedMs / sideTotalMs) * 100) + '%',
                  trackFoundInSide,
                });
              }
            } else if (durationMs > 0) {
              // Fallback: estimate using global position/duration evenly over the side
              const half = durationMs / 2;
              const pos = animatedPositionMsRef.current;
              const inSide =
                vinyl.activeSide === 'A' ? Math.min(pos, half) : Math.max(0, pos - half);
              sideElapsedMs = Math.max(0, Math.min(sideTotalMs, inSide));

              if (shouldLog) {
                console.log('🎵 Needle Debug (fallback):', {
                  activeSide: vinyl.activeSide,
                  sideTotalMs,
                  pos,
                  inSide,
                  sideElapsedMs,
                  progress: Math.round((sideElapsedMs / sideTotalMs) * 100) + '%',
                });
              }
            } else {
              sideElapsedMs = 0;
              if (shouldLog) {
                console.log('🎵 Needle Debug: No duration data');
              }
            }
          }

          const progress = sideElapsedMs / sideTotalMs; // 0..1 along the active side

          // Needle stays at 3 o'clock (0 degrees) and moves inward like real vinyl
          const needleAngle = 0; // Always at 3 o'clock

          // Calculate radial position: starts at outer edge, moves toward center as track progresses
          const outerRadius = radius - 10; // Start near outer edge
          const innerRadius = radius * 0.3; // End at about 30% of radius (near center)
          const needleRadius = outerRadius - progress * (outerRadius - innerRadius);

          if (shouldLog) {
            console.log('🎯 Needle Position:', {
              progress: Math.round(progress * 100) + '%',
              outerRadius,
              innerRadius,
              needleRadius: Math.round(needleRadius),
              needleAngle,
            });
          }

          const needleX = centerX + Math.cos(needleAngle) * needleRadius;
          const needleY = centerY + Math.sin(needleAngle) * needleRadius;

          // Draw prominent needle indicator
          // Outer glow (brand accent)
          ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
          ctx.beginPath();
          ctx.arc(needleX, needleY, 12, 0, Math.PI * 2);
          ctx.fill();

          // Inner dot
          ctx.fillStyle = '#6366f1';
          ctx.beginPath();
          ctx.arc(needleX, needleY, 8, 0, Math.PI * 2);
          ctx.fill();

          // Center highlight
          ctx.fillStyle = '#a5b4fc';
          ctx.beginPath();
          ctx.arc(needleX, needleY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Restore context if we were flipping
      if (vinyl.isFlipping) {
        ctx.restore();
      }
    },
    [
      durationMs,
      vinyl.isFlipping,
      vinyl.flipProgress,
      vinyl.activeSide,
      track,
      album.sideATracks,
      album.sideBTracks,
      artwork.coverUrl,
      album.currentAlbum,
    ]
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Advance animated position based on real time when playing
    const now = performance.now();
    if (lastTimestampRef.current == null) {
      lastTimestampRef.current = now;
    }
    // Poll Spotify SDK periodically for authoritative position
    if (player && now - lastPollRef.current > 200) {
      lastPollRef.current = now;
      player.getCurrentState().then(state => {
        if (state) {
          animatedPositionMsRef.current = state.position;
          lastTimestampRef.current = now;
          pausedRef.current = state.paused;

          // Debug: Compare actual playing track with store state
          const actualTrack = state.track_window?.current_track;
          actualTrackRef.current = actualTrack;

          if (actualTrack) {
            const playerStore = usePlayerStore.getState();
            const storeTrack = playerStore.track;

            // If the actual Spotify track differs from our store track, log once and sync the store.
            // Compare against the latest store state (not the stale `track` prop) and avoid
            // logging repeatedly for the same actual track id.
            if (!storeTrack || storeTrack.id !== actualTrack.id) {
              if (lastSyncedTrackIdRef.current !== actualTrack.id && storeTrack) {
                console.warn('🔄 TRACK MISMATCH DETECTED:', {
                  storeTrack: { id: storeTrack.id, name: storeTrack.name },
                  actualTrack: { id: actualTrack.id, name: actualTrack.name },
                  message: 'Player store track differs from actual playing track',
                });
              }

              const normalizedTrack = mapSdkTrackToSpotifyTrack(actualTrack);
              playerStore.setTrack(normalizedTrack);
              lastSyncedTrackIdRef.current = actualTrack.id;
            }
          }
        }
      });
    }
    // Only advance position when actually playing and we have a track
    if (isPlaying && track && !pausedRef.current) {
      const delta = now - lastTimestampRef.current;
      animatedPositionMsRef.current = Math.min(
        animatedPositionMsRef.current + delta,
        track.duration_ms
      );
      lastTimestampRef.current = now;
    } else {
      // Reset timestamp when paused to prevent delta accumulation
      lastTimestampRef.current = now;
    }

    drawVinyl(ctx, canvas);

    animationRef.current = requestAnimationFrame(animate);
  }, [drawVinyl, isPlaying, player, track, mapSdkTrackToSpotifyTrack]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const size = Math.min(container.clientWidth, container.clientHeight, 2400);
        canvas.width = size;
        canvas.height = size;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Kick off a continuous animation loop once on mount
  useEffect(() => {
    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset animated position when SDK reports a new base position, on pause, or on track change
  useEffect(() => {
    animatedPositionMsRef.current = positionMs;
    lastTimestampRef.current = performance.now();
  }, [positionMs, isPlaying, track?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [handleCanvasClick, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Start playback when side changes
  useEffect(() => {
    const currentTracks = vinyl.activeSide === 'A' ? album.sideATracks : album.sideBTracks;

    if (currentTracks.length > 0) {
      // Start playback of the current side
      fetch('/api/spotify/play', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          deviceId: usePlayerStore.getState().deviceId,
          uris: currentTracks.map(track => track.uri),
        }),
      })
        .then(response => {
          if (!response.ok && response.status === 403) {
            triggerPremiumWarning();
          }
        })
        .catch(error => {
          console.error('Failed to start side playback:', error);
        });
    }
  }, [vinyl.activeSide, album.sideATracks, album.sideBTracks]);

  const handleMouseMoveForCursor = useCallback(
    (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !player) return;

      const rect = canvas.getBoundingClientRect();
      const canvasRadius = Math.min(rect.width, rect.height) / 2 - 20;
      const radius = getRadiusFromPointer(event, canvas);

      // Check if hovering near the needle
      const sideTracks = vinyl.activeSide === 'A' ? album.sideATracks : album.sideBTracks;
      const sideTotalMs = sideTracks.reduce((sum, t) => sum + (t?.duration_ms || 0), 0);

      if (sideTotalMs > 0 && track) {
        let elapsedBeforeCurrent = 0;
        for (const t of sideTracks) {
          if (t.id === track.id) break;
          elapsedBeforeCurrent += t.duration_ms;
        }
        const sideElapsedMs = elapsedBeforeCurrent + animatedPositionMsRef.current;
        const progress = sideElapsedMs / sideTotalMs;

        const outerRadius = canvasRadius - 10;
        const innerRadius = canvasRadius * 0.3;
        const needleRadius = outerRadius - progress * (outerRadius - innerRadius);

        // Show grab cursor when near needle
        if (Math.abs(radius - needleRadius) < 30) {
          canvas.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
        } else {
          canvas.style.cursor = 'pointer';
        }
      } else {
        canvas.style.cursor = 'pointer';
      }
    },
    [player, getRadiusFromPointer, vinyl.activeSide, album.sideATracks, album.sideBTracks, track]
  );

  return (
    <div className={`vinyl-deck ${className}`}>
      <canvas
        ref={canvasRef}
        className="vinyl-canvas"
        style={{ cursor: player ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMoveForCursor as any}
      />
    </div>
  );
}
