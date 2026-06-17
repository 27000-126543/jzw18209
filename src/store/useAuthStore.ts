import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api';
import { AuthResponse, User } from '../../shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (data) => {
        localStorage.setItem('token', data.token);
        set({ 
          token: data.token, 
          isAuthenticated: true,
          user: {
            id: data.id,
            username: data.username,
            avatar: data.avatar,
            email: '',
            bio: '',
            createdAt: ''
          }
        });
      },
      
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      fetchUser: async () => {
        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
      
      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null
        }));
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
