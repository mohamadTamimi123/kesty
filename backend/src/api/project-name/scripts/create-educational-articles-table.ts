import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function createEducationalArticlesTable() {
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

    const migrationPath = path.join(
      __dirname,
      '../src/database/migrations/create-educational-articles-table.sql',
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await client.query(sql);
    console.log('✓ Educational articles table created successfully');

    await client.end();
  } catch (error: any) {
    console.error('✗ Error creating table:', error.message);
    await client.end();
    process.exit(1);
  }
}

createEducationalArticlesTable();

