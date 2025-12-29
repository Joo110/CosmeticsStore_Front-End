import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { RegisterRequest } from '../../../types/auth.types';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { register, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterRequest>({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Full name
    if (!formData.fullName.trim()) {
      errors.fullName = t('name_required', 'Name is required');
      toast.error(t('name_required', 'Name is required'));
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = t('name_min_length', 'Name must be at least 3 characters');
      toast.error(t('name_min_length', 'Name must be at least 3 characters'));
    }

    // Email
    if (!formData.email.trim()) {
      errors.email = t('email_required', 'Email is required');
      toast.error(t('email_required', 'Email is required'));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('email_format_invalid', 'Invalid email format');
      toast.error(t('email_format_invalid', 'Invalid email format'));
    }

    // Phone number
    const phone = formData.phoneNumber.replace(/\s/g, '');
    if (!phone) {
      errors.phoneNumber = t('mobile_required', 'Mobile number is required');
      toast.error(t('mobile_required', 'Mobile number is required'));
    } else if (!/^[0-9]{10,15}$/.test(phone)) {
      errors.phoneNumber = t('mobile_invalid', 'Invalid mobile number');
      toast.error(t('mobile_invalid', 'Invalid mobile number'));
    }

    // Password
    if (!formData.password) {
      errors.password = t('password_required', 'Password is required');
      toast.error(t('password_required', 'Password is required'));
    } else if (formData.password.length < 8) {
      errors.password = t('password_min_length', 'Password must be at least 8 characters');
      toast.error(t('password_min_length', 'Password must be at least 8 characters'));
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(formData.password)) {
      errors.password = t('password_complexity', 'Password must include uppercase, lowercase and number');
      toast.error(t('password_complexity', 'Password must include uppercase, lowercase and number'));
    }

    // Confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = t('confirm_password_required', 'Please confirm your password');
      toast.error(t('confirm_password_required', 'Please confirm your password'));
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('passwords_not_match', 'Passwords do not match');
      toast.error(t('passwords_not_match', 'Passwords do not match'));
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const result = await register(formData);
      if (result) {
        toast.success(t('account_created_success', 'Account created successfully 🎉'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('register_title', 'Create your account to get started.')}
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-2">
                {t('name', 'Name')}
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder={t('name', 'Name')}
                className={`w-full px-4 py-3 rounded-xl border ${
                  validationErrors.fullName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-200'
                } focus:outline-none focus:ring-2 transition-colors`}
              />
              {validationErrors.fullName && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.fullName}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                {t('email', 'Email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
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

            {/* Mobile Number Field */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900 mb-2">
                {t('mobile_number', 'Mobile Number')}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder={t('mobile_number', 'Mobile Number')}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    validationErrors.phoneNumber
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-purple-500 focus:ring-purple-200'
                  } focus:outline-none focus:ring-2 transition-colors`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {validationErrors.phoneNumber && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.phoneNumber}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                {t('password', 'Password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                {t('confirm_password', 'Confirm Password')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('confirm_password', 'Confirm Password')}
                className={`w-full px-4 py-3 rounded-xl border ${
                  validationErrors.confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-200'
                } focus:outline-none focus:ring-2 transition-colors`}
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Already have account */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('already_have_account', 'Already Have Account?')}{' '}
                <Link
                  to="/login"
                  className="text-[#5D2D2C] hover:text-purple-700 font-medium transition-colors"
                >
                  {t('log_in', 'Log in')}
                </Link>
              </p>
            </div>

            {/* Submit Button */}
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
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('creating_account', 'Creating account...')}
                </span>
              ) : (
                t('sign_up', 'Sign up')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;