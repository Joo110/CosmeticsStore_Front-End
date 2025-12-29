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
import { AuthContext } from '../../../contexts/AuthProvider';
import type { AuthContextType } from '../../../contexts/AuthContext';

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
      const response = await authService.login(data);
      setCurrentUser(response);
      navigate('/profile');
      return true;
    } catch (err) {
      setError(handleApiError(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      setCurrentUser(response);
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

  // Get Profile
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

  // Update Profile
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

  // Change Password
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
