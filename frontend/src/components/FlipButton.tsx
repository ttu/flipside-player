import { useUIStore } from '../stores/uiStore';

interface FlipButtonProps {
  className?: string;
}

export function FlipButton({ className = '' }: FlipButtonProps) {
  const { vinyl, flipSide } = useUIStore();

  return (
    <button
      className={`flip-button ${className}`}
      onClick={flipSide}
      aria-label={`Flip to side ${vinyl.activeSide === 'A' ? 'B' : 'A'}`}
      title={`Flip to side ${vinyl.activeSide === 'A' ? 'B' : 'A'} (F)`}
    >
      <span className="flip-icon">⟲</span>
      <span className="side-indicator">
        Side {vinyl.activeSide} → {vinyl.activeSide === 'A' ? 'B' : 'A'}
      </span>
    </button>
  );
}