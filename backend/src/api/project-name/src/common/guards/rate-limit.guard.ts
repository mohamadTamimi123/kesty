import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';

/**
 * Rate Limit Guard
 * 
 * Note: This guard is currently a placeholder. Rate limiting is handled by RateLimitInterceptor.
 * If you need to use @nestjs/throttler, install it: npm install @nestjs/throttler
 * Then uncomment the ThrottlerGuard extension below.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    // Rate limiting is handled by RateLimitInterceptor
    return true;
  }
}

// Alternative implementation using @nestjs/throttler (requires installation):
// import { Injectable, ExecutionContext } from '@nestjs/common';
// import { ThrottlerGuard } from '@nestjs/throttler';
//
// @Injectable()
// export class RateLimitGuard extends ThrottlerGuard {
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     if (process.env.NODE_ENV === 'development') {
//       return true;
//     }
//     return super.canActivate(context);
//   }
// }

