import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';
import { triggerPremiumWarning } from '../utils/premiumWarning';

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

  const getAngleFromPointer = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = event.clientX - rect.left - centerX;
    const y = event.clientY - rect.top - centerY;

    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    return angle;
  }, []);

  const getTimeFromAngle = useCallback(
    (angle: number) => {
      if (!durationMs) return 0;

      const halfDuration = durationMs / 2;

      if (vinyl.activeSide === 'A') {
        // Side A: 0° to 180° maps to 0 to halfDuration
        if (angle > 180) return 0; // Outside active zone
        return (angle / 180) * halfDuration;
      } else {
        // Side B: 180° to 360° maps to halfDuration to durationMs
        if (angle <= 180) return halfDuration; // Outside active zone
        return halfDuration + ((angle - 180) / 180) * halfDuration;
      }
    },
    [durationMs, vinyl.activeSide]
  );

  const handleCanvasClick = useCallback(
    async (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !player || !durationMs) return;

      const angle = getAngleFromPointer(event, canvas);
      const targetTime = getTimeFromAngle(angle);

      try {
        await player.seek(Math.round(targetTime));
      } catch (error) {
        console.error('Seek failed:', error);
      }
    },
    [player, durationMs, getAngleFromPointer, getTimeFromAngle]
  );

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
            sideTracks: sideTracks.map(t => ({
              id: t.id,
              name: t.name,
              duration_ms: t.duration_ms,
            })),
            sideTotalMs,
            currentTrack: track ? { id: track.id, name: track.name } : null,
          });
        }

        if (sideTotalMs > 0) {
          let sideElapsedMs: number;

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
            const inSide = vinyl.activeSide === 'A' ? Math.min(pos, half) : Math.max(0, pos - half);
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

          ctx.strokeStyle = '#ff6b35';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(needleX, needleY);
          ctx.stroke();

          // Needle dot
          ctx.fillStyle = '#ff6b35';
          ctx.beginPath();
          ctx.arc(needleX, needleY, 5, 0, Math.PI * 2);
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

          if (actualTrack && track && actualTrack.id !== track.id) {
            console.warn('🔄 TRACK MISMATCH DETECTED:', {
              storeTrack: { id: track.id, name: track.name },
              actualTrack: { id: actualTrack.id, name: actualTrack.name },
              message: 'Player store track differs from actual playing track',
            });
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
  }, [drawVinyl, isPlaying, player, track]);

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

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [handleCanvasClick]);

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

  return (
    <div className={`vinyl-deck ${className}`}>
      <canvas
        ref={canvasRef}
        className="vinyl-canvas"
        style={{ cursor: player ? 'pointer' : 'default' }}
      />
    </div>
  );
}
