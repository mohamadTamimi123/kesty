import { Category } from './category';

export interface Machine {
  id: string;
  name: string;
  categoryId?: string;
  category?: Category;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMachineData {
  name: string;
  categoryId?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateMachineData extends Partial<CreateMachineData> {}

