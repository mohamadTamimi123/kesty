import { DataSource } from 'typeorm';
import { seedComprehensive } from './comprehensive.seed';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';
import { Category } from '../../categories/entities/category.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { PortfolioImage } from '../../portfolio/entities/portfolio-image.entity';
import { Review } from '../../reviews/entities/review.entity';
import { EducationalArticle } from '../../educational-articles/entities/educational-article.entity';
import { Project } from '../../projects/entities/project.entity';
import { ProjectFile } from '../../projects/entities/project-file.entity';
import { Machine } from '../../machines/entities/machine.entity';
import { Material } from '../../materials/entities/material.entity';
import { CategorySupplier } from '../../categories/entities/category-supplier.entity';
import { CitySupplier } from '../../cities/entities/city-supplier.entity';
import { SupplierRating } from '../../rating/entities/supplier-rating.entity';
import { Quote } from '../../quotes/entities/quote.entity';
import { Conversation } from '../../messaging/entities/conversation.entity';
import { Message } from '../../messaging/entities/message.entity';

async function runComprehensiveSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'keesti_db',
    entities: [
      User,
      City,
      Category,
      Portfolio,
      PortfolioImage,
      Review,
      EducationalArticle,
      Project,
      ProjectFile,
      Machine,
      Material,
      CategorySupplier,
      CitySupplier,
      SupplierRating,
      Quote,
      Conversation,
      Message,
    ],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established.');

    await seedComprehensive(dataSource);
    
    console.log('Comprehensive seeding completed successfully!');
  } catch (error) {
    console.error('Error during comprehensive seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

runComprehensiveSeed();

