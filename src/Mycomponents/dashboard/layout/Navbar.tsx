// src/components/Navbar.tsx
import { ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cartCount] = useState(0);

  // local state for search input
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  // handle RTL/LTR direction
  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
  }, [i18n.language]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const changeLanguage = (lang: 'ar' | 'en') => {
    i18n.changeLanguage(lang);
    Cookies.set('language', lang);
  };

  // navigate to products page with query param
  const handleSearch = (value?: string) => {
    const q = (value ?? searchInput).trim();
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/products`);
    }
    setIsSearchOpen(false);
  };

  const onKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const isRtl = i18n.language === 'ar';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Bar (desktop only) */}
      <div className="hidden md:block bg-gradient-to-r from-[#5D2D2C] to-[#7a3f3e] border-b border-gray-200 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className={`flex items-center space-x-4 text-white/90 ${isRtl ? 'space-x-reverse' : ''}`}>
            <span className="flex items-center">
              <svg className={`w-4 h-4 ${isRtl ? 'ml-1' : 'mr-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +20 123 456 789
            </span>
            <span className="flex items-center">
              <svg className={`w-4 h-4 ${isRtl ? 'ml-1' : 'mr-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@cosmetics.com
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-white/90 text-sm">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('ar')}
                className={`px-2 py-1 rounded ${i18n.language === 'ar' ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                عربي
              </button>
            </div>
            <Link to="/profile" className="text-white hover:text-white/80 transition-colors font-medium">
              {t('my_account', 'My Account')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Left Section: Mobile Menu & Logo */}
          <div className={`flex items-center ${isRtl ? 'space-x-3 lg:space-x-6 space-x-reverse' : 'space-x-3 lg:space-x-6'}`}>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 -ml-2"
              aria-label={t('toggle_menu', 'Toggle menu')}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Logo */}
            <Link to="/" className={`flex items-center ${isRtl ? 'space-x-2 space-x-reverse' : 'space-x-2'} group`}>
              <div className="relative">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-[#5D2D2C] to-[#8B4545] rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-pink-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block text-left" style={{ textAlign: isRtl ? 'right' as const : 'left' as const }}>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#5D2D2C] to-[#8B4545] bg-clip-text text-transparent">
                  GlowStore
                </h1>
                <p className="text-xs text-gray-500 -mt-1">{t('tagline', 'Beauty & Cosmetics')}</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div
            className="hidden lg:flex items-center gap-x-8 xl:gap-x-10"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {[
              { name: t('home', 'Home'), path: '/' },
              { name: t('premium', 'Premium'), path: '/products/premium' },
              { name: t('makeup', 'Makeup'), path: '/products/makeup' },
              { name: t('brands', 'Brands'), path: '/products/brands' },
              { name: t('perfume', 'Perfume'), path: '/products/perfume' }
            ].map(item => (
              <Link
                key={item.name}
                to={item.path}
                className="text-gray-700 hover:text-[#5D2D2C] font-medium relative group transition-colors"
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 ${isRtl ? 'right-0' : 'left-0'} w-0 h-0.5 bg-[#5D2D2C] group-hover:w-full transition-all duration-300`}
                ></span>
              </Link>
            ))}
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t('search_placeholder', 'Search for products...')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5D2D2C] focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={onKeyDownSearch}
                aria-label={t('search_products', 'Search products')}
                style={{ direction: isRtl ? 'rtl' : 'ltr' }}
              />
              <svg 
                className={`${isRtl ? 'absolute right-3 left-auto' : 'absolute left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                onClick={() => handleSearch()}
                role="button"
                aria-hidden={false}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center" style={{ gap: isRtl ? undefined : '0.5rem' }}>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={t('search', 'Search')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <Link
                to="/orders"
                className="hidden sm:block p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative transition-colors"
                aria-label={t('my_orders', 'My Orders')}
              >
                <ShoppingBag className="w-6 h-6" />
              </Link>

              {/* Cart */}
              <Link
                to="/shipping"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative transition-colors"
                aria-label={t('shopping_cart', 'Shopping cart')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className={`absolute -top-1 ${isRtl ? '-left-1' : '-right-1'} bg-[#5D2D2C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-md`}>
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Language buttons for mobile (visible on small screens) */}
              <div className="md:hidden flex items-center gap-1">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-2 py-1 rounded text-sm ${i18n.language === 'en' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
                  aria-label="English"
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage('ar')}
                  className={`px-2 py-1 rounded text-sm ${i18n.language === 'ar' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
                  aria-label="Arabic"
                >
                  عربي
                </button>
              </div>

              {/* User Account - Mobile */}
              <Link to="/profile" className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" aria-label={t('my_account', 'My account')}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden pb-4 animate-slideDown">
            <div className="relative">
              <input
                type="text"
                placeholder={t('search_placeholder', 'Search for products...')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5D2D2C] focus:border-transparent bg-gray-50 focus:bg-white"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={onKeyDownSearch}
                autoFocus
                style={{ direction: isRtl ? 'rtl' : 'ltr' }}
              />
              <svg 
                className={`${isRtl ? 'absolute right-3 left-auto' : 'absolute left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                onClick={() => handleSearch()}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          ></div>

          {/* Menu Content - enter from left for LTR, from right for RTL */}
          <div
            className={`fixed top-0 ${isRtl ? 'right-0' : 'left-0'} bottom-0 w-80 max-w-[85vw] bg-white z-50 overflow-y-auto shadow-2xl 
              ${isRtl ? 'animate-slideInRight' : 'animate-slideInLeft'}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[#5D2D2C] to-[#7a3f3e]">
              <h2 className="text-lg font-bold text-white">{t('menu', 'Menu')}</h2>
              <div className="flex items-center gap-2">
                {/* language toggles inside menu header (visible on mobile) */}
                <div className="hidden sm:hidden flex items-center gap-1" />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`px-2 py-1 rounded text-sm ${i18n.language === 'en' ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    aria-label="English"
                  >
                    EN
                  </button>
                  <button
                    onClick={() => changeLanguage('ar')}
                    className={`px-2 py-1 rounded text-sm ${i18n.language === 'ar' ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    aria-label="Arabic"
                  >
                    عربي
                  </button>
                </div>

                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label={t('close_menu', 'Close menu')}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-1">
              {[
                { name: t('home', 'Home'), path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { name: t('premium', 'Premium'), path: '/products/premium', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
                { name: t('makeup', 'Makeup'), path: '/products/makeup', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
                { name: t('brands', 'Brands'), path: '/products/brands', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
                { name: t('perfume', 'Perfume'), path: '/products/perfume', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#5D2D2C]/5 hover:to-[#8B4545]/5 hover:text-[#5D2D2C] rounded-xl transition-all font-medium group"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className={`w-5 h-5 ${isRtl ? 'ml-3' : 'mr-3'} text-gray-400 group-hover:text-[#5D2D2C]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center">
                  <svg className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +20 123 456 789
                </p>
                <p className="flex items-center">
                  <svg className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@cosmetics.com
                </p>

                {/* language (footer) */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`px-3 py-1 rounded text-sm border ${i18n.language === 'en' ? 'bg-white' : 'bg-transparent'}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => changeLanguage('ar')}
                    className={`px-3 py-1 rounded text-sm border ${i18n.language === 'ar' ? 'bg-white' : 'bg-transparent'}`}
                  >
                    عربي
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
