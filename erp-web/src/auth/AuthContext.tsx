'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (err) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login({ email, password });
      const data = response.data as any;
      
      // Extract user info from response
      const userData: User = {
        id: data.user?.id || '',
        email: data.user?.email || email,
        name: data.user?.name || '',
        role: data.user?.role || 'user',
        isActive: data.user?.isActive ?? true,
        createdAt: data.user?.createdAt,
        updatedAt: data.user?.updatedAt,
      };

      localStorage.setItem('authToken', data.access_token || data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      const errorMessage = 
        (err as any)?.response?.data?.message || 
        (err instanceof Error ? err.message : 'Login failed');
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.register({ email, password, name });
      const data = response.data as any;
      
      // Validate response contains required fields
      if (!data.access_token || !data.user) {
        console.error('Invalid registration response:', data);
        throw new Error('Invalid server response - missing token or user data');
      }

      // Extract user info
      const userData: User = {
        id: data.user.id || '',
        email: data.user.email || email,
        name: data.user.name || name,
        role: data.user.role || 'user',
        isActive: data.user.isActive ?? true,
        createdAt: data.user.createdAt,
        updatedAt: data.user.updatedAt,
      };

      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      const errorMessage = 
        (err as any)?.response?.data?.message || 
        (err instanceof Error ? err.message : 'Registration failed');
      setError(errorMessage);
      console.error('Registration error:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
