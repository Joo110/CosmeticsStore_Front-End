import { useState, useEffect } from 'react';
import productService from '../Services/productService';
import { handleApiError } from '../../Users/utils/api';
import type { Product, ProductsQuery } from '../../../types/product.types';

export const useProducts = (initialQuery: ProductsQuery = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ProductsQuery>(initialQuery);

  const fetchProducts = async (newQuery?: ProductsQuery) => {
    setLoading(true);
    setError(null);
    try {
      const queryToUse = newQuery || query;
      const data = await productService.getProducts(queryToUse);
      setProducts(data);
      return data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateQuery = (newQuery: Partial<ProductsQuery>) => {
    const updatedQuery = { ...query, ...newQuery };
    setQuery(updatedQuery);
    fetchProducts(updatedQuery);
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    products,
    loading,
    error,
    query,
    fetchProducts,
    updateQuery,
  };
};


export const useProductsByCategoryName = (categoryName: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      if (!categoryName) return;

      setLoading(true);
      setError(null);
      try {
        const data = await productService.getProductsByCategoryName(categoryName);
        setProducts(data);
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsByCategory();
  }, [categoryName]);

  return { products, loading, error };
};


export const useProduct = (productId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await productService.getProductById(productId);
        setProduct(data);
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
};

export const useFeaturedProducts = (limit: number = 8) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await productService.getFeaturedProducts(limit);
        setProducts(data);
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, [limit]);

  return { products, loading, error };
};