import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '../Mycomponents/Users/Services/authService';
import type { AuthResponse } from '../types/auth.types';

// أضفنا export هنا
export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AuthResponse | null;
  loading: boolean;
  setCurrentUser: (user: AuthResponse | null) => void;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = () => {
      try {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error checking auth:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const value: AuthContextType = {
    isAuthenticated: !!currentUser,
    currentUser,
    loading,
    setCurrentUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
