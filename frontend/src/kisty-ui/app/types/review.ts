import { Portfolio } from './portfolio';
import { User } from './user';

export enum ReviewRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface Review {
  id: string;
  portfolioId: string;
  portfolio?: Portfolio;
  customerId: string | null;
  customer?: User | null;
  customerName?: string | null;
  customerEmail?: string | null;
  supplierId: string;
  supplier?: User;
  rating: number; // 1-5
  comment?: string;
  isApproved: boolean;
  isDeleted: boolean;
  responseDate?: string;
  responseTimeHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequest {
  id: string;
  portfolioId: string;
  portfolio?: Portfolio;
  supplierId: string;
  supplier?: User;
  customerId: string | null;
  customer?: User | null;
  customerName?: string | null;
  customerEmail?: string | null;
  token?: string | null;
  status: ReviewRequestStatus;
  message?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  portfolioId: string;
  rating: number;
  comment?: string;
}

export interface CreateReviewRequestData {
  portfolioId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  message?: string;
  generateToken?: boolean; // If true, generate one-time token instead of requiring customerId
}

