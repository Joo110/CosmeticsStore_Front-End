import { useEffect, useState } from 'react';
import paymentService from '../services/PaymentService';
import { handleApiError } from '../../Users/utils/api';
import type {
  PaymentDto,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaginatedPaymentsResponse,
} from '../../../types/payment.types';

export const usePayments = (initialPageSize = 20) => {
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // filters
  const [orderId, setOrderId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [provider, setProvider] = useState<string | undefined>();

  // Fetch paginated payments
  const fetchPayments = async (opts?: {
    pageIndex?: number;
    pageSize?: number;
    orderId?: string;
    status?: string;
    provider?: string;
  }): Promise<PaginatedPaymentsResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        pageIndex: opts?.pageIndex ?? pageIndex,
        pageSize: opts?.pageSize ?? pageSize,
        orderId: opts?.orderId ?? orderId,
        status: opts?.status ?? status,
        provider: opts?.provider ?? provider,
      };

      const data = await paymentService.getPayments(params);
      setPayments(data.items);
      setPageIndex(data.pageIndex);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      return data;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get payment by id
  const getPayment = async (id: string): Promise<PaymentDto | null> => {
    setLoading(true);
    setError(null);
    try {
      return await paymentService.getPaymentById(id);
    } catch (err) {
      setError(handleApiError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create payment
  const createPayment = async (payload: CreatePaymentDto): Promise<PaymentDto> => {
    setLoading(true);
    setError(null);
    try {
      const created = await paymentService.createPayment(payload);
      setPayments((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(handleApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update payment
  const updatePayment = async (paymentId: string, payload: UpdatePaymentDto): Promise<PaymentDto> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await paymentService.updatePayment(paymentId, payload);
      setPayments((prev) =>
        prev.map((p) => (p.paymentId === paymentId ? updated : p))
      );
      return updated;
    } catch (err) {
      setError(handleApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete payment
  const deletePayment = async (paymentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await paymentService.deletePayment(paymentId);
      setPayments((prev) =>
        prev.filter((p) => p.paymentId !== paymentId)
      );
    } catch (err) {
      setError(handleApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Set filters
  const setFilters = (filters: { orderId?: string; status?: string; provider?: string }) => {
    setOrderId(filters.orderId);
    setStatus(filters.status);
    setProvider(filters.provider);
    setPageIndex(1);
    void fetchPayments({ pageIndex: 1, ...filters });
  };

  // Set page
  const setPage = (newPage: number) => {
    setPageIndex(newPage);
    void fetchPayments({ pageIndex: newPage });
  };

  // --- New: Stripe Checkout Session ---
  const createStripeSession = async (
    paymentId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { sessionUrl } = await paymentService.createStripeSession({ paymentId, successUrl, cancelUrl });
      return sessionUrl;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    void fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    payments,
    loading,
    error,
    pageIndex,
    pageSize,
    totalPages,
    totalCount,
    fetchPayments,
    getPayment,
    createPayment,
    updatePayment,
    deletePayment,
    setFilters,
    setPage,
    setPageSize,
    // Stripe helper
    createStripeSession,
  };
};

export default usePayments;
