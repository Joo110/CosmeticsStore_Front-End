import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Trash2, Heart, Plus, Minus, CreditCard, User, Mail, Phone, Home } from 'lucide-react';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';
import { useCartByUser } from '../../Carts/hooks/useCartByUser';
import api, { handleApiError } from '../../Users/utils/api';
import { useRemoveCartItem } from '../../Carts/hooks/useRemoveCartItem';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------- Local types ----------------------
interface Product {
  id: string;
  productVariantId: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

interface CartItem {
  id: string | number;
  productVariantId: string | number;
  title?: string;
  unitPriceAmount?: number;
  unitPrice?: number;
  quantity?: number;
}

interface CartWithItems {
  id: string | number;
  items?: CartItem[];
}

// Add cartId to context so components can call backend with real cart id
interface CartContextType {
  cartId: string | null;
  products: Product[];
  updateQuantity: (id: string, quantity: number) => void;
  removeProduct: (id: string) => void;
  getSubtotal: () => number;
  shippingInfo: ShippingInfo | null;
  setShippingInfo: (info: ShippingInfo) => void;
  loading: boolean;
  error: string | null;
}

// ---------------------- Context ----------------------
const CartContext = createContext<CartContextType | undefined>(undefined);

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

// ---------------------- Provider ----------------------
const CartProvider: React.FC<{ children: ReactNode; userId?: string | undefined }> = ({ children, userId }) => {
  const { cart, loading, error } = useCartByUser(userId ?? '');
  // console.log('useCartByUser:', { cart, loading, error });

  // derive cartId directly from cart (no need to store it in state)
  const cartId = cart?.id ? String(cart.id) : null;

  const [products, setProducts] = useState<Product[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);

  useEffect(() => {
    // Type assertion to handle the items property
    const cartWithItems = cart as CartWithItems | null;
    
    if (!cartWithItems?.items || cartWithItems.items.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect    
      setProducts([]);
      return;
    }

    const mapped: Product[] = cartWithItems.items.map((item: CartItem) => ({
      id: String(item.id),
      productVariantId: String(item.productVariantId),
      name: String((item as any).title ?? ''),
      brand: '',
      price: Number((item as any).unitPriceAmount ?? (item as any).unitPrice ?? 0),
      quantity: Number(item.quantity ?? 1),
      image: undefined,
    }));

    // Simple shallow compare based on length + ids/price/quantity to avoid needless setState
    setProducts((prev) => {
      if (
        prev.length === mapped.length &&
        prev.every((p, i) => p.id === mapped[i].id && p.quantity === mapped[i].quantity && p.price === mapped[i].price)
      ) {
        return prev;
      }
      return mapped;
    });
  }, [cart]);

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, quantity } : p)));
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const getSubtotal = () => {
    return products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartId,
        products,
        updateQuantity,
        removeProduct,
        getSubtotal,
        shippingInfo,
        setShippingInfo,
        loading,
        error,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ================= Helper Validation Utilities =================
const isValidName = (name: string) => {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  const re = /^[\p{L}\s\-.'\u0640]{2,}$/u;
  return re.test(trimmed);
};

const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

const isValidPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

const isValidPostalCode = (code: string) => {
  const trimmed = code.trim();
  return /^\d{3,10}$/.test(trimmed);
};

const isValidAddress = (addr: string) => {
  return addr.trim().length >= 5;
};

const isValidCity = (city: string) => {
  const trimmed = city.trim();
  return trimmed.length >= 2;
};

const luhnCheck = (cardNumber: string) => {
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0 && digits.length >= 13 && digits.length <= 19;
};

const isValidExpiry = (mmYY: string) => {
  const cleaned = mmYY.replace(/\s/g, '');
  const m = cleaned.match(/^(\d{2})(?:\/|-)?(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const expiry = new Date(year, month - 1, 1);
  expiry.setMonth(expiry.getMonth() + 1);
  expiry.setDate(0);
  return expiry >= new Date(now.getFullYear(), now.getMonth(), 1);
};

const isValidCVV = (cvv: string) => {
  return /^\d{3,4}$/.test(cvv.trim());
};

// =================== ProductCard ===================
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { t } = useTranslation();
  const { updateQuantity, cartId } = useCart();
  const { removeItem, loading: removing, error: removeError } = useRemoveCartItem();

  const handleRemove = async () => {
    if (!cartId) {
      console.error('Cart ID is missing');
      return;
    }

    try {
      const result = await removeItem(cartId, product.id);
      window.location.reload();

      if (result) {
        window.location.reload();
      } else {
        console.error('Failed to remove item from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-3">
          <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
          <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-gray-900">ج.م {product.price}</span>
            <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">-15%</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <button className="text-gray-400 hover:text-red-500 transition-colors mb-2" aria-label={t('wishlist', 'Wishlist')}>
            <Heart className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200">
            <button
              onClick={handleRemove}
              className="p-2 hover:bg-gray-100 transition-colors"
              aria-label={t('remove_item', 'Remove {{name}}', { name: product.name })}
              disabled={removing}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => updateQuantity(product.id, product.quantity - 1)}
              className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
              disabled={product.quantity <= 1}
              aria-label={t('decrease_quantity', 'Decrease quantity for {{name}}', { name: product.name })}
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="px-4 font-medium">{product.quantity}</span>

            <button
              onClick={() => updateQuantity(product.id, product.quantity + 1)}
              className="p-2 hover:bg-gray-100 transition-colors"
              aria-label={t('increase_quantity', 'Increase quantity for {{name}}', { name: product.name })}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {removeError && <p className="text-red-500 text-xs mt-1">{removeError}</p>}
        </div>
      </div>
    </div>
  );
};

// =================== OrdersScreen ===================
const OrdersScreen: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { t } = useTranslation();
  const { products, getSubtotal, loading, error } = useCart();
  const subtotal = getSubtotal();
  const deliveryFee = 20;
  const serviceFee = 20;
  const total = subtotal + deliveryFee + serviceFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading_cart', 'Loading your cart...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('error_loading_cart', 'Error Loading Cart')}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('orders', 'Orders')}</h1>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('cart_empty', 'Your cart is empty')}</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('payment_summary', 'Payment summary')}</h2>

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
          </>
        )}

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

// =================== ShippingScreen ===================
const ShippingScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const { t } = useTranslation();
  const { shippingInfo, setShippingInfo } = useCart();
  const [formData, setFormData] = useState<ShippingInfo>(
    shippingInfo || {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ShippingInfo, boolean>>>({});

  const validateField = (field: keyof ShippingInfo, value: string) => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return t('fullname_required', 'Full name is required');
        if (!isValidName(value)) return t('fullname_invalid', 'Enter a valid name (letters and spaces only, min 2 chars)');
        return '';
      case 'email':
        if (!value.trim()) return t('email_required', 'Email is required');
        if (!isValidEmail(value)) return t('email_invalid', 'Enter a valid email address');
        return '';
      case 'phone':
        if (!value.trim()) return t('phone_required', 'Phone number is required');
        if (!isValidPhone(value)) return t('phone_invalid', 'Enter a valid phone number (7–15 digits)');
        return '';
      case 'address':
        if (!value.trim()) return t('address_required', 'Address is required');
        if (!isValidAddress(value)) return t('address_invalid', 'Address must be at least 5 characters');
        return '';
      case 'city':
        if (!value.trim()) return t('city_required', 'City is required');
        if (!isValidCity(value)) return t('city_invalid', 'Enter a valid city name');
        return '';
      case 'postalCode':
        if (!value.trim()) return t('postal_required', 'Postal code is required');
        if (!isValidPostalCode(value)) return t('postal_invalid', 'Enter a valid postal code (digits only)');
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingInfo, string>> = {};
    (Object.keys(formData) as (keyof ShippingInfo)[]).forEach((key) => {
      const message = validateField(key, formData[key]);
      if (message) newErrors[key] = message;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateVisibleFields = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingInfo, string>> = {};
    ['fullName', 'email', 'phone', 'address'].forEach((key) => {
      const fieldKey = key as keyof ShippingInfo;
      const message = validateField(fieldKey, formData[fieldKey]);
      if (message) newErrors[fieldKey] = message;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      address: true,
    });

    if (validateVisibleFields()) {
      setShippingInfo(formData);
      onNext();
    }
  };

  const handleChange = (field: keyof ShippingInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const msg = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: msg || undefined }));
    }
  };

  const handleBlur = (field: keyof ShippingInfo) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const msg = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: msg || undefined }));
  };

  const isFormValidVisibleFields = () => {
    return isValidName(formData.fullName) && isValidEmail(formData.email) && isValidPhone(formData.phone) && isValidAddress(formData.address);
  };

  useEffect(() => {
    if (shippingInfo) {
      setTouched({
        fullName: true,
        email: true,
        phone: true,
        address: true,
      });
      validateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <button onClick={onBack} className="mb-6 text-gray-600 hover:text-gray-900 transition-colors">
          ← {t('back', 'Back')}
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('shipping_information', 'Shipping Information')}</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              {t('name', 'Name')}
            </label>
            <input
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('enter_fullname', 'Enter your full name')}
            />
            {errors.fullName && (
              <p id="fullName-error" role="alert" className="text-red-500 text-sm mt-1">
                {errors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              {t('email_address', 'Email Address')}
            </label>
            <input
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('email_placeholder', 'your.email@example.com')}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-red-500 text-sm mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              {t('phone_number', 'Phone Number')}
            </label>
            <input
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('phone_placeholder', '+20 10 1234 5678')}
            />
            {errors.phone && (
              <p id="phone-error" role="alert" className="text-red-500 text-sm mt-1">
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Home className="w-4 h-4 inline mr-2" />
              {t('address', 'Address')}
            </label>
            <input
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? 'address-error' : undefined}
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('address_placeholder', 'Building number, street name')}
            />
            {errors.address && (
              <p id="address-error" role="alert" className="text-red-500 text-sm mt-1">
                {errors.address}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>

          <button
            onClick={handleSubmit}
            className="w-full mt-6 bg-[#5D2D2C] text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!isFormValidVisibleFields()}
          >
            {t('continue_to_payment', 'Continue to Payment')}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
};

// =================== PaymentScreen ===================
const PaymentScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();
  const { products, getSubtotal, shippingInfo } = useCart();
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [createdOrderId, setCreatedOrderId] = useState<string | undefined>(undefined);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const [errors, setErrors] = useState<{ cardNumber?: string; cardName?: string; expiry?: string; cvv?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const deliveryFee = 20;
  const serviceFee = 20;
  const total = subtotal + deliveryFee + serviceFee;

  const validatePayment = () => {
    const newErrors: typeof errors = {};

    const numClean = cardNumber.replace(/\s/g, '');
    if (!numClean) newErrors.cardNumber = t('card_number_required', 'Card number is required');
    else if (!/^\d{13,19}$/.test(numClean)) newErrors.cardNumber = t('card_number_length', 'Card number must be 13–19 digits');
    else if (!luhnCheck(numClean)) newErrors.cardNumber = t('card_number_invalid', 'Invalid card number');

    if (!cardName.trim()) newErrors.cardName = t('cardholder_name_required', 'Cardholder name is required');
    else if (cardName.trim().length < 2) newErrors.cardName = t('cardholder_name_short', 'Enter full name');

    if (!expiryDate.trim()) newErrors.expiry = t('expiry_required', 'Expiry date is required');
    else if (!isValidExpiry(expiryDate)) newErrors.expiry = t('expiry_invalid', 'Invalid expiry date (MM/YY) or card expired');

    if (!cvv.trim()) newErrors.cvv = t('cvv_required', 'CVV is required');
    else if (!isValidCVV(cvv)) newErrors.cvv = t('cvv_invalid', 'CVV must be 3 or 4 digits');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    setApiError(null);
    if (!validatePayment()) return;

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
      const orderPayload = {
        userId,
        shippingAddress: shippingInfo.address,
        phoneNumber: shippingInfo.phone,
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

      let orderId: string | undefined;

      try {
        const orderRes = await api.post('/Orders', orderPayload);
        orderId = orderRes.data?.orderId;

        if (!orderId) {
          setApiError(t('order_created_no_id', 'Order created but response missing orderId.'));
          setIsProcessing(false);
          return;
        }

        setCreatedOrderId(orderId);
        console.log('Order created with ID:', orderId);
      } catch (err: any) {
        const text = err?.response?.data?.message || err?.message || t('order_failed', 'Failed to create order');
        setApiError(text);
        setIsProcessing(false);
        return;
      }

      try {
        const txnId = Math.random().toString(36).slice(2, 12);
        const paymentPayload = {
          orderId: orderId,
          amount: subtotal,
          currency: 'USD',
          provider: 'CARD',
          transactionId: txnId,
          status: 'true',
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
      }

      setIsProcessing(false);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Payment flow error', err);
      setApiError(err?.message || t('unexpected_error', 'Unexpected error occurred'));
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
                <span className="text-gray-600">{t('order_total', 'Order Total:')}:</span>
                <span className="font-medium">ج.م {total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('shipping_to', 'Shipping to:')}:</span>
                <span className="font-medium">{shippingInfo?.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('items', 'Items')}:</span>
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

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('payment', 'Payment')}</h1>

        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
          <h3 className="font-bold mb-4">{t('order_summary', 'Order Summary')}</h3>
          <div className="space-y-2 text-sm mb-4">
            {products.map((product) => (
              <div key={product.id} className="flex justify-between">
                <span className="text-gray-600">
                  {product.name} x{product.quantity}
                </span>
                <span className="font-medium">ج.م {product.price * product.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>{t('subtotal', 'Subtotal')}</span>
              <span>ج.م {subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{t('delivery', 'Delivery')}</span>
              <span>ج.م {deliveryFee}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>{t('total', 'Total')}</span>
              <span>ج.م {total}</span>
            </div>
          </div>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            <strong>{t('error', 'Error')}:</strong> {apiError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-2" />
              {t('card_number', 'Card Number')}
            </label>
            <input
              aria-invalid={!!errors.cardNumber}
              aria-describedby={errors.cardNumber ? 'card-error' : undefined}
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.cardNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('card_number_placeholder', '1234 5678 9012 3456')}
              maxLength={23}
            />
            {errors.cardNumber && (
              <p id="card-error" role="alert" className="text-red-500 text-sm mt-1">
                {errors.cardNumber}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('cardholder_name', 'Cardholder Name')}</label>
            <input
              aria-invalid={!!errors.cardName}
              aria-describedby={errors.cardName ? 'cardname-error' : undefined}
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.cardName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('name_on_card', 'Name on card')}
            />
            {errors.cardName && (
              <p id="cardname-error" role="alert" className="text-red-500 text-sm mt-1">
                {errors.cardName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('expiry_date', 'Expiry Date')}</label>
              <input
                aria-invalid={!!errors.expiry}
                aria-describedby={errors.expiry ? 'expiry-error' : undefined}
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.expiry ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('expiry_placeholder', 'MM/YY')}
                maxLength={5}
              />
              {errors.expiry && (
                <p id="expiry-error" role="alert" className="text-red-500 text-sm mt-1">
                  {errors.expiry}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('cvv', 'CVV')}</label>
              <input
                aria-invalid={!!errors.cvv}
                aria-describedby={errors.cvv ? 'cvv-error' : undefined}
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.cvv ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('cvv_placeholder', '123')}
                maxLength={4}
              />
              {errors.cvv && (
                <p id="cvv-error" role="alert" className="text-red-500 text-sm mt-1">
                  {errors.cvv}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full mt-6 bg-[#5D2D2C] text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? t('processing', 'Processing...') : t('pay_amount', 'Pay ج.م {{amount}}', { amount: total })}
          </button>
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

// =================== App ===================
export default function App() {
  const [currentStep, setCurrentStep] = useState<'orders' | 'shipping' | 'payment'>('orders');
  const userCookie = Cookies.get('user');
  let userId: string | undefined = undefined;

  if (userCookie) {
    try {
      const userObj = JSON.parse(userCookie);
      userId = userObj.userId;
    } catch (err) {
      console.error('Failed to parse user cookie', err);
    }
  }

  // console.log('userId from cookies:', userId);

  return (
    <CartProvider userId={userId}>
      <div className="min-h-screen bg-white">
        {currentStep === 'orders' && <OrdersScreen onNext={() => setCurrentStep('shipping')} />}
        {currentStep === 'shipping' && (
          <ShippingScreen onNext={() => setCurrentStep('payment')} onBack={() => setCurrentStep('orders')} />
        )}
        {currentStep === 'payment' && <PaymentScreen onBack={() => setCurrentStep('shipping')} />}
      </div>
    </CartProvider>
  );
}