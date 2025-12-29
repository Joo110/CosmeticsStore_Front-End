import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, TrendingUp, Calendar, Search, X, FileText, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePayments } from '../../payment/hooks/usePayments';
import type { PaymentDto } from '../../../types/payment.types';

const PaymentsManagement: React.FC = () => {
  const { t, i18n } = useTranslation();

  const {
    payments,
    loading,
    error,
    pageIndex,
    pageSize,
    totalPages,
    totalCount,
    getPayment,
    setFilters,
    setPage,
    setPageSize,
  } = usePayments(10);


  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentDto | null>(null);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  
  const visiblePageCount = 5;

  useEffect(() => {
    const dir = (i18n.language || '').startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
  }, [i18n.language]);

  const handleViewPayment = async (paymentId: string) => {
    setPaymentDetailsLoading(true);
    try {
      const payment = await getPayment(paymentId);
      if (payment) {
        setSelectedPayment(payment);
      }
    } catch (err) {
      console.error('Failed to fetch payment details:', err);
    } finally {
      setPaymentDetailsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters({
      status: statusFilter || undefined,
      provider: providerFilter || undefined,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setProviderFilter('');
    setFilters({});
  };

  // Filter payments locally by search term
  const filteredPayments = searchTerm.trim()
    ? payments.filter(
        (p) =>
          p.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.provider?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : payments;

  // Statistics - based on all payments
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedPayments = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayments = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (p.amount || 0), 0);
  const failedPayments = payments.filter(p => p.status === 'Failed').reduce((sum, p) => sum + (p.amount || 0), 0);

  const completedCount = payments.filter(p => p.status === 'Completed').length;
  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const failedCount = payments.filter(p => p.status === 'Failed').length;

  // Pagination computation
  const half = Math.floor(visiblePageCount / 2);
  let startPage = Math.max(1, pageIndex - half);
  const endPage = Math.min(totalPages, startPage + visiblePageCount - 1);
  if (endPage - startPage + 1 < visiblePageCount) {
    startPage = Math.max(1, endPage - visiblePageCount + 1);
  }
  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method?: string) => {
    if (!method) return <DollarSign size={16} className="text-gray-400" />;
    
    if (method.toLowerCase().includes('card') || method.toLowerCase().includes('stripe')) {
      return <CreditCard size={16} className="text-blue-500" />;
    } else if (method.toLowerCase().includes('paypal')) {
      return <DollarSign size={16} className="text-blue-600" />;
    } else if (method.toLowerCase().includes('cash')) {
      return <DollarSign size={16} className="text-green-600" />;
    } else {
      return <DollarSign size={16} className="text-purple-600" />;
    }
  };

  // Payment Details Modal
  if (selectedPayment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{t('payment_details', 'Payment Details')}</h2>
              <p className="text-sm text-gray-500">{t('payment_id_label', 'Payment ID')}: {selectedPayment.paymentId}</p>
            </div>
            <button
              onClick={() => setSelectedPayment(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={t('close', 'Close')}
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                {t(`status_${selectedPayment.status.toLowerCase()}`, selectedPayment.status)}
              </span>
            </div>

            {/* Payment Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('payment_amount', 'Payment Amount')}</h3>
                </div>
                <div className="text-2xl font-bold text-[#5D2D2C]">
                  {selectedPayment.amount?.toFixed(2) || '0.00'} SAR
                </div>
              </div>

              {/* Payment Provider */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('payment_method', 'Payment Method')}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {getMethodIcon(selectedPayment.provider)}
                  <span className="text-sm font-medium">{selectedPayment.provider || t('na', 'N/A')}</span>
                </div>
              </div>

              {/* Order Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('order_information', 'Order Information')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">{t('order_id_label', 'Order ID')}:</span>
                    <span className="ml-2 font-medium">{selectedPayment.orderId || t('na', 'N/A')}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('transaction_id', 'Transaction ID')}</h3>
                </div>
                <div className="text-sm break-all">
                  <span className="font-mono text-gray-700">
                    {selectedPayment.transactionId || t('na', 'N/A')}
                  </span>
                </div>
              </div>

              {/* Payment Dates */}
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('timeline', 'Timeline')}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t('created', 'Created')}:</span>
                    <span className="ml-2 font-medium">
                      {selectedPayment.createdAtUtc ? new Date(selectedPayment.createdAtUtc).toLocaleString() : t('na', 'N/A')}
                    </span>
                  </div>
                  {selectedPayment.modifiedAtUtc && (
                    <div>
                      <span className="text-gray-600">{t('last_updated', 'Last Updated')}:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedPayment.modifiedAtUtc).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('close', 'Close')}
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
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{t('payments_management', 'Payments Management')}</h2>
        <p className="text-gray-600 text-sm">{t('payments_description', 'Track and manage all payment transactions')}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Payments */}
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4" style={{ borderColor: '#5D2D2C' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(93, 45, 44, 0.1)' }}>
              <TrendingUp size={24} style={{ color: '#5D2D2C' }} />
            </div>
            <span className="text-xs text-gray-500 font-medium">{t('transactions_count', '{{count}} transactions', { count: totalCount })}</span>
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-1">{t('total_payments', 'Total Payments')}</h3>
          <p className="text-2xl font-bold" style={{ color: '#5D2D2C' }}>
            {totalAmount.toLocaleString()} <span className="text-sm text-gray-500">SAR</span>
          </p>
        </div>

        {/* Completed Payments */}
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">{completedCount} {t('completed', 'completed')}</span>
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-1">{t('completed', 'Completed')}</h3>
          <p className="text-2xl font-bold text-green-600">
            {completedPayments.toLocaleString()} <span className="text-sm text-gray-500">SAR</span>
          </p>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Calendar size={24} className="text-yellow-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">{pendingCount} {t('pending', 'pending')}</span>
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-1">{t('pending', 'Pending')}</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {pendingPayments.toLocaleString()} <span className="text-sm text-gray-500">SAR</span>
          </p>
        </div>

        {/* Failed Payments */}
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <DollarSign size={24} className="text-red-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">{failedCount} {t('failed', 'failed')}</span>
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-1">{t('failed', 'Failed')}</h3>
          <p className="text-2xl font-bold text-red-600">
            {failedPayments.toLocaleString()} <span className="text-sm text-gray-500">SAR</span>
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('search_placeholder_payments', 'Search by payment ID, order ID, status, or provider...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D2D2C] focus:border-transparent"
            />
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D2D2C] focus:border-transparent"
          >
            <option value="">{t('all_statuses', 'All Statuses')}</option>
            <option value="Completed">{t('completed', 'Completed')}</option>
            <option value="Pending">{t('pending', 'Pending')}</option>
            <option value="Failed">{t('failed', 'Failed')}</option>
          </select>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D2D2C] focus:border-transparent"
          >
            <option value="">{t('all_methods', 'All Methods')}</option>
            <option value="Stripe">{t('credit_card', 'Credit Card')}</option>
            <option value="PayPal">{t('paypal', 'PayPal')}</option>
            <option value="Cash">{t('cash_on_delivery', 'Cash on Delivery')}</option>
          </select>

          <button
            onClick={handleApplyFilters}
            className="px-6 py-3 bg-[#5D2D2C] text-white rounded-lg hover:bg-[#4a2321] transition-colors whitespace-nowrap"
          >
            {t('apply_filters', 'Apply Filters')}
          </button>

          {(statusFilter || providerFilter) && (
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
      {loading && !paymentDetailsLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D2D2C]"></div>
        </div>
      )}

      {/* Payments Table */}
      {!loading && (
        <>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('table_payment_id', 'Payment ID')}
                    </th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('table_order_id', 'Order ID')}
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('table_amount', 'Amount')}
                    </th>
                    <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('table_method', 'Method')}
                    </th>
                    <th className="hidden xl:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('table_date', 'Date')}
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t('table_status', 'Status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr 
                      key={payment.paymentId} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewPayment(payment.paymentId)}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{payment.paymentId.slice(0, 8)}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {payment.orderId ? `#${payment.orderId.slice(0, 8)}` : t('na', 'N/A')}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {payment.amount?.toLocaleString() || '0'} <span className="text-xs text-gray-500 font-normal">SAR</span>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getMethodIcon(payment.provider)}
                          <span className="text-sm text-gray-600">{payment.provider || t('na', 'N/A')}</span>
                        </div>
                      </td>
                      <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={14} />
                          {payment.createdAtUtc ? new Date(payment.createdAtUtc).toLocaleDateString() : t('na', 'N/A')}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {t(`status_${payment.status.toLowerCase()}`, payment.status)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                        {t('no_payments_found', 'No payments found.')}
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
                {totalCount === 0 ? '0' : `${(pageIndex - 1) * pageSize + 1} - ${Math.min(pageIndex * pageSize, totalCount)} of ${totalCount}`}
              </div>

              <nav className="inline-flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, pageIndex - 1))}
                  disabled={pageIndex === 1}
                  className={`px-3 py-1 rounded border ${pageIndex === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
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
                    className={`px-3 py-1 rounded border ${num === pageIndex ? 'bg-[#5D2D2C] text-white' : 'hover:bg-gray-100'}`}
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
                  disabled={pageIndex === totalPages}
                  className={`px-3 py-1 rounded border ${pageIndex === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                >
                  {t('next', 'Next')}
                </button>
              </nav>
            </div>
          </div>

          {/* Summary Footer */}
          {payments.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t('success_rate', 'Success Rate')}</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">
                    {payments.length > 0 ? ((completedCount / payments.length) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t('avg_payment', 'Avg. Payment')}</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">
                    {payments.length > 0 ? Math.round(totalAmount / payments.length).toLocaleString() : '0'} SAR
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t('largest', 'Largest')}</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-600">
                    {payments.length > 0 ? Math.max(...payments.map(p => p.amount || 0)).toLocaleString() : '0'} SAR
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t('total_amount', 'Total Amount')}</p>
                  <p className="text-lg sm:text-xl font-bold" style={{ color: '#5D2D2C' }}>
                    {totalAmount.toLocaleString()} SAR
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

export default PaymentsManagement;