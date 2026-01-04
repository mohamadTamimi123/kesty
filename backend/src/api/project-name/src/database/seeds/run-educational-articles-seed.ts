import { DataSource } from 'typeorm';
import { seedEducationalArticles } from './educational-articles.seed';
import { EducationalArticle } from '../../educational-articles/entities/educational-article.entity';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'keesti_db',
    entities: [EducationalArticle, Category, User],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✓ Database connected\n');

    // Create uuid-ossp extension if it doesn't exist
    try {
      await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✓ UUID extension installed/verified.\n');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠ Warning: Could not install uuid-ossp extension: ${errorMessage}\n`);
    }

    await seedEducationalArticles(dataSource);

    await dataSource.destroy();
    console.log('\n✓ Seeder completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('✗ Error running seeder:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeed();

