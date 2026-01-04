import { Client } from 'pg';

async function createTables() {
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

    // Create enum type for user role
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_role_enum" AS ENUM('CUSTOMER', 'SUPPLIER', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ User role enum created.');

    // Create users table with gen_random_uuid() instead of uuid_generate_v4()
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "phone" character varying(11) NOT NULL,
        "email" character varying,
        "full_name" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'CUSTOMER',
        "password_hash" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_blocked" boolean NOT NULL DEFAULT false,
        "email_verified" boolean NOT NULL DEFAULT false,
        "phone_verified" boolean NOT NULL DEFAULT false,
        "last_login_at" TIMESTAMP,
        "last_login_ip" character varying(45),
        "last_seen_at" TIMESTAMP,
        "login_count" integer NOT NULL DEFAULT '0',
        "failed_login_attempts" integer NOT NULL DEFAULT '0',
        "locked_until" TIMESTAMP,
        "avatar_url" character varying,
        "bio" text,
        "address" text,
        "city" character varying(100),
        "postal_code" character varying(20),
        "country" character varying(100),
        "date_of_birth" date,
        "gender" character varying(20),
        "preferred_language" character varying(10) NOT NULL DEFAULT 'fa',
        "timezone" character varying(50),
        "notification_preferences" jsonb,
        "metadata" jsonb,
        "is_premium" boolean NOT NULL DEFAULT false,
        "premium_level" character varying(20),
        "premium_expires_at" TIMESTAMP,
        "workshop_name" character varying(255),
        "workshop_address" text,
        "workshop_phone" character varying(20),
        "cover_image_url" character varying(500),
        "profile_image_url" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      );
    `);
    console.log('✓ Users table created.');

    // Create cities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "cities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" text,
        "logo_url" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_cities_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_cities" PRIMARY KEY ("id")
      );
    `);
    console.log('✓ Cities table created.');

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "description" text,
        "icon_url" character varying(500),
        "is_active" boolean NOT NULL DEFAULT true,
        "meta_title" character varying(255),
        "meta_description" text,
        "parent_id" uuid,
        "level" integer NOT NULL DEFAULT 1,
        "order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_categories_parent" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL
      );
    `);
    console.log('✓ Categories table created.');

    // Create conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "customer_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "project_id" uuid,
        "last_message_at" TIMESTAMP,
        "customer_unread_count" integer NOT NULL DEFAULT 0,
        "supplier_unread_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_conversations_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_conversations_supplier" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Conversations table created.');

    // Create indexes for conversations
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversations_customer_id" ON "conversations" ("customer_id");
      CREATE INDEX IF NOT EXISTS "IDX_conversations_supplier_id" ON "conversations" ("supplier_id");
      CREATE INDEX IF NOT EXISTS "IDX_conversations_project_id" ON "conversations" ("project_id");
    `);
    console.log('✓ Conversations indexes created.');

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "conversation_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "content" text NOT NULL,
        "metadata" jsonb,
        "is_read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP,
        "delivered_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Messages table created.');

    // Create indexes for messages
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_conversation_id" ON "messages" ("conversation_id");
      CREATE INDEX IF NOT EXISTS "IDX_messages_sender_id" ON "messages" ("sender_id");
      CREATE INDEX IF NOT EXISTS "IDX_messages_delivered_at" ON "messages" ("delivered_at");
      CREATE INDEX IF NOT EXISTS "idx_messages_metadata_type" ON "messages" USING GIN (metadata jsonb_path_ops) WHERE metadata IS NOT NULL;
    `);
    console.log('✓ Messages indexes created.');

    // Create enum types for projects
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."projects_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."projects_quantity_estimate_enum" AS ENUM('LESS_THAN_10', 'BETWEEN_10_100', 'MORE_THAN_100');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Project enum types created.');

    // Create projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "customer_id" uuid NOT NULL,
        "city_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "sub_category_id" uuid,
        "machine_id" uuid,
        "completion_date" date,
        "client_name" character varying(255),
        "quantity_estimate" "public"."projects_quantity_estimate_enum",
        "status" "public"."projects_status_enum" NOT NULL DEFAULT 'PENDING',
        "is_public" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_projects_city" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_projects_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_projects_sub_category" FOREIGN KEY ("sub_category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      );
    `);
    console.log('✓ Projects table created.');

    // Create indexes for projects
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_projects_customer_id" ON "projects" ("customer_id");
      CREATE INDEX IF NOT EXISTS "IDX_projects_city_id" ON "projects" ("city_id");
      CREATE INDEX IF NOT EXISTS "IDX_projects_category_id" ON "projects" ("category_id");
      CREATE INDEX IF NOT EXISTS "IDX_projects_sub_category_id" ON "projects" ("sub_category_id");
      CREATE INDEX IF NOT EXISTS "IDX_projects_machine_id" ON "projects" ("machine_id");
    `);
    console.log('✓ Projects indexes created.');

    // Create enum type for quotes
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."quotes_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Quote enum type created.');

    // Create quotes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "quotes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "price" decimal(15,2) NOT NULL,
        "description" text,
        "delivery_time_days" integer,
        "status" "public"."quotes_status_enum" NOT NULL DEFAULT 'PENDING',
        "accepted_at" TIMESTAMP,
        "rejected_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quotes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quotes_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quotes_supplier" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Quotes table created.');

    // Create indexes for quotes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_quotes_project_supplier" ON "quotes" ("project_id", "supplier_id");
    `);
    console.log('✓ Quotes indexes created.');

    // Create supplier_ratings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "supplier_ratings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "supplier_id" uuid NOT NULL UNIQUE,
        "total_score" decimal(5,2) NOT NULL DEFAULT 0,
        "premium_score" decimal(5,2) NOT NULL DEFAULT 0,
        "review_score" decimal(5,2) NOT NULL DEFAULT 0,
        "profile_score" decimal(5,2) NOT NULL DEFAULT 0,
        "response_score" decimal(5,2) NOT NULL DEFAULT 0,
        "activity_score" decimal(5,2) NOT NULL DEFAULT 0,
        "penalties" decimal(5,2) NOT NULL DEFAULT 0,
        "last_calculated_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_supplier_ratings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_supplier_ratings_supplier" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Supplier ratings table created.');

    // Create index for supplier_ratings
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_supplier_ratings_supplier_id" ON "supplier_ratings" ("supplier_id");
    `);
    console.log('✓ Supplier ratings indexes created.');

    // Create category_supplier junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "category_supplier" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "category_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_category_supplier" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_category_supplier" UNIQUE ("category_id", "supplier_id"),
        CONSTRAINT "FK_category_supplier_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_category_supplier_supplier" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Category supplier junction table created.');

    // Create indexes for category_supplier
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_category_supplier_category_id" ON "category_supplier" ("category_id");
      CREATE INDEX IF NOT EXISTS "IDX_category_supplier_supplier_id" ON "category_supplier" ("supplier_id");
    `);
    console.log('✓ Category supplier indexes created.');

    // Create city_supplier junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "city_supplier" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "city_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_city_supplier" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_city_supplier" UNIQUE ("city_id", "supplier_id"),
        CONSTRAINT "FK_city_supplier_city" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_city_supplier_supplier" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ City supplier junction table created.');

    // Create indexes for city_supplier
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_city_supplier_city_id" ON "city_supplier" ("city_id");
      CREATE INDEX IF NOT EXISTS "IDX_city_supplier_supplier_id" ON "city_supplier" ("supplier_id");
    `);
    console.log('✓ City supplier indexes created.');

    // Create machines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "machines" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "category_id" uuid,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_machines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_machines_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      );
    `);
    console.log('✓ Machines table created.');

    // Create index for machines
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_machines_category_id" ON "machines" ("category_id");
    `);
    console.log('✓ Machines indexes created.');

    // Create enum type for portfolio quantity range
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."portfolios_quantity_range_enum" AS ENUM('LESS_THAN_100', 'BETWEEN_100_1000', 'MORE_THAN_1000');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Portfolio quantity range enum created.');

    // Create portfolios table (needed for reviews)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "portfolios" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(255) NOT NULL,
        "supplier_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "subcategory_id" uuid,
        "project_id" uuid,
        "completion_date" date NOT NULL,
        "quantity_range" "public"."portfolios_quantity_range_enum",
        "description" text NOT NULL,
        "customer_name" character varying(255),
        "customer_id" uuid,
        "is_public" boolean NOT NULL DEFAULT true,
        "is_verified" boolean NOT NULL DEFAULT false,
        "rating" decimal(3,2),
        "view_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portfolios" PRIMARY KEY ("id"),
        CONSTRAINT "FK_portfolios_supplier" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_portfolios_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_portfolios_subcategory" FOREIGN KEY ("subcategory_id") REFERENCES "categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_portfolios_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_portfolios_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);
    console.log('✓ Portfolios table created.');

    // Add missing columns to portfolios table if they don't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolios' AND column_name='subcategory_id') THEN
          ALTER TABLE portfolios ADD COLUMN subcategory_id uuid;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolios' AND column_name='project_id') THEN
          ALTER TABLE portfolios ADD COLUMN project_id uuid;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolios' AND column_name='completion_date') THEN
          ALTER TABLE portfolios ADD COLUMN completion_date date NOT NULL DEFAULT CURRENT_DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolios' AND column_name='quantity_range') THEN
          ALTER TABLE portfolios ADD COLUMN quantity_range "public"."portfolios_quantity_range_enum";
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolios' AND column_name='customer_name') THEN
          ALTER TABLE portfolios ADD COLUMN customer_name character varying(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolios' AND column_name='customer_id') THEN
          ALTER TABLE portfolios ADD COLUMN customer_id uuid;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolios' AND column_name='is_public') THEN
          ALTER TABLE portfolios ADD COLUMN is_public boolean NOT NULL DEFAULT true;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolios' AND column_name='rating') THEN
          ALTER TABLE portfolios ADD COLUMN rating decimal(3,2);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolios' AND column_name='view_count') THEN
          ALTER TABLE portfolios ADD COLUMN view_count integer NOT NULL DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('✓ Portfolios columns updated.');

    // Add foreign keys if they don't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_portfolios_subcategory') THEN
          ALTER TABLE portfolios ADD CONSTRAINT "FK_portfolios_subcategory" 
          FOREIGN KEY ("subcategory_id") REFERENCES "categories"("id") ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_portfolios_project') THEN
          ALTER TABLE portfolios ADD CONSTRAINT "FK_portfolios_project" 
          FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_portfolios_customer') THEN
          ALTER TABLE portfolios ADD CONSTRAINT "FK_portfolios_customer" 
          FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    console.log('✓ Portfolios foreign keys updated.');

    // Create indexes for portfolios
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_portfolios_supplier_id" ON "portfolios" ("supplier_id");
      CREATE INDEX IF NOT EXISTS "IDX_portfolios_category_id" ON "portfolios" ("category_id");
      CREATE INDEX IF NOT EXISTS "IDX_portfolios_project_id" ON "portfolios" ("project_id");
    `);
    console.log('✓ Portfolios indexes created.');

    // Create reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "portfolio_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "is_approved" boolean NOT NULL DEFAULT false,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "response_date" TIMESTAMP,
        "response_time_hours" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_portfolio" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_supplier" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Reviews table created.');

    // Create indexes for reviews
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reviews_portfolio_id" ON "reviews" ("portfolio_id");
      CREATE INDEX IF NOT EXISTS "IDX_reviews_customer_id" ON "reviews" ("customer_id");
      CREATE INDEX IF NOT EXISTS "IDX_reviews_supplier_id" ON "reviews" ("supplier_id");
    `);
    console.log('✓ Reviews indexes created.');

    // Create review_requests enum type
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."review_requests_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Review requests enum type created.');

    // Create review_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "review_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "portfolio_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "status" "public"."review_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "message" text,
        "expires_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_review_requests_portfolio" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_review_requests_supplier" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_review_requests_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Review requests table created.');

    // Create indexes for review_requests
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_review_requests_portfolio_id" ON "review_requests" ("portfolio_id");
      CREATE INDEX IF NOT EXISTS "IDX_review_requests_supplier_id" ON "review_requests" ("supplier_id");
      CREATE INDEX IF NOT EXISTS "IDX_review_requests_customer_id" ON "review_requests" ("customer_id");
      CREATE INDEX IF NOT EXISTS "IDX_review_requests_status" ON "review_requests" ("status");
    `);
    console.log('✓ Review requests indexes created.');

    // Update projects table to add foreign key for machine_id (if not exists)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_projects_machine'
        ) THEN
          ALTER TABLE projects ADD CONSTRAINT "FK_projects_machine" 
          FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    console.log('✓ Projects machine foreign key added/verified.');

    // Create materials table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "materials" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "category_id" uuid,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_materials" PRIMARY KEY ("id"),
        CONSTRAINT "FK_materials_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      );
    `);
    console.log('✓ Materials table created.');

    // Create index for materials
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_materials_category_id" ON "materials" ("category_id");
    `);
    console.log('✓ Materials indexes created.');

    // Create portfolio_images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "portfolio_images" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "portfolio_id" uuid NOT NULL,
        "image_url" text NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portfolio_images" PRIMARY KEY ("id"),
        CONSTRAINT "FK_portfolio_images_portfolio" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Portfolio images table created.');

    // Create index for portfolio_images
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_portfolio_images_portfolio_id" ON "portfolio_images" ("portfolio_id");
    `);
    console.log('✓ Portfolio images indexes created.');

    // Create project_files table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "project_files" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "file_url" character varying(500) NOT NULL,
        "file_name" character varying(255),
        "file_size" integer,
        "mime_type" character varying(100),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_files" PRIMARY KEY ("id"),
        CONSTRAINT "FK_project_files_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Project files table created.');

    // Create index for project_files
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_project_files_project_id" ON "project_files" ("project_id");
    `);
    console.log('✓ Project files indexes created.');

    // Create portfolio_machines junction table (many-to-many)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "portfolio_machines" (
        "portfolio_id" uuid NOT NULL,
        "machine_id" uuid NOT NULL,
        CONSTRAINT "PK_portfolio_machines" PRIMARY KEY ("portfolio_id", "machine_id"),
        CONSTRAINT "FK_portfolio_machines_portfolio" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_portfolio_machines_machine" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Portfolio machines junction table created.');

    // Create portfolio_materials junction table (many-to-many)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "portfolio_materials" (
        "portfolio_id" uuid NOT NULL,
        "material_id" uuid NOT NULL,
        CONSTRAINT "PK_portfolio_materials" PRIMARY KEY ("portfolio_id", "material_id"),
        CONSTRAINT "FK_portfolio_materials_portfolio" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_portfolio_materials_material" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Portfolio materials junction table created.');

    // Create machine_supplier junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "machine_supplier" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "machine_id" uuid NOT NULL,
        "supplier_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_machine_supplier" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_machine_supplier" UNIQUE ("machine_id", "supplier_id"),
        CONSTRAINT "FK_machine_supplier_machine" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_machine_supplier_supplier" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log('✓ Machine supplier junction table created.');

    // Create indexes for machine_supplier
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_machine_supplier_machine_id" ON "machine_supplier" ("machine_id");
      CREATE INDEX IF NOT EXISTS "IDX_machine_supplier_supplier_id" ON "machine_supplier" ("supplier_id");
    `);
    console.log('✓ Machine supplier indexes created.');

    console.log('✓ All tables created successfully!');
  } catch (error: any) {
    console.error('Error creating tables:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

createTables()
  .then(() => {
    console.log('Table creation completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Table creation failed:', error);
    process.exit(1);
  });

