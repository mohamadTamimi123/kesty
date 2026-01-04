import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

enum ErrorCategory {
  DATABASE = 'DATABASE',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'خطای داخلی سرور';
    let error = 'InternalServerError';
    let stack: string | undefined;
    let originalMessage = '';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        originalMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        originalMessage = (responseObj.message as string) || message;
        message = originalMessage;
        error = (responseObj.error as string) || error;
      }
    } else if (exception instanceof Error) {
      originalMessage = exception.message;
      message = exception.message;
      stack = exception.stack;
    }

    // Categorize error
    const category = this.categorizeError(exception, originalMessage, status);
    
    // Get user-friendly message
    const userFriendlyMessage = this.getUserFriendlyMessage(
      category,
      originalMessage,
      status,
    );

    // Log error with context
    this.logErrorWithContext(exception, status, message, category, request, stack);

    // Use user-friendly message for client responses
    const responseMessage = status >= HttpStatus.INTERNAL_SERVER_ERROR
      ? userFriendlyMessage
      : message; // Keep original message for client errors (4xx)

    response.status(status).json({
      error,
      message: responseMessage,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
    });
  }

  private categorizeError(
    exception: unknown,
    message: string,
    status: number,
  ): ErrorCategory {
    const messageLower = message.toLowerCase();
    const errorString = exception instanceof Error ? exception.toString().toLowerCase() : '';

    // Database errors
    if (
      messageLower.includes('relation') ||
      messageLower.includes('permission denied') ||
      messageLower.includes('duplicate') ||
      messageLower.includes('foreign key') ||
      messageLower.includes('constraint') ||
      errorString.includes('typeorm') ||
      errorString.includes('query failed')
    ) {
      return ErrorCategory.DATABASE;
    }

    // Validation errors
    if (
      status === HttpStatus.BAD_REQUEST ||
      messageLower.includes('validation') ||
      messageLower.includes('invalid') ||
      messageLower.includes('معتبر نیست')
    ) {
      return ErrorCategory.VALIDATION;
    }

    // Auth errors
    if (
      status === HttpStatus.UNAUTHORIZED ||
      status === HttpStatus.FORBIDDEN ||
      messageLower.includes('unauthorized') ||
      messageLower.includes('forbidden') ||
      messageLower.includes('دسترسی') ||
      messageLower.includes('احراز هویت')
    ) {
      return ErrorCategory.AUTH;
    }

    // Not found errors
    if (
      status === HttpStatus.NOT_FOUND ||
      messageLower.includes('not found') ||
      messageLower.includes('یافت نشد') ||
      messageLower.includes('موجود نیست')
    ) {
      return ErrorCategory.NOT_FOUND;
    }

    // Network errors
    if (
      messageLower.includes('timeout') ||
      messageLower.includes('network') ||
      messageLower.includes('connection') ||
      messageLower.includes('econnrefused')
    ) {
      return ErrorCategory.NETWORK;
    }

    return ErrorCategory.UNKNOWN;
  }

  private getUserFriendlyMessage(
    category: ErrorCategory,
    originalMessage: string,
    status: number,
  ): string {
    // For client errors (4xx), return original message if it's user-friendly
    if (status < HttpStatus.INTERNAL_SERVER_ERROR && originalMessage) {
      return originalMessage;
    }

    // For server errors (5xx), provide user-friendly messages
    switch (category) {
      case ErrorCategory.DATABASE:
        return 'خطای اتصال به پایگاه داده. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید.';
      
      case ErrorCategory.VALIDATION:
        return 'اطلاعات وارد شده معتبر نیست. لطفاً فیلدها را بررسی کنید.';
      
      case ErrorCategory.AUTH:
        return 'شما دسترسی لازم را ندارید. لطفاً دوباره وارد شوید.';
      
      case ErrorCategory.NOT_FOUND:
        return 'مورد درخواستی یافت نشد.';
      
      case ErrorCategory.NETWORK:
        return 'خطای اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
      
      case ErrorCategory.UNKNOWN:
      default:
        return 'متأسفانه خطایی رخ داد. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید.';
    }
  }

  private logErrorWithContext(
    exception: unknown,
    status: number,
    message: string,
    category: ErrorCategory,
    request: Request,
    stack?: string,
  ): void {
    const context = {
      method: request.method,
      url: request.url,
      status,
      category,
      userId: (request as any).user?.id,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${category}] Error ${status}: ${message}`,
        stack,
        JSON.stringify(context),
      );
    } else {
      this.logger.warn(
        `[${category}] Client error ${status}: ${message}`,
        JSON.stringify(context),
      );
    }
  }
}

