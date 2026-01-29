import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isValidName, isValidEmail, isValidPhone, isValidAddress, isValidCity, isValidPostalCode } from '../pages/validation';
import { useCart } from '../pages/CartProvider';

type Props = {
  onNext: () => void;
  onBack: () => void;
};

const ShippingScreen: React.FC<Props> = ({ onNext, onBack }) => {
  const { t } = useTranslation();
  const { shippingInfo, setShippingInfo } = useCart();
  const [formData, setFormData] = useState(
    shippingInfo || {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof formData, boolean>>>({});

  const validateField = (field: keyof typeof formData, value: string) => {
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

  const validateVisibleFields = () => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};
    ['fullName', 'email', 'phone', 'address', 'city', 'postalCode'].forEach((k) => {
      const key = k as keyof typeof formData;
      const msg = validateField(key, formData[key] ?? "");
      if (msg) newErrors[key] = msg;
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
      city: true,
      postalCode: true,
    });

    if (validateVisibleFields()) {
      setShippingInfo(formData);
      onNext();
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const msg = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: msg || undefined }));
    }
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const msg = validateField(field, formData[field] ?? "");
    setErrors((prev) => ({ ...prev, [field]: msg || undefined }));
  };

  useEffect(() => {
    if (shippingInfo) {
      setTouched({
        fullName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFormValid = () =>
    isValidName(formData.fullName) &&
    isValidEmail(formData.email) &&
    isValidPhone(formData.phone) &&
    isValidAddress(formData.address);

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                onBlur={() => handleBlur('city')}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Cairo"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                onBlur={() => handleBlur('postalCode')}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${errors.postalCode ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="12345"
              />
              {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full mt-6 bg-[#5D2D2C] text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!isFormValid()}
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

export default ShippingScreen;