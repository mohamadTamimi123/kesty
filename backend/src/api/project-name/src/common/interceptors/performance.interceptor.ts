import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;

          // Log slow requests (> 1 second)
          if (responseTime > 1000) {
            console.warn(
              `[SLOW REQUEST] ${method} ${url} - ${statusCode} - ${responseTime}ms`,
            );
          }

          // Log all requests in development
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `[API] ${method} ${url} - ${statusCode} - ${responseTime}ms`,
            );
          }

          // Add response time header
          response.setHeader('X-Response-Time', `${responseTime}ms`);
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          console.error(
            `[API ERROR] ${method} ${url} - ${responseTime}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}

