import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private store: RateLimitStore = {};
  private readonly maxRequests: number = 100; // per window
  private readonly windowMs: number = 60 * 1000; // 1 minute

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);
    const now = Date.now();

    const record = this.store[key];

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return next.handle();
    }

    if (record.count >= this.maxRequests) {
      throw new HttpException(
        {
          error: 'Too Many Requests',
          message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفا کمی صبر کنید.',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;

    return next.handle().pipe(
      tap(() => {
        // Clean up old entries periodically
        if (Math.random() < 0.01) {
          this.cleanup();
        }
      }),
    );
  }

  private getKey(request: any): string {
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const userId = request.user?.id || 'anonymous';
    return `${ip}:${userId}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }
}


