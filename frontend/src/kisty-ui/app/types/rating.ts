import { User } from './user';

export interface SupplierRating {
  id: string;
  supplierId: string;
  supplier?: User;
  totalScore: number;
  premiumScore: number;
  reviewScore: number;
  profileScore: number;
  responseScore: number;
  activityScore: number;
  penalties: number;
  lastCalculatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingBreakdown {
  premium: number;
  review: number;
  profile: number;
  response: number;
  activity: number;
  penalties: number;
  total: number;
}

export enum PremiumLevel {
  NONE = 'NONE',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
}

