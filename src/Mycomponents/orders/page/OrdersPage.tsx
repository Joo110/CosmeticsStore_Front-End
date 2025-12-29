// path: src/features/Orders/pages/OrdersPage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMyOrders } from '../hook/useMyOrders';
import { Package, Calendar, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { orders, loading, error } = useMyOrders();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '0001-01-01T00:00:00') {
      return t('not_available', 'N/A');
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5D2D2C] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading_orders', 'Loading your orders...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#5D2D2C] rounded-full flex items-center justify-center">
              <ShoppingBag className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('my_orders', 'My Orders')}</h1>
              <p className="text-gray-600 text-sm">{t('track_orders_subtitle', 'Track and view your order history')}</p>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Package className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('no_orders_yet', 'No Orders Yet')}</h3>
            <p className="text-gray-600">{t('start_shopping', 'Start shopping to see your orders here!')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderId = order.id || order.orderId || '';
              return (
                <div
                  key={orderId}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Order Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleOrder(orderId)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#5D2D2C] to-[#8B4A47] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {t('order_number', 'Order #{{number}}', { number: orderId?.slice(0, 8) ?? '--------' })}...
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <Calendar size={16} />
                            <span>{formatDate(order.createdAtUtc || order.orderDate || '')}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {t('items_count', '{{count}} item', { count: order.items?.length || 0, count_plural: '{{count}} items' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{t('total', 'Total')}</p>
                          <p className="text-2xl font-bold text-[#5D2D2C]">
                            {order.totalAmount?.toFixed(2) ?? '0.00'} {order.totalCurrency ?? 'USD'}
                          </p>
                        </div>
                        <div className="text-gray-400">
                          {expandedOrders.has(orderId) ? (
                            <ChevronUp size={24} />
                          ) : (
                            <ChevronDown size={24} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items (Expandable) */}
                  {expandedOrders.has(orderId) && order.items && order.items.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      <div className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">{t('order_items', 'Order Items')}</h4>
                        <div className="space-y-3">
                          {order.items.map((item) => {
                            const itemId = item.id || item.orderItemId || '';
                            const unitPrice = item.unitPrice ?? item.unitPriceAmount ?? 0;
                            const currency = item.currency || item.unitPriceCurrency || 'USD';
                            
                            return (
                              <div
                                key={itemId}
                                className="bg-white rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-md transition-shadow"
                              >
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">
                                    {item.productName || item.title || item.productVariantSku || t('product', 'Product')}
                                  </h5>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <span>{t('qty', 'Qty')}: {item.quantity ?? 0}</span>
                                    <span>•</span>
                                    <span>
                                      {unitPrice.toFixed(2)} {currency} {t('each', 'each')}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right sm:text-left">
                                  <p className="text-lg font-bold text-[#5D2D2C]">
                                    {item.itemTotalPrice?.toFixed(2) ?? ((item.quantity ?? 0) * unitPrice).toFixed(2)} {currency}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;