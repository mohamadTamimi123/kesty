import { DataSource } from 'typeorm';
import { seedAdmin } from './admin.seed';
import { seedCities } from './cities.seed';
import { seedCategories } from './categories.seed';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';
import { Category } from '../../categories/entities/category.entity';

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'keesti_db',
    entities: [User, City, Category],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established.');

    await seedAdmin(dataSource);
    await seedCities(dataSource);
    await seedCategories(dataSource);
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

runSeed();

