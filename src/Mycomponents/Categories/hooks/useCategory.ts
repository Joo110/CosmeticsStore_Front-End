import { useEffect, useState } from 'react';
import categoryService from '../services/CategoryService';
import { handleApiError } from '../../Users/utils/api';
import type { Category } from '../../../types/category.types';

export const useCategory = (categoryId: string) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) return;

      setLoading(true);
      setError(null);
      try {
        const data = await categoryService.getCategoryById(categoryId);
        setCategory(data);
      } catch (err) {
        const msg = handleApiError(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  return { category, loading, error };
};