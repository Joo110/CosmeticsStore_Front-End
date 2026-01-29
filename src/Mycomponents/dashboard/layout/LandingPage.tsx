import { useState, useEffect } from 'react';
import ProductsSection from '../../Products/pages/ProductsSection';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: t('special_offers_title'),
      description: t('special_offers_description'),
      buttonText: t('shop_now'),
      badge: t('up_to_70_off'),
      bgGradient: 'from-rose-50 via-pink-50 to-purple-50',
      image:
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=80',
    },
    {
      id: 2,
      title: t('premium_skincare_title'),
      description: t('premium_skincare_description'),
      buttonText: t('explore_now'),
      badge: t('new_arrival'),
      bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
      image:
        'https://i.pinimg.com/736x/b8/ca/1a/b8ca1ac427c8a626aa8c0e2d90bf25be.jpg',
    },
    {
      id: 3,
      title: t('luxury_perfume_title'),
      description: t('luxury_perfume_description'),
      buttonText: t('shop_collection'),
      badge: t('premium_quality'),
      bgGradient: 'from-amber-50 via-orange-50 to-red-50',
      image:
        'https://i.pinimg.com/736x/3b/d8/f7/3bd8f7b478da8b6c27f34b729cef7f31.jpg',
    },
  ];

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleAddToCart = () => {
    // Cart logic here
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative bg-gray-50">
      {/* Hero Slider - Images hidden on small screens (mobile) */}
      <div className="relative h-[450px] sm:h-[550px] md:h-[650px] overflow-hidden bg-white">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            aria-hidden={index === activeSlide ? 'false' : 'true'}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient} mix-blend-overlay`}></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Text Column */}
                <div className="order-2 md:order-1 max-w-2xl">
                  <span className="inline-block bg-[#5D2D2C] text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4 sm:mb-6 animate-pulse">
                    {slide.badge}
                  </span>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 leading-relaxed max-w-xl">
                    {slide.description}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <button
                      className="bg-[#5D2D2C] hover:bg-[#4a2422] text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base"
                      onClick={() => window.scrollBy({ top: 1900, behavior: 'smooth' })}
                    >
                      {slide.buttonText}
                    </button>

                    <button
                      className="bg-white hover:bg-gray-50 text-[#5D2D2C] font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border-2 border-[#5D2D2C] text-sm sm:text-base"
                      onClick={() => window.scrollBy({ top: 1300, behavior: 'smooth' })}
                    >
                      {t('learn_more') || 'Learn More'}
                    </button>
                  </div>
                </div>

                {/* Image Column — hidden on small screens to match your request */}
                <div className="hidden sm:block order-1 md:order-2 h-56 md:h-80 lg:h-96 w-full rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${
                      index === activeSlide ? 'scale-100' : 'scale-105'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
          aria-label={t('previous_page') || 'Previous slide'}
        >
          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
          aria-label={t('next_page') || 'Next slide'}
        >
          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Slider Indicators - Enhanced */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 sm:space-x-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                index === activeSlide
                  ? 'bg-[#5D2D2C] w-8 sm:w-10'
                  : 'bg-gray-400 hover:bg-gray-500 w-2 sm:w-2.5'
              }`}
              aria-label={`${t('go_to_page', { page: index + 1 }) || `Go to slide ${index + 1}`}`}
            />
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <section className="py-8 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: '🚚', title: t('trust_discount_shipping_title'), desc: t('trust_discount_shipping_desc') },
              { icon: '💯', title: t('trust_quality_guarantee_title'), desc: t('trust_quality_guarantee_desc') },
              { icon: '🔒', title: t('trust_secure_payment_title'), desc: t('trust_secure_payment_desc') },
              { icon: '🎁', title: t('trust_special_offers_title'), desc: t('trust_special_offers_desc') },
            ].map((badge) => (
              <div key={badge.title} className="text-center">
                <div className="text-3xl sm:text-4xl mb-2">{badge.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{badge.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories - Enhanced */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {t('shop_by_category_title')}
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              {t('shop_by_category_desc')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { name: t('category_skincare'), image: '🧴', color: 'from-pink-100 to-pink-200', items: '120+ products' },
              { name: t('category_makeup'), image: '💄', color: 'from-purple-100 to-purple-200', items: '200+ products' },
              { name: t('category_haircare'), image: '💇‍♀️', color: 'from-blue-100 to-blue-200', items: '150+ products' },
              { name: t('category_perfume'), image: '🌸', color: 'from-amber-100 to-amber-200', items: '80+ products' },
            ].map((category) => (
              <div
                key={category.name}
                className={`group bg-gradient-to-br ${category.color} rounded-2xl p-6 sm:p-8 text-center hover:scale-105 transition-all duration-300 cursor-pointer shadow-md hover:shadow-2xl relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative">
                  <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform">
                    {category.image}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{category.items}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beauty Banner Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br via-white ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image Side */}
              <div className="relative h-64 md:h-auto bg-gradient-to-br from-[#5D2D2C] to-[#8B4545] p-8 md:p-12 flex items-center justify-center">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
                  <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white rounded-full"></div>
                </div>
                <div className="relative text-center">
                  <div className="mb-6">
                    <svg className="w-32 h-32 md:w-40 md:h-40 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <div className="w-12 h-16 bg-white/20 backdrop-blur-sm rounded-full"></div>
                    <div className="w-12 h-20 bg-white/30 backdrop-blur-sm rounded-full"></div>
                    <div className="w-12 h-16 bg-white/20 backdrop-blur-sm rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Content Side */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <span className="inline-block bg-[#5D2D2C] text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4 w-fit">
                  {t('badge_premium_collection')}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {t('beauty_banner_title')}
                </h2>
                <p className="text-gray-600 text-base md:text-lg mb-6 leading-relaxed">
                  {t('beauty_banner_description')}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">{t('benefit_100_natural')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">{t('benefit_dermatologist_tested')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">{t('benefit_cruelty_free')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">{t('benefit_eco_friendly')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summer Top Deals */}
      <ProductsSection title={t('summer_top_deals')} limit={40} onAddToCart={handleAddToCart} />

      {/* Statistics Section (unchanged) */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#5D2D2C] via-[#7d3d3c] to-[#5D2D2C] relative overflow-hidden">
        {/* ...rest unchanged... */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              {t('stats_trusted_by')}
            </h2>
            <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto">
              {t('stats_description')}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Stat cards... (kept exactly as before) */}
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-300">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2">
                  50K+
                </div>
                <div className="text-white/90 text-sm sm:text-base font-medium mb-1">
                  {t('stat_happy_customers')}
                </div>
                <div className="text-white/60 text-xs sm:text-sm">
                  {t('stat_worldwide')}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-300">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2">
                  98%
                </div>
                <div className="text-white/90 text-sm sm:text-base font-medium mb-1">
                  {t('stat_satisfaction_rate')}
                </div>
                <div className="text-white/60 text-xs sm:text-sm">
                  {t('stat_5_star_reviews')}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-300">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2">
                  200+
                </div>
                <div className="text-white/90 text-sm sm:text-base font-medium mb-1">
                  {t('stat_premium_products')}
                </div>
                <div className="text-white/60 text-xs sm:text-sm">
                  {t('stat_curated_collection')}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-300">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2">
                  15+
                </div>
                <div className="text-white/90 text-sm sm:text-base font-medium mb-1">
                  {t('stat_years_experience')}
                </div>
                <div className="text-white/60 text-xs sm:text-sm">
                  {t('stat_in_beauty_industry')}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badges */}
          <div className="mt-12 pt-12 border-t border-white/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="text-white/90">
                <div className="text-2xl mb-2">🚚</div>
                <p className="text-sm font-medium">{t('stat_free_shipping')}</p>
                <p className="text-xs text-white/60">{t('stat_free_shipping_desc')}</p>
              </div>
              <div className="text-white/90">
                <div className="text-2xl mb-2">🔒</div>
                <p className="text-sm font-medium">{t('stat_secure_payment')}</p>
                <p className="text-xs text-white/60">{t('stat_secure_payment_desc')}</p>
              </div>
              <div className="text-white/90">
                <div className="text-2xl mb-2">♻️</div>
                <p className="text-sm font-medium">{t('stat_easy_returns')}</p>
                <p className="text-xs text-white/60">{t('stat_easy_returns_desc')}</p>
              </div>
              <div className="text-white/90">
                <div className="text-2xl mb-2">💝</div>
                <p className="text-sm font-medium">{t('stat_premium_quality')}</p>
                <p className="text-xs text-white/60">{t('stat_premium_quality_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced (unchanged) */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#5D2D2C] to-[#8B4545] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">بصمه</h3>
              </div>
              <p className="text-gray-400 text-sm sm:text-base mb-4 max-w-sm">
                {t('footer_tagline') || t('tagline') || 'Your trusted destination for premium beauty and skincare products. Quality guaranteed, beauty delivered.'}
              </p>
            
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-4">{t('footer_quick_links')}</h3>
              <ul className="space-y-3 text-gray-400 text-sm sm:text-base">
                {[t('footer_shop_all'), t('footer_new_arrivals'), t('footer_best_sellers'), t('footer_sale'), t('footer_about_us')].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">→</span> {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-4">{t('footer_customer_care')}</h3>
              <ul className="space-y-3 text-gray-400 text-sm sm:text-base">
                {[t('footer_contact_us'), t('footer_shipping_info'), t('footer_returns_exchanges'), t('footer_track_order'), t('footer_faq')].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-white transition-colors flex items-center">
                      <span className="mr-2">→</span> {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-4">{t('footer_get_in_touch')}</h3>
              <ul className="space-y-3 text-gray-400 text-sm sm:text-base">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                       0566060682
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  forsantop@gmail.com
                </li>         
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 sm:mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              &copy; 2025 بصمه. {t('all_rights_reserved') || 'All rights reserved.'}
            </p>
            <div className="flex gap-6 text-gray-400 text-xs sm:text-sm">
              <a href="#" className="hover:text-white transition-colors">{t('footer_privacy_policy')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('footer_terms_of_service')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('footer_cookies')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
