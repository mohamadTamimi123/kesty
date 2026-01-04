import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from '../../types/api';

// Get API URL - use environment variable or detect from current hostname
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // In browser, use current hostname with API port
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5001/api`;
  }
  
  // Fallback for server-side
  return 'http://localhost:5001/api';
};

const API_URL = getApiUrl();

// Log API URL in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('🔗 API Base URL:', API_URL);
}

export class BaseApiClient {
  protected client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Request interceptor to add token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: any) => {
        // Ensure we have a valid error object
        if (!error || typeof error !== 'object') {
          const fallbackError: ApiError = {
            message: String(error || 'Unknown error'),
            statusCode: undefined,
            error: 'Unknown Error',
            path: undefined,
          };
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('api-error', {
                detail: fallbackError,
              })
            );
          }
          return Promise.reject(fallbackError);
        }
        
        const originalRequest = error.config as any;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          const token = this.getToken();
          const requestUrl = originalRequest?.url || '';
          const requestMethod = (originalRequest?.method || 'get').toLowerCase();
          
          // Check if this is a public GET endpoint
          // Public GET endpoints: GET /portfolio/:id, GET /portfolio/supplier/:id, GET /reviews/portfolio/:id, GET /suppliers/:slug, GET /customers/:id
          // Remove query string for matching
          const urlWithoutQuery = requestUrl.split('?')[0];
          const isPublicGetEndpoint = 
            requestMethod === 'get' && (
              (urlWithoutQuery.match(/^\/portfolio\/[^\/]+$/) && // GET /portfolio/:id (single ID, not nested)
               !urlWithoutQuery.includes('/portfolio/my-portfolios') &&
               !urlWithoutQuery.includes('/portfolio/pending') &&
               !urlWithoutQuery.includes('/portfolio/stats') &&
               !urlWithoutQuery.includes('/portfolio/upload-images')) ||
              urlWithoutQuery.match(/^\/portfolio\/supplier\/[^\/]+$/) || // GET /portfolio/supplier/:id
              urlWithoutQuery.includes('/reviews/portfolio/') ||
              urlWithoutQuery.includes('/suppliers/') ||
              urlWithoutQuery.match(/^\/customers\/[^\/]+$/) // GET /customers/:id
            );
          
          // If it's a public GET endpoint and we had a token (expired), retry without token
          if (isPublicGetEndpoint && token && !originalRequest._retry) {
            originalRequest._retry = true;
            delete originalRequest.headers.Authorization;
            
            try {
              // Retry the request without token
              return await this.client.request(originalRequest);
            } catch (retryError) {
              // If retry also fails, continue with normal error handling
              this.clearToken();
              return Promise.reject(retryError);
            }
          }
          
          // Clear token for non-public endpoints or if retry wasn't attempted
          this.clearToken();
          
          // Only redirect to login if we had a token and are on a protected route
          // Public routes (like /portfolio, /supplier) should not redirect
          if (token && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            // Only redirect for dashboard/protected routes
            if (currentPath.startsWith('/dashboard')) {
              window.location.href = '/login';
            }
          }
        }
        
        // Format error for ErrorContext
        // Error will be handled by ErrorContext through showApiError
        // We format it here to ensure consistent error structure
        
        // Handle network errors (no response)
        if (!error.response) {
          const networkError: ApiError = {
            message: error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK'
              ? 'اتصال به سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.'
              : error.message || 'خطا در ارتباط با سرور',
            statusCode: undefined,
            error: error.code || error.message || 'Network Error',
            path: error.config?.url,
          };
          
          // Dispatch network error event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('api-error', {
                detail: networkError,
              })
            );
          }
          
          return Promise.reject(networkError);
        }
        
        // Handle HTTP response errors
        const formattedError: ApiError = {
          message: error.response?.data?.message || 
                   error.response?.data?.error || 
                   error.message || 
                   'خطایی رخ داد',
          statusCode: error.response?.status,
          error: error.response?.data?.error || 
                 error.response?.statusText || 
                 error.message,
          path: error.config?.url,
        };
        
        // Log error details in development before dispatching
        // Always log in browser environment for debugging
        if (typeof window !== 'undefined') {
          try {
            // Build error details object step by step
            const errorDetails: Record<string, any> = {};
            
            // Extract basic error info
            if (error && typeof error === 'object') {
              // URL and config
              if (error.config) {
                errorDetails.url = error.config.url || 'N/A';
                errorDetails.method = error.config.method || 'N/A';
                errorDetails.baseURL = error.config.baseURL || 'N/A';
              } else {
                errorDetails.url = 'N/A';
                errorDetails.method = 'N/A';
                errorDetails.baseURL = 'N/A';
              }
              
              // Response info
              if (error.response) {
                errorDetails.status = error.response.status || 'N/A';
                errorDetails.statusText = error.response.statusText || 'N/A';
                
                // Safely extract response data
                if (error.response.data) {
                  try {
                    const dataStr = JSON.stringify(error.response.data);
                    errorDetails.responseData = JSON.parse(dataStr);
                  } catch {
                    errorDetails.responseData = String(error.response.data);
                  }
                } else {
                  errorDetails.responseData = null;
                }
              } else {
                errorDetails.status = 'N/A';
                errorDetails.statusText = 'N/A';
                errorDetails.responseData = null;
              }
              
              // Error message and code
              errorDetails.message = error.message || 'N/A';
              errorDetails.code = error.code || 'N/A';
              
              // Error name
              if (error.name) {
                errorDetails.name = error.name;
              }
            } else {
              // Fallback if error is not an object
              errorDetails.message = String(error || 'Unknown error');
              errorDetails.url = 'N/A';
              errorDetails.method = 'N/A';
              errorDetails.baseURL = 'N/A';
              errorDetails.status = 'N/A';
              errorDetails.statusText = 'N/A';
            }

            // Add formatted error
            errorDetails.formattedError = formattedError;

            // Log with a clear, visible format
            console.error('═══════════════════════════════════════════════════════');
            console.error('🔴 API ERROR in base.ts');
            console.error('═══════════════════════════════════════════════════════');
            console.error('📍 URL:', errorDetails.url);
            console.error('🔧 Method:', errorDetails.method);
            console.error('🌐 Base URL:', errorDetails.baseURL);
            console.error('📊 Status:', errorDetails.status);
            console.error('📝 Status Text:', errorDetails.statusText);
            console.error('💬 Message:', errorDetails.message);
            console.error('🔑 Code:', errorDetails.code);
            if (errorDetails.name) {
              console.error('📌 Error Name:', errorDetails.name);
            }
            console.error('📦 Response Data:', errorDetails.responseData);
            console.error('✨ Formatted Error:', errorDetails.formattedError);
            console.error('═══════════════════════════════════════════════════════');
            
            // Also log the raw error for debugging
            console.error('🔍 Raw Error Object:', error);
            if (error && typeof error === 'object') {
              console.error('🔑 Error Keys:', Object.keys(error));
              if (error.config) {
                console.error('⚙️ Error Config:', {
                  url: error.config.url,
                  method: error.config.method,
                  baseURL: error.config.baseURL,
                  headers: error.config.headers,
                });
              }
              if (error.response) {
                console.error('📡 Error Response:', {
                  status: error.response.status,
                  statusText: error.response.statusText,
                  headers: error.response.headers,
                  data: error.response.data,
                });
              }
            }
            console.error('═══════════════════════════════════════════════════════');
          } catch (logError) {
            console.error('🔴 Error logging failed:', logError);
            console.error('🔴 Original error:', error);
            console.error('🔴 Error type:', typeof error);
            console.error('🔴 Error string:', String(error));
          }
        }
        
        // Dispatch error event for all errors except 401 (401 is handled above with redirect)
        // But we still reject the promise so the calling code can handle it
        if (typeof window !== 'undefined' && error.response?.status !== 401) {
          window.dispatchEvent(
            new CustomEvent('api-error', {
              detail: formattedError,
            })
          );
        }
        
        return Promise.reject(formattedError);
      },
    );
  }

  protected getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  protected setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
      
      // Set cookie with proper expiration for middleware access
      const expires = new Date();
      expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      
      // Set cookie with multiple attempts to ensure it's set
      const cookieValue = `accessToken=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      document.cookie = cookieValue;
      
      // Force update (some browsers need this)
      if (window.location.protocol === 'https:') {
        document.cookie = `${cookieValue}; Secure`;
      }
    }
  }

  protected clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      // Clear cookie
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  // Generic methods
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

