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
  const { vinyl, artwork } = useUIStore();

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

  const getTimeFromAngle = useCallback((angle: number) => {
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
  }, [durationMs, vinyl.activeSide]);

  const handleCanvasClick = useCallback(async (event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !player || !durationMs) return;

    const angle = getAngleFromPointer(event, canvas);
    const targetTime = getTimeFromAngle(angle);
    
    try {
      await player.seek(Math.round(targetTime));
    } catch (error) {
      console.error('Seek failed:', error);
    }
  }, [player, durationMs, getAngleFromPointer, getTimeFromAngle]);

  const drawVinyl = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
    
    // Draw split line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();
    
    // Highlight active side
    const activeAlpha = 0.3;
    const inactiveAlpha = 0.1;
    
    // Side A (top half)
    ctx.fillStyle = vinyl.activeSide === 'A' 
      ? `rgba(255, 255, 255, ${activeAlpha})` 
      : `rgba(255, 255, 255, ${inactiveAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    
    // Side B (bottom half)
    ctx.fillStyle = vinyl.activeSide === 'B' 
      ? `rgba(255, 255, 255, ${activeAlpha})` 
      : `rgba(255, 255, 255, ${inactiveAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI, false);
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    
    // Draw side labels
    ctx.fillStyle = '#ccc';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('A', centerX, centerY - 40);
    ctx.fillText('B', centerX, centerY + 50);
    
    // Draw needle/progress indicator
    if (durationMs > 0) {
      const progress = positionMs / durationMs;
      const halfProgress = (positionMs % (durationMs / 2)) / (durationMs / 2);
      
      let needleAngle;
      if (positionMs < durationMs / 2) {
        // Side A
        needleAngle = (halfProgress * Math.PI) + Math.PI; // 180° to 360°
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
    if (artwork.coverUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, centerX - 60, centerY - 60, 120, 120);
        ctx.restore();
      };
      img.src = artwork.coverUrl;
    }
  }, [positionMs, durationMs, vinyl.activeSide, artwork.coverUrl]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawVinyl(ctx, canvas);
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, drawVinyl]);

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
    if (isPlaying) {
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
  }, [isPlaying, animate, drawVinyl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('click', handleCanvasClick);
    
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [handleCanvasClick]);

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