import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function addMessageMetadata() {
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
      '../src/database/migrations/add-message-metadata.sql',
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await client.query(sql);
    console.log('✓ Message metadata column added successfully');

    await client.end();
  } catch (error: any) {
    console.error('✗ Error running migration:', error.message);
    await client.end();
    process.exit(1);
  }
}

addMessageMetadata();
