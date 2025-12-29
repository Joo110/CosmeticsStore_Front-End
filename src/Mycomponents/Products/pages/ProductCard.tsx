import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import type { Product } from '../../../types/product.types';

import { useAddToCart } from '../../Carts/hooks/useAddToCart';
import authService from '../../Users/Services/authService';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string, variantId: string) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState<number>(1);

  const { addItem, loading: actionLoading, error: actionError } = useAddToCart();
/* eslint-disable @typescript-eslint/no-explicit-any */

  const media = Array.isArray(product.media) ? product.media : [];
  const primaryImage = media.find((m) => m.isPrimary) || media[0] || null;
  const displayImage = media[selectedImage] || primaryImage;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const activeVariant = variants.find((v) => v.isActive) ?? variants[0] ?? null;
  const hasStock = Boolean(activeVariant && Number(activeVariant.stock ?? 0) > 0);
  const availableStock = Number(activeVariant?.stock ?? 0);

  const priceAmount = useMemo(() => Number(activeVariant?.priceAmount ?? 0), [activeVariant]);
  const priceCurrency = useMemo(
    () => String((activeVariant as any)?.priceCurrency ?? (product as any)?.priceCurrency ?? ''),
    [activeVariant, product]
  );

  const fakeOriginalPrice = useMemo(() => {
    if (!priceAmount || priceAmount <= 0) return 0;

    const minExtra = 0.15;
    const maxExtra = 0.7;

    const seed = String(product.productId ?? product.slug ?? product.name ?? '0');
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const t = (h % 1000) / 1000;
    const factor = 1 + minExtra + t * (maxExtra - minExtra);

    return Math.ceil(priceAmount * factor);
  }, [priceAmount, product.productId, product.slug, product.name]);

  const discountPercentage = useMemo(() => {
    if (!fakeOriginalPrice || fakeOriginalPrice <= priceAmount) return 0;
    return Math.round(((fakeOriginalPrice - priceAmount) / fakeOriginalPrice) * 100);
  }, [fakeOriginalPrice, priceAmount]);

  const handleQuantityChange = (value: string) => {
    const n = Math.max(1, Math.floor(Number(value) || 1));
    if (availableStock > 0) {
      setQuantity(Math.min(n, availableStock));
    } else {
      setQuantity(n);
    }
  };

const handleAddToCart = async (e: React.MouseEvent) => {
  console.log('🔵 === handleAddToCart STARTED ===');
  e.preventDefault();
  e.stopPropagation();

  if (!activeVariant) {
    toast.error(t('no_variant_available', 'No active variant available'));
    return;
  }

  console.log('🔵 Checking onAddToCart callback...');
  if (onAddToCart) {
    try {
      const productIdToParent = String(product.productId ?? product.slug ?? '');
      const variantIdToParent = String(activeVariant.productVariantId ?? '');
      console.log('🔵 Calling parent callback with:', { productIdToParent, variantIdToParent });
      onAddToCart(productIdToParent, variantIdToParent);
      console.log('✅ Parent callback finished');
    } catch (err) {
      console.log('❌ Parent callback error:', err);
    }
  }

  console.log('🔵 Getting current user...');
  const currentUser = authService.getCurrentUser();
  console.log('🔵 Current user:', currentUser);
  
  if (!currentUser) {
    console.log('❌ No user - showing toast and STOPPING');
    toast.info(t('login_to_add_cart', 'Please login to add items to cart'));
    console.log('🔵 === handleAddToCart ENDED (no user) ===');
    return;
  }

  console.log('✅ User found, continuing...');

  const variantIdToSend = String(activeVariant.productVariantId);
  if (!variantIdToSend) {
    console.error('variant id is missing', activeVariant);
    toast.error(t('unable_add_cart', 'Unable to add to cart: invalid variant id'));
    return;
  }

  if (availableStock > 0 && quantity > availableStock) {
    toast.error(t('limited_stock', 'Only {{count}} item(s) left in stock', { count: availableStock }));
    return;
  }
  if (quantity <= 0) {
    toast.error(t('quantity_min', 'Quantity must be at least 1'));
    return;
  }

  const cartItemRequest = {
    userId: currentUser.userId,
    productVariantId: variantIdToSend,
    quantity,
  };

  console.log('🔵 Calling addItem with:', cartItemRequest);

  try {
    const result = await addItem(cartItemRequest);
    console.log('🟢 addItem returned:', result);
    
    if (result) {
      console.log('✅ SUCCESS - Showing success toast');
      toast.success(t('added_to_cart_success', '✅ Added {{count}} item(s) to cart successfully!', { count: quantity }));
      console.log('✅ Toast shown');
    } else {
      console.log('❌ addItem returned null/false');
      toast.error(t('failed_add_cart', 'Failed to add to cart'));
    }
  } catch (error: any) {
    console.error('❌ addItem threw error:', error);
    
    if (error?.response?.status === 401) {
      console.log('⚠️ Got 401 error');
      toast.warning(t('session_expired', 'Session expired. Please login again.'));
    } else {
      toast.error(t('unexpected_error', 'An unexpected error occurred'));
    }
  }
  
  console.log('🔵 === handleAddToCart ENDED ===');
};

  const linkId = product.productId ?? '';

  return (
    <article
      className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden transition-transform duration-300 hover:shadow-2xl border border-gray-100 w-full h-full flex flex-col"
      aria-label={product.name}
    >
      {/* Image area */}
      {linkId ? (
        <Link to={`/product/${encodeURIComponent(String(linkId))}`} className="block" aria-hidden>
          <div className="relative h-40 sm:h-48 md:h-52 lg:h-56 xl:h-64 bg-gray-50 overflow-hidden">
            {displayImage ? (
              <img
                src={displayImage.url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">🧴</span>
              </div>
            )}

            {/* Thumbnails */}
            {media.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 sm:space-x-2 bg-black/20 p-0.5 sm:p-1 rounded-full">
                {media.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      setSelectedImage(index);
                    }}
                    aria-label={t('show_image', 'Show image {{number}}', { number: index + 1 })}
                    className={`transition-all rounded-full ${
                      index === selectedImage 
                        ? 'w-5 h-1.5 sm:w-6 sm:h-2 md:w-8 md:h-2 bg-white' 
                        : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </Link>
      ) : (
        <div className="relative h-40 sm:h-48 md:h-52 lg:h-56 xl:h-64 bg-gray-50 overflow-hidden">
          {displayImage ? (
            <img src={displayImage.url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">🧴</span>
            </div>
          )}
        </div>
      )}

      {/* Details */}
      <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-1">
        <Link to={linkId ? `/product/${encodeURIComponent(String(linkId))}` : '#'} className="block">
          <h3 className="font-bold text-sm sm:text-base md:text-lg lg:text-xl text-gray-900 mb-1 line-clamp-1 hover:text-purple-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-2 sm:mb-3 line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price & discount */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            {fakeOriginalPrice > priceAmount && (
              <div className="text-xs sm:text-sm text-gray-400 line-through mb-0.5 sm:mb-1">
                {fakeOriginalPrice.toLocaleString()}
              </div>
            )}

            <div className="flex items-baseline space-x-1.5 sm:space-x-2 md:space-x-3">
              <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 truncate">
                {priceAmount.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm md:text-base text-gray-700 font-medium flex-shrink-0">
                {priceCurrency}
              </span>
            </div>
          </div>

          {hasStock && discountPercentage > 0 && (
            <div className="bg-pink-50 text-pink-600 text-xs sm:text-sm md:text-base font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg flex-shrink-0 ml-2">
              -{discountPercentage}%
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-2">
          {hasStock ? (
            <>
              {/* Quantity Control */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1.5 sm:p-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(String(quantity - 1));
                    }}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  
                  <input
                    id={`qty-${product.productId ?? product.slug ?? product.name}`}
                    type="number"
                    min={1}
                    max={availableStock || undefined}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-12 sm:w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label={t('quantity', 'Quantity')}
                  />
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(String(quantity + 1));
                    }}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                    disabled={availableStock > 0 && quantity >= availableStock}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                type="button"
                className="w-full bg-gradient-to-r from-[#5D2D2C] to-[#7a3a38] text-white py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base hover:shadow-lg hover:from-[#4e2524] hover:to-[#6a3230] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('adding', 'Adding...')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{t('add_to_cart', 'Add to cart')}</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full py-3 bg-gray-100 rounded-lg text-center">
              <span className="text-xs sm:text-sm text-gray-500 font-medium">{t('out_of_stock', 'Out of stock')}</span>
            </div>
          )}
        </div>

        {actionError && (
          <div className="text-xs sm:text-sm text-red-600 mt-2 p-2 bg-red-50 rounded">{actionError}</div>
        )}
      </div>
    </article>
  );
}