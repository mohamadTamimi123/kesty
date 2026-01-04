import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';
import { Category } from '../../categories/entities/category.entity';
import { Project } from '../../projects/entities/project.entity';
import { ProjectFile } from '../../projects/entities/project-file.entity';
import { seedProjects } from './projects.seed';

async function runProjectsSeed() {
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
      Project,
      ProjectFile,
    ],
    synchronize: false, // Tables are created manually, don't synchronize
    logging: false, // Set to true for debugging
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established.');

    // Get project count from command line argument or use default
    const projectCount = process.argv[2] ? parseInt(process.argv[2], 10) : 20;
    
    if (isNaN(projectCount) || projectCount < 1) {
      console.error('تعداد پروژه باید یک عدد مثبت باشد.');
      process.exit(1);
    }

    await seedProjects(dataSource, projectCount);
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

runProjectsSeed();

