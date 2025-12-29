// hooks/useCartByUser.ts
import { useState, useEffect, useCallback } from 'react';
import cartService from '../services/cartService';
import { handleApiError } from '../../Users/utils/api';
import type { Cart } from '../../../types/cart.types';

export const useCartByUser = (userId?: string) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async (uId?: string) => {
    const uid = uId ?? userId;
    if (!uid) return null;

    setLoading(true);
    setError(null);
    try {
      const data = await cartService.getCartByUserId(uid);
      setCart(data);
      return data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { cart, loading, error, fetchCart };
};