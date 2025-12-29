// path: src/features/Orders/hooks/useOrders.ts
import { useEffect, useState } from 'react';
import orderService from '../services/OrderService';
import { handleApiError } from '../../Users/utils/api';
import type {
  OrderDto,
  CreateOrderDto,
  UpdateOrderDto,
  PaginatedOrdersResponse,
} from '../../../types/order.types';

export const useOrders = (initialPageSize = 20) => {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // pagination / filters
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  // current filters
  const [userIdFilter, setUserIdFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchOrders = async (opts?: {
    pageIndex?: number;
    pageSize?: number;
    userId?: string;
    status?: string;
  }): Promise<PaginatedOrdersResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        pageIndex: opts?.pageIndex ?? pageIndex,
        pageSize: opts?.pageSize ?? pageSize,
        userId: opts?.userId ?? userIdFilter,
        status: opts?.status ?? statusFilter,
      };
      const data = await orderService.getOrders(params);
      setOrders(data.items);
      setPageIndex(data.pageIndex || params.pageIndex || 1);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      return data;
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (id: string): Promise<OrderDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrderById(id);
      return data;
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (payload: CreateOrderDto): Promise<OrderDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const created = await orderService.createOrder(payload);
      // append to list (or refetch for consistency)
      setOrders((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (orderId: string, payload: UpdateOrderDto): Promise<OrderDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await orderService.updateOrder(orderId, payload);
      // update in-place
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? updated : o)));
      return updated;
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await orderService.deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // helper to change page / size / filters
  const setPage = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
    void fetchOrders({ pageIndex: newPageIndex, pageSize, userId: userIdFilter, status: statusFilter });
  };

  const setSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(1);
    void fetchOrders({ pageIndex: 1, pageSize: newPageSize, userId: userIdFilter, status: statusFilter });
  };

  const setFilters = (opts: { userId?: string; status?: string }) => {
    setUserIdFilter(opts.userId);
    setStatusFilter(opts.status);
    setPageIndex(1);
    void fetchOrders({ pageIndex: 1, pageSize, userId: opts.userId, status: opts.status });
  };

  useEffect(() => {
    // initial load
    void fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    orders,
    loading,
    error,
    pageIndex,
    pageSize,
    totalPages,
    totalCount,
    fetchOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    setPage,
    setSize,
    setFilters,
    setUserIdFilter,
    setStatusFilter,
  };
};

export default useOrders;
