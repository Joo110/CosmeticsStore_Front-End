// src/features/Payments/services/PaymentService.ts
import api from '../../Users/utils/api';
import type {
  PaymentDto,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaginatedPaymentsResponse,
} from '../../../types/payment.types';

class PaymentService {
  // Create payment
  async createPayment(payload: CreatePaymentDto): Promise<PaymentDto> {
    const response = await api.post<PaymentDto>('/Payments', payload);
    return response.data;
  }

  // Get payments (pagination + filters)
  async getPayments(params?: {
    pageIndex?: number;
    pageSize?: number;
    orderId?: string;
    status?: string;
    provider?: string;
  }): Promise<PaginatedPaymentsResponse> {
    const response = await api.get<PaginatedPaymentsResponse>('/Payments', {
      params,
    });
    return response.data;
  }

  // Get payment by id
  async getPaymentById(id: string): Promise<PaymentDto> {
    const response = await api.get<PaymentDto>(`/Payments/${id}`);
    return response.data;
  }

  // Update payment
  async updatePayment(
    id: string,
    payload: UpdatePaymentDto
  ): Promise<PaymentDto> {
    const response = await api.put<PaymentDto>(`/Payments/${id}`, payload);
    return response.data;
  }

  // Delete payment
  async deletePayment(id: string): Promise<void> {
    await api.delete(`/Payments/${id}`);
  }
}

export default new PaymentService();