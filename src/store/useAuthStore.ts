import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api';
import { AuthResponse, User, LoginRequest, RegisterRequest } from '../../shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
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
      
      login: async (emailOrUsername: string, password: string) => {
        const isEmail = emailOrUsername.includes('@');
        const data: LoginRequest = isEmail
          ? { email: emailOrUsername, password }
          : { email: emailOrUsername, password };
        
        const response: AuthResponse = await authApi.login(data);
        
        localStorage.setItem('token', response.token);
        set({ 
          token: response.token, 
          isAuthenticated: true,
          user: {
            id: response.id,
            username: response.username,
            avatar: response.avatar,
            email: '',
            bio: '',
            createdAt: ''
          }
        });
      },

      register: async (username: string, email: string, password: string) => {
        const data: RegisterRequest = { username, email, password };
        const response: AuthResponse = await authApi.register(data);
        
        localStorage.setItem('token', response.token);
        set({ 
          token: response.token, 
          isAuthenticated: true,
          user: {
            id: response.id,
            username: response.username,
            avatar: response.avatar,
            email: email,
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
