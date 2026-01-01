import { useState, useEffect } from 'react';
import orderService from '../services/OrderService';
import { handleApiError } from '../../Users/utils/api';
import type { OrderDto } from '../../../types/order.types';

export const useMyOrders = () => {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const fetchOrders = async () => {
  setLoading(true);
  setError(null);

  try {
    const data = await orderService.getMyOrders();
    setOrders(data);
  } catch (err) {
    const msg = handleApiError(err);
    setError(msg);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
  };
};
