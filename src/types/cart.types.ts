export interface AddCartItemRequest {
  userId: string;
  productVariantId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItemResponse {
  itemId: string;
  productVariantId: string;
  title?: string | null;
  unitPriceAmount: number;
  unitPriceCurrency: string;
  quantity: number;
  lineTotal: number;
}

export interface CartResponse {
  id: string;
  userId: string;
  items: CartItemResponse[];
  totalAmount: number;
  currency: string;
  createdAtUtc: string;
  modifiedAtUtc?: string | null;
}
