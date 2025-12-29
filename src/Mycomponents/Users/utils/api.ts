import axios from 'axios';
import type { AxiosError, AxiosInstance } from 'axios';
import type { ApiError } from '../../../types/auth.types';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://localhost:7079/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token from cookies
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken'); // Get token from cookies
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
  console.warn('401 – not authenticated, staying on page');
}
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    if (apiError?.message) {
      return apiError.message;
    }
    if (apiError?.errors) {
      const firstError = Object.values(apiError.errors)[0];
      return firstError?.[0] || 'An error occurred';
    }
    return error.message || 'Network error';
  }
  return 'An unexpected error occurred';
};

// Helper function to save token to cookies
export const saveTokenToCookies = (token: string, user?: unknown) => {
  Cookies.set('authToken', token, { expires: 7 }); // expires in 7 days
  if (user) {
    Cookies.set('user', JSON.stringify(user), { expires: 7 });
  }
};

export default api;
