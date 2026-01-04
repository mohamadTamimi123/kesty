import { Client } from 'pg';

async function alterCategoriesTable() {
  const dbName = process.env.DATABASE_NAME || 'keesti_db';
  const dbHost = process.env.DATABASE_HOST || 'localhost';
  const dbPort = parseInt(process.env.DATABASE_PORT || '5432', 10);
  const dbUser = process.env.DATABASE_USER || 'postgres';
  const dbPassword = process.env.DATABASE_PASSWORD || 'postgres';

  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // Add missing columns if they don't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='icon_url') THEN
          ALTER TABLE categories ADD COLUMN icon_url character varying(500);
        END IF;
      END $$;
    `);
    console.log('✓ icon_url column added/verified.');

    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='level') THEN
          ALTER TABLE categories ADD COLUMN level integer NOT NULL DEFAULT 1;
        END IF;
      END $$;
    `);
    console.log('✓ level column added/verified.');

    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='order') THEN
          ALTER TABLE categories ADD COLUMN "order" integer NOT NULL DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('✓ order column added/verified.');

    console.log('✓ Categories table updated successfully!');
  } catch (error: any) {
    console.error('Error altering categories table:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

alterCategoriesTable()
  .then(() => {
    console.log('Table alteration completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Table alteration failed:', error);
    process.exit(1);
  });

