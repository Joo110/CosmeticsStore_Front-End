import React, { useState, useEffect, useMemo } from 'react'; 
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useProducts } from '../../Products/hooks/useProducts';
import { useProductsAdmin } from '../../Products/hooks/useProductsAdmin';
import { useCategories } from '../../Categories/hooks/useCategories';

import { centerCropAndResizeFile } from '../../Users/utils/imageProcessing';
import { resolveImageUrl } from '../../Users/utils/images';

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
  createdAtUtc?: string | null;
  modifiedAtUtc?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7079';
/* eslint-disable @typescript-eslint/no-explicit-any */

const ProductsManagement: React.FC = () => {
  const { t, i18n } = useTranslation();

  // hooks
  const { products, fetchProducts } = useProducts();
  const { createProduct, updateProduct, deleteProduct } = useProductsAdmin();
  const { categories, createCategory } = useCategories();

  // UI state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [newProduct, setNewProduct] = useState<Product>({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    isPublished: true,
    variants: [{ sku: '', priceAmount: 0, priceCurrency: 'ريال', stock: 0, isActive: true }],
    media: [],
  });

  const [mediaFiles, setMediaFiles] = useState<Record<string, File>>({});
  const [newCategory, setNewCategory] = useState({ name: '' });

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [visiblePageCount] = useState<number>(5);

  // Set document direction based on language
  useEffect(() => {
    const dir = (i18n.language || '').startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
  }, [i18n.language]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProducts();
  }, []);

  // Validation
  const validateProductForm = () => {
    const errors: Record<string, string> = {};
    if (!newProduct.name.trim()) errors.name = t('error_product_name_required', 'Product name is required');
    if (!newProduct.slug.trim()) errors.slug = t('error_slug_required', 'Slug is required');
    if (!newProduct.description.trim()) errors.description = t('error_description_required', 'Description is required');
    if (!newProduct.categoryId) errors.categoryId = t('error_category_required', 'Category is required');

    newProduct.variants.forEach((v, i) => {
      if (!v.sku) errors[`variant_${i}_sku`] = t('error_sku_required', 'SKU is required');
      if (v.priceAmount <= 0) errors[`variant_${i}_price`] = t('error_invalid_price', 'Invalid price');
      if (v.stock < 0) errors[`variant_${i}_stock`] = t('error_invalid_stock', 'Invalid stock');
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const revokeAllObjectUrls = (mediaArray: ProductMedia[] = []) => {
    mediaArray.forEach((m) => {
      try {
        if (m.url && m.url.startsWith('blob:')) URL.revokeObjectURL(m.url);
      } catch {
        // ignore
      }
    });
  };

  const resetProductForm = () => {
    revokeAllObjectUrls(newProduct.media);
    setNewProduct({
      name: '',
      slug: '',
      description: '',
      categoryId: '',
      isPublished: true,
      variants: [{ sku: '', priceAmount: 0, priceCurrency: 'ريال', stock: 0, isActive: true }],
      media: [],
    });
    setFormErrors({});
    setMediaFiles({});
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      revokeAllObjectUrls(newProduct.media);
    };
  }, []);

  // CRUD Operations
  const handleAddProduct = async () => {
    if (!validateProductForm()) return;
    console.log('Category ID before submit:', newProduct.categoryId);

    const skus = newProduct.variants.map(v => v.sku.trim());
    const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
    if (duplicates.length > 0) {
      alert(t('error_duplicate_skus', 'Duplicate SKUs found: {{skus}}', { skus: [...new Set(duplicates)].join(', ') }));
      return;
    }

    try {
      const payload = {
        name: newProduct.name,
        slug: newProduct.slug,
        description: newProduct.description,
        categoryId: newProduct.categoryId,
        isPublished: newProduct.isPublished,
        variants: newProduct.variants.map(v => ({
          sku: v.sku,
          priceAmount: v.priceAmount,
          priceCurrency: v.priceCurrency || 'ريال',
          stock: v.stock,
          isActive: v.isActive,
        })),
        media: [],
      };

      const createdProduct = await createProduct(payload);

      let uploadedMedia: ProductMedia[] = [];
      if (Object.keys(mediaFiles).length > 0) {
        uploadedMedia = await prepareMediaAndUpload(createdProduct.productId!);
      }

      if (uploadedMedia.length > 0) {
        await updateProduct(createdProduct.productId!, {
          name: newProduct.name,
          slug: newProduct.slug,
          description: newProduct.description,
          categoryId: newProduct.categoryId,
          isPublished: newProduct.isPublished,
          variants: newProduct.variants.map(v => ({
            sku: v.sku,
            priceAmount: v.priceAmount,
            priceCurrency: v.priceCurrency || 'EGP',
            stock: v.stock,
            isActive: v.isActive,
          })),
          media: uploadedMedia.map(m => ({
            mediaId: m.mediaId,
            url: m.url,
            fileName: m.fileName,
            contentType: m.contentType,
            sizeInBytes: m.sizeInBytes,
            isPrimary: m.isPrimary,
          })),
        });
      }

      await fetchProducts();
      setShowProductModal(false);
      resetProductForm();

    } catch (err) {
      console.error('Failed to add product:', err);
      await fetchProducts();
      resetProductForm();
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct?.productId || !validateProductForm()) return;

    try {
      let uploadedMedia: ProductMedia[] = [];
      if (Object.keys(mediaFiles).length > 0) {
        uploadedMedia = await prepareMediaAndUpload(editingProduct.productId);
      }

      const finalMedia: ProductMedia[] = [
        ...newProduct.media
          .filter((m) => m.mediaId && !m.mediaId.startsWith('tmp_'))
          .map((m) => ({
            mediaId: m.mediaId!,
            url: m.url,
            fileName: m.fileName,
            contentType: m.contentType,
            sizeInBytes: m.sizeInBytes,
            isPrimary: m.isPrimary,
          })),
        ...uploadedMedia,
      ];

      const skus = newProduct.variants.map((v) => v.sku.trim());
      const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
      if (duplicates.length > 0) {
        alert(t('error_duplicate_skus', 'Duplicate SKUs found: {{skus}}', { skus: [...new Set(duplicates)].join(', ') }));
        return;
      }

      await updateProduct(editingProduct.productId, {
        name: newProduct.name,
        slug: newProduct.slug,
        description: newProduct.description,
        categoryId: newProduct.categoryId,
        isPublished: newProduct.isPublished,
        variants: newProduct.variants
          .filter(v => v.productVariantId)
          .map((v) => ({
            productVariantId: v.productVariantId!,
            sku: v.sku,
            priceAmount: v.priceAmount,
            priceCurrency: v.priceCurrency || 'SAR',
            stock: v.stock,
            isActive: v.isActive,
          })),
        media: finalMedia,
      });

      await fetchProducts();
      setEditingProduct(null);
      setShowProductModal(false);
      resetProductForm();
      setPage(1);

    } catch (err) {
      console.error('Failed to update product:', err);
      await fetchProducts();
        resetProductForm();
          }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t('confirm_delete_product', 'Are you sure you want to delete this product?'))) return;
    await deleteProduct(id);
    await fetchProducts();
    setTimeout(() => {
      const totalAfter = filteredProducts.length - 1;
      const maxPage = Math.max(1, Math.ceil(Math.max(0, totalAfter) / pageSize));
      if (page > maxPage) setPage(maxPage);
    }, 100);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    await createCategory({
      name: newCategory.name,
      description: '',
      parentCategoryId: 0,
      isActive: true,
    });

    setShowCategoryModal(false);
    setNewCategory({ name: '' });
  };

 const handleEditProduct = (product: Product) => {
  setEditingProduct(product);

  const mappedMedia: ProductMedia[] = (product.media || []).map((m) => {
    const mid = (m as any).mediaId ?? (m as any).id ?? (m as any).Id ?? makeTempId();
    const rawUrl = (m as any).url ?? (m as any).Url ?? '';
    const url = resolveImageUrl(rawUrl);

    return {
      mediaId: mid,
      url,
      fileName: (m as any).fileName ?? '',
      contentType: (m as any).contentType ?? '',
      sizeInBytes: (m as any).sizeInBytes ?? 0,
      isPrimary: Boolean((m as any).isPrimary),
    } as ProductMedia;
  });

  setNewProduct({
    ...product,
    variants: product.variants.map(v => ({
      productVariantId: v.productVariantId,
      sku: v.sku,
      priceAmount: v.priceAmount,
      priceCurrency: v.priceCurrency,
      stock: v.stock,
      isActive: v.isActive,
    })),
    media: mappedMedia,
  });

  setMediaFiles({});
  setShowProductModal(true);
};


  // Media helpers
  const makeTempId = () => `tmp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const handleFilesSelected = async (filesList: FileList | null) => {
  console.log('=== START handleFilesSelected ===');
  console.log('Files:', filesList);
  
  if (!filesList) return;
  
  const filesArray = Array.from(filesList).filter(f => f.type.startsWith('image/'));
  console.log('Image files count:', filesArray.length);
  
  if (filesArray.length === 0) return;

  const newMedia = [...newProduct.media];
  const newFiles = { ...mediaFiles };

  for (const file of filesArray) {
    console.log('Processing file:', file.name, file.type, file.size);
    
    const id = makeTempId();
    
    const previewUrl = URL.createObjectURL(file);
    console.log('Created preview URL:', previewUrl);
    
    newFiles[id] = file;
    
    newMedia.push({
      mediaId: id,
      url: previewUrl,
      fileName: file.name,
      contentType: file.type,
      sizeInBytes: file.size,
      isPrimary: newMedia.length === 0,
    });
    
    console.log('Added media:', newMedia[newMedia.length - 1]);
  }

  console.log('Final newMedia:', newMedia);
  console.log('Final newFiles:', newFiles);
  
  setMediaFiles(newFiles);
  setNewProduct({ ...newProduct, media: newMedia });
  
  console.log('=== END handleFilesSelected ===');
};


  const removeMedia = (mediaId: string) => {
    const m = newProduct.media.find((x) => x.mediaId === mediaId);
    if (m?.url?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(m.url);
      } catch {
        // ignore
      }
    }
    setNewProduct({ ...newProduct, media: newProduct.media.filter((x) => x.mediaId !== mediaId) });
    const next = { ...mediaFiles };
    delete next[mediaId];
    setMediaFiles(next);
  };

  const setPrimaryMedia = (mediaId: string) => {
    setNewProduct({
      ...newProduct,
      media: newProduct.media.map((m) => ({ ...m, isPrimary: m.mediaId === mediaId })),
    });
  };

  const uploadFileToServer = async (file: File, productId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('FileName', file.name);
    formData.append('ContentType', file.type);
    formData.append('SizeInBytes', String(file.size));
    formData.append('ownerId', productId);
    formData.append('isPrimary', 'false');

    const res = await fetch(`${API_BASE_URL}/api/v1/Media`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  };

  const prepareMediaAndUpload = async (productId: string): Promise<ProductMedia[]> => {
  const uploadedMedia: ProductMedia[] = [];

  for (const tmpId of Object.keys(mediaFiles)) {
    const file = mediaFiles[tmpId];

    try {
      // Process image: center-crop square + resize to 800x800 (تعديل الحجم لو حبيت)
      const processedFile = await centerCropAndResizeFile(file, 800);

      // Upload the processed file (uploadFileToServer expects File)
      const uploaded = await uploadFileToServer(processedFile, productId);

      uploadedMedia.push({
        mediaId: uploaded.mediaId,
        url: uploaded.url,
        fileName: uploaded.fileName || processedFile.name,
        contentType: uploaded.contentType || processedFile.type,
        sizeInBytes: uploaded.sizeInBytes || processedFile.size,
        isPrimary: newProduct.media.find((m) => m.mediaId === tmpId)?.isPrimary ?? false,
      });
    } catch (err) {
      console.error('upload failed for', file.name, err);
      throw err;
    }
  }

  return uploadedMedia;
};
  // Variants
  const addVariant = () =>
    setNewProduct({
      ...newProduct,
      variants: [...newProduct.variants, { sku: '', priceAmount: 0, priceCurrency: 'EGP', stock: 0, isActive: true }],
    });

  const updateVariant = (i: number, field: keyof ProductVariant, value: any) => {
    const updated = [...newProduct.variants];
    updated[i] = { ...updated[i], [field]: value };
    setNewProduct({ ...newProduct, variants: updated });
  };

  const removeVariant = (i: number) =>
    setNewProduct({
      ...newProduct,
      variants: newProduct.variants.filter((_, index) => index !== i),
    });

  // Filtering
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.slug || '').toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPage(1);
  }, [searchTerm, products, pageSize]);

  // Pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const half = Math.floor(visiblePageCount / 2);
    let start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + visiblePageCount - 1);
    if (end - start + 1 < visiblePageCount) {
      start = Math.max(1, end - visiblePageCount + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [totalPages, page, visiblePageCount]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{t('manage_products', 'Manage Products')}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 sm:px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            <span className="text-sm sm:text-base">{t('add_category', 'Add Category')}</span>
          </button>
          <button
            onClick={() => {
              resetProductForm();
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            className="px-4 sm:px-6 py-3 text-white rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
            style={{ background: '#5D2D2C' }}
          >
            <Plus size={20} />
            <span className="text-sm sm:text-base">{t('add_product', 'Add Product')}</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder={t('search_placeholder_products', 'Search for a product...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D2D2C] focus:border-transparent"
          />
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        </div>
      </div>

      {/* Desktop / Tablet Table (kept as original) */}
      <div className="hidden sm:block bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table_image', 'Image')}</th>
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
            {paginatedProducts.map((product) => {
              const primaryImageRaw = product.media?.find((m) => m.isPrimary)?.url || product.media?.[0]?.url || '';
              const primaryImage = resolveImageUrl(primaryImageRaw) || 'https://dummyimage.com/80x80/ddd/999.png';
              return (
                <tr key={product.productId} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img src={primaryImage} alt={product.name || 'product image'} className="w-full h-full object-cover" />
                    </div>
                  </td>
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
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.productId!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                  {t('no_products_found', 'No products found.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (visible on small screens) - keeps same data & actions */}
      <div className="sm:hidden space-y-3">
        {paginatedProducts.map((product) => {
          const primaryImageRaw = product.media?.find((m) => m.isPrimary)?.url || product.media?.[0]?.url || '';
          const primaryImage = resolveImageUrl(primaryImageRaw) || 'https://dummyimage.com/160x160/ddd/999.png';
          return (
            <div key={product.productId} className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <img src={primaryImage} alt={product.name || 'product image'} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-1 text-blue-600 hover:text-blue-900"
                        aria-label={t('edit_product', 'Edit Product')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.productId!)}
                        className="p-1 text-red-600 hover:text-red-900"
                        aria-label={t('delete_product', 'Delete product')}
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
          );
        })}

        {paginatedProducts.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            {t('no_products_found', 'No products found.')}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{t('rows_per_page', 'Rows per page:')}</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2 border rounded bg-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            {totalItems === 0 ? '0' : `${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, totalItems)} ${t('of', 'of')} ${totalItems}`}
          </div>

          <nav className="inline-flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded border ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
            >
              {t('prev', 'Prev')}
            </button>

            {pageNumbers[0] > 1 && (
              <>
                <button onClick={() => setPage(1)} className="px-3 py-1 rounded border hover:bg-gray-100">1</button>
                {pageNumbers[0] > 2 && <span className="px-2">…</span>}
              </>
            )}

            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`px-3 py-1 rounded border ${num === page ? 'bg-[#5D2D2C] text-white' : 'hover:bg-gray-100'}`}
              >
                {num}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-2">…</span>}
                <button onClick={() => setPage(totalPages)} className="px-3 py-1 rounded border hover:bg-gray-100">{totalPages}</button>
              </>
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded border ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
            >
              {t('next', 'Next')}
            </button>
          </nav>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto my-4">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {editingProduct ? t('edit_product', 'Edit Product') : t('add_new_product', 'Add New Product')}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('product_name', 'Product Name')} *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5D2D2C] ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('slug', 'Slug')} *</label>
                  <input
                    type="text"
                    value={newProduct.slug}
                    onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5D2D2C] ${formErrors.slug ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('description', 'Description')} *</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5D2D2C] ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('category', 'Category')} *</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => {
                      console.log('Selected category ID:', e.target.value);
                      setNewProduct({ ...newProduct, categoryId: e.target.value });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5D2D2C] ${formErrors.categoryId ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">{t('select_category', 'Select a category')}</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.categoryId && <p className="text-red-500 text-xs mt-1">{formErrors.categoryId}</p>}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.isPublished}
                    onChange={(e) => setNewProduct({ ...newProduct, isPublished: e.target.checked })}
                    className="h-4 w-4 text-[#5D2D2C] focus:ring-[#5D2D2C] rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{t('published', 'Published')}</label>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-base sm:text-lg font-semibold">{t('variants', 'Variants')}</h4>
                    <button
                      onClick={addVariant}
                      className="px-3 py-1 text-xs sm:text-sm text-white rounded hover:opacity-90"
                      style={{ background: '#5D2D2C' }}
                    >
                      + {t('add_variant', 'Add Variant')}
                    </button>
                  </div>

                  {newProduct.variants.map((variant, index) => (
                    <div key={index} className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-700">{t('variant', 'Variant')} {index + 1}</span>
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
                          <label className="block text-xs text-gray-600 mb-1">{t('sku', 'SKU')} *</label>
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
                          <label className="block text-xs text-gray-600 mb-1">{t('price', 'Price')} *</label>
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
                          <label className="block text-xs text-gray-600 mb-1">{t('currency', 'Currency')}</label>
                          <input
                            type="text"
                            value={variant.priceCurrency}
                            onChange={(e) => updateVariant(index, 'priceCurrency', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#5D2D2C]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('stock', 'Stock')} *</label>
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
                        <label className="ml-2 text-xs text-gray-700">{t('active', 'Active')}</label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Media upload */}
                <div className="border-t pt-4">
                  <h4 className="text-base sm:text-lg font-semibold mb-2">{t('media', 'Media')}</h4>

                  <div className="mb-3">
                    <input
                      id="product-media"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFilesSelected(e.target.files)}
                      className="hidden"
                    />
                    <label htmlFor="product-media" className="inline-flex items-center px-4 py-2 border rounded cursor-pointer hover:bg-gray-100">
                      <Plus size={16} />
                      <span className="ml-2 text-sm">{t('upload_images', 'Upload Images')}</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">{t('upload_images_hint', 'You can upload multiple images. Click on image to set as Primary.')}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {newProduct.media.map((m) => (
                      <div key={m.mediaId} className="relative w-28 h-28 border rounded overflow-hidden">
                        <img
                          src={m.url}
                          alt={m.fileName}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => m.mediaId && setPrimaryMedia(m.mediaId)}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', m.url);
                            const target = e.target as HTMLImageElement;
                            console.error('❌ Image naturalWidth:', target.naturalWidth);
                            console.error('❌ Image naturalHeight:', target.naturalHeight);
                          }}
                          onLoad={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.log('✅ Image loaded:', m.url);
                            console.log('✅ naturalWidth:', target.naturalWidth);
                            console.log('✅ naturalHeight:', target.naturalHeight);
                          }}
                        />

                        <button
                          onClick={() => m.mediaId && removeMedia(m.mediaId)}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                          type="button"
                        >
                          <X size={14} />
                        </button>
                        {m.isPrimary && (
                          <div className="absolute left-1 bottom-1 bg-[#5D2D2C] text-white px-1 text-xs rounded">{t('primary', 'Primary')}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  className="flex-1 px-6 py-3 text-white rounded-lg hover:opacity-90 transition font-medium"
                  style={{ background: '#5D2D2C' }}
                >
                  {editingProduct ? t('update_product', 'Update Product') : t('add_product', 'Add Product')}
                </button>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  {t('cancel', 'Cancel')}
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
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t('add_new_category', 'Add New Category')}</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('category_name', 'Category Name')}</label>
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
                  {t('add_category', 'Add Category')}
                </button>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategory({ name: '' });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  {t('cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;
