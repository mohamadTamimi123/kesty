import { Category } from './category';
import { User } from './user';
import { Supplier } from './supplier';

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
  supplier?: Supplier;
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
  completionDate: string; // Required
  quantityRange?: QuantityRange; // Required: <100, 100-1000, >1000
  description: string; // Project challenges, solutions
  customerName?: string; // Optional, only if permission granted
  customerId?: string;
  isPublic?: boolean; // Show in public gallery
  machineIds?: string[]; // Multiple selection from predefined list
  materialIds?: string[]; // From predefined list
  images?: {
    imageUrl: string;
    order?: number;
    isPrimary?: boolean;
  }[]; // Minimum 1 image required
}

export interface UpdatePortfolioData extends Partial<CreatePortfolioData> {}

