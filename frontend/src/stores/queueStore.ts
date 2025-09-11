import { create } from 'zustand';
import { QueueState, QueueItem, SpotifyTrack } from '../types';

interface QueueStore extends QueueState {
  addTrack: (track: SpotifyTrack) => void;
  removeTrack: (id: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
}

export const useQueueStore = create<QueueStore>((set, _get) => ({
  items: [],

  addTrack: (track: SpotifyTrack) => {
    const queueItem: QueueItem = {
      type: 'track',
      spotifyUri: track.uri,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumId: track.album.id,
      albumArt: track.album.images[0]?.url,
      id: `${track.id}-${Date.now()}`,
    };

    set(state => ({
      items: [...state.items, queueItem],
    }));
  },

  removeTrack: (id: string) => {
    set(state => ({
      items: state.items.filter(item => item.id !== id),
    }));
  },

  reorderQueue: (fromIndex: number, toIndex: number) => {
    set(state => {
      const items = [...state.items];
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
      return { items };
    });
  },

  clearQueue: () => set({ items: [] }),
}));
