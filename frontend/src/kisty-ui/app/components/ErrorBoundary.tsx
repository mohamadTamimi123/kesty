"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to error tracking service
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    
    // In production, send to error tracking service
    // TODO: Send to error tracking service (e.g., Sentry)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-brand-off-white flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg border border-brand-medium-gray p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-4 font-display">
              خطایی رخ داد
            </h2>
            <p className="text-brand-medium-blue mb-6">
              متأسفانه خطایی در نمایش این صفحه رخ داده است. لطفا صفحه را رفرش کنید.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-brand-medium-gray mb-2">
                  جزئیات خطا (فقط در حالت توسعه)
                </summary>
                <pre className="text-xs bg-red-50 p-4 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-brand-medium-blue text-white rounded-lg hover:bg-brand-dark-blue transition-colors"
              >
                تلاش مجدد
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white border border-brand-medium-gray text-brand-dark-blue rounded-lg hover:bg-brand-light-sky transition-colors"
              >
                رفرش صفحه
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

