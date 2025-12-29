// src/components/ProductsSection.tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/useProducts';
import ProductCard from './ProductCard';
import { useSearchParams } from 'react-router-dom';

interface ProductsSectionProps {
  title?: string;
  categoryId?: string;
  limit?: number;
  showViewAll?: boolean;
  onAddToCart?: (productId: string, variantId: string) => void;
}

export default function ProductsSection({
  title = 'Summer Top Deals',
  categoryId,
  limit = 40,
  showViewAll = true,
  onAddToCart,
}: ProductsSectionProps) {
  const { t } = useTranslation();
  
  // read search param from URL (e.g. /products?search=lipstick)
  const [searchParams] = useSearchParams();
  const searchTermParam = searchParams.get('search') ?? undefined;

  const { products, loading, error } = useProducts({
    pageSize: limit,
    categoryId,
    isPublished: true,
    searchTerm: searchTermParam, // pass the search term to the hook
  });

  const handleAddToCartInternal = (productId: string, variantId: string) => {
    if (onAddToCart) {
      onAddToCart(productId, variantId);
    } else {
      console.log('Add to cart:', productId, variantId);
    }
  };

  if (loading) {
    return (
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 text-lg font-medium">{t('error_loading_products', 'Error loading products')}</p>
            <p className="text-gray-600 mt-2">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  // optional: show dynamic title if search used
  const headerTitle = searchTermParam 
    ? t('search_results_for', 'Search results for "{{term}}"', { term: searchTermParam }) 
    : title;

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ====== Header Section ====== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 lg:mb-10">

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {headerTitle}
          </h2>
          
          {showViewAll && (
            <Link
              to="/products"
              className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200 group"
            >
              <span className="text-sm sm:text-base">{t('view_all', 'View all')}</span>
              <svg 
                className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          
          {products.map((product) => {
            const productId = product.productId ?? '';
            
            return (
              <div 
                key={productId}
                className="animate-fadeIn"
                style={{ 
                  animationDelay: `${products.indexOf(product) * 50}ms` 
                }}
              >
                <ProductCard 
                  product={product} 
                  onAddToCart={handleAddToCartInternal} 
                />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
}