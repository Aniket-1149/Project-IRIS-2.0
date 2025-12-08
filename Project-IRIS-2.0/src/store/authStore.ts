import { create } from 'zustand';
import { authAPI } from '../services/apiService';

interface User {
  id: string;
  email: string;
  name?: string;
  profileImage?: string;
  phone?: string;
  address?: string;
  subscription: {
    plan: 'Free' | 'Basic' | 'Premium' | 'Device Owner';
    status: 'active' | 'inactive' | 'expired';
    startDate?: string;
    endDate?: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<void>;
  updateUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('iris_token'),
  isAuthenticated: false,
  loading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('iris_token', token);
      localStorage.setItem('iris_user', JSON.stringify(user));
      
      set({ 
        token, 
        user, 
        isAuthenticated: true,
        loading: false 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.msg || 'Login failed');
    }
  },

  register: async (email: string, password: string, name: string) => {
    try {
      const response = await authAPI.register(email, password, name);
      const { token, user } = response.data;
      
      localStorage.setItem('iris_token', token);
      localStorage.setItem('iris_user', JSON.stringify(user));
      
      set({ 
        token, 
        user, 
        isAuthenticated: true,
        loading: false 
      });
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(error.response?.data?.msg || 'Registration failed');
    }
  },

  logout: () => {
    localStorage.removeItem('iris_token');
    localStorage.removeItem('iris_user');
    set({ 
      token: null, 
      user: null, 
      isAuthenticated: false 
    });
  },

  verifyToken: async () => {
    const token = localStorage.getItem('iris_token');
    
    if (!token) {
      set({ loading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await authAPI.verify();
      const { user } = response.data;
      
      set({ 
        user, 
        isAuthenticated: true,
        loading: false 
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('iris_token');
      localStorage.removeItem('iris_user');
      set({ 
        token: null, 
        user: null, 
        isAuthenticated: false,
        loading: false 
      });
    }
  },

  updateUser: (user: User) => {
    localStorage.setItem('iris_user', JSON.stringify(user));
    set({ user });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },
}));
