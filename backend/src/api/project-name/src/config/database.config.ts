import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { City } from '../cities/entities/city.entity';
import { CitySupplier } from '../cities/entities/city-supplier.entity';
import { Category } from '../categories/entities/category.entity';
import { CategorySupplier } from '../categories/entities/category-supplier.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectFile } from '../projects/entities/project-file.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { PortfolioImage } from '../portfolio/entities/portfolio-image.entity';
import { Review } from '../reviews/entities/review.entity';
import { ReviewRequest } from '../reviews/entities/review-request.entity';
import { SupplierRating } from '../rating/entities/supplier-rating.entity';
import { Machine } from '../machines/entities/machine.entity';
import { MachineMainCategory } from '../machines/entities/machine-main-category.entity';
import { MachineSupplier } from '../machines/entities/machine-supplier.entity';
import { Material } from '../materials/entities/material.entity';
import { ChangelogTask } from '../changelog/entities/changelog-task.entity';
import { EducationalArticle } from '../educational-articles/entities/educational-article.entity';
import { MachineListing } from '../machine-listings/entities/machine-listing.entity';
import { Conversation } from '../messaging/entities/conversation.entity';
import { Message } from '../messaging/entities/message.entity';
import { Quote } from '../quotes/entities/quote.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentTransaction } from '../payments/entities/payment-transaction.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketMessage } from '../tickets/entities/ticket-message.entity';
import { TicketAttachment } from '../tickets/entities/ticket-attachment.entity';
import { OtpCode } from '../users/entities/otp-code.entity';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USER', 'postgres'),
  password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
  database: configService.get<string>('DATABASE_NAME', 'keesti_db'),
  entities: [
    User,
    OtpCode,
    City,
    CitySupplier,
    Category,
    CategorySupplier,
    Project,
    ProjectFile,
    Portfolio,
    PortfolioImage,
    Review,
    ReviewRequest,
    SupplierRating,
    Machine,
    MachineMainCategory,
    MachineSupplier,
    Material,
    ChangelogTask,
    EducationalArticle,
    MachineListing,
    Conversation,
    Message,
    Quote,
    SubscriptionPlan,
    UserSubscription,
    Payment,
    PaymentTransaction,
    Ticket,
    TicketMessage,
    TicketAttachment,
  ],
  synchronize: false, // Disabled - tables are created manually via scripts
  logging: configService.get<string>('NODE_ENV') === 'development',
  extra: {
    // Connection pool configuration
    max: 20, // Maximum number of connections in the pool
    min: 5, // Minimum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    // Enable connection pooling
    poolSize: 20,
  },
});

