import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import type { ForgotPasswordRequest } from '../../../types/auth.types';

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const BLOCKED_DOMAINS = ['example.com', 'test.com', 'mailinator.com', 'tempmail.com'];

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const { forgotPassword, loading, error } = useAuth();

  const [formData, setFormData] = useState<ForgotPasswordRequest>({
    email: '',
  });

  const [success, setSuccess] = useState(false);
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

    if (!email) {
      errors.email = t('email_required', 'Email is required');
    } else if (email.length < 6 || email.length > 254) {
      errors.email = t('email_length_invalid', 'Email length is invalid');
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = t('email_invalid', 'Please enter a valid email address');
    } else {
      const domain = email.split('@')[1]?.toLowerCase();
      if (domain && BLOCKED_DOMAINS.includes(domain)) {
        errors.email = t('temp_email_not_allowed', 'Temporary email addresses are not allowed');
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await forgotPassword({ email: formData.email.trim() });

    if (result) {
      toast.success(t('reset_link_sent', 'Password reset link sent to your email'));
      setSuccess(true);
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
          {!success ? (
            <>
              <div className="mb-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {t('forgot_password_title', 'Forgot Password?')}
                </h1>
                <p className="text-gray-600 text-sm">
                  {t('forgot_password_subtitle', 'No worries, we\'ll send you reset instructions')}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    {t('email', 'Email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('enter_email', 'Enter your email')}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      validationErrors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:border-purple-500 focus:ring-purple-200'
                    } focus:outline-none focus:ring-2 transition-colors`}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.email}
                    </p>
                  )}
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
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t('sending', 'Sending...')}
                    </span>
                  ) : (
                    t('reset_password', 'Reset Password')
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    {t('back_to_login', 'Back to Log in')}
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2"
                  />
                </svg>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {t('check_email', 'Check your email')}
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {t('reset_link_sent_to', 'We sent a password reset link to')}
                <br />
                <span className="font-medium text-gray-900 break-all">
                  {formData.email}
                </span>
              </p>

              <Link
                to="/login"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('back_to_login', 'Back to Log in')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;