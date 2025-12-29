import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Package, ShoppingCart, DollarSign, Users, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // make nav items use translation keys (do not hardcode visible text)
  const navItems = [
    { key: 'products_tab', path: '/admin/products', icon: Package },
    { key: 'orders_tab', path: '/admin/orders', icon: ShoppingCart },
    { key: 'payments_tab', path: '/admin/payments', icon: DollarSign },
    { key: 'users_tab', path: '/admin/users', icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleBackToHome = () => {
    navigate('/');
  };

  // set document direction (rtl/ltr) according to language
  useEffect(() => {
    const lang = i18n.language || '';
    const dir = lang.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
  }, [i18n.language]);

  const isRtl = (i18n.language || '').startsWith('ar');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md" style={{ background: '#5D2D2C' }} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{t('admin_dashboard', 'Admin Dashboard')}</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Back to Home Button */}
              <button
                onClick={handleBackToHome}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                aria-label={t('back_to_home', 'Back to Home')}
              >
                <Home size={18} />
                <span>{t('home', 'Home')}</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-white p-2"
                aria-label={t('toggle_menu', 'Toggle menu')}
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      isActive(item.path) ? 'bg-white text-[#5D2D2C]' : 'text-white hover:bg-white/20'
                    }`}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                  >
                    <Icon size={18} />
                    {t(item.key as unknown as string, item.key)}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full text-left px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      isActive(item.path) ? 'bg-white text-[#5D2D2C]' : 'text-white hover:bg-white/20'
                    }`}
                  >
                    <Icon size={18} />
                    {t(item.key as unknown as string, item.key)}
                  </Link>
                );
              })}

              {/* Mobile Home Button */}
              <button
                onClick={() => {
                  handleBackToHome();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-white hover:bg-white/20"
                aria-label={t('back_to_home', 'Back to Home')}
              >
                <Home size={18} />
                {t('back_to_home', 'Back to Home')}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
