import api from '../../Users/utils/api';
import type { CartResponse, AddCartItemRequest, UpdateCartItemRequest } from '../../../types/cart.types';

class CartService {
  // Get cart by user ID
  async getCartByUserId(userId: string): Promise<CartResponse> {
    const response = await api.get<CartResponse>(`/Carts/user/${userId}`);
    return response.data;
  }

  // Add item to cart
  async addItemToCart(request: AddCartItemRequest): Promise<CartResponse> {
    const response = await api.post<CartResponse>('/Carts/add', request);
    return response.data;
  }

  // Update cart item quantity
  async updateCartItem(cartId: string, itemId: string, request: UpdateCartItemRequest): Promise<CartResponse> {
    const response = await api.put<CartResponse>(`/Carts/${cartId}/items/${itemId}`, request);
    return response.data;
  }

  // Remove item from cart
  async removeCartItem(cartId: string, itemId: string): Promise<CartResponse> {
    const response = await api.delete<CartResponse>(`/Carts/${cartId}/items/${itemId}`);
    return response.data;
  }

  // Delete entire cart
  async deleteCart(cartId: string): Promise<void> {
    await api.delete(`/Carts/${cartId}`);
  }
}

export default new CartService();