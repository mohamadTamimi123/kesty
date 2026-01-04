export enum QuoteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface Quote {
  id: string;
  projectId: string;
  project?: {
    id: string;
    title: string;
    description: string;
    status: string;
    category?: {
      id: string;
      title: string;
    };
    city?: {
      id: string;
      title: string;
    };
    customer?: {
      id: string;
      fullName: string;
    };
  };
  supplierId: string;
  supplier?: {
    id: string;
    fullName: string;
    workshopName?: string;
    avatarUrl?: string;
    rating?: number;
  };
  price: number;
  description: string | null;
  deliveryTimeDays: number | null;
  status: QuoteStatus;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteData {
  projectId: string;
  price: number;
  description?: string;
  deliveryTimeDays?: number;
}

export interface UpdateQuoteData {
  price?: number;
  description?: string;
  deliveryTimeDays?: number;
}

export interface QuoteStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
}

