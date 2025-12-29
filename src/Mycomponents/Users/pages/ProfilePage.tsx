import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import type { UpdateProfileRequest, ChangePasswordRequest } from '../../../types/auth.types';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { profile, getProfile, updateProfile, changePassword, loading, error } = useProfile();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [profileData, setProfileData] = useState<UpdateProfileRequest>({
    fullName: profile?.fullName || '',
    phoneNumber: profile?.phoneNumber || '',
  });

  const isAdmin = () => {
    return profile?.roles?.includes('Admin') || currentUser?.roles?.includes('Admin');
  };

  useEffect(() => {
    getProfile();
  }, []);

  useEffect(() => {
    if (profile && !editMode) {
      setProfileData({
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
      });
    }
  }, [profile, editMode]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfileForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profileData.fullName.trim()) {
      errors.fullName = t('name_required', 'Name is required');
      toast.error(t('name_required', 'Name is required'));
    }

    if (!profileData.phoneNumber.trim()) {
      errors.phoneNumber = t('phone_required', 'Phone number is required');
      toast.error(t('phone_required', 'Phone number is required'));
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = t('current_password_required', 'Current password is required');
      toast.error(t('current_password_required', 'Current password is required'));
    }

    if (!passwordData.newPassword) {
      errors.newPassword = t('new_password_required', 'New password is required');
      toast.error(t('new_password_required', 'New password is required'));
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = t('password_min_length', 'Password must be at least 8 characters');
      toast.error(t('password_min_length', 'Password must be at least 8 characters'));
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = t('confirm_password_required', 'Please confirm your password');
      toast.error(t('confirm_password_required', 'Please confirm your password'));
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('passwords_not_match', 'Passwords do not match');
      toast.error(t('passwords_not_match', 'Passwords do not match'));
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateProfileForm()) {
      const result = await updateProfile(profileData);
      if (result) {
        toast.success(t('profile_updated_success', 'Profile updated successfully'));
        setSuccessMessage(t('profile_updated_success', 'Profile updated successfully!'));
        setEditMode(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validatePasswordForm()) {
      const result = await changePassword(passwordData);
      if (result) {
        toast.success(t('password_changed_success', 'Password changed successfully'));
        setSuccessMessage(t('password_changed_success', 'Password changed successfully!'));
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 md:py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 text-center sm:text-left w-full sm:w-auto">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-r from-purple-900 to-purple-700 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
                {currentUser?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {currentUser?.fullName || t('user', 'User')}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 truncate">{currentUser?.email}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {isAdmin() && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-[#5D2D2C] hover:bg-[#4e2524] text-white rounded-xl font-medium transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <Shield size={18} />
                  {t('admin_dashboard', 'Admin Dashboard')}
                </button>
              )}
              <button
                onClick={logout}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-medium transition-all duration-200 text-sm sm:text-base"
              >
                {t('logout', 'Logout')}
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs sm:text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs sm:text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('profile');
                setValidationErrors({});
              }}
              className={`flex-1 px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center font-medium transition-colors text-xs sm:text-sm md:text-base ${
                activeTab === 'profile'
                  ? 'text-[#5D2D2C] border-b-2 border-[#5D2D2C]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('profile_info', 'Profile Info')}
            </button>
            <button
              onClick={() => {
                setActiveTab('password');
                setValidationErrors({});
              }}
              className={`flex-1 px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center font-medium transition-colors text-xs sm:text-sm md:text-base ${
                activeTab === 'password'
                  ? 'text-[#5D2D2C] border-b-2 border-[#5D2D2C]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('change_password', 'Change Password')}
            </button>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">{t('full_name', 'Full Name')}</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    disabled={!editMode}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border text-sm sm:text-base ${
                      validationErrors.fullName
                        ? 'border-red-300'
                        : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-colors ${
                      !editMode ? 'bg-gray-50' : ''
                    }`}
                  />
                  {validationErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">{t('email', 'Email')}</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm sm:text-base"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('email_cannot_change', 'Email cannot be changed')}</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">{t('phone_number', 'Phone Number')}</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleProfileChange}
                    disabled={!editMode}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border text-sm sm:text-base ${
                      validationErrors.phoneNumber
                        ? 'border-red-300'
                        : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-colors ${
                      !editMode ? 'bg-gray-50' : ''
                    }`}
                  />
                  {validationErrors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.phoneNumber}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                  {!editMode ? (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="w-full bg-[#5D2D2C] hover:bg-[#4e2524] text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      {t('edit_profile', 'Edit Profile')}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          setProfileData({
                            fullName: profile?.fullName || '',
                            phoneNumber: profile?.phoneNumber || '',
                          });
                          setValidationErrors({});
                        }}
                        className="w-full sm:flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 text-sm sm:text-base"
                      >
                        {t('cancel', 'Cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:flex-1 bg-[#5D2D2C] hover:bg-[#4e2524] text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 text-sm sm:text-base"
                      >
                        {loading ? t('saving', 'Saving...') : t('save_changes', 'Save Changes')}
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                    {t('current_password', 'Current Password')}
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border text-sm sm:text-base ${
                      validationErrors.currentPassword
                        ? 'border-red-300'
                        : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-colors`}
                  />
                  {validationErrors.currentPassword && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">{t('new_password', 'New Password')}</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border text-sm sm:text-base ${
                      validationErrors.newPassword
                        ? 'border-red-300'
                        : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-colors`}
                  />
                  {validationErrors.newPassword && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                    {t('confirm_new_password', 'Confirm New Password')}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border text-sm sm:text-base ${
                      validationErrors.confirmPassword
                        ? 'border-red-300'
                        : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-colors`}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5D2D2C] hover:bg-[#4e2524] text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? t('changing_password', 'Changing Password...') : t('change_password', 'Change Password')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;