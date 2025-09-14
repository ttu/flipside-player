import { useUIStore } from '../stores/uiStore';

interface ViewToggleProps {
  className?: string;
}

export function ViewToggle({ className = '' }: ViewToggleProps) {
  const { view, toggleView } = useUIStore();

  return (
    <button
      className={`view-toggle ${className}`}
      onClick={toggleView}
      aria-label={`Switch to ${view.mode === 'vinyl' ? 'favorites' : 'vinyl'} view`}
      title={`Switch to ${view.mode === 'vinyl' ? 'favorites' : 'vinyl'} view (C)`}
    >
      {view.mode === 'vinyl' ? '♥' : '💿'}
      <span className="view-label">{view.mode === 'vinyl' ? 'Favorites' : 'Vinyl'}</span>
    </button>
  );
}
