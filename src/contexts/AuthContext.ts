// src/contexts/AuthContext.ts
import { createContext, useContext } from 'react';
import type { AuthResponse } from '../types/auth.types';

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AuthResponse | null;
  loading: boolean;
  setCurrentUser: (user: AuthResponse | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access AuthContext from components
 * Use this everywhere instead of useContext(AuthContext)
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
