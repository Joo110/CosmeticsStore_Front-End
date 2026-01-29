import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../Services/authService';
import { handleApiError } from '../utils/api';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../../../types/auth.types';
import { AuthContext } from '../../../contexts/AuthContext';
import type { AuthContextType } from '../../../contexts/AuthContext';

// Utility to parse JWT
const parseJwt = (token: string | undefined) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Error parsing JWT', err);
    return null;
  }
};

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const context = useContext(AuthContext) as AuthContextType;
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const { currentUser, setCurrentUser, logout: contextLogout } = context;

  // Login
  const login = async (data: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await authService.login(data);

      // Extract roles from JWT
      const payload = parseJwt(resp.token);
      const roles: string[] = payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
        ? [payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']]
        : [];

      const userWithRoles = { ...resp, roles };

      setCurrentUser(userWithRoles);
      navigate('/profile');
      return true;
    } catch (err) {
      setError(handleApiError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register (if you also return token)
  const register = async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await authService.register(data);

      const payload = parseJwt(resp.token);
      const roles: string[] = payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
        ? [payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']]
        : [];

      const userWithRoles = { ...resp, roles };

      setCurrentUser(userWithRoles);
      navigate('/profile');
      return true;
    } catch (err) {
      setError(handleApiError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const forgotPassword = async (data: ForgotPasswordRequest) => {
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(data);
      return true;
    } catch (err) {
      setError(handleApiError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    contextLogout();
    navigate('/login');
  };

  return {
    login,
    register,
    forgotPassword,
    logout,
    loading,
    error,
    currentUser,
  };
};

// Hook for Profile Management
export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const getProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getProfile();
      setProfile(data);
      return data;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await authService.updateProfile(data);
      setProfile(updated);
      return true;
    } catch (err) {
      setError(handleApiError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    setLoading(true);
    setError(null);
    try {
      await authService.changePassword(data);
      return true;
    } catch (err) {
      setError(handleApiError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    getProfile,
    updateProfile,
    changePassword,
    loading,
    error,
  };
};
