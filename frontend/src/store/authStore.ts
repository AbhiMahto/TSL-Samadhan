import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Employee } from '../types';

interface AuthState {
  user: Employee | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string | null, user: Employee | null) => Promise<void>;
  updateUser: (user: Employee) => void;
  logout: () => Promise<void>;
  loadSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: async (token, user) => {
    try {
      if (token) {
        await AsyncStorage.setItem('@auth_token', token);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        await AsyncStorage.removeItem('@auth_token');
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Error saving auth token:', error);
      set({ isLoading: false });
    }
  },

  updateUser: (user) => {
    set({ user });
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('@auth_token');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Error removing auth token during logout:', error);
    }
  },

  loadSession: async () => {
    set({ isLoading: true });
    try {
      const storedToken = await AsyncStorage.getItem('@auth_token');
      if (!storedToken) {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        return false;
      }

      // To avoid circular dependency, we import Axios client dynamically
      const api = require('../services/api').default;
      
      // Verify token validity by calling profile API
      const response = await api.get('/api/employee/profile');
      
      if (response.data && response.data.success) {
        const user = response.data.user;
        set({ 
          token: storedToken, 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        return true;
      } else {
        await AsyncStorage.removeItem('@auth_token');
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        return false;
      }
    } catch (error) {
      console.warn('Session loading failed or token is invalid. Resetting session...', error);
      await AsyncStorage.removeItem('@auth_token');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  }
}));
