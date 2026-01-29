import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trash2, Search, X, Package, Calendar, User, DollarSign, FileText, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOrders } from '../../orders/hook/useOrders';
import { useProducts } from '../../Products/hooks/useProducts';
import { useUsers } from '../../Users/hooks/useUsers';
import type { OrderDto } from '../../../types/order.types';


    /* eslint-disable @typescript-eslint/no-explicit-any */

const OrdersManagement: React.FC = () => {
  const { t, i18n } = useTranslation();

  const {
    orders,
    loading,
    error,
    pageIndex,
    pageSize,
    totalPages,
    totalCount,
    getOrder,
    deleteOrder,
    setPage,
    setSize,
    setFilters,
  } = useOrders(10);

  const { products } = useProducts();
  const { users, fetchUsers } = useUsers(1000);

  // build productMap and userMap via useMemo to avoid extra renders
  const productMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!products || products.length === 0) return map;
    for (const product of products) {
      product.variants?.forEach((variant) => {
        if (variant.productVariantId) {
          map.set(variant.productVariantId, product.name);
        }
      });
    }
    return map;
  }, [products]);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!users || users.length === 0) return map;
    for (const u of users) {
      const display = u.fullName && u.fullName.trim().length > 0 ? u.fullName : (u.email || u.userId);
      if (u.userId) map.set(u.userId, display);
    }
    return map;
  }, [users]);

  // fetch users once (fetchUsers assumed stable from hook)
  useEffect(() => {
    // avoid unhandled promise rejection
    void (async () => {
      try {
        await fetchUsers({ pageIndex: 1, pageSize: 1000 });
      } catch {
        // ignore fetch errors here (original logic did same)
      }
    })();
  }, [fetchUsers]);

  // Helpers آمنين للتعامل مع قيم ممكن تكون undefined/null
  const safeStr = useCallback((s?: string | null) => (s ?? ''), []);
  const safeLower = useCallback((s?: string | null) => (s ?? '').toLowerCase(), []);

  const getProductName = useCallback(
    (productVariantId?: string | null): string => {
      if (!productVariantId) return t('na', 'N/A');
      return productMap.get(productVariantId) || productVariantId;
    },
    [productMap, t]
  );

  const getUserName = useCallback(
    (userId?: string | null): string => {
      if (!userId) return t('na', 'N/A');
      return userMap.get(userId) || userId;
    },
    [userMap, t]
  );

  const getStatusLabel = useCallback(
    (status?: string | null) => {
      const key = `status_${safeLower(status || 'unknown')}`;
      const defaultText = status ?? t('na', 'N/A');
      return t(key, defaultText);
    },
    [safeLower, t]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);

  // set document dir
  useEffect(() => {
    const dir = (i18n.language || '').startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
  }, [i18n.language]);

  // stable handlers
  const handleDeleteOrder = useCallback(
    async (id?: string) => {
      if (!id) return;
      const display = getUserName(orders.find(o => o.orderId === id)?.userId) || id;
      if (window.confirm(t('confirm_delete_order_with_customer', 'Are you sure you want to delete order {{id}} (customer: {{customer}})?', { id: id.slice(0, 8), customer: display }))) {
        try {
          await deleteOrder(id);
        } catch (err) {
          console.error('Failed to delete order:', err);
        }
      }
    },
    [deleteOrder, getUserName, orders, t]
  );

  const handleViewOrder = useCallback(
    async (orderId?: string) => {
      if (!orderId) return;
      setOrderDetailsLoading(true);
      try {
        const order = await getOrder(orderId);
        if (order) setSelectedOrder(order);
      } catch (err) {
        console.error('Failed to fetch order details:', err);
      } finally {
        setOrderDetailsLoading(false);
      }
    },
    [getOrder]
  );

  const handleSearch = useCallback(() => {
    setFilters({ status: statusFilter || undefined });
  }, [setFilters, statusFilter]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setFilters({});
  }, [setFilters]);

  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // useDeferredValue-like behaviour: avoid heavy work while typing by memoizing filtered result
  const deferredSearch = searchTerm.trim();

  const filteredOrders = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    const filterByTerm = (o: OrderDto) => {
      if (!term) return true;
      const matchesId = safeStr(o.orderId).toLowerCase().includes(term);
      const matchesUser = o.userId ? getUserName(o.userId).toLowerCase().includes(term) : false;
      const matchesStatus = safeStr(o.status).toLowerCase().includes(term);
      return matchesId || matchesUser || matchesStatus;
    };

    const statusFiltered = statusFilter ? orders.filter(o => (o.status || '') === statusFilter) : orders;
    return statusFiltered.filter(filterByTerm);
  }, [orders, deferredSearch, statusFilter, getUserName, safeStr]);

  // pagination numbers memoized
  const pageNumbers = useMemo(() => {
    const visiblePageCount = 5;
    const half = Math.floor(visiblePageCount / 2);
    let startPage = Math.max(1, pageIndex - half);
    const endPage = Math.min(totalPages, startPage + visiblePageCount - 1);
    if (endPage - startPage + 1 < visiblePageCount) {
      startPage = Math.max(1, endPage - visiblePageCount + 1);
    }
    const nums: number[] = [];
    for (let i = startPage; i <= endPage; i++) nums.push(i);
    return nums;
  }, [pageIndex, totalPages]);

  // Row click handler (stable ref) - read data attribute
  const handleRowClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget as HTMLElement;
    const id = target.getAttribute('data-orderid') || undefined;
    if (id) handleViewOrder(id);
  }, [handleViewOrder]);

  // Delete button handler for row (stable ref)
  const handleDeleteButtonClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const id = target.getAttribute('data-orderid') || undefined;
    if (id) void handleDeleteOrder(id);
  }, [handleDeleteOrder]);

  // Actions in order details modal
  const handleDeleteSelectedOrder = useCallback(async () => {
    if (!selectedOrder?.orderId) return;
    await handleDeleteOrder(selectedOrder.orderId);
    setSelectedOrder(null);
  }, [handleDeleteOrder, selectedOrder]);

  // Render order details modal if selectedOrder
  if (selectedOrder) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={t('back', 'Back')}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{t('order_details', 'Order Details')}</h2>
                <p className="text-sm text-gray-500">{t('order_id_label', 'Order ID')}: {selectedOrder.orderId ?? t('na','N/A')}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
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
              <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                selectedOrder.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : selectedOrder.status === 'Pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : selectedOrder.status === 'Cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {getStatusLabel(selectedOrder.status)}
              </span>
            </div>

            {/* Order Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <User className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('customer_information', 'Customer Information')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">{t('name_label', 'Name')}:</span>
                    <span className="ml-2 font-medium">{getUserName(selectedOrder.userId) || t('na', 'N/A')}</span>
                  </div>

                  {/* ===== ADDED: show shippingAddress under the Name (only in modal) ===== */}
                  <div>
                    <span className="text-gray-600">{t('address_label', 'Address')}:</span>
                    <span className="ml-2 font-medium">{safeStr((selectedOrder as any).shippingAddress) || t('na', 'N/A')}</span>
                  </div>
                  {/* =================================================================== */}

                  <div>
                    <span className="text-gray-600">{t('user_id_label', 'User ID')}:</span>
                    <span className="ml-2 font-medium text-xs text-gray-500">{selectedOrder.userId ?? t('na', 'N/A')}</span>
                  </div>
                </div>
              </div>

              {/* Order Dates */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('order_timeline', 'Order Timeline')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">{t('created_label', 'Created')}:</span>
                    <span className="ml-2 font-medium">
                      {selectedOrder.createdAtUtc ? new Date(selectedOrder.createdAtUtc).toLocaleString() : t('na', 'N/A')}
                    </span>
                  </div>
                  {selectedOrder.modifiedAtUtc && (
                    <div>
                      <span className="text-gray-600">{t('last_updated_label', 'Last Updated')}:</span>
                      <span className="ml-2 font-medium">{new Date(selectedOrder.modifiedAtUtc).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('order_total', 'Order Total')}</h3>
                </div>
                <div className="text-2xl font-bold text-[#5D2D2C]">{selectedOrder.totalAmount?.toFixed(2) || '0.00'} EGP</div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-[#5D2D2C]" size={20} />
                  <h3 className="font-semibold text-gray-800">{t('additional_details', 'Additional Details')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">{t('items_count_label', 'Items Count')}:</span>
                    <span className="ml-2 font-medium">{selectedOrder.items?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="text-[#5D2D2C]" size={20} />
                  <h3 className="text-xl font-semibold text-gray-800">{t('order_items', 'Order Items')}</h3>
                </div>
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_product_name', 'Product Name')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_quantity', 'Quantity')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_price', 'Price')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_subtotal', 'Subtotal')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-medium">{getProductName(item.productVariantId)}</div>
                            <div className="text-xs text-gray-500">{t('id_label', 'ID')}: {item.productVariantId ? `${item.productVariantId.slice(0, 8)}...` : t('na','N/A')}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.unitPrice?.toFixed(2) ?? '0.00'} EGP</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)} EGP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('close', 'Close')}
              </button>
              <button
                onClick={handleDeleteSelectedOrder}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                {t('delete_order', 'Delete Order')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{t('manage_orders', 'Manage Orders')}</h2>
          <p className="text-gray-600 text-sm">{t('manage_orders_description', 'View and manage all customer orders')}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('search_placeholder_orders', 'Search by order ID, user name, or status...')}
              value={searchTerm}
              onChange={handleSearchInput}
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
            <option value="Pending">{t('pending', 'Pending')}</option>
            <option value="Completed">{t('completed', 'Completed')}</option>
            <option value="Cancelled">{t('cancelled', 'Cancelled')}</option>
            <option value="Processing">{t('processing', 'Processing')}</option>
          </select>

          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-[#5D2D2C] text-white rounded-lg hover:bg-[#4a2321] transition-colors whitespace-nowrap"
          >
            {t('apply_filters', 'Apply Filters')}
          </button>

          {statusFilter && (
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {/* Loading State */}
      {loading && !orderDetailsLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D2D2C]"></div>
        </div>
      )}

      {/* Orders Table */}
      {!loading && (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_order_id', 'Order ID')}</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_customer', 'Customer')}</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_items', 'Items')}</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_total', 'Total')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_status', 'Status')}</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_date', 'Date')}</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, idx) => (
                  <tr
                    key={order.orderId ?? `order-${idx}`}
                    className="hover:bg-gray-50 cursor-pointer"
                    data-orderid={order.orderId}
                    onClick={handleRowClick}
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{safeStr(order.orderId).slice(0, 8)}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-[140px] sm:max-w-none truncate">{getUserName(order.userId)}</div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items?.length || 0}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.totalAmount?.toFixed(2) || '0.00'} EGP</td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.createdAtUtc ? new Date(order.createdAtUtc).toLocaleDateString() : t('na', 'N/A')}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        data-orderid={order.orderId}
                        onClick={handleDeleteButtonClick}
                        className="text-red-600 hover:text-red-900"
                        aria-label={t('delete_order', 'Delete Order')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">{t('no_orders_found', 'No orders found.')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t('rows_per_page', 'Rows per page:')}</span>
              <select value={pageSize} onChange={(e) => setSize(Number(e.target.value))} className="px-3 py-2 border rounded bg-white">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{totalCount === 0 ? '0' : `${(pageIndex - 1) * pageSize + 1} - ${Math.min(pageIndex * pageSize, totalCount)} of ${totalCount}`}</div>

              <nav className="inline-flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, pageIndex - 1))} disabled={pageIndex === 1} className={`px-3 py-1 rounded border ${pageIndex === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>{t('prev', 'Prev')}</button>

                {pageNumbers[0] > 1 && (
                  <>
                    <button onClick={() => setPage(1)} className="px-3 py-1 rounded border hover:bg-gray-100">1</button>
                    {pageNumbers[0] > 2 && <span className="px-2">…</span>}
                  </>
                )}

                {pageNumbers.map((num) => (
                  <button key={num} onClick={() => setPage(num)} className={`px-3 py-1 rounded border ${num === pageIndex ? 'bg-[#5D2D2C] text-white' : 'hover:bg-gray-100'}`}>{num}</button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-2">…</span>}
                    <button onClick={() => setPage(totalPages)} className="px-3 py-1 rounded border hover:bg-gray-100">{totalPages}</button>
                  </>
                )}

                <button onClick={() => setPage(Math.min(totalPages, pageIndex + 1))} disabled={pageIndex === totalPages} className={`px-3 py-1 rounded border ${pageIndex === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>{t('next', 'Next')}</button>
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(OrdersManagement);
