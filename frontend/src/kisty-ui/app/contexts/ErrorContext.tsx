"use client";

import { createContext, useContext, ReactNode, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
  path?: string;
}

interface ErrorContextType {
  showError: (message: string, severity?: "error" | "warning" | "info") => void;
  showApiError: (error: ApiError | Error | unknown) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const showError = useCallback((
    message: string,
    severity: "error" | "warning" | "info" = "error"
  ) => {
    switch (severity) {
      case "error":
        toast.error(message, {
          duration: 5000,
          position: "top-center",
        });
        break;
      case "warning":
        toast(message, {
          icon: "⚠️",
          duration: 4000,
          position: "top-center",
          style: {
            border: "1px solid #f59e0b",
          },
        });
        break;
      case "info":
        toast(message, {
          icon: "ℹ️",
          duration: 3000,
          position: "top-center",
        });
        break;
    }
  }, []);

  const showApiError = useCallback((error: ApiError | Error | unknown) => {
    let errorMessage = "خطایی رخ داد. لطفاً دوباره تلاش کنید.";

    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    } else if (typeof error === "object" && error !== null) {
      const apiError = error as ApiError;
      
      // Extract message from API error response
      if (apiError.message) {
        errorMessage = apiError.message;
      } else if (apiError.error) {
        errorMessage = apiError.error;
      }

      // Categorize error and provide user-friendly messages
      const statusCode = apiError.statusCode;
      
      if (statusCode) {
        if (statusCode >= 500) {
          // Server errors - show generic message
          errorMessage = "خطای داخلی سرور. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید.";
        } else if (statusCode === 404) {
          errorMessage = apiError.message || "مورد درخواستی یافت نشد.";
        } else if (statusCode === 403) {
          errorMessage = apiError.message || "شما دسترسی لازم را ندارید.";
        } else if (statusCode === 401) {
          errorMessage = apiError.message || "لطفاً دوباره وارد شوید.";
        } else if (statusCode === 400) {
          // Keep original validation message for 400 errors
          errorMessage = apiError.message || "اطلاعات وارد شده معتبر نیست.";
        }
      }
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    // Determine severity based on status code
    const apiError = error as ApiError;
    const severity =
      apiError.statusCode && apiError.statusCode >= 500
        ? "error"
        : apiError.statusCode === 404 || apiError.statusCode === 403
        ? "warning"
        : "error";

    showError(errorMessage, severity);

    // Log error for debugging - improved logging
    if (process.env.NODE_ENV === "development") {
      try {
        // Extract all possible error properties
        const apiError = error as ApiError;
        const errorObj = error as any;
        
        // Build error details object with all available information
        const errorDetails: Record<string, any> = {};
        
        // Basic error information
        if (error !== null && error !== undefined) {
          errorDetails.errorType = typeof error;
          errorDetails.errorConstructor = error?.constructor?.name || 'Unknown';
          errorDetails.errorString = String(error);
          
          // Extract message
          if (error instanceof Error) {
            errorDetails.errorMessage = error.message;
            errorDetails.errorStack = error.stack;
          } else if (apiError?.message) {
            errorDetails.errorMessage = apiError.message;
          } else if (errorObj?.message) {
            errorDetails.errorMessage = errorObj.message;
          }
          
          // Extract status code
          if (apiError?.statusCode !== undefined) {
            errorDetails.errorStatus = apiError.statusCode;
          } else if (errorObj?.statusCode !== undefined) {
            errorDetails.errorStatus = errorObj.statusCode;
          } else if (errorObj?.status !== undefined) {
            errorDetails.errorStatus = errorObj.status;
          }
          
          // Extract path/URL
          if (apiError?.path) {
            errorDetails.errorPath = apiError.path;
          } else if (errorObj?.path) {
            errorDetails.errorPath = errorObj.path;
          } else if (errorObj?.config?.url) {
            errorDetails.errorPath = errorObj.config.url;
          }
          
          // Extract error property
          if (apiError?.error) {
            errorDetails.error = apiError.error;
          } else if (errorObj?.error) {
            errorDetails.error = errorObj.error;
          }
          
          // Try to extract response data (for Axios errors)
          if (errorObj?.response) {
            errorDetails.responseData = errorObj.response.data;
            errorDetails.responseStatus = errorObj.response.status;
            errorDetails.responseStatusText = errorObj.response.statusText;
          }
          
          // Try to extract request config (for Axios errors)
          if (errorObj?.config) {
            errorDetails.requestUrl = errorObj.config.url;
            errorDetails.requestMethod = errorObj.config.method;
            errorDetails.requestBaseURL = errorObj.config.baseURL;
          }
          
          // Try to serialize the entire error object
          try {
            if (typeof error === 'object') {
              const errorKeys = Object.keys(error);
              const ownPropertyNames = Object.getOwnPropertyNames(error);
              const allKeys = [...new Set([...errorKeys, ...ownPropertyNames])];
              
              const serializedError: Record<string, any> = {};
              allKeys.forEach(key => {
                try {
                  const value = (error as any)[key];
                  // Skip functions and circular references
                  if (typeof value !== 'function' && value !== error) {
                    // Try to serialize, but catch circular references
                    try {
                      JSON.stringify(value);
                      serializedError[key] = value;
                    } catch {
                      serializedError[key] = '[Circular or non-serializable]';
                    }
                  }
                } catch (e) {
                  // Skip properties that can't be accessed
                }
              });
              
              if (Object.keys(serializedError).length > 0) {
                errorDetails.errorObject = serializedError;
              }
            }
          } catch (serializeError) {
            errorDetails.serializeError = String(serializeError);
          }
        } else {
          errorDetails.note = 'Error object is null or undefined';
        }

        // Only log if we have some information
        if (Object.keys(errorDetails).length > 0) {
          console.error("🔴 API Error Details in ErrorContext:", errorDetails);
        } else {
          console.error("⚠️ API Error Details is empty. Raw error:", error);
        }
        console.error("🔴 Raw Error Object:", error);
      } catch (logError) {
        console.error("❌ Error logging failed:", logError);
        console.error("❌ Original error:", String(error));
        console.error("❌ Original error (raw):", error);
      }
    }
  }, [showError]);

  const clearError = useCallback(() => {
    toast.dismiss();
  }, []);

  // Listen for API errors from axios interceptor
  useEffect(() => {
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent<ApiError>;
      const errorDetail = customEvent.detail;
      
      // Log the received error detail for debugging
      if (process.env.NODE_ENV === "development") {
        console.log("📥 Received API error event:", errorDetail);
      }
      
      if (errorDetail) {
        showApiError(errorDetail);
      } else {
        console.warn("⚠️ API error event received but detail is empty:", event);
      }
    };

    window.addEventListener("api-error", handleApiError as EventListener);

    return () => {
      window.removeEventListener("api-error", handleApiError as EventListener);
    };
  }, [showApiError]);

  return (
    <ErrorContext.Provider value={{ showError, showApiError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
}

