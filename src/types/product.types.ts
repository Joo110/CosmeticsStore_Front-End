export interface ProductVariant {
  productVariantId: string;
  sku: string;
id?: string;
  priceAmount: number;
  priceCurrency: string;
  stock: number;
  isActive: boolean;
}

export interface ProductMedia {
  mediaId: string;
  url: string;
  fileName: string;
  contentType: string;
  sizeInBytes: number;
  isPrimary: boolean;
  createdAtUtc: string;
}
// src/types/product.ts
export interface ProductVariant {
  productVariantId: string;
  sku: string;
  priceAmount: number;
  priceCurrency: string;
  stock: number;
  isActive: boolean;
}

export interface ProductMedia {
  mediaId: string;
  url: string;
  fileName: string;
  contentType: string;
  sizeInBytes: number;
  isPrimary: boolean;
  createdAtUtc: string;
}

export interface Product {
  productId: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  isPublished: boolean;
  variants: ProductVariant[];
  media: ProductMedia[];  // ✅ هنا الصور
  createdAtUtc: string;
  modifiedAtUtc: string | null;
}

export interface Product {
  productId: string;
  name: string;
 id?: string;
  slug: string;
  description: string;
  categoryId: string;
  isPublished: boolean;
  variants: ProductVariant[];
  media: ProductMedia[];
  createdAtUtc: string;
}

export interface ProductsQuery {
  pageIndex?: number;
  pageSize?: number;
  categoryId?: string;
  isPublished?: boolean;
  searchTerm?: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

export interface ProductVariantDto {
  sku: string;
  priceAmount: number;
  priceCurrency: string;
  stock: number;
  isActive: boolean;
}

export interface ProductMediaDto {
  url: string;
  fileName: string;
  contentType: string;
  sizeInBytes: number;
  isPrimary: boolean;
}

export interface CreateProductDto {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  isPublished: boolean;
  variants: ProductVariantDto[];
  media: ProductMediaDto[];
}

export interface UpdateProductDto {
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  isPublished?: boolean;
  variants?: ProductVariantDto[];
  media?: ProductMediaDto[];
}
