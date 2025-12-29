import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import './i18n'; // ⚠️ مهم جدًا!

import Navbar from '../src/Mycomponents/dashboard/layout/Navbar';
import LandingPage from '../src/Mycomponents/dashboard/layout/LandingPage';

import ProductsSection from '../src/Mycomponents/Products/pages/ProductsSection';
import ProductDetailPage from '../src/Mycomponents/Products/pages/ProductDetail';

// Admin Components
import AdminLayout from '../src/Mycomponents/AdminDashboard/Pages/AdminLayout';
import ProductsManagement from '../src/Mycomponents/AdminDashboard/Pages/ProductsManagement';
import OrdersManagement from '../src/Mycomponents/AdminDashboard/Pages/OrdersManagement';
import PaymentsManagement from '../src/Mycomponents/AdminDashboard/Pages/PaymentsManagement';
import UsersManagement from '../src/Mycomponents/AdminDashboard/Pages/UsersManagement';

// Import Pages
import LoginPage from '../src/Mycomponents/Users/pages/LoginPage';
import RegisterPage from '../src/Mycomponents/Users/pages/RegisterPage';
import ForgotPasswordPage from '../src/Mycomponents/Users/pages/ForgotPasswordPage';
import ProfilePage from '../src/Mycomponents/Users/pages/ProfilePage';
import ProductGridWrapper from './Mycomponents/Categories/pages/ProductGridWrapper';

//OrderPage
import OrdersPage from './Mycomponents/orders/page/OrdersPage';

//ShippingInfo
import Shipping from '../src/Mycomponents/ShippingInfo/pages/Shipping';

function AppContent() {
  const location = useLocation();
  
  const hideNavbar = location.pathname.startsWith('/admin');

  return (
    <>
      {!hideNavbar && <Navbar />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Product Routes */}
        <Route path="/products" element={<ProductsSection />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/products/:category" element={<ProductGridWrapper />} />

        {/* Orders Route */}
        <Route path="/orders" element={<OrdersPage />} />

        {/* Admin Routes*/}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/products" replace />} />
          <Route path="products" element={<ProductsManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="payments" element={<PaymentsManagement />} />
          <Route path="users" element={<UsersManagement />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="/shipping" element={<Shipping />} />
        
        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;