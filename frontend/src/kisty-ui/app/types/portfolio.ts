import { Category } from './category';
import { User } from './user';

export enum QuantityRange {
  LESS_THAN_100 = 'LESS_THAN_100',
  BETWEEN_100_1000 = 'BETWEEN_100_1000',
  MORE_THAN_1000 = 'MORE_THAN_1000',
}

export interface PortfolioImage {
  id: string;
  portfolioId: string;
  imageUrl: string;
  order: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface Machine {
  id: string;
  name: string;
  categoryId?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  name: string;
  categoryId?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Portfolio {
  id: string;
  title: string;
  supplierId: string;
  supplier?: User;
  categoryId: string;
  category?: Category;
  subcategoryId?: string;
  projectId?: string;
  completionDate: string;
  quantityRange?: QuantityRange;
  description: string;
  customerName?: string;
  customerId?: string;
  customer?: User;
  isPublic: boolean;
  isVerified: boolean;
  rating?: number;
  viewCount: number;
  images?: PortfolioImage[];
  machines?: Machine[];
  materials?: Material[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioData {
  title: string;
  categoryId: string;
  subcategoryId?: string;
  projectId?: string;
  completionDate: string;
  quantityRange?: QuantityRange;
  description: string;
  customerName?: string;
  customerId?: string;
  isPublic?: boolean;
  machineIds?: string[];
  materialIds?: string[];
  images?: {
    imageUrl: string;
    order?: number;
    isPrimary?: boolean;
  }[];
}

export interface UpdatePortfolioData extends Partial<CreatePortfolioData> {}

