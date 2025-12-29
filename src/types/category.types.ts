export interface Category {
  id: number;
  categoryId: string;
  name: string;
  description: string;
  parentCategoryId: number | null;
  isActive: boolean;
  createdAtUtc: string;
  modifiedAtUtc: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentCategoryId?: number;
  isActive: boolean;
}


export interface UpdateCategoryDto {
  id: string;
  name?: string;
  description?: string;
  parentCategoryId?: number | null;
  isActive?: boolean;
}
