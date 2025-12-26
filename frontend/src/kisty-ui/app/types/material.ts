import { Category } from './category';

export interface Material {
  id: string;
  name: string;
  categoryId?: string;
  category?: Category;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialData {
  name: string;
  categoryId?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateMaterialData extends Partial<CreateMaterialData> {}

