import { useState } from 'react';
import productService from '../Services/productService';
import { handleApiError } from '../../Users/utils/api';
import type {

  CreateProductDto,
  UpdateProductDto,
} from '../../../types/product.types';

export const useProductsAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = async (data: CreateProductDto) => {
    setLoading(true);
    setError(null);
    try {
      return await productService.createProduct(data);
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (
    productId: string,
    data: UpdateProductDto
  ) => {
    setLoading(true);
    setError(null);
    try {
      await productService.updateProduct(productId, data);
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      await productService.deleteProduct(productId);
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};