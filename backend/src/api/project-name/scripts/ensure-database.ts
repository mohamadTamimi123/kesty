import { Client } from 'pg';

async function ensureDatabase() {
  const dbName = process.env.DATABASE_NAME || 'keesti_db';
  const dbHost = process.env.DATABASE_HOST || 'localhost';
  const dbPort = parseInt(process.env.DATABASE_PORT || '5432', 10);
  const dbUser = process.env.DATABASE_USER || 'postgres';
  const dbPassword = process.env.DATABASE_PASSWORD || 'postgres';

  // Connect to default postgres database to create our database
  const adminClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await adminClient.connect();
    console.log('Connected to PostgreSQL server.');

    // Check if database exists
    const result = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`Creating database "${dbName}"...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✓ Database "${dbName}" created successfully.`);
      
      // Connect to the new database to create extension
      await adminClient.end();
      const dbClient = new Client({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
      });
      
      await dbClient.connect();
      console.log(`Installing uuid-ossp extension in "${dbName}"...`);
      try {
        await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log(`✓ UUID extension installed successfully.`);
      } catch (extError: any) {
        console.warn(`⚠ Warning: Could not install uuid-ossp extension: ${extError.message}`);
        console.warn(`  This might require superuser privileges or the extension may not be available.`);
      }
      await dbClient.end();
    } else {
      console.log(`✓ Database "${dbName}" already exists.`);
      
      // Verify extension exists in existing database
      await adminClient.end();
      const dbClient = new Client({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
      });
      
      await dbClient.connect();
      try {
        await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log(`✓ UUID extension verified/installed.`);
      } catch (extError: any) {
        console.warn(`⚠ Warning: Could not install uuid-ossp extension: ${extError.message}`);
      }
      await dbClient.end();
    }
  } catch (error: any) {
    console.error('Error ensuring database:', error.message);
    throw error;
  } finally {
    await adminClient.end();
  }
}

ensureDatabase()
  .then(() => {
    console.log('Database setup completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });

