/**
 * API Response Types
 */

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp?: string;
  path?: string;
  stack?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AxiosErrorResponse {
  response?: {
    data?: ApiError | { message?: string };
    status?: number;
  };
  message?: string;
}


