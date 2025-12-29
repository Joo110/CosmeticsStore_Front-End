import { useEffect, useState } from 'react';
import categoryService from '../services/CategoryService';
import { handleApiError } from '../../Users/utils/api';
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../../types/category.types';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
/* eslint-disable @typescript-eslint/no-explicit-any */

 const fetchCategories = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await categoryService.getCategories();
    
    const mappedCategories = data.map((cat: any) => ({
      ...cat,
      categoryId: cat.id,
    }));
    
    console.log('Mapped categories:', mappedCategories);
    
    setCategories(mappedCategories);
    return mappedCategories;
  } catch (err) {
    const msg = handleApiError(err);
    setError(msg);
    return [];
  } finally {
    setLoading(false);
  }
};
  const createCategory = async (data: CreateCategoryDto) => {
    setLoading(true);
    setError(null);
    try {
      const created = await categoryService.createCategory(data);
      
      const mappedCategory = {
        ...created,
        categoryId: created.categoryId || created.categoryId,
      };
      
      setCategories((prev) => [...prev, mappedCategory]);
      return mappedCategory;
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (
    categoryId: string,
    data: UpdateCategoryDto
  ) => {
    setLoading(true);
    setError(null);
    try {
      await categoryService.updateCategory(categoryId, data);
      await fetchCategories(); // refresh list
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      await categoryService.deleteCategory(categoryId);
      setCategories((prev) =>
        prev.filter((c) => c.categoryId !== categoryId)
      );
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};