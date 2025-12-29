import api from '../../Users/utils/api';
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../../types/category.types';

class CategoryService {
  // GET /Categories
  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/Categories');
    return response.data;
  }

  // GET /Categories/{id}
  async getCategoryById(categoryId: string): Promise<Category> {
    const response = await api.get<Category>(`/Categories/${categoryId}`);
    return response.data;
  }

  // POST /Categories
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const response = await api.post<Category>('/Categories', data);
    return response.data;
  }

  // PUT /Categories/{id}
  async updateCategory(
    categoryId: string,
    data: UpdateCategoryDto
  ): Promise<void> {
    await api.put(`/Categories/${categoryId}`, data);
  }

  // DELETE /Categories/{id}
  async deleteCategory(categoryId: string): Promise<void> {
    await api.delete(`/Categories/${categoryId}`);
  }
}

export default new CategoryService();