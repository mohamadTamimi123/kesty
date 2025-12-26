import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

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
  
  // Allow multiple origins for development
  const allowedOrigins = [
    frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://103.75.197.95:3000',
  ].filter((origin): origin is string => typeof origin === 'string' && origin !== '');
  
  app.enableCors({
    origin: process.env.NODE_ENV === 'development' 
      ? (origin, callback) => {
          // Allow all origins in development
          callback(null, true);
        }
      : allowedOrigins.length > 0 
        ? allowedOrigins 
        : frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  const port = configService.get('PORT', 3001) as number;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}${apiPrefix}`);
}
bootstrap();
