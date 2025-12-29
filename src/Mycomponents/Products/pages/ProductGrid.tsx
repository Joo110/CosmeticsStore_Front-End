import React, { useMemo, useState, useEffect, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts, useProductsByCategoryName } from '../hooks/useProducts';
import type { ProductsQuery } from '../../../types/product.types';
import type { Product as ProductType } from '../../../types/product.types';

/* eslint-disable @typescript-eslint/no-explicit-any */


/**
 * Derived item shape used inside this component.
 * Kept as a concrete local type to avoid `ReturnType<...>` misuse.
 */
type DerivedItem = {
  product: ProductType;
  activeVariant: any | null;
  primaryImage: any | null;
  priceAmount: number;
  priceCurrency: string;
  formattedPrice: string;
  formattedOriginal: string;
  hasStock: boolean;
  fakeOriginalPrice: number;
  discountPercentage: number;
  rating: number;
  media: any[];
};

interface ProductGridProps {
  category?: string;
  title?: string;
  showFilters?: boolean;
  limit?: number;
  initialQuery?: ProductsQuery;
  onAddToCart?: (productId: string, variantId: string) => void;
}

function hashStringToNumber(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}

const ProductGrid: React.FC<ProductGridProps> = ({
  category = '',
  title = 'Products',
  showFilters = true,
  limit = 12,
  initialQuery = {},
  onAddToCart
}) => {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState('Show product');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const {
    products: allProducts = [],
    loading: productsLoading,
    error: productsError,
    fetchProducts
  } = useProducts({});

  const {
    products: catProducts = [],
    loading: catLoading,
    error: catError
  } = useProductsByCategoryName(category || '');

  const productsSource = category ? catProducts : allProducts;
  const loading = category ? catLoading : productsLoading;
  const error = category ? (catError ?? productsError) : productsError;

  useEffect(() => {
    if (!category) {
      // ProductsQuery type may not include 'limit' — keep original behavior but pass as any to avoid TS error.
      const q: any = { ...(initialQuery as any) };
      if (limit !== undefined) q.limit = limit;
      void fetchProducts(q);
    }
  }, [category, initialQuery, limit, fetchProducts]);

  const displayTitle = title ?? (category ? category.toUpperCase() : t('products', 'Products'));
  const filterOptions = [
    t('show_product', 'Show product'),
    t('new_arrival', 'New Arrival'),
    t('best_seller', 'Best Seller'),
    t('on_sale', 'On Sale')
  ];

  const derivedProducts: DerivedItem[] = useMemo(() => {
    const list = (productsSource || []) as ProductType[];
    return list.map((product: ProductType) => {
      const variants = Array.isArray((product as any).variants) ? (product as any).variants : [];
      const activeVariant = variants.find((v: any) => v.isActive) ?? variants[0] ?? null;

      const media = Array.isArray((product as any).media) ? (product as any).media : [];
      const primaryImage = media.find((m: any) => m.isPrimary) || media[0] || null;

      const priceAmount = Number((activeVariant as any)?.priceAmount ?? (activeVariant as any)?.price ?? (product as any).price ?? 0);
      const priceCurrency = String((activeVariant as any)?.priceCurrency ?? (product as any).priceCurrency ?? 'EGP');

      const hasStock = Boolean(activeVariant && Number((activeVariant as any).stock ?? (activeVariant as any).available ?? 0) > 0);

      let fakeOriginalPrice = 0;
      if (priceAmount && priceAmount > 0) {
        const minExtra = 0.15;
        const maxExtra = 0.4;
        const seed = hashStringToNumber(String(product.productId ?? product.slug ?? '0'));
        const rnd01 = (seed % 1000) / 1000;
        const factor = 1 + minExtra + rnd01 * (maxExtra - minExtra);
        fakeOriginalPrice = Math.ceil(priceAmount * factor);
      }

      const discountPercentage = fakeOriginalPrice && fakeOriginalPrice > priceAmount
        ? Math.round(((fakeOriginalPrice - priceAmount) / fakeOriginalPrice) * 100)
        : 0;

      const ratingSeed = hashStringToNumber(String(product.productId ?? product.slug ?? '0')) % 2;
      const rating = 4 + ratingSeed;

      let formattedPrice = '';
      let formattedOriginal = '';
      try {
        formattedPrice = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: priceCurrency,
          maximumFractionDigits: 0
        }).format(priceAmount);
      } catch {
        formattedPrice = `${priceAmount.toLocaleString()} ${priceCurrency}`;
      }
      try {
        if (fakeOriginalPrice > 0) {
          formattedOriginal = new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: priceCurrency,
            maximumFractionDigits: 0
          }).format(fakeOriginalPrice);
        }
      } catch {
        formattedOriginal = fakeOriginalPrice > 0 ? `${fakeOriginalPrice.toLocaleString()} ${priceCurrency}` : '';
      }

      return {
        product,
        activeVariant,
        primaryImage,
        priceAmount,
        priceCurrency,
        formattedPrice,
        formattedOriginal,
        hasStock,
        fakeOriginalPrice,
        discountPercentage,
        rating,
        media,
      };
    });
  }, [productsSource]);

  const totalPages = Math.max(1, Math.ceil(derivedProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = derivedProducts.slice(startIndex, endIndex);

  const handleAddToCart = (productId: string, variantId: string) => {
    if (onAddToCart) onAddToCart(productId, variantId);
    else console.log('Add to cart (noop):', productId, variantId);
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 text-base sm:text-lg font-medium">{t('error_loading_products', 'Error loading products')}</p>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">{String(error)}</p>
        </div>
      </div>
    );
  }

  function ProductCardInline({
    item,
  }: {
    item: DerivedItem;
  }) {
    const {
      product,
      primaryImage,
      priceAmount,
      priceCurrency,
      formattedOriginal,
      hasStock,
      fakeOriginalPrice,
      discountPercentage,
      activeVariant,
      media
    } = item;

    const linkId = (product as any).productId ?? (product as any).slug ?? '';

    // idx parameter removed (was unused) — keep keyboard handling behavior unchanged
    const onThumbnailKey = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
      }
    };

    return (
      <div className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-100 w-full h-full flex flex-col">
        {hasStock && (
          <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4 z-10">
            <span className="bg-emerald-600 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm" role="status">
              {t('trending', 'Trending')}
            </span>
          </div>
        )}

        <Link
          to={linkId ? `/product/${encodeURIComponent(String(linkId))}` : '#'}
          className="flex-1 flex flex-col"
          aria-label={typeof (product as any).name === 'string' ? String((product as any).name) : t('product', 'Product')}
        >
          <div className="relative rounded overflow-hidden flex-1 flex flex-col">
            <div className="relative h-40 sm:h-48 md:h-52 lg:h-56 xl:h-64 bg-gray-50 overflow-hidden">
              {primaryImage ? (
                <img
                  src={(primaryImage as any).url ?? (primaryImage as any).src ?? ''}
                  alt={(product as any).name ?? (product as any).title ?? t('product', 'product')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e: any) => {
                    if (e?.target) e.target.src = 'https://via.placeholder.com/600x600?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <span className="text-5xl sm:text-6xl lg:text-7xl" aria-hidden>🧴</span>
                  <span className="sr-only">{t('no_image', 'No image available')}</span>
                </div>
              )}

              {Array.isArray(media) && media.length > 1 && (
                <div className="hidden sm:flex absolute bottom-2 sm:bottom-3 lg:bottom-4 left-1/2 -translate-x-1/2 space-x-1.5 sm:space-x-2" role="list">
                  {media.slice(0, 4).map((m: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onKeyDown={(e) => onThumbnailKey(e)}
                      className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-white/90 rounded overflow-hidden shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-110 transition-transform"
                      aria-label={t('thumbnail', 'Thumbnail {{number}}', { number: idx + 1 })}
                      type="button"
                    >
                      <img
                        src={m.url}
                        alt={`thumb-${idx}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e: any) => { if (e?.target) (e.target.src = 'https://via.placeholder.com/80x80?text=No'); }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {!hasStock && (
                <div className="absolute bottom-0 left-0 right-0 bg-gray-500 text-white text-[10px] sm:text-[11px] font-medium py-1.5 sm:py-2 text-center" role="status">
                  {t('out_of_stock', 'Out of Stock')}
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 lg:p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-sm sm:text-base md:text-lg lg:text-xl text-gray-900 mb-1 sm:mb-1.5 line-clamp-1 hover:text-purple-600 transition-colors">
                {(product as any).name ?? (product as any).title}
              </h3>

              <p className="hidden sm:block text-xs sm:text-sm md:text-base text-gray-500 mb-2 sm:mb-3 line-clamp-2">
                {(product as any).description ?? ''}
              </p>

              <div className="flex items-end justify-between mb-3 sm:mb-4 mt-auto">
                <div className="flex flex-col">
                  {fakeOriginalPrice > priceAmount && (
                    <div className="text-xs sm:text-sm text-gray-400 line-through mb-0.5 sm:mb-1" aria-hidden>
                      {formattedOriginal}
                    </div>
                  )}

                  <div className="flex items-baseline space-x-1 sm:space-x-2">
                    <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900" aria-live="polite">
                      {priceAmount.toLocaleString()}
                    </span>
                    <span className="text-xs sm:text-sm md:text-base text-gray-700 font-medium" aria-hidden>
                      {priceCurrency}
                    </span>
                  </div>
                </div>

                {hasStock && discountPercentage > 0 && (
                  <div className="bg-pink-50 text-pink-600 text-xs sm:text-sm md:text-base font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg" aria-hidden>
                    -{discountPercentage}%
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {hasStock ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const productId = (product as any).productId ?? (product as any).slug;
                      const variantId = (activeVariant as any)?.productVariantId ?? (activeVariant as any)?.id ?? '';
                      if (productId && variantId) handleAddToCart(String(productId), String(variantId));
                    }}
                    className="flex-1 bg-gradient-to-r from-[#5D2D2C] to-[#7a3a38] text-white py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm lg:text-base hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5D2D2C] active:scale-95"
                    aria-label={t('add_to_cart', 'Add to cart')}
                    type="button"
                  >
                    {t('add_to_cart', 'Add to cart')}
                  </button>
                ) : (
                  <div className="flex-1 text-center text-xs sm:text-sm text-gray-500 py-2 sm:py-2.5 lg:py-3">
                    {t('out_of_stock', 'Out of stock')}
                  </div>
                )}

                <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 hover:border-gray-300 transition-colors" aria-hidden>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-medium text-gray-900">
          {loading ? t('loading', 'Loading...') : displayTitle}
        </h2>

        {showFilters && (
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 transition-shadow"
            aria-label={t('filter_products', 'Filter products')}
          >
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse" aria-hidden>
              <div className="bg-gray-200 aspect-square rounded-2xl mb-3"></div>
              <div className="h-2 sm:h-2.5 bg-gray-200 rounded mb-2"></div>
              <div className="h-2 sm:h-2.5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 sm:h-3.5 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {currentProducts.map((item) => {
              // preserve original key generation behavior
              // eslint-disable-next-line react-hooks/purity
              const key = (item.product as any).productId ?? (item.product as any).slug ?? JSON.stringify((item.product as any).title ?? Math.random());
              return <ProductCardInline key={key} item={item as DerivedItem} />;
            })}
          </div>

          {/* Pagination */}
          {derivedProducts.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 sm:gap-1.5 mt-8 sm:mt-10 lg:mt-12">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-sm sm:text-base ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 active:bg-gray-200'} transition-colors`}
                aria-label={t('previous_page', 'Previous page')}
              >
                ←
              </button>

              {[...Array(Math.min(totalPages, 6))].map((_, idx) => {
                let pageNum = idx + 1;

                if (totalPages > 6) {
                  if (idx === 3) {
                    return (
                      <span key="dots" className="px-1 text-gray-400 text-xs sm:text-sm">
                        ...
                      </span>
                    );
                  }
                  if (idx > 3) {
                    pageNum = totalPages - (5 - idx);
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all ${currentPage === pageNum ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'}`}
                    aria-label={t('goto_page', 'Go to page {{number}}', { number: pageNum })}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-sm sm:text-base ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 active:bg-gray-200'} transition-colors`}
                aria-label={t('next_page', 'Next page')}
              >
                →
              </button>
            </div>
          )}

          {/* Empty State */}
          {derivedProducts.length === 0 && !loading && (
            <div className="text-center py-12 sm:py-16 lg:py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm sm:text-base lg:text-lg font-medium">{t('no_products_available', 'No products available')}</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">{t('check_back_later', 'Check back later for new items')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductGrid;
