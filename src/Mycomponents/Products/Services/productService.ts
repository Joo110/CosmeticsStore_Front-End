import api from '../../Users/utils/api';
import type {
  Product,
  ProductsQuery,
  CreateProductDto,
  UpdateProductDto,
} from '../../../types/product.types';

class ProductService {
  // Get all products with filters
  async getProducts(query: ProductsQuery = {}): Promise<Product[]> {
    const params = new URLSearchParams();
    
    if (query.pageIndex) params.append('pageIndex', query.pageIndex.toString());
    if (query.pageSize) params.append('pageSize', query.pageSize.toString());
    if (query.categoryId) params.append('categoryId', query.categoryId);
    if (query.isPublished !== undefined) params.append('isPublished', query.isPublished.toString());
    if (query.searchTerm) params.append('searchTerm', query.searchTerm);

    const response = await api.get<Product[]>(`/Products?${params.toString()}`);
    return response.data;
  }

  // Get single product by ID
  async getProductById(productId: string): Promise<Product> {
    const response = await api.get<Product>(`/Products/${productId}`);
    return response.data;
  }

// POST /Products
async createProduct(data: CreateProductDto): Promise<Product> {
  const response = await api.post<Product>('/Products', data);
  return response.data;
}

// PUT /Products/{id}
async updateProduct(
  productId: string,
  data: UpdateProductDto
): Promise<void> {
  await api.put(`/Products/${productId}`, data);
}

// DELETE /Products/{id}
async deleteProduct(productId: string): Promise<void> {
  await api.delete(`/Products/${productId}`);
}


  // Get product by slug
  async getProductBySlug(slug: string): Promise<Product> {
    const response = await api.get<Product>(`/Products/slug/${slug}`);
    return response.data;
  }

  // Get featured products
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    const response = await api.get<Product[]>(`/Products?pageSize=${limit}&isPublished=true`);
    return response.data;
 }


 // Get products by category name
async getProductsByCategoryName(categoryName: string): Promise<Product[]> {
  const response = await api.get<Product[]>(
    `/Products/by-category/${encodeURIComponent(categoryName)}`
  );
  return response.data;
}


  // Search products
  async searchProducts(searchTerm: string, pageSize: number = 20): Promise<Product[]> {
    const response = await api.get<Product[]>(
      `/Products?searchTerm=${encodeURIComponent(searchTerm)}&pageSize=${pageSize}&isPublished=true`
    );
    return response.data;
  }
}

export default new ProductService();