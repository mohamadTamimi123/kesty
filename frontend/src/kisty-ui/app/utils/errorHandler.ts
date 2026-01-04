/**
 * Error handling utilities
 */

import { AxiosError } from 'axios';
import { ApiError, AxiosErrorResponse } from '../types/api';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  const axiosError = error as AxiosErrorResponse;
  if (axiosError.response?.data) {
    const apiError = axiosError.response.data as ApiError;
    return apiError.message || 'خطای نامشخص رخ داد';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'خطای نامشخص رخ داد';
}

export function getApiError(error: unknown): ApiError | null {
  const axiosError = error as AxiosErrorResponse;
  if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
    return axiosError.response.data as ApiError;
  }
  return null;
}

export function isAxiosError(error: unknown): error is AxiosError<ApiError> {
  return error !== null && typeof error === 'object' && 'response' in error;
}


