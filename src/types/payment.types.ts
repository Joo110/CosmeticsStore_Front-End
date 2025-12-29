// src/types/payment.types.ts
export type UUID = string;

export interface PaymentDto {
  paymentId: UUID;
  orderId: UUID;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  transactionId?: string;
  createdAtUtc?: string;
  modifiedAtUtc?: string;
}

export interface CreatePaymentDto {
  orderId: UUID;
  amount: number;
  currency: string;
  provider: string;
  transactionId?: string;
  status: string;
}

export interface UpdatePaymentDto {
  amount?: number;
  currency?: string;
  provider?: string;
  transactionId?: string;
  status?: string;
}

export interface PaginatedPaymentsResponse {
  items: PaymentDto[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
}