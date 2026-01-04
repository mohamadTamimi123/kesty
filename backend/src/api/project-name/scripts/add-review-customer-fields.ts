import { Client } from 'pg';

async function addReviewCustomerFields() {
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

    // Make customer_id nullable in reviews table
    await client.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='customer_id' AND is_nullable='NO') THEN
          ALTER TABLE reviews ALTER COLUMN customer_id DROP NOT NULL;
        END IF;
      END $$;
    `);
    console.log('✓ Reviews customer_id made nullable.');

    // Add customer_name field to reviews
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='customer_name') THEN
          ALTER TABLE reviews ADD COLUMN customer_name character varying(255);
        END IF;
      END $$;
    `);
    console.log('✓ Reviews customer_name field added.');

    // Add customer_email field to reviews
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='customer_email') THEN
          ALTER TABLE reviews ADD COLUMN customer_email character varying(255);
        END IF;
      END $$;
    `);
    console.log('✓ Reviews customer_email field added.');

    console.log('All review fields added successfully!');
  } catch (error: any) {
    console.error('Error adding fields:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

addReviewCustomerFields()
  .then(() => {
    console.log('Migration completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

