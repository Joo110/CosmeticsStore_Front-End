import { useState, useMemo, useEffect, type JSX, type KeyboardEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Heart, ShoppingCart, Star, Minus, Plus, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProduct, useProducts } from '../hooks/useProducts';
import { resolveImageUrl } from '../../Users/utils/images';
import { useAddToCart } from '../../Carts/hooks/useAddToCart';
import authService from '../../Users/Services/authService';

export default function ProductDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const { product, loading: productLoading, error: productError } = useProduct(id || '');

  // recommended products via useProducts hook
  const { products: allProducts = [], loading: recLoading, error: recError } = useProducts({
    pageSize: 50,
    isPublished: true,
  });

  // add-to-cart hook
  const { addItem, loading: actionLoading} = useAddToCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'additional'>('description');

  const RECOMMENDED_COUNT = 8;
  const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800x800?text=No+Image';

  // normalize images from several possible shapes
  const images: string[] = useMemo(() => {
    if (!product) return [];
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const anyP: any = product;
    if (Array.isArray(anyP.images) && anyP.images.length > 0) return anyP.images as string[];
    if (Array.isArray(anyP.media) && anyP.media.length > 0)
      return anyP.media.map((m: any) => (typeof m === 'string' ? m : m.url));
    if (anyP.image) return [anyP.image];
    return [];
  }, [product]);

  // when product changes reset some UI state
  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
  }, [product?.productId ?? id]);

  const handlePrevImage = () => {
    if (!images || images.length === 0) return;
    setSelectedImage(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!images || images.length === 0) return;
    setSelectedImage(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // keyboard shortcuts for image navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent | KeyboardEventInit) => {
      if (e instanceof KeyboardEvent === false && typeof (e as any).key === 'undefined') return;
      const key = (e as any).key as string;
      if (key === 'ArrowLeft') handlePrevImage();
      if (key === 'ArrowRight') handleNextImage();
    };
    window.addEventListener('keydown', onKey as any);
    return () => window.removeEventListener('keydown', onKey as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    if (type === 'increase') {
      setQuantity(prev => prev + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Helper to get product image for recommended list (compatible shapes)
  const getImage = (p: any) => {
    if (!p) return PLACEHOLDER_IMAGE;
    if (p.image) return p.image;
    if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
    if (Array.isArray(p.media) && p.media.length > 0) return typeof p.media[0] === 'string' ? p.media[0] : p.media[0].url;
    return PLACEHOLDER_IMAGE;
  };

  // deterministic pseudo-random based on string (keeps fake price stable)
  const seededRand = (seedStr: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return (h % 1000) / 1000;
  };

  // Build recommended list
  const recommended = useMemo(() => {
    if (recLoading || !allProducts || allProducts.length === 0) return [];
    const currentId = product?.productId ?? id ?? undefined;

    const filtered = allProducts.filter((p: any) => {
      const pid = p.id ?? p.productId ?? p._id ?? p.slug;
      return Boolean(pid) && pid !== currentId;
    });

    if (filtered.length === 0) return [];

    const shuffled = [...filtered].sort((a: any, b: any) => {
      const aid = String(a.id ?? a.productId ?? a._id ?? a.slug ?? '');
      const bid = String(b.id ?? b.productId ?? b._id ?? b.slug ?? '');
      return seededRand(aid) - seededRand(bid);
    });

    return shuffled.slice(0, RECOMMENDED_COUNT).map((p: any) => {
      const pid = p.id ?? p.productId ?? p._id ?? p.slug ?? String(Math.random());
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const variant = variants.find((v: any) => v?.isActive) ?? variants[0] ?? null;

      const priceAmt = Number(variant?.priceAmount ?? p.price ?? p.priceAmount ?? 0);
      const currency = variant?.priceCurrency ?? p.priceCurrency ?? 'USD';
      const backendOriginal = Number(variant?.originalPrice ?? variant?.listPrice ?? p.originalPrice ?? p.listPrice ?? 0);

      let fakeOriginal = backendOriginal && backendOriginal > priceAmt ? Math.ceil(backendOriginal) : 0;
      if (!fakeOriginal || fakeOriginal <= priceAmt) {
        const rnd = seededRand(pid);
        const minExtra = 0.15;
        const maxExtra = 0.7;
        const factor = 1 + minExtra + rnd * (maxExtra - minExtra);
        fakeOriginal = Math.ceil(priceAmt * factor);
        if (fakeOriginal <= priceAmt) fakeOriginal = priceAmt + 1;
      }

      const discountPercent = fakeOriginal > priceAmt ? Math.round(((fakeOriginal - priceAmt) / fakeOriginal) * 100) : 0;

      return {
        pid,
        name: p.name ?? p.title ?? t('untitled', 'Untitled'),
        brand: p.brand ?? '',
        image: getImage(p),
        priceAmount: priceAmt,
        priceCurrency: currency,
        originalPrice: fakeOriginal,
        discountPercent,
        rating: Number(p.rating ?? Math.round(3 + seededRand(pid) * 2)),
        raw: p,
      };
    });
  }, [allProducts, product, id, recLoading, t]);

  // activeVariant-like info for main product price/stock
  const variants: any[] = product?.variants ?? [];
  const firstVariant = variants[0] ?? undefined;
  const activeVariant = variants.find((v: any) => v?.isActive) ?? firstVariant;
  const hasStock = Boolean(activeVariant && Number(activeVariant.stock) > 0);
  const availableStock = Number(activeVariant?.stock ?? 0);

  const priceAmount = Number(activeVariant?.priceAmount ?? firstVariant?.priceAmount ?? (product as any)?.price ?? 0);
  const originalPrice = Number(activeVariant?.originalPrice ?? firstVariant?.listPrice ?? (product as any)?.originalPrice ?? 0);
  const discount = originalPrice > priceAmount && originalPrice > 0 ? Math.round((1 - priceAmount / originalPrice) * 100) : 0;
  const priceCurrency = activeVariant?.priceCurrency ?? firstVariant?.priceCurrency ?? (product as any)?.priceCurrency ?? 'USD';

  const formattedPrice = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: priceCurrency }).format(priceAmount);
    } catch {
      return `${priceAmount.toLocaleString()} ${priceCurrency}`;
    }
  }, [priceAmount, priceCurrency]);

  const formattedOriginal = useMemo(() => {
    if (!originalPrice || originalPrice <= 0) return '';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: priceCurrency }).format(originalPrice);
    } catch {
      return `${originalPrice.toLocaleString()} ${priceCurrency}`;
    }
  }, [originalPrice, priceCurrency]);

  // --- Add to cart handler for ProductDetailPage ---
  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!activeVariant) {
      toast.error(t('no_variant_available', 'No active variant available'));
      return;
    }

    const variantId = String(activeVariant.productVariantId ?? activeVariant.id ?? '');
    if (!variantId) {
      toast.error(t('unable_add_cart', 'Unable to add to cart: invalid variant id'));
      return;
    }

    if (availableStock > 0 && quantity > availableStock) {
      toast.error(t('limited_stock', 'Only {{count}} item(s) left in stock', { count: availableStock }));
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      toast.info(t('login_to_add_cart', 'Please login to add items to cart'));
      return;
    }

    const cartItemRequest = {
      userId: currentUser.userId,
      productVariantId: variantId,
      quantity,
    };

    try {
      const res = await addItem(cartItemRequest);
      if (res) {
        toast.success(t('added_to_cart_success', '✅ Added {{count}} item(s) to cart successfully!', { count: quantity }));
      } else {
        toast.error(t('failed_add_cart', 'Failed to add to cart'));
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast.warning(t('session_expired', 'Session expired. Please login again.'));
      } else {
        toast.error(t('unexpected_error', 'An unexpected error occurred'));
      }
    }
  };
  // --- end add to cart handler ---

  // Loading / Error handling
  if (productLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" aria-hidden />
            <span className="sr-only">{t('loading_product', 'Loading product')}</span>
          </div>
        </div>
      </section>
    );
  }

  if (productError) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-red-600">
            <p>{t('error_loading_product', 'Error loading product')}: {String(productError)}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-gray-700">
            <p>{t('product_not_found', 'Product not found.')}</p>
          </div>
        </div>
      </section>
    );
  }

  const displayedImages = images.length > 0 ? images : [(product as any).image || PLACEHOLDER_IMAGE];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-[#5D2D2C]">{t('home', 'Home')}</Link>
            <span>/</span>
            <button type="button" className="hover:text-[#5D2D2C]">{t('makeup', 'Makeup')}</button>
            <span>/</span>
            <span className="text-gray-900">{(product as any).name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Side - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg aspect-square">
             <img
  src={resolveImageUrl(displayedImages[selectedImage])}
  alt={(product as any).name}
  className="w-full h-full object-cover"
  onError={(e: any) => {
    if (e?.target) e.target.src = PLACEHOLDER_IMAGE;
  }}
  loading="lazy"
/>

              {/* Navigation Arrows */}
              {displayedImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label={t('previous_image', 'Previous image')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label={t('next_image', 'Next image')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}

              {/* Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">-{discount}%</div>
              )}

              {/* Stock Badge */}
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                {hasStock ? t('in_stock', 'IN STOCK') : t('out_of_stock', 'OUT OF STOCK')}
              </div>
            </div>

            {/* Thumbnail Images */}
            {displayedImages.length > 1 && (
              <div className="flex gap-3">
                {displayedImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    onKeyDown={(e) => {
                      if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
                        e.preventDefault();
                        setSelectedImage(idx);
                      }
                    }}
                    aria-label={t('view_image_number', 'View image {{number}}', { number: idx + 1 })}
                    aria-pressed={selectedImage === idx}
                    className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      selectedImage === idx ? 'border-[#5D2D2C] shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                  <img
  src={resolveImageUrl(img)} 
  alt={t('thumbnail', 'Thumbnail {{number}}', { number: idx + 1 })}
  className="w-full h-full object-cover"
  onError={(e: any) => { if (e?.target) e.target.src = PLACEHOLDER_IMAGE; }}
  loading="lazy"
/>

                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Product Info */}
          <div className="space-y-6">
            {/* Brand */}
            <div>
              <span className="text-sm text-gray-600 uppercase tracking-wide font-semibold">{(product as any).brand ?? (product as any).name}</span>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{(product as any).name}</h1>

            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-gray-900" aria-live="polite">
                {formattedPrice}
              </span>

              {originalPrice > 0 && (
                <span className="text-2xl text-gray-500 line-through">
                  {formattedOriginal}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 ${hasStock ? 'bg-green-500' : 'bg-gray-400'} rounded-full`} />
              <span className={`text-sm font-semibold ${hasStock ? 'text-green-600' : 'text-gray-600'}`}>
                {hasStock ? t('in_stock_ready_ship', 'In Stock - Ready to Ship') : t('out_of_stock', 'Out of Stock')}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed">{(product as any).description}</p>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">{t('quantity', 'Quantity')}:</span>
              <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                <button type="button" onClick={() => handleQuantityChange('decrease')} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors" aria-label={t('decrease_quantity', 'Decrease quantity')}>
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-12 h-10 flex items-center justify-center border-x-2 border-gray-300 font-semibold" aria-live="polite">{quantity}</div>
                <button type="button" onClick={() => handleQuantityChange('increase')} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors" aria-label={t('increase_quantity', 'Increase quantity')}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Upload Prescription Notice */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
              <p className="text-sm text-amber-800 font-medium">{t('no_return_refund', 'This item cannot be returned or refunded')}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-[#5D2D2C] to-[#7a3a38] text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                aria-label={t('add_to_cart', 'Add to cart')}
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
                    <ShoppingCart className="w-5 h-5" />
                    {t('add_to_cart', 'Add to Cart')}
                  </>
                )}
              </button>
         
              <button type="button" className="w-14 h-14 border-2 border-gray-300 rounded-xl flex items-center justify-center hover:border-[#5D2D2C] transition-colors" aria-label={t('share_product', 'Share product')}>
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'description' ? 'text-[#5D2D2C] border-b-2 border-[#5D2D2C]' : 'text-gray-600 hover:text-gray-900'}`}
                aria-pressed={activeTab === 'description'}
              >
                {t('description', 'Description')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specifications')}
                className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'specifications' ? 'text-[#5D2D2C] border-b-2 border-[#5D2D2C]' : 'text-gray-600 hover:text-gray-900'}`}
                aria-pressed={activeTab === 'specifications'}
              >
                {t('specifications', 'Specifications')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('additional')}
                className={`flex-1 py-4 px-6 font-semibold transition-colors ${activeTab === 'additional' ? 'text-[#5D2D2C] border-b-2 border-[#5D2D2C]' : 'text-gray-600 hover:text-gray-900'}`}
                aria-pressed={activeTab === 'additional'}
              >
                {t('additional_info', 'Additional Info')}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && <div>{(product as any).description}</div>}
            {activeTab === 'specifications' && <pre className="whitespace-pre-wrap text-sm">{JSON.stringify((product as any).specifications ?? {}, null, 2)}</pre>}
            {activeTab === 'additional' && <div>{(product as any).additionalInfo ?? t('no_additional_info', 'No additional info')}</div>}
          </div>
        </div>

        {/* Recommended Products */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('recommended_products', 'Recommended Products')}</h2>

          {recLoading && <div className="py-8 text-center text-gray-500">{t('loading_recommended', 'Loading recommended products...')}</div>}
          {recError && <div className="py-8 text-center text-red-600">{t('failed_load_recommendations', 'Failed to load recommendations.')}</div>}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {recommended.map((p: any) => {
              return (
                <Link key={p.pid} to={`/product/${encodeURIComponent(p.pid)}`} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group" aria-label={t('view_product', 'View product {{name}}', { name: p.name })}>
                  <div className="relative aspect-square bg-gray-100">
<img
  src={resolveImageUrl(p.image)}
  alt={p.name}
  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
  onError={(e: any) => (e?.target ? (e.target.src = PLACEHOLDER_IMAGE) : null)}
  loading="lazy"
/>
                    {p.discountPercent > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">-{p.discountPercent}%</div>
                    )}
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">{t('new', 'NEW')}</div>
                    <button className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" type="button" aria-label={t('add_to_wishlist', 'Add to wishlist')}>
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="p-3">
                    <p className="text-xs text-gray-500 uppercase mb-1">{p.brand}</p>
                    <h3 className="font-medium text-sm mb-2 line-clamp-2 min-h-[2.2rem]">{p.name}</h3>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex text-yellow-400" aria-hidden>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(p.rating ?? 0) ? 'fill-yellow-400' : ''}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({p.rating ?? 0})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold">{Number(p.priceAmount).toLocaleString()}</span>
                        <span className="text-xs text-gray-600">{p.priceCurrency}</span>
                      </div>

                      {p.originalPrice > p.priceAmount && (
                        <div className="text-xs text-gray-400 line-through">{Number(p.originalPrice).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
