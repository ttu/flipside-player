import { useUIStore } from '../stores/uiStore';

interface ViewToggleProps {
  className?: string;
}

export function ViewToggle({ className = '' }: ViewToggleProps) {
  const { view, setViewMode } = useUIStore();

  return (
    <div className={`view-toggle ${className}`} role="tablist" aria-label="View mode selector">
      <button
        className={`view-toggle-option ${view.mode === 'vinyl' ? 'active' : ''}`}
        onClick={() => setViewMode('vinyl')}
        role="tab"
        aria-selected={view.mode === 'vinyl'}
        aria-label="Vinyl view"
        title="Vinyl view (C)"
      >
        <span className="view-icon">◉</span>
        <span className="view-label">Vinyl</span>
      </button>
      <button
        className={`view-toggle-option ${view.mode === 'favorites' ? 'active' : ''}`}
        onClick={() => setViewMode('favorites')}
        role="tab"
        aria-selected={view.mode === 'favorites'}
        aria-label="Favorites view"
        title="Favorites view (C)"
      >
        <span className="view-icon">♥</span>
        <span className="view-label">Favorites</span>
      </button>
    </div>
  );
}
