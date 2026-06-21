'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../utils/api';

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  description?: string;
  timestamp: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  reward: number;
}

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  tokens: number;
  predictionsCount: number;
  correctPredictions: number;
  winStreak: number;
  unlockedAchievements: string[];
  isChampion: boolean;
  role: 'user' | 'admin';
  transactions?: Transaction[];
  achievementsList?: Achievement[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string) => Promise<void>;
  googleLogin: (email: string, name: string, avatar: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  claimSandboxTokens: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('fifa_predictor_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      const profileData = await api.get<User>('/auth/profile');
      setUser(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      localStorage.setItem('fifa_predictor_token', data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string) => {
    setLoading(true);
    try {
      // Using a simplified registration without password for demo, or let's pass a standard password 'password123'
      const data = await api.post<{ token: string; user: User }>('/auth/register', { 
        username, 
        email, 
        password: 'password123' // default password for ease of registration in local tests
      });
      localStorage.setItem('fifa_predictor_token', data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (email: string, name: string, avatar: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: User }>('/auth/google', { email, name, avatar });
      localStorage.setItem('fifa_predictor_token', data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('fifa_predictor_token');
    setUser(null);
    router.push('/');
  };

  const refreshProfile = async () => {
    try {
      const profileData = await api.get<User>('/auth/profile');
      setUser(profileData);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const claimSandboxTokens = async (amount: number) => {
    try {
      const updatedProfile = await api.post<User>('/auth/sandbox', { amount });
      setUser(updatedProfile);
    } catch (error) {
      console.error('Error claiming sandbox tokens:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      googleLogin,
      logout,
      refreshProfile,
      claimSandboxTokens
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
