// path: src/types/order.types.ts
export type UUID = string;

export interface OrderItemDto {
  id?: UUID; // من الـ API
  orderItemId?: UUID;
  orderId?: UUID;
  productVariantId?: UUID;
  productName?: string; // اسم المنتج
  productVariantSku?: string; // كود المنتج
  title?: string;
  quantity: number;
  unitPrice?: number; // للتوافق مع الكود القديم
  unitPriceAmount?: number; // من الـ API
  unitPriceCurrency?: string; // من الـ API
  currency?: string; // للتوافق مع الكود القديم
  itemTotalPrice?: number;
  lineTotal?: number;
}

export interface PaymentDto {
  paymentId?: UUID;
  amount: number;
  currency: string;
  method?: string;
  createdAtUtc?: string;
}

export interface OrderDto {
  id?: UUID; // من الـ API
  orderId?: UUID;
  userId?: UUID;
  status?: string | null;
  shippingAddress?: string | null;
  phoneNumber?: string | null;
  items: OrderItemDto[];
  payments?: PaymentDto[];
  totalAmount: number;
  totalCurrency: string;
  userName?: string;
  orderDate?: string;
  createdAtUtc?: string;
  modifiedAtUtc?: string | null;
}

export interface CreateOrderDto {
  userId: UUID;
  shippingAddress?: string;
  phoneNumber?: string;
  status?: string;
  items: {
    productVariantId: UUID;
    quantity: number;
    unitPrice: number;
    currency: string;
  }[];
  totalAmount: number;
  totalCurrency: string;
}

export interface UpdateOrderDto {
  shippingAddress?: string;
  phoneNumber?: string;
  status?: string;
  items?: {
    productVariantId: UUID;
    quantity: number;
    unitPrice: number;
    currency: string;
    orderItemId?: UUID;
  }[];
  totalAmount?: number;
  totalCurrency?: string;
}

export interface PaginatedOrdersResponse {
  items: OrderDto[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
}

export interface OrderItem {
  orderItemId: string;
  productName: string;
  quantity: number;
  unitPriceAmount: number;
  unitPriceCurrency: string;
  itemTotalPrice: number;
}

export interface Order {
  orderId: string;
  userName: string;
  orderDate: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
}