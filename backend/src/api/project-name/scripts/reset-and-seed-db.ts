import { Client } from 'pg';
import { execSync } from 'child_process';
import * as path from 'path';

async function resetAndSeedDatabase() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'keesti_db',
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Backup database name
    const dbName = process.env.DATABASE_NAME || 'keesti_db';
    const backupName = `${dbName}_backup_${Date.now()}`;

    console.log('\n📦 Creating backup...');
    try {
      // Create backup database
      await client.query(`CREATE DATABASE ${backupName} WITH TEMPLATE ${dbName}`);
      console.log(`✓ Backup created: ${backupName}`);
    } catch (error: any) {
      if (error.code === '42P04') {
        console.log('⚠ Backup database already exists, skipping...');
      } else {
        console.log('⚠ Could not create backup:', error.message);
      }
    }

    console.log('\n🗑️  Clearing existing data...');
    
    // Drop all tables in correct order (respecting foreign keys)
    const dropTables = [
      'DROP TABLE IF EXISTS messages CASCADE',
      'DROP TABLE IF EXISTS conversations CASCADE',
      'DROP TABLE IF EXISTS quotes CASCADE',
      'DROP TABLE IF EXISTS project_files CASCADE',
      'DROP TABLE IF EXISTS projects CASCADE',
      'DROP TABLE IF EXISTS portfolio_images CASCADE',
      'DROP TABLE IF EXISTS portfolios CASCADE',
      'DROP TABLE IF EXISTS reviews CASCADE',
      'DROP TABLE IF EXISTS supplier_ratings CASCADE',
      'DROP TABLE IF EXISTS city_suppliers CASCADE',
      'DROP TABLE IF EXISTS category_suppliers CASCADE',
      'DROP TABLE IF EXISTS educational_articles CASCADE',
      'DROP TABLE IF EXISTS materials CASCADE',
      'DROP TABLE IF EXISTS machines CASCADE',
      'DROP TABLE IF EXISTS categories CASCADE',
      'DROP TABLE IF EXISTS cities CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
    ];

    for (const dropQuery of dropTables) {
      try {
        await client.query(dropQuery);
      } catch (error: any) {
        console.log(`⚠ ${dropQuery}: ${error.message}`);
      }
    }

    console.log('✓ Tables cleared');

    await client.end();
    console.log('\n🔧 Recreating all tables...');
    
    // Run create-tables script to recreate all tables (includes metadata column)
    const projectRoot = path.join(__dirname, '../..');
    const createTablesScriptPath = path.join(__dirname, 'create-tables.ts');
    
    execSync(`pnpm ts-node -r tsconfig-paths/register ${createTablesScriptPath}`, {
      stdio: 'inherit',
      cwd: projectRoot,
      env: { ...process.env },
    });
    console.log('\n✅ Database reset completed!');
    console.log('\n🌱 Running seeders...\n');

    // Run comprehensive seed - use absolute path
    const seedScriptPath = path.join(__dirname, '../src/database/seeds/run-comprehensive-seed.ts');
    
    execSync(`pnpm ts-node -r tsconfig-paths/register ${seedScriptPath}`, {
      stdio: 'inherit',
      cwd: projectRoot,
      env: { ...process.env },
    });

    console.log('\n✅ Database reset and seeding completed successfully!');
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

resetAndSeedDatabase();
