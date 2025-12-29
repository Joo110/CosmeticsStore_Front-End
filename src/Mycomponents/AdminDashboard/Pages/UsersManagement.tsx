import React, { useState } from 'react';
import { Trash2, Edit2, Mail, Calendar, Shield, User, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUsers } from '../../Users/hooks/useUsers';
import type { UserDto } from '../../../types/user.types';

const UsersManagement: React.FC = () => {
  const { t } = useTranslation();
  
  const {
    users,
    loading,
    error,
    pageIndex,
    pageSize,
    getUser,
    deleteUser,
    setFilters,
    setPage,
    setPageSize,
  } = useUsers(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  
  const visiblePageCount = 5;

  const handleDeleteUser = async (id: string) => {
    if (window.confirm(t('confirm_delete_user', 'Are you sure you want to delete this user?'))) {
      try {
        await deleteUser(id);
      } catch (err) {
        console.error('Failed to delete user:', err);
      }
    }
  };

  const handleViewUser = async (userId: string) => {
    setUserDetailsLoading(true);
    try {
      const user = await getUser(userId);
      if (user) {
        setSelectedUser(user);
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters({
      searchTerm: searchTerm || undefined,
      role: roleFilter || undefined,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setFilters({});
  };

  // Filter users locally by search term
  const filteredUsers = searchTerm.trim()
    ? users.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.roles?.includes(searchTerm.toLowerCase())
      )
    : users;

  // Statistics - based on all users
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.roles?.includes('Admin')).length;
  const customerUsers = users.filter(u => u.roles?.includes('Customer')).length;

  // For pagination display
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages);

  // Compute page numbers to display (centered window)
  const half = Math.floor(visiblePageCount / 2);
  let startPage = Math.max(1, currentPage - half);
  const endPage = Math.min(totalPages, startPage + visiblePageCount - 1);
  if (endPage - startPage + 1 < visiblePageCount) {
    startPage = Math.max(1, endPage - visiblePageCount + 1);
  }
  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-green-400 to-green-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600'
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const getUserDisplayName = (user: UserDto) => {
    if (user.fullName) {
      return user.fullName;
    }
    return user.email || t('unknown_user', 'Unknown User');
  };

  // User Details Modal
  if (selectedUser) {
    const displayName = getUserDisplayName(selectedUser);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getAvatarColor(displayName)} flex items-center justify-center text-white font-bold text-2xl`}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Role Badge */}
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold rounded-full ${
                selectedUser.roles?.includes('Admin') 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {selectedUser.roles?.includes('Admin') ? <Shield size={16} /> : <User size={16} />}
                {selectedUser.roles?.includes('Admin') ? t('role_admin', 'Admin') : t('role_customer', 'Customer')}
              </span>
            </div>

            {/* User Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <User className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('personal_information', 'Personal Information')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">{t('username', 'Username')}:</span>
                    <span className="ml-2 font-medium">{selectedUser.fullName || t('not_available', 'N/A')}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('contact_information', 'Contact Information')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">{t('email', 'Email')}:</span>
                    <span className="ml-2 font-medium break-all">{selectedUser.email || t('not_available', 'N/A')}</span>
                  </div>
                  {selectedUser.phoneNumber && (
                    <div>
                      <span className="text-gray-600">{t('phone', 'Phone')}:</span>
                      <span className="ml-2 font-medium">{selectedUser.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('account_timeline', 'Account Timeline')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">{t('created', 'Created')}:</span>
                    <span className="ml-2 font-medium">
                      {selectedUser.createdAtUtc ? new Date(selectedUser.createdAtUtc).toLocaleString() : t('not_available', 'N/A')}
                    </span>
                  </div>
                  {selectedUser.modifiedAtUtc && (
                    <div>
                      <span className="text-gray-600">{t('last_updated', 'Last Updated')}:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedUser.modifiedAtUtc).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('close', 'Close')}
              </button>
              <button
                onClick={() => {
                  handleDeleteUser(selectedUser.userId);
                  setSelectedUser(null);
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                {t('delete_user', 'Delete User')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{t('users_management', 'Users Management')}</h2>
          <p className="text-gray-600 text-sm">{t('manage_monitor_users', 'Manage and monitor all user accounts')}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 border-l-4" style={{ borderColor: '#5D2D2C' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(93, 45, 44, 0.1)' }}>
              <User size={20} style={{ color: '#5D2D2C' }} />
            </div>
          </div>
          <h3 className="text-xs text-gray-600 font-medium mb-1">{t('total_users', 'Total Users')}</h3>
          <p className="text-xl sm:text-2xl font-bold" style={{ color: '#5D2D2C' }}>
            {totalUsers}
          </p>
        </div>

        {/* Admins */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Shield size={20} className="text-purple-600" />
            </div>
          </div>
          <h3 className="text-xs text-gray-600 font-medium mb-1">{t('admins', 'Admins')}</h3>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">
            {adminUsers}
          </p>
        </div>

        {/* Customers */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 border-l-4 border-blue-500 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User size={20} className="text-blue-600" />
            </div>
          </div>
          <h3 className="text-xs text-gray-600 font-medium mb-1">{t('customers', 'Customers')}</h3>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">
            {customerUsers}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('search_users_placeholder', 'Search users by name, email, or username...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D2D2C] focus:border-transparent"
            />
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D2D2C] focus:border-transparent"
          >
            <option value="">{t('all_roles', 'All Roles')}</option>
            <option value="Admin">{t('role_admin', 'Admin')}</option>
            <option value="Customer">{t('role_customer', 'Customer')}</option>
          </select>

          <button
            onClick={handleApplyFilters}
            className="px-6 py-3 bg-[#5D2D2C] text-white rounded-lg hover:bg-[#4a2321] transition-colors whitespace-nowrap"
          >
            {t('apply_filters', 'Apply Filters')}
          </button>

          {(searchTerm || roleFilter) && (
            <button
              onClick={handleClearFilters}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              {t('clear', 'Clear')}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !userDetailsLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D2D2C]"></div>
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('user', 'User')}
                    </th>
                    <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('email', 'Email')}
                    </th>
                    <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('role', 'Role')}
                    </th>
                    <th className="hidden xl:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('joined_date', 'Joined Date')}
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const displayName = getUserDisplayName(user);
                    
                    return (
                      <tr 
                        key={user.userId} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleViewUser(user.userId)}
                      >
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getAvatarColor(displayName)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                                {displayName}
                              </div>
                              <div className="text-xs text-gray-500 md:hidden truncate max-w-[120px]">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400 flex-shrink-0" />
                            <div className="text-sm text-gray-600 truncate max-w-[200px]">{user.email}</div>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex items-center gap-2 text-xs font-medium rounded-full ${
                              user.roles?.includes('Admin')
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {user.roles?.includes('Admin') ? (
                              <Shield size={12} />
                            ) : (
                              <User size={12} />
                            )}
                            {user.roles?.join(', ')}
                          </span>
                        </td>
                        <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar size={14} />
                            {user.createdAtUtc ? new Date(user.createdAtUtc).toLocaleDateString() : t('not_available', 'N/A')}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Edit functionality can be added here
                              }}
                              className="text-blue-600 hover:text-blue-900 transition"
                              title={t('edit_user', 'Edit User')}
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user.userId);
                              }}
                              className="text-red-600 hover:text-red-900 transition"
                              title={t('delete_user', 'Delete User')}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        {t('no_users_found', 'No users found.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t('rows_per_page', 'Rows per page:')}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-3 py-2 border rounded bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="text-sm text-gray-600">
                {filteredUsers.length === 0 ? '0' : `${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filteredUsers.length)} ${t('of', 'of')} ${filteredUsers.length}`}
              </div>

              <nav className="inline-flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, pageIndex - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                >
                  {t('prev', 'Prev')}
                </button>

                {pageNumbers[0] > 1 && (
                  <>
                    <button onClick={() => setPage(1)} className="px-3 py-1 rounded border hover:bg-gray-100">1</button>
                    {pageNumbers[0] > 2 && <span className="px-2">…</span>}
                  </>
                )}

                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`px-3 py-1 rounded border ${num === currentPage ? 'bg-[#5D2D2C] text-white' : 'hover:bg-gray-100'}`}
                  >
                    {num}
                  </button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-2">…</span>}
                    <button onClick={() => setPage(totalPages)} className="px-3 py-1 rounded border hover:bg-gray-100">{totalPages}</button>
                  </>
                )}

                <button
                  onClick={() => setPage(Math.min(totalPages, pageIndex + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                >
                  {t('next', 'Next')}
                </button>
              </nav>
            </div>
          </div>

          {/* Summary Footer */}
          {users.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t('admin_ratio', 'Admin Ratio')}</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-600">
                    {totalUsers > 0 ? ((adminUsers / totalUsers) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t('customer_ratio', 'Customer Ratio')}</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">
                    {totalUsers > 0 ? ((customerUsers / totalUsers) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-600 mb-1">{t('total_users', 'Total Users')}</p>
                  <p className="text-lg sm:text-xl font-bold" style={{ color: '#5D2D2C' }}>
                    {totalUsers}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsersManagement;