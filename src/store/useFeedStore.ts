import { create } from 'zustand';
import { checkInsApi } from '../api';
import { CheckInFeed } from '../../shared/types';

interface FeedState {
  feedItems: CheckInFeed[];
  loading: boolean;
  hasMore: boolean;
  cursor: number;
  fetchFeed: (reset?: boolean) => Promise<void>;
  toggleLike: (id: number) => Promise<void>;
  addComment: (id: number, content: string) => Promise<void>;
  deleteCheckIn: (id: number) => Promise<void>;
  addCheckInToFeed: (item: CheckInFeed) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feedItems: [],
  loading: false,
  hasMore: true,
  cursor: 0,

  fetchFeed: async (reset = false) => {
    const { loading, cursor, feedItems } = get();
    if (loading) return;
    
    const currentCursor = reset ? 0 : cursor;
    
    set({ loading: true });
    try {
      const response = await checkInsApi.feed(currentCursor, 20);
      const newItems = response.checkIns;
      
      set({
        feedItems: reset ? newItems : [...feedItems, ...newItems],
        cursor: response.nextCursor,
        hasMore: response.nextCursor > 0,
        loading: false
      });
    } catch (error) {
      set({ loading: false });
    }
  },

  toggleLike: async (id: number) => {
    try {
      const result = await checkInsApi.like(id);
      set((state) => ({
        feedItems: state.feedItems.map(item =>
          item.id === id
            ? { ...item, isLiked: result.liked, likesCount: result.likesCount }
            : item
        )
      }));
    } catch (error) {
      console.error('Toggle like failed:', error);
    }
  },

  addComment: async (id: number, content: string) => {
    try {
      await checkInsApi.comment(id, content);
      set((state) => ({
        feedItems: state.feedItems.map(item =>
          item.id === id
            ? { ...item, commentsCount: item.commentsCount + 1 }
            : item
        )
      }));
    } catch (error) {
      console.error('Add comment failed:', error);
    }
  },

  deleteCheckIn: async (id: number) => {
    try {
      await checkInsApi.delete(id);
      set((state) => ({
        feedItems: state.feedItems.filter(item => item.id !== id)
      }));
    } catch (error) {
      console.error('Delete check-in failed:', error);
    }
  },

  addCheckInToFeed: (item: CheckInFeed) => {
    set((state) => ({
      feedItems: [item, ...state.feedItems]
    }));
  }
}));
