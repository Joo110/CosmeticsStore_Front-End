import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import api, { handleApiError } from '../../Users/utils/api';
import { useCart } from '../pages/CartProvider';
import { useCartByUser } from '../../Carts/hooks/useCartByUser';
//import usePayments from '../../payment/hooks/usePayments';

const PaymentScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();

  const {  shippingInfo } = useCart();
/* eslint-disable @typescript-eslint/no-explicit-any */

  const userCookie = Cookies.get('user');
  let userIdFromCookie: string | undefined = undefined;

  if (userCookie) {
    try {
      const userObj = JSON.parse(userCookie);
      userIdFromCookie = userObj.userId;
    } catch {
      // ignore
    }
  }

  const { cart, loading, error } = useCartByUser(userIdFromCookie ?? '');

  const products =
    cart?.items?.map((item: any) => ({
      id: String(item.id),
      productVariantId: String(item.productVariantId),
      name: String(item.title ?? ''),
      price: Number(item.unitPriceAmount ?? 0),
      quantity: Number(item.quantity ?? 1),
    })) || [];



  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | undefined>(undefined);

  const subtotal = products.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  const deliveryFee = 20;
  const serviceFee = 20;
  const total = subtotal + deliveryFee + serviceFee;



  const createOrder = async () => {
    const userCookie = Cookies.get('user');
    let userId: string | undefined = undefined;

    if (userCookie) {
      try {
        const userObj = JSON.parse(userCookie);
        userId = userObj.userId;
      } catch {
        // ignore
      }
    }

    if (!userId)
      throw new Error(t('user_not_authenticated', 'User not authenticated'));

    if (!shippingInfo)
      throw new Error(t('shipping_info_missing', 'Shipping info missing'));

    if (!products || products.length === 0)
      throw new Error(t('cart_empty', 'Cart is empty'));

    const orderPayload = {
      userId,
      shippingAddress: shippingInfo.address,
      phoneNumber: shippingInfo.phone,
      status: 'Draft',

      items: products.map((p) => ({
        productVariantId: p.productVariantId,
        quantity: p.quantity,
        unitPrice: p.price,
        currency: 'USD',
      })),

      totalAmount: subtotal,
      totalCurrency: 'USD',
    };

    const orderRes = await api.post('/Orders', orderPayload);

    const orderId = orderRes.data?.orderId;

    if (!orderId)
      throw new Error('Order created but missing id');

    return orderId as string;
  };

const handleStripePay = async () => {
  setApiError(null);
  setIsProcessing(true);

  try {
    // 1️⃣ إنشاء الأوردر أولاً
    const orderId = await createOrder();
    setCreatedOrderId(orderId);

    // 2️⃣ إنشاء الدفع
    const paymentPayload = {
      orderId,
      amount: total,
      currency: 'USD',
      provider: 'Stripe',
      transactionId: null,
      status: 'Pending',
    };

    const payRes = await api.post('/Payments', paymentPayload);
    const paymentId = payRes.data?.paymentId;
    if (!paymentId) throw new Error('Payment created but missing id');

    // 3️⃣ إنشاء Stripe session مع metadata
    const successUrl = `${window.location.origin}/payment-success?paymentId=${paymentId}&orderId=${orderId}`;
    const cancelUrl = `${window.location.origin}/payment-cancel?orderId=${orderId}`;

    const sessionRes = await api.post('/Payments/create-stripe-session', {
      paymentId,
      orderId,
      amount: total,
      currency: 'USD',
      successUrl,
      cancelUrl,
      metadata: { PaymentId: paymentId, OrderId: orderId } // 👈 هنا
    });

    const sessionUrl = sessionRes.data?.url;
    if (!sessionUrl) throw new Error('Failed to create stripe session');

    window.location.href = sessionUrl; // تحويل للـ Stripe Checkout
  } catch (err: any) {
    setApiError(handleApiError(err));
    setIsProcessing(false);
  }
};


  const cancelOrder = async () => {
    if (!createdOrderId) {
      setApiError('Order id not available.');
      return;
    }

    try {
      await api.delete(`/Orders/${createdOrderId}`);
      setIsSuccess(false);
    } catch (err: any) {
      setApiError(handleApiError(err));
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
        <p>{t('error', 'Error:')} {error}</p>
      </div>
    );

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6 max-w-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('payment_successful', 'Payment Successful!')}
          </h2>

          <p className="text-gray-600 mb-6">
            {t('order_confirmed', 'Your order has been confirmed.')}
          </p>

          <div className="mt-4">
            <button
              onClick={cancelOrder}
              className="w-full mt-2 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              {t('cancel_order', 'Cancel Order')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <button
          onClick={onBack}
          className="mb-6 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← {t('back', 'Back')}
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t('payment', 'Payment')}
        </h1>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            <strong>{t('error', 'Error')}:</strong> {apiError}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
          <h3 className="font-bold mb-4">
            {t('order_summary', 'Order Summary')}
          </h3>

          <div className="space-y-2 text-sm mb-4">
            {products.map((product) => (
              <div key={product.id} className="flex justify-between">
                <span className="text-gray-600">
                  {product.name} x{product.quantity}
                </span>

                <span className="font-medium">
                  ج.م {product.price * product.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>{t('subtotal', 'Subtotal')}</span>
              <span>ج.م {subtotal}</span>
            </div>

            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>{t('total', 'Total')}</span>
              <span>ج.م {total}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleStripePay}
            disabled={isProcessing}
            className="w-full mt-6 bg-[#5D2D2C] text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? t('processing', 'Processing...')
              : t('pay_amount', 'Pay ج.م {{amount}}', {
                  amount: total,
                })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
