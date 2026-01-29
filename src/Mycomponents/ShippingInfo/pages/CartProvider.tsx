/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useCartByUser } from '../../Carts/hooks/useCartByUser';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Minimal local types exported for consumers
export interface Product {
  id: string;
  productVariantId: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  postalCode?: string;
}

interface CartContextType {
  cartId: string | null;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  updateQuantity: (id: string, quantity: number) => void;
  removeProduct: (id: string) => void;
  getSubtotal: () => number;
  shippingInfo: ShippingInfo | null;
  setShippingInfo: (info: ShippingInfo) => void;
  loading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode; userId?: string }> = ({
  children,
  userId,
}) => {
  const { cart, loading, error, fetchCart } = useCartByUser(userId ?? '');

  const cartId = cart?.id ? String(cart.id) : null;

  const [products, setProducts] = useState<Product[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);

  useEffect(() => {
    const cartWithItems = cart as { items?: any[] } | null;

    if (!cartWithItems?.items || cartWithItems.items.length === 0) {
      setProducts([
        {
          id: 'fake-1',
          productVariantId: 'fake-variant-1',
          name: 'منتج تجريبي',
          brand: 'ماركة وهمية',
          price: 100,
          quantity: 1,
          image: undefined,
        },
      ]);
      return;
    }

    const mapped: Product[] = cartWithItems.items.map((item: any) => ({
      id: String(item.id),
      productVariantId: String(item.productVariantId),
      name: String(item.title ?? ''),
      brand: '',
      price: Number(item.unitPriceAmount ?? item.unitPrice ?? 0),
      quantity: Number(item.quantity ?? 1),
      image: undefined,
    }));

    setProducts((prev) => {
      if (
        prev.length === mapped.length &&
        prev.every(
          (p, i) =>
            p.id === mapped[i].id &&
            p.quantity === mapped[i].quantity &&
            p.price === mapped[i].price
        )
      ) {
        return prev;
      }
      return mapped;
    });
  }, [cart]);

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity } : p))
    );
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const getSubtotal = () =>
    products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const refreshCart = async () => {
    await fetchCart();
  };

  return (
    <CartContext.Provider
      value={{
        cartId,
        products,
        setProducts,
        updateQuantity,
        removeProduct,
        getSubtotal,
        shippingInfo,
        setShippingInfo,
        loading,
        error,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
