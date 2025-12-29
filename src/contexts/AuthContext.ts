import { createContext } from 'react';
import type { AuthResponse } from '../types/auth.types';

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AuthResponse | null;
  loading: boolean;
  setCurrentUser: (user: AuthResponse | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);