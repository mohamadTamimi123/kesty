import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded } from 'express';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Enable compression for all responses
  app.use(compression({
    level: 6, // Compression level (1-9, 6 is a good balance)
    filter: (req: any, res: any) => {
      // Don't compress if client doesn't support it or if response is already compressed
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression for all text-based responses
      return compression.filter(req, res);
    },
  }));

  // Body size limit for JSON payloads
  // Reduced from 50MB to 10MB to prevent excessive RAM usage
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', '/api') as string;
  app.setGlobalPrefix(apiPrefix);

  // Serve static files from uploads directory (after setting global prefix)
  // Static files will be accessible at /api/uploads/...
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: `${apiPrefix}/uploads`,
  });

  // CORS configuration
  const frontendUrl = configService.get(
    'FRONTEND_URL',
    'http://localhost:3000',
  ) as string;
  
  // Allow multiple origins
  const allowedOrigins = [
    frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://103.75.197.95:3000',
    'http://103.75.197.95',
    'https://103.75.197.95:3000',
    'https://103.75.197.95',
  ].filter((origin): origin is string => typeof origin === 'string' && origin !== '');
  
  // CORS configuration - simplified to ensure it works
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Always allow if in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // For development or if origin matches server IP, allow it
      if (process.env.NODE_ENV !== 'production' || origin.includes('103.75.197.95')) {
        return callback(null, true);
      }
      
      // Default: allow all origins (for now)
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Security headers
  app.use((req, res, next) => {
    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Content Security Policy
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
      );
    }
    next();
  });

  const port = configService.get('PORT', 3001) as number;
  await app.listen(port);
  // Application started successfully
}
bootstrap();
