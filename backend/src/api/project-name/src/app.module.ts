import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CitiesModule } from './cities/cities.module';
import { CategoriesModule } from './categories/categories.module';
import { ProjectsModule } from './projects/projects.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RatingModule } from './rating/rating.module';
import { MachinesModule } from './machines/machines.module';
import { MaterialsModule } from './materials/materials.module';
import { ChangelogModule } from './changelog/changelog.module';
import { EducationalArticlesModule } from './educational-articles/educational-articles.module';
import { MachineListingsModule } from './machine-listings/machine-listings.module';
import { MessagingModule } from './messaging/messaging.module';
import { QuotesModule } from './quotes/quotes.module';
import { RedisModule } from './common/modules/redis.module';
import { getDatabaseConfig } from './config/database.config';
import { AdminStatsService } from './common/services/admin-stats.service';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { User, UserRole } from './users/entities/user.entity';
import { Project } from './projects/entities/project.entity';
import { Conversation } from './messaging/entities/conversation.entity';
import { Message } from './messaging/entities/message.entity';
import { Quote } from './quotes/entities/quote.entity';
import { SupplierRating } from './rating/entities/supplier-rating.entity';
import * as bcrypt from 'bcryptjs';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    CitiesModule,
    CategoriesModule,
    ProjectsModule,
    PortfolioModule,
    ReviewsModule,
    RatingModule,
    MachinesModule,
    MaterialsModule,
    ChangelogModule,
    EducationalArticlesModule,
    MachineListingsModule,
    MessagingModule,
    QuotesModule,
    TypeOrmModule.forFeature([User, Project, Conversation, Message, Quote, SupplierRating]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AdminStatsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
  exports: [AdminStatsService],
})
export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    // Try to install uuid-ossp extension, if it fails, use gen_random_uuid() instead
    // Note: PostgreSQL 13+ has gen_random_uuid() built-in, so extension is optional
    try {
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✓ uuid-ossp extension installed successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // If extension installation fails, TypeORM will use gen_random_uuid() instead
      // This is expected in some database configurations (e.g., limited permissions)
      console.log('ℹ uuid-ossp extension not available, using gen_random_uuid() instead');
      console.log(`  Reason: ${errorMessage}`);
      // This is not a critical error - TypeORM will use gen_random_uuid() which is built-in in PostgreSQL 13+
    }

    // Initialize admin user if it doesn't exist
    await this.initializeAdminUser();
  }

  private async initializeAdminUser(): Promise<void> {
    try {
      const userRepository = this.dataSource.getRepository(User);

      // Admin credentials
      const adminPhone = '09123456789';
      const adminPassword = 'admin123';
      const adminFullName = 'Super Admin';
      const adminEmail = 'admin@keesti.com';

      // Check if admin already exists
      const existingAdmin = await userRepository.findOne({
        where: { phone: adminPhone },
      });

      if (existingAdmin) {
        // Update existing admin to ensure correct credentials
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        existingAdmin.fullName = adminFullName;
        existingAdmin.email = adminEmail;
        existingAdmin.role = UserRole.ADMIN;
        existingAdmin.passwordHash = passwordHash;
        existingAdmin.isActive = true;
        existingAdmin.isBlocked = false;
        existingAdmin.phoneVerified = true;
        existingAdmin.emailVerified = true;

        await userRepository.save(existingAdmin);
        console.log('✓ Admin user updated successfully');
        console.log(`  Phone: ${adminPhone}`);
        console.log(`  Password: ${adminPassword}`);
      } else {
        // Create new admin
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const admin = userRepository.create({
          phone: adminPhone,
          fullName: adminFullName,
          email: adminEmail,
          role: UserRole.ADMIN,
          passwordHash,
          isActive: true,
          isBlocked: false,
          phoneVerified: true,
          emailVerified: true,
        });

        await userRepository.save(admin);
        console.log('✓ Admin user created successfully');
        console.log(`  Phone: ${adminPhone}`);
        console.log(`  Password: ${adminPassword}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('✗ Error initializing admin user:', errorMessage);
      // Don't throw - allow app to start even if admin initialization fails
    }
  }
}
