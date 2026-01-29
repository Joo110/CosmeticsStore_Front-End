// src/Mycomponents/Users/hooks/useAuthService.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../Services/authService';
import { handleApiError } from '../../Users/utils/api';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
} from '../../../types/auth.types';
import { useAuthContext } from '../../../contexts/AuthContext';

export const useAuthService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, logout: contextLogout } = useAuthContext();

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

export default useAuthService;
