import { create } from 'zustand';
import { checkInsApi } from '../api';
import { CheckInFeed, ExploreUser } from '../../shared/types';

interface FeedState {
  feed: CheckInFeed[];
  publicFeed: CheckInFeed[];
  exploreUsers: (ExploreUser & { isFollowing: boolean })[];
  userCheckIns: CheckInFeed[];
  loading: boolean;
  fetchFeed: () => Promise<void>;
  fetchPublicFeed: (hot?: boolean) => Promise<void>;
  fetchExploreUsers: () => Promise<void>;
  fetchUserCheckIns: (userId: number) => Promise<void>;
  toggleLike: (id: number) => Promise<void>;
  addComment: (id: number, content: string) => Promise<void>;
  deleteCheckIn: (id: number) => Promise<void>;
}

const updateLikeInLists = (
  lists: CheckInFeed[][],
  id: number,
  liked: boolean,
  likesCount: number
): CheckInFeed[][] => {
  return lists.map(list =>
    list.map(item =>
      item.id === id
        ? { ...item, isLiked: liked, likesCount }
        : item
    )
  );
};

const updateCommentInLists = (lists: CheckInFeed[][], id: number): CheckInFeed[][] => {
  return lists.map(list =>
    list.map(item =>
      item.id === id
        ? { ...item, commentsCount: item.commentsCount + 1 }
        : item
    )
  );
};

const removeFromLists = (lists: CheckInFeed[][], id: number): CheckInFeed[][] => {
  return lists.map(list => list.filter(item => item.id !== id));
};

export const useFeedStore = create<FeedState>((set, get) => ({
  feed: [],
  publicFeed: [],
  exploreUsers: [],
  userCheckIns: [],
  loading: false,

  fetchFeed: async () => {
    set({ loading: true });
    try {
      const response = await checkInsApi.feed(0, 50);
      set({ feed: response.checkIns, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Fetch feed failed:', error);
    }
  },

  fetchPublicFeed: async (hot?: boolean) => {
    set({ loading: true });
    try {
      const data = await checkInsApi.publicFeed(hot);
      set({ publicFeed: data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Fetch public feed failed:', error);
    }
  },

  fetchExploreUsers: async () => {
    set({ loading: true });
    try {
      const data = await checkInsApi.exploreUsers();
      set({
        exploreUsers: data.map(u => ({ ...u, isFollowing: u.isFollowing ?? false })),
        loading: false
      });
    } catch (error) {
      set({ loading: false });
      console.error('Fetch explore users failed:', error);
    }
  },

  fetchUserCheckIns: async (userId: number) => {
    set({ loading: true });
    try {
      const data = await checkInsApi.userCheckIns(userId);
      set({ userCheckIns: data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Fetch user check-ins failed:', error);
    }
  },

  toggleLike: async (id: number) => {
    try {
      const result = await checkInsApi.like(id);
      const { feed, publicFeed, userCheckIns } = get();
      const [newFeed, newPublicFeed, newUserCheckIns] = updateLikeInLists(
        [feed, publicFeed, userCheckIns],
        id,
        result.liked,
        result.likesCount
      );
      set({
        feed: newFeed,
        publicFeed: newPublicFeed,
        userCheckIns: newUserCheckIns
      });
    } catch (error) {
      console.error('Toggle like failed:', error);
    }
  },

  addComment: async (id: number, content: string) => {
    try {
      await checkInsApi.comment(id, content);
      const { feed, publicFeed, userCheckIns } = get();
      const [newFeed, newPublicFeed, newUserCheckIns] = updateCommentInLists(
        [feed, publicFeed, userCheckIns],
        id
      );
      set({
        feed: newFeed,
        publicFeed: newPublicFeed,
        userCheckIns: newUserCheckIns
      });
    } catch (error) {
      console.error('Add comment failed:', error);
    }
  },

  deleteCheckIn: async (id: number) => {
    try {
      await checkInsApi.delete(id);
      const { feed, publicFeed, userCheckIns } = get();
      const [newFeed, newPublicFeed, newUserCheckIns] = removeFromLists(
        [feed, publicFeed, userCheckIns],
        id
      );
      set({
        feed: newFeed,
        publicFeed: newPublicFeed,
        userCheckIns: newUserCheckIns
      });
    } catch (error) {
      console.error('Delete check-in failed:', error);
    }
  }
}));
