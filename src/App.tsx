// src/App.tsx
import  { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute'; 
import './i18n';
import Cookies from 'js-cookie';

import Navbar from './Mycomponents/dashboard/layout/Navbar';
import LandingPage from './Mycomponents/dashboard/layout/LandingPage';

import ProductsSection from './Mycomponents/Products/pages/ProductsSection';
import ProductDetailPage from './Mycomponents/Products/pages/ProductDetail';

// Admin Components
import AdminLayout from './Mycomponents/AdminDashboard/Pages/AdminLayout';
import ProductsManagement from './Mycomponents/AdminDashboard/Pages/ProductsManagement';
import OrdersManagement from './Mycomponents/AdminDashboard/Pages/OrdersManagement';
import PaymentsManagement from './Mycomponents/AdminDashboard/Pages/PaymentsManagement';
import UsersManagement from './Mycomponents/AdminDashboard/Pages/UsersManagement';

// User Pages
import LoginPage from './Mycomponents/Users/pages/LoginPage';
import RegisterPage from './Mycomponents/Users/pages/RegisterPage';
import ForgotPasswordPage from './Mycomponents/Users/pages/ForgotPasswordPage';
import ProfilePage from './Mycomponents/Users/pages/ProfilePage';
import ProductGridWrapper from './Mycomponents/Categories/pages/ProductGridWrapper';

//OrderPage
import OrdersPage from './Mycomponents/orders/page/OrdersPage';

//ShippingInfo
import Shipping from './Mycomponents/ShippingInfo/pages/Shipping';

// Checkout Components
import { CartProvider } from './Mycomponents/ShippingInfo/pages/CartProvider';
import OrdersScreen from './Mycomponents/ShippingInfo/pages/OrdersScreen';
import ShippingScreen from './Mycomponents/ShippingInfo/pages/ShippingScreen';
import PaymentScreen from './Mycomponents/ShippingInfo/pages/PaymentScreen';

function CheckoutWrapper() {
const [step, setStep] = useState(0);
const userCookie = Cookies.get('user');
const userId = userCookie ? JSON.parse(userCookie).userId : '';
  const steps = [
<OrdersScreen userId={userId} onNext={() => setStep(1)} />,
    <ShippingScreen key="shipping" onNext={() => setStep(2)} onBack={() => setStep(0)} />,
    <PaymentScreen key="payment" onBack={() => setStep(1)} />,
  ];

  return steps[step];
}

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

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/products" replace />} />
          <Route path="products" element={<ProductsManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="payments" element={<PaymentsManagement />} />
          <Route path="users" element={<UsersManagement />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Shipping */}
        <Route path="/shipping" element={<Shipping />} />

        {/* Checkout Routes */}
        <Route path="/checkout/*" element={
          <CartProvider>
            <CheckoutWrapper />
          </CartProvider>
        } />

        {/* 404 */}
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
