import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
  useRef
} from 'react';
import { Plus, Edit2, Trash2, X, Search, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* Types */
interface ProductVariant {
  productVariantId?: string;
  sku: string;
  priceAmount: number;
  priceCurrency: string;
  stock: number;
  isActive: boolean;
}

interface ProductMedia {
  mediaId?: string;
  url: string;
  fileName: string;
  contentType: string;
  sizeInBytes: number;
  isPrimary: boolean;
}

interface Product {
  productId?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  isPublished: boolean;
  variants: ProductVariant[];
  media: ProductMedia[];
  createdAtUtc?: string;
  modifiedAtUtc?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Order {
  orderId: string;
  customerName: string;
  items: number;
  total: number;
  status: string;
  date: string;
}

interface Payment {
  paymentId: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedDate: string;
}
/* eslint-disable @typescript-eslint/no-explicit-any */

const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'payments' | 'users'>('products');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const productsMapRef = useRef<Map<string, Product>>(new Map()); // for O(1) lookup in shared handlers

  const [categories, setCategories] = useState<Category[]>([
    { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'Electronics' },
    { id: '3fa85f64-5717-4562-b3fc-2c963f66afa7', name: 'Clothing' }
  ]);
  const [orders, setOrders] = useState<Order[]>([
    { orderId: '001', customerName: 'Ahmed Mohamed', items: 3, total: 1500, status: 'Pending', date: '2025-12-20' },
    { orderId: '002', customerName: 'Sarah Ali', items: 2, total: 850, status: 'Completed', date: '2025-12-19' }
  ]);
  const [payments] = useState<Payment[]>([
    { paymentId: 'P001', orderId: '002', amount: 850, method: 'Credit Card', status: 'Completed', date: '2025-12-19' },
    { paymentId: 'P002', orderId: '001', amount: 1500, method: 'Cash', status: 'Pending', date: '2025-12-20' }
  ]);
  const [users, setUsers] = useState<User[]>([
    { userId: 'U001', name: 'Mohamed Ahmed', email: 'mohamed@example.com', role: 'Customer', joinedDate: '2025-01-15' },
    { userId: 'U002', name: 'Fatima Ali', email: 'fatima@example.com', role: 'Customer', joinedDate: '2025-02-20' }
  ]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [newProduct, setNewProduct] = useState<Product>({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    isPublished: true,
    variants: [{ sku: '', priceAmount: 0, priceCurrency: 'EGP', stock: 0, isActive: true }],
    media: []
  });

  const [newCategory, setNewCategory] = useState({ name: '' });

  useEffect(() => {
    const mockProducts: Product[] = [
      {
        productId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        name: 'Laptop Dell XPS',
        slug: 'laptop-dell-xps',
        description: 'High performance laptop for professionals',
        categoryId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        isPublished: true,
        variants: [
          { productVariantId: '1', sku: 'DELLXPS001', priceAmount: 15000, priceCurrency: 'EGP', stock: 10, isActive: true }
        ],
        media: [],
        createdAtUtc: '2025-12-01T00:00:00'
      }
    ];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(mockProducts);
  }, []);

  // keep products map up-to-date (used by shared handlers to avoid per-row closures)
  useEffect(() => {
    const m = new Map<string, Product>();
    for (const p of products) {
      if (p.productId) m.set(p.productId, p);
    }
    productsMapRef.current = m;
  }, [products]);

  const validateProductForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!newProduct.name.trim()) errors.name = t('validation_product_name_required', 'Product name is required');
    if (!newProduct.slug.trim()) errors.slug = t('validation_slug_required', 'Slug is required');
    if (!newProduct.description.trim()) errors.description = t('validation_description_required', 'Description is required');
    if (!newProduct.categoryId) errors.categoryId = t('validation_category_required', 'Category is required');
    
    newProduct.variants.forEach((variant, index) => {
      if (!variant.sku.trim()) errors[`variant_${index}_sku`] = t('validation_variant_sku_required', 'SKU is required');
      if (variant.priceAmount <= 0) errors[`variant_${index}_price`] = t('validation_variant_price_positive', 'Price must be greater than 0');
      if (variant.stock < 0) errors[`variant_${index}_stock`] = t('validation_variant_stock_non_negative', 'Stock cannot be negative');
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newProduct, t]);

  const resetProductForm = useCallback(() => {
    setNewProduct({
      name: '',
      slug: '',
      description: '',
      categoryId: '',
      isPublished: true,
      variants: [{ sku: '', priceAmount: 0, priceCurrency: 'EGP', stock: 0, isActive: true }],
      media: []
    });
    setFormErrors({});
  }, []);

  const handleAddProduct = useCallback(() => {
    if (!validateProductForm()) return;

    const product: Product = {
      ...newProduct,
      productId: Math.random().toString(),
      createdAtUtc: new Date().toISOString()
    };
    setProducts(prev => [...prev, product]);
    setShowProductModal(false);
    resetProductForm();
  }, [newProduct, validateProductForm, resetProductForm]);

  const handleUpdateProduct = useCallback(() => {
    if (!validateProductForm()) return;

    if (editingProduct?.productId) {
      setProducts(prev => prev.map(p => 
        p.productId === editingProduct.productId ? { ...newProduct, productId: editingProduct.productId } : p
      ));
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
    }
  }, [editingProduct, newProduct, validateProductForm, resetProductForm]);

  const handleDeleteProductById = useCallback((id: string) => {
    if (!id) return;
    if (confirm(t('confirm_delete_product', 'Are you sure you want to delete this product?'))) {
      setProducts(prev => prev.filter(p => p.productId !== id));
    }
  }, [t]);

  const handleEditProductById = useCallback((id: string) => {
    if (!id) return;
    const p = productsMapRef.current.get(id);
    if (!p) return;
    setEditingProduct(p);
    setNewProduct(p);
    setShowProductModal(true);
  }, []);

  // Shared click handlers that read data-id (avoids creating per-row closures)
  const handleRowActionClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    const action = el.getAttribute('data-action');
    const id = el.getAttribute('data-id') || '';
    if (!action) return;

    if (action === 'edit') {
      handleEditProductById(id);
    } else if (action === 'delete') {
      handleDeleteProductById(id);
    }
  }, [handleEditProductById, handleDeleteProductById]);

  const handleAddCategory = useCallback(() => {
    if (!newCategory.name.trim()) {
      alert(t('name_required', 'Category name is required'));
      return;
    }
    const category: Category = {
      id: Math.random().toString(),
      name: newCategory.name
    };
    setCategories(prev => [...prev, category]);
    setShowCategoryModal(false);
    setNewCategory({ name: '' });
  }, [newCategory, t]);

  const handleDeleteOrder = useCallback((id: string) => {
    if (confirm(t('confirm_delete_order', 'Are you sure you want to delete this order?'))) {
      setOrders(prev => prev.filter(o => o.orderId !== id));
    }
  }, [t]);

  const handleDeleteUser = useCallback((id: string) => {
    if (confirm(t('confirm_delete_user', 'Are you sure you want to delete this user?'))) {
      setUsers(prev => prev.filter(u => u.userId !== id));
    }
  }, [t]);

  const addVariant = useCallback(() => {
    setNewProduct(prev => ({
      ...prev,
      variants: [...prev.variants, { sku: '', priceAmount: 0, priceCurrency: 'EGP', stock: 0, isActive: true }]
    }));
  }, []);

  const updateVariant = useCallback((index: number, field: keyof ProductVariant, value: any) => {
    setNewProduct(prev => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  }, []);

  const removeVariant = useCallback((index: number) => {
    setNewProduct(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  }, []);

  // memoized heavy values
  const totalPayments = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);

  const filteredProducts = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    if (!term) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.slug.toLowerCase().includes(term)
    );
  }, [products, deferredSearch]);

  const isRtl = i18n.language === 'ar';

  // simple handler for search input (stable reference)
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md" style={{ background: '#5D2D2C' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-lg sm:text-2xl font-bold text-white">{t('admin_dashboard', 'Admin Dashboard')}</h1>
            
            {/* Mobile menu button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(s => !s)}
                className="lg:hidden text-white p-2"
                aria-label={t('open_menu', 'Open menu')}
              >
                <Menu size={22} />
              </button>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex space-x-4">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'products' ? 'bg-white text-[#5D2D2C]' : 'text-white hover:bg-white/20'}`}
                >
                  {t('products_tab', 'Products')}
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'orders' ? 'bg-white text-[#5D2D2C]' : 'text-white hover:bg-white/20'}`}
                >
                  {t('orders_tab', 'Orders')}
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'payments' ? 'bg-white text-[#5D2D2C]' : 'text-white hover:bg-white/20'}`}
                >
                  {t('payments_tab', 'Payments')}
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'users' ? 'bg-white text-[#5D2D2C]' : 'text-white hover:bg-white/20'}`}
                >
                  {t('users_tab', 'Users')}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('products');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${activeTab === 'products' ? 'bg-white text-[#5D2D2C]' : 'text-white hover:bg-white/20'}`}
              >
                {t('products_tab', 'Products')}
              </button>
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${activeTab === 'orders' ? 'bg-white text-[#5D2D2C]' : 'text-white hover:bg-white/20'}`}
              >
                {t('orders_tab', 'Orders')}
              </button>
              <button
                onClick={() => {
                  setActiveTab('payments');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${activeTab === 'payments' ? 'bg-white text-[#5D2D2C]' : 'text-white hover:bg-white/20'}`}
              >
                {t('payments_tab', 'Payments')}
              </button>
              <button
                onClick={() => {
                  setActiveTab('users');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${activeTab === 'users' ? 'bg-white text-[#5D2D2C]' : 'text-white hover:bg-white/20'}`}
              >
                {t('users_tab', 'Users')}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{t('manage_products_title', 'Manage Products')}</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  <span className="text-sm sm:text-base">{t('add_category_button', 'Add Category')}</span>
                </button>
                <button
                  onClick={() => {
                    resetProductForm();
                    setEditingProduct(null);
                    setShowProductModal(true);
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 text-white rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                  style={{ background: '#5D2D2C' }}
                >
                  <Plus size={18} />
                  <span className="text-sm sm:text-base">{t('add_product_button', 'Add Product')}</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('search_placeholder_product', 'Search for a product...')}
                  value={searchTerm}
                  onChange={handleSearchInput}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D2D2C] focus:border-transparent"
                />
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              </div>
            </div>

            {/* Desktop Table (hidden on small screens) */}
            <div className="hidden sm:block bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_name', 'Name')}</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_slug', 'Slug')}</th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_description', 'Description')}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_price', 'Price')}</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_stock', 'Stock')}</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_status', 'Status')}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="max-w-[150px] sm:max-w-none truncate">{product.name}</div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.slug}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {product.description}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.variants[0]?.priceAmount || 0} {product.variants[0]?.priceCurrency || 'EGP'}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.variants[0]?.stock || 0}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${product.isPublished ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.isPublished ? t('status_published', 'Published') : t('status_draft', 'Draft')}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            data-action="edit"
                            data-id={product.productId}
                            onClick={handleRowActionClick}
                            className="text-blue-600 hover:text-blue-900"
                            aria-label={t('edit_product_modal_title', 'Edit Product')}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            data-action="delete"
                            data-id={product.productId}
                            onClick={handleRowActionClick}
                            className="text-red-600 hover:text-red-900"
                            aria-label={t('confirm_delete_product', 'Delete product')}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (visible on small screens) */}
            <div className="sm:hidden space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.productId} className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            data-action="edit"
                            data-id={product.productId}
                            onClick={handleRowActionClick}
                            className="p-1 text-blue-600 hover:text-blue-900"
                            aria-label={t('edit_product_modal_title', 'Edit Product')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            data-action="delete"
                            data-id={product.productId}
                            onClick={handleRowActionClick}
                            className="p-1 text-red-600 hover:text-red-900"
                            aria-label={t('confirm_delete_product', 'Delete product')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 truncate mt-1">{product.description}</p>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          {product.variants[0]?.priceAmount || 0} {product.variants[0]?.priceCurrency || 'EGP'}
                        </div>
                        <div className="text-xs">
                          <span className={`px-2 py-1 text-xs rounded-full ${product.isPublished ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.isPublished ? t('status_published', 'Published') : t('status_draft', 'Draft')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">{t('manage_orders', 'Manage Orders')}</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('orders_table_order_id', 'Order ID')}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('orders_table_customer', 'Customer')}</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('orders_table_items', 'Items')}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('orders_table_total', 'Total')}</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('orders_table_status', 'Status')}</th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('orders_table_date', 'Date')}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderId}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-[120px] sm:max-w-none truncate">{order.customerName}</div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.items}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.total} EGP
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {t(order.status.toLowerCase(), order.status)}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.date}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteOrder(order.orderId)}
                          className="text-red-600 hover:text-red-900"
                          aria-label={t('confirm_delete_order', 'Delete order')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{t('manage_payments_title', 'Manage Payments')}</h2>
              <div className="bg-white rounded-lg shadow px-4 sm:px-6 py-4">
                <p className="text-xs sm:text-sm text-gray-600">{t('total_payments_label', 'Total Payments')}</p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: '#5D2D2C' }}>
                  {totalPayments.toLocaleString()} EGP
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_payment_id', 'Payment ID')}</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_order_id', 'Order ID')}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_amount', 'Amount')}</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_method', 'Method')}</th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_status', 'Status')}</th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_date', 'Date')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.paymentId} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.paymentId}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.orderId}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.amount} EGP
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.method}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${payment.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {t(payment.status.toLowerCase(), payment.status)}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">{t('manage_users_title', 'Manage Users')}</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_user', 'Name')}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_email', 'Email')}</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_role', 'Role')}</th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_joined_date', 'Joined Date')}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="max-w-[120px] sm:max-w-none truncate">{user.name}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-[150px] sm:max-w-none truncate">{user.email}</div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.role}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.joinedDate}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.userId)}
                          className="text-red-600 hover:text-red-900"
                          aria-label={t('confirm_delete_user', 'Delete user')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto my-4">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {editingProduct ? t('edit_product_modal_title', 'Edit Product') : t('add_new_product_modal_title', 'Add New Product')}
                </h3>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('label_product_name', 'Product Name *')}</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5D2D2C] ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('label_slug', 'Slug *')}</label>
                  <input
                    type="text"
                    value={newProduct.slug}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, slug: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5D2D2C] ${formErrors.slug ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('label_description', 'Description *')}</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5D2D2C] ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('label_category', 'Category *')}</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, categoryId: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5D2D2C] ${formErrors.categoryId ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">{t('select_category_placeholder', 'Select a category')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {formErrors.categoryId && <p className="text-red-500 text-xs mt-1">{formErrors.categoryId}</p>}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.isPublished}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="h-4 w-4 text-[#5D2D2C] focus:ring-[#5D2D2C] rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{t('label_published', 'Published')}</label>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-base sm:text-lg font-semibold">{t('variants_title', 'Variants')}</h4>
                    <button
                      onClick={addVariant}
                      className="px-3 py-1 text-xs sm:text-sm text-white rounded hover:opacity-90"
                      style={{ background: '#5D2D2C' }}
                    >
                      {t('add_variant_button', '+ Add Variant')}
                    </button>
                  </div>

                  {newProduct.variants.map((variant, index) => (
                    <div key={index} className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-700">{t('variant_label', `Variant ${index + 1}`)}</span>
                        {newProduct.variants.length > 1 && (
                          <button
                            onClick={() => removeVariant(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('label_sku', 'SKU *')}</label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-[#5D2D2C] ${formErrors[`variant_${index}_sku`] ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {formErrors[`variant_${index}_sku`] && (
                            <p className="text-red-500 text-xs mt-1">{formErrors[`variant_${index}_sku`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('label_price', 'Price *')}</label>
                          <input
                            type="number"
                            value={variant.priceAmount}
                            onChange={(e) => updateVariant(index, 'priceAmount', Number(e.target.value))}
                            className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-[#5D2D2C] ${formErrors[`variant_${index}_price`] ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {formErrors[`variant_${index}_price`] && (
                            <p className="text-red-500 text-xs mt-1">{formErrors[`variant_${index}_price`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('label_currency', 'Currency')}</label>
                          <input
                            type="text"
                            value={variant.priceCurrency}
                            onChange={(e) => updateVariant(index, 'priceCurrency', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#5D2D2C]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('label_stock', 'Stock *')}</label>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                            className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-[#5D2D2C] ${formErrors[`variant_${index}_stock`] ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {formErrors[`variant_${index}_stock`] && (
                            <p className="text-red-500 text-xs mt-1">{formErrors[`variant_${index}_stock`]}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={variant.isActive}
                          onChange={(e) => updateVariant(index, 'isActive', e.target.checked)}
                          className="h-3 w-3 text-[#5D2D2C] focus:ring-[#5D2D2C] rounded"
                        />
                        <label className="ml-2 text-xs text-gray-700">{t('label_active', 'Active')}</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  className="flex-1 px-6 py-3 text-white rounded-lg hover:opacity-90 transition font-medium"
                  style={{ background: '#5D2D2C' }}
                >
                  {editingProduct ? t('update_product_button', 'Update Product') : t('confirm_add_product_button', 'Add Product')}
                </button>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  {t('cancel_button', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t('add_new_category_modal_title', 'Add New Category')}</h3>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategory({ name: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('label_category_name', 'Category Name')}</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D2D2C]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleAddCategory}
                  className="flex-1 px-6 py-3 text-white rounded-lg hover:opacity-90 transition font-medium"
                  style={{ background: '#5D2D2C' }}
                >
                  {t('confirm_add_category_button', 'Add Category')}
                </button>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategory({ name: '' });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  {t('cancel_button', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
