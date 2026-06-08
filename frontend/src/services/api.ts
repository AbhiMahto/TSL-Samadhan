import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

import Constants from 'expo-constants';

// Get base URL dynamically in development, or from env in production
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'web') {
      const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
      return `http://${host}:5001`;
    }
    
    // For mobile emulators/devices, grab the host IP where Metro is running
    const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.37:8081"
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:5001`;
    }
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001';
  }
  return 'http://localhost:5001';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach bearer token to headers
api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Catch 401 unauthorized errors for automatic logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If JWT is unauthorized, clear credentials and log out
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request detected. Logging out user...');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
