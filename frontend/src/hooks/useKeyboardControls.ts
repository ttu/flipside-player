import { useEffect } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';

export function useKeyboardControls() {
  const { player, isPlaying } = usePlayerStore();
  const { flipSide, toggleView } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (player) {
            if (isPlaying) {
              player.pause();
            } else {
              player.resume();
            }
          }
          break;

        case 'KeyF':
          event.preventDefault();
          flipSide();
          break;

        case 'KeyC':
          event.preventDefault();
          toggleView();
          break;

        case 'ArrowLeft':
          event.preventDefault();
          if (player) {
            const seekAmount = event.shiftKey ? 30000 : 5000; // 30s or 5s
            player.getCurrentState().then((state) => {
              if (state) {
                const newPosition = Math.max(0, state.position - seekAmount);
                player.seek(newPosition);
              }
            });
          }
          break;

        case 'ArrowRight':
          event.preventDefault();
          if (player) {
            const seekAmount = event.shiftKey ? 30000 : 5000; // 30s or 5s
            player.getCurrentState().then((state) => {
              if (state) {
                const newPosition = Math.min(state.duration, state.position + seekAmount);
                player.seek(newPosition);
              }
            });
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [player, isPlaying, flipSide, toggleView]);
}