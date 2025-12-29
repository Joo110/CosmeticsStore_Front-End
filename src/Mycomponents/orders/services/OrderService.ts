// path: src/features/Orders/services/OrderService.ts
import api from '../../Users/utils/api';
import type {
  OrderDto,
  CreateOrderDto,
  UpdateOrderDto,
  PaginatedOrdersResponse,
} from '../../../types/order.types';

class OrderService {
  // Create order
  async createOrder(request: CreateOrderDto): Promise<OrderDto> {
    const response = await api.post<OrderDto>('/Orders', request);
    return response.data;
  }

  // Get paginated orders with optional filters: pageIndex, pageSize, userId, status
  async getOrders(params?: {
    pageIndex?: number;
    pageSize?: number;
    userId?: string;
    status?: string;
  }): Promise<PaginatedOrdersResponse> {
    const response = await api.get<PaginatedOrdersResponse>('/Orders', {
      params,
    });
    return response.data;
  }

  // ✅ إضافة: Get user's own orders
  async getMyOrders(): Promise<OrderDto[]> {
    const response = await api.get<OrderDto[]>('/Orders/my-orders');
    return response.data;
  }

  // Get single order by id
  async getOrderById(id: string): Promise<OrderDto> {
    const response = await api.get<OrderDto>(`/Orders/${id}`);
    return response.data;
  }

  // Update order
  async updateOrder(id: string, request: UpdateOrderDto): Promise<OrderDto> {
    const response = await api.put<OrderDto>(`/Orders/${id}`, request);
    return response.data;
  }

  // Delete order
  async deleteOrder(id: string): Promise<void> {
    await api.delete(`/Orders/${id}`);
  }
}

export default new OrderService();