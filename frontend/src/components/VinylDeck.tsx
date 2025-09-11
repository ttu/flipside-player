import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';

interface VinylDeckProps {
  className?: string;
}

export function VinylDeck({ className = '' }: VinylDeckProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { isPlaying, positionMs, durationMs, player } = usePlayerStore();
  const { vinyl, artwork, album, flipSide } = useUIStore();

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
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const clickX = event.clientX - rect.left - centerX;
      const clickY = event.clientY - rect.top - centerY;
      const clickRadius = Math.sqrt(clickX * clickX + clickY * clickY);

      // Check if click is on the center area (for flipping)
      if (clickRadius < 80) {
        flipSide();
        return;
      }

      // Regular seeking behavior
      if (!player || !durationMs) return;

      const angle = getAngleFromPointer(event, canvas);
      const targetTime = getTimeFromAngle(angle);

      try {
        await player.seek(Math.round(targetTime));
      } catch (error) {
        console.error('Seek failed:', error);
      }
    },
    [player, durationMs, getAngleFromPointer, getTimeFromAngle, flipSide]
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

      // Draw center hole
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Draw needle/progress indicator
      if (durationMs > 0) {
        const halfProgress = (positionMs % (durationMs / 2)) / (durationMs / 2);

        let needleAngle;
        if (positionMs < durationMs / 2) {
          // Side A
          needleAngle = halfProgress * Math.PI + Math.PI; // 180° to 360°
        } else {
          // Side B
          needleAngle = halfProgress * Math.PI; // 0° to 180°
        }

        const needleX = centerX + Math.cos(needleAngle) * (radius - 30);
        const needleY = centerY + Math.sin(needleAngle) * (radius - 30);

        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(needleX, needleY);
        ctx.stroke();

        // Needle dot
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.arc(needleX, needleY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Album artwork in center if available
      const albumCover = album.currentAlbum?.images?.[0]?.url || artwork.coverUrl;
      if (albumCover) {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, centerX - 60, centerY - 60, 120, 120);
          ctx.restore();
        };
        img.src = albumCover;
      }

      // Add clickable flip indicator in center
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Click to flip', centerX, centerY + 85);

      // Restore context if we were flipping
      if (vinyl.isFlipping) {
        ctx.restore();
      }
    },
    [
      positionMs,
      durationMs,
      vinyl.isFlipping,
      vinyl.flipProgress,
      artwork.coverUrl,
      album.currentAlbum,
    ]
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawVinyl(ctx, canvas);

    if (isPlaying || vinyl.isFlipping) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, vinyl.isFlipping, drawVinyl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const size = Math.min(container.clientWidth, container.clientHeight, 500);
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawVinyl(ctx, canvas);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [drawVinyl]);

  useEffect(() => {
    if (isPlaying || vinyl.isFlipping) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Draw static state
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        drawVinyl(ctx, canvas);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, vinyl.isFlipping, animate, drawVinyl]);

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
          uris: currentTracks.map(track => track.uri),
        }),
      }).catch(error => {
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
