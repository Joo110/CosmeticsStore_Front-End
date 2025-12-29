import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import type { LoginRequest } from '../../../types/auth.types';

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, loading, error } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      errors.email = t('email_required', 'Email is required');
    } else if (email.length < 6 || email.length > 254) {
      errors.email = t('email_length_invalid', 'Email length is invalid');
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = t('email_invalid', 'Please enter a valid email address');
    }

    if (!password) {
      errors.password = t('password_required', 'Password is required');
    } else if (password.length < 8) {
      errors.password = t('password_min_length', 'Password must be at least 8 characters');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await login({
      email: formData.email.trim(),
      password: formData.password,
    });

    if (result) {
      toast.success(t('logged_in_success', 'Logged in successfully'));
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4 py-6 sm:p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {t('welcome_back', 'Welcome back')}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {t('login_subtitle', 'Please enter your details to sign in')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                {t('email', 'Email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('email', 'Email')}
                className={`w-full px-4 py-3 rounded-xl border ${
                  validationErrors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-200'
                } focus:outline-none focus:ring-2 transition-colors`}
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                {t('password', 'Password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('password', 'Password')}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    validationErrors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-purple-500 focus:ring-purple-200'
                  } focus:outline-none focus:ring-2 transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-600">{t('remember_me', 'Remember me')}</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-[#5D2D2C] hover:text-purple-700 font-medium transition-colors"
              >
                {t('forgot_password', 'Forgot Password?')}
              </Link>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('no_account', 'Don\'t Have Account?')}{' '}
                <Link
                  to="/register"
                  className="text-[#5D2D2C] hover:text-purple-700 font-medium transition-colors"
                >
                  {t('sign_up', 'Sign up')}
                </Link>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5D2D2C] hover:bg-[#4e2524] text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('signing_in', 'Signing in...')}
                </span>
              ) : (
                t('log_in', 'Log in')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;