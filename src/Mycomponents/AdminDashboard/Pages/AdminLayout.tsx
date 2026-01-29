import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Package, ShoppingCart, DollarSign, Users, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  /* ================= MEMO ================= */

  const navItems = useMemo(
    () => [
      { key: 'products_tab', path: '/admin/products', icon: Package },
      { key: 'orders_tab', path: '/admin/orders', icon: ShoppingCart },
      { key: 'payments_tab', path: '/admin/payments', icon: DollarSign },
      { key: 'users_tab', path: '/admin/users', icon: Users }
    ],
    []
  );

  const isRtl = useMemo(
    () => (i18n.language || '').startsWith('ar'),
    [i18n.language]
  );

  /* ================= CALLBACKS ================= */

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(v => !v);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleBackToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /* ================= EFFECT ================= */

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [isRtl]);

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav
        className="bg-white shadow-md"
        style={{ background: '#5D2D2C' }}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {t('admin_dashboard', 'Admin Dashboard')}
            </h1>

            <div className="flex items-center gap-3">
              {/* Back to Home (Desktop) */}
              <button
                onClick={handleBackToHome}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                aria-label={t('back_to_home', 'Back to Home')}
              >
                <Home size={18} />
                {t('home', 'Home')}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden text-white p-2"
                aria-label={t('toggle_menu', 'Toggle menu')}
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      active
                        ? 'bg-white text-[#5D2D2C]'
                        : 'text-white hover:bg-white/20'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} />
                    {t(item.key, item.key)}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 space-y-2">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`w-full text-left px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      active
                        ? 'bg-white text-[#5D2D2C]'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    <Icon size={18} />
                    {t(item.key, item.key)}
                  </Link>
                );
              })}

              {/* Mobile Home */}
              <button
                onClick={() => {
                  handleBackToHome();
                  closeMobileMenu();
                }}
                className="w-full text-left px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-white hover:bg-white/20"
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

export default React.memo(AdminLayout);
