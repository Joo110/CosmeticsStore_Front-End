import { useState } from 'react';
import cartService from '../services/cartService';
import { handleApiError } from '../../Users/utils/api';
import type { CartResponse, AddCartItemRequest } from '../../../types/cart.types';

export const useAddToCart = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = async (request: AddCartItemRequest): Promise<CartResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await cartService.addItemToCart(request);
      return data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { addItem, loading, error };
};