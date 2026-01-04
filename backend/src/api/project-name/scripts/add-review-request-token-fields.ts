import { Client } from 'pg';

async function addTokenFields() {
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

    // Add token field
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_requests' AND column_name='token') THEN
          ALTER TABLE review_requests ADD COLUMN token character varying(255);
          CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_requests_token" ON "review_requests" ("token") WHERE token IS NOT NULL;
        END IF;
      END $$;
    `);
    console.log('✓ Token field added.');

    // Make customer_id nullable
    await client.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_requests' AND column_name='customer_id' AND is_nullable='NO') THEN
          ALTER TABLE review_requests ALTER COLUMN customer_id DROP NOT NULL;
        END IF;
      END $$;
    `);
    console.log('✓ Customer ID made nullable.');

    // Add customer_name field
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_requests' AND column_name='customer_name') THEN
          ALTER TABLE review_requests ADD COLUMN customer_name character varying(255);
        END IF;
      END $$;
    `);
    console.log('✓ Customer name field added.');

    // Add customer_email field
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_requests' AND column_name='customer_email') THEN
          ALTER TABLE review_requests ADD COLUMN customer_email character varying(255);
        END IF;
      END $$;
    `);
    console.log('✓ Customer email field added.');

    console.log('All fields added successfully!');
  } catch (error: any) {
    console.error('Error adding fields:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

addTokenFields()
  .then(() => {
    console.log('Migration completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

