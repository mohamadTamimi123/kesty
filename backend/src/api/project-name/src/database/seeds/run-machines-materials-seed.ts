import { DataSource } from 'typeorm';
import { seedMachines } from './machines.seed';
import { seedMaterials } from './materials.seed';
import { Machine } from '../../machines/entities/machine.entity';
import { Material } from '../../materials/entities/material.entity';
import { Category } from '../../categories/entities/category.entity';

async function runMachinesMaterialsSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'keesti_db',
    entities: [Machine, Material, Category],
    synchronize: false, // Tables are created manually, don't synchronize
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established.');

    // Create uuid-ossp extension if it doesn't exist
    try {
      await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✓ UUID extension installed/verified.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠ Warning: Could not install uuid-ossp extension: ${errorMessage}`);
      // Continue anyway - TypeORM will use gen_random_uuid() as fallback
    }

    await seedMachines(dataSource);
    await seedMaterials(dataSource);
    
    console.log('Machines and Materials seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

runMachinesMaterialsSeed();

