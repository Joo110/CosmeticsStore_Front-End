import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Trash2, Minus, Plus } from 'lucide-react';
import { useCartByUser } from '../../Carts/hooks/useCartByUser';
import { useCart } from '../pages/CartProvider';
import { useRemoveCartItem } from '../../Carts/hooks/useRemoveCartItem';

interface OrdersScreenProps {
  userId: string;
  onNext: () => void;
}

const OrdersScreen: React.FC<OrdersScreenProps> = ({ userId, onNext }) => {
  const { t } = useTranslation();

  const { cart, loading, error, fetchCart } = useCartByUser(userId);

  const { updateQuantity } = useCart();

  const { removeItem, loading: removing, error: removeError } = useRemoveCartItem();

  const products = cart?.items || [];

  const subtotal = products.reduce(
    (sum, p) => sum + p.unitPriceAmount * p.quantity,
    0
  );

  const deliveryFee = 20;
  const serviceFee = 20;
  const total = subtotal + deliveryFee + serviceFee;

  const handleRemove = async (itemId: string) => {
    if (!cart?.id) return;

    const result = await removeItem(cart.id, itemId);
      await fetchCart();

    if (result) {
      await fetchCart();
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('loading_cart', 'Loading your cart...')}</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>
          {t('error_loading_cart', 'Error:')} {error}
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t('orders', 'Orders')}
        </h1>

        {/* Product Cards */}
        <div className="mb-8 space-y-4">
          {products.map((product) => (
            <div key={product.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                {/* Left: Product Info */}
                <div className="flex-1 pr-3">
                  <p className="text-xs text-gray-500 mb-1">
                    {product.title}
                  </p>

                  <h3 className="font-medium text-gray-900 line-clamp-2">
                    {product.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-gray-900">
                      ج.م {product.unitPriceAmount}
                    </span>

                    <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                      -15%
                    </span>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="flex flex-col items-end">
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors mb-2"
                    aria-label={t('wishlist', 'Wishlist')}
                  >
                    <Heart className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      disabled={removing}
                      aria-label={t('remove_item', 'Remove {{name}}', {
                        name: product.title,
                      })}
                    >
                      {removing ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        updateQuantity(product.id, product.quantity - 1)
                      }
                      className="p-2 hover:bg-gray-100 transition-colors"
                      disabled={product.quantity <= 1 || removing}
                      aria-label={t(
                        'decrease_quantity',
                        'Decrease quantity for {{name}}',
                        { name: product.title }
                      )}
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="px-4 font-medium">
                      {product.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(product.id, product.quantity + 1)
                      }
                      className="p-2 hover:bg-gray-100 transition-colors"
                      aria-label={t(
                        'increase_quantity',
                        'Increase quantity for {{name}}',
                        { name: product.title }
                      )}
                      disabled={removing}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {removeError && (
                    <p className="text-red-500 text-xs mt-1">
                      {removeError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {t('payment_summary', 'Payment summary')}
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{t('subtotal', 'Subtotal')}</span>
              <span className="font-medium">ج.م {subtotal}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>{t('delivery_fee', 'Delivery fee')}</span>
              <span className="font-medium">ج.م {deliveryFee}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>{t('service_fee', 'Service fee')}</span>
              <span className="font-medium">ج.م {serviceFee}</span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between text-gray-900 font-bold text-lg">
                <span>{t('total_amount', 'Total amount')}</span>
                <span>ج.م {total}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full mt-6 bg-[#5D2D2C] text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          {t('continue_to_shipping', 'Continue to Shipping')}
        </button>

        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
};

export default OrdersScreen;
