import { useState } from 'react';
import cartService from '../services/cartService';
import { handleApiError } from '../../Users/utils/api';
import type { CartResponse } from '../../../types/cart.types';

export const useRemoveCartItem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeItem = async (cartId: string, itemId: string): Promise<CartResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await cartService.removeCartItem(cartId, itemId);
      return data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { removeItem, loading, error };
};