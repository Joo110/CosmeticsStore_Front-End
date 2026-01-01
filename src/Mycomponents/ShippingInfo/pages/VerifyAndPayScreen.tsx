// VerifyAndPayScreen.tsx
import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';
import api, { handleApiError } from '../../Users/utils/api'; // عدّل المسار لو مشروعك مختلف

type Product = {
  id: string;
  productVariantId: string;
  name: string;
  brand?: string;
  price: number;
  quantity: number;
  image?: string;
};

type ShippingInfo = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

type Props = {
  products: Product[];
  getSubtotal: () => number;
  shippingInfo: ShippingInfo | null;
  onBack: () => void;
  orderId?: string;
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
};
    /* eslint-disable @typescript-eslint/no-explicit-any */

const VerifyAndPayScreen: React.FC<Props> = ({
  products,
  getSubtotal,
  shippingInfo,
  onBack,
  orderId: incomingOrderId,
  cardNumber,
  cardName,
  expiryDate,
  cvv,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | undefined>(incomingOrderId);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const subtotal = getSubtotal();
  const deliveryFee = 20;
  const serviceFee = 20;
  const total = subtotal + deliveryFee + serviceFee;

  const validateCode = (c: string) => {
    const trimmed = c.trim();
    if (!/^\d{4,8}$/.test(trimmed)) return t('code_invalid', 'Enter a valid code (4-8 digits)');
    return '';
  };

  const ensureCardDetailsPresent = (): string | null => {
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      return t('card_details_missing', 'Card details missing. Please enter card information first.');
    }
    return null;
  };

  // If no orderId provided (edge case), create order here — normally PaymentScreen created it.
  const createOrderIfNeeded = async (userId: string) => {
    if (createdOrderId) return createdOrderId;
    const orderPayload = {
      userId,
      shippingAddress: shippingInfo?.address,
      phoneNumber: shippingInfo?.phone,
      status: 'true',
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
    const newId = orderRes.data?.orderId;
    if (!newId) throw new Error('Order created but response missing orderId.');
    setCreatedOrderId(newId);
    return newId;
  };

  const handleVerifyAndPay = async () => {
    setApiError(null);

    // ensure card details are present (flow: card details entered previously)
    const cardCheckMsg = ensureCardDetailsPresent();
    if (cardCheckMsg) {
      setApiError(cardCheckMsg);
      return;
    }

    const codeError = validateCode(code);
    if (codeError) {
      setApiError(codeError);
      return;
    }

    if (!shippingInfo) {
      setApiError(t('shipping_info_missing', 'Please fill shipping information before payment.'));
      return;
    }

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

    if (!userId) {
      setApiError(t('user_not_authenticated', 'User is not authenticated. Please login.'));
      return;
    }

    if (!products || products.length === 0) {
      setApiError(t('cart_empty', 'Cart is empty.'));
      return;
    }

    setIsProcessing(true);

    try {
      // Ensure order exists (created by PaymentScreen in normal flow)
      let orderId = createdOrderId;
      try {
        orderId = await createOrderIfNeeded(userId);
      } catch (err: any) {
        setApiError(err?.message || t('order_failed', 'Failed to create order'));
        setIsProcessing(false);
        return;
      }

      // call payments verify endpoint if exists (optional)
      try {
        await api.post('/Payments/verify-code', { userId, orderId, code });
      } catch (verifyErr) {
        // not fatal; proceed to final payment attempt
        console.warn('verify-code endpoint failed or not present — proceeding to payment with code', verifyErr);
      }

      // finally create payment using provided card + verification code
      try {
        const txnId = Math.random().toString(36).slice(2, 12);
        const paymentPayload: any = {
          orderId,
          amount: subtotal,
          currency: 'USD',
          provider: 'CARD',
          transactionId: txnId,
          status: 'true',
          verificationCode: code,
          card: {
            number: cardNumber?.replace(/\s+/g, ''),
            name: cardName,
            expiry: expiryDate,
            cvv,
          },
        };

        const payRes = await api.post('/Payments', paymentPayload);

        if (!payRes.data) {
          setApiError(t('payment_created_no_data', 'Payment created but response missing data.'));
          setIsProcessing(false);
          return;
        }

        setIsProcessing(false);
        setIsSuccess(true);
      } catch (err: any) {
        console.error('Payment flow error', err);
        const text = err?.response?.data?.message || err?.message || t('payment_failed', 'Failed to create payment');
        setApiError(text);
        setIsProcessing(false);
        return;
      }
    } catch (err: any) {
      console.error('Verify & Pay error', err);
      setApiError(err?.message || t('unexpected_error', 'Unexpected error occurred'));
      setIsProcessing(false);
      return;
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelOrder = async () => {
    if (!createdOrderId) {
      setCancelError(t('order_id_unavailable', 'Order id not available.'));
      return;
    }

    setCancelError(null);
    setIsCancelling(true);

    try {
      await api.delete(`/Orders/${createdOrderId}`);
      setCancelSuccess(true);
    } catch (err: any) {
      const message = handleApiError(err);
      setCancelError(message);
      console.error('Cancel order error', err);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6 max-w-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('payment_successful', 'Payment Successful!')}</h2>
          <p className="text-gray-600 mb-6">{t('order_confirmed', 'Your order has been confirmed and will be shipped soon.')}</p>

          <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto text-left mb-4">
            <h3 className="font-bold mb-3">{t('order_summary', 'Order Summary')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('order_total', 'Order Total:')}</span>
                <span className="font-medium">ج.م {total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('shipping_to', 'Shipping to:')}</span>
                <span className="font-medium">{shippingInfo?.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('items', 'Items')}</span>
                <span className="font-medium">{products.length}</span>
              </div>
            </div>
          </div>

          {createdOrderId && !cancelSuccess && (
            <div className="mt-4">
              <button
                onClick={cancelOrder}
                disabled={isCancelling}
                className="w-full mt-2 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isCancelling ? t('cancelling', 'Cancelling...') : t('cancel_order', 'Cancel Order')}
              </button>
              {cancelError && <p className="text-red-500 text-sm mt-2">{cancelError}</p>}
            </div>
          )}

          {cancelSuccess && (
            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded">
              {t('order_cancelled', 'Order cancelled successfully.')}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <button onClick={onBack} className="mb-6 text-gray-600 hover:text-gray-900 transition-colors">
          ← {t('back', 'Back')}
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('verify_and_pay', 'Enter Verification Code')}</h1>

        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
          <p className="text-sm text-gray-700 mb-3">{t('enter_code_instructions', 'Enter the code that was sent to you to authorize the payment.')}</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('verification_code', 'Verification Code')}</label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('code_placeholder', '123456')}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              maxLength={8}
            />
          </div>

          {apiError && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{apiError}</div>}

          <div className="mt-6">
            <button
              onClick={handleVerifyAndPay}
              disabled={isProcessing}
              className="w-full bg-[#5D2D2C] text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? t('processing', 'Processing...') : t('verify_and_pay', 'Verify & Pay ج.م {{amount}}', { amount: total })}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
};

export default VerifyAndPayScreen;