import { Client } from 'pg';
import { execSync } from 'child_process';
import * as path from 'path';

async function setupAndSeed() {
  const dbName = process.env.DATABASE_NAME || 'keesti_db';
  const dbHost = process.env.DATABASE_HOST || 'localhost';
  const dbPort = parseInt(process.env.DATABASE_PORT || '5432', 10);
  const dbUser = process.env.DATABASE_USER || 'postgres';
  const dbPassword = process.env.DATABASE_PASSWORD || 'postgres';
  // __dirname is scripts/, so we go up one level to get project-name directory
  const projectRoot = path.join(__dirname, '..');
  const numberOfProjects = parseInt(process.argv[2] || '30', 10);

  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    console.log('🚀 شروع فرآیند راه‌اندازی و سیدینگ دیتابیس...\n');

    // Step 1: Backup database
    console.log('📦 مرحله 1: ایجاد بکاپ دیتابیس...');
    const adminClient = new Client({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: 'postgres',
    });

    try {
      await adminClient.connect();
      const backupName = `${dbName}_backup_${Date.now()}`;
      
      // Check if database exists
      const dbCheck = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName]
      );

      if (dbCheck.rows.length > 0) {
        try {
          await adminClient.query(`CREATE DATABASE ${backupName} WITH TEMPLATE ${dbName}`);
          console.log(`✓ بکاپ ایجاد شد: ${backupName}\n`);
        } catch (error: any) {
          if (error.code !== '42P04') {
            console.log(`⚠ خطا در ایجاد بکاپ: ${error.message}`);
          }
        }
      } else {
        console.log('⚠ دیتابیس وجود ندارد، بکاپ ایجاد نمی‌شود\n');
      }
      await adminClient.end();
    } catch (error: any) {
      console.log(`⚠ خطا در اتصال برای بکاپ: ${error.message}\n`);
      await adminClient.end();
    }

    // Step 2: Connect and clear tables
    console.log('🗑️  مرحله 2: پاک کردن جداول موجود...');
    await client.connect();
    console.log('✓ متصل به دیتابیس');

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
        // Ignore errors for non-existent tables
      }
    }

    console.log('✓ جداول پاک شدند\n');
    await client.end();

    // Step 3: Create tables
    console.log('🔧 مرحله 3: ایجاد جداول...');
    const createTablesScriptPath = path.join(__dirname, 'create-tables.ts');
    
    try {
      execSync(`pnpm ts-node -r tsconfig-paths/register scripts/create-tables.ts`, {
        stdio: 'inherit',
        cwd: projectRoot,
        env: { ...process.env },
      });
      console.log('✓ جداول ایجاد شدند\n');
    } catch (error: any) {
      console.error('✗ خطا در ایجاد جداول:', error.message);
      throw error;
    }

    // Step 4: Run basic seeders (admin, cities, categories)
    console.log('🌱 مرحله 4: اجرای سیدرهای پایه (ادمین، شهرها، دسته‌بندی‌ها)...');
    
    try {
      const exitCode = execSync(`pnpm ts-node -r tsconfig-paths/register src/database/seeds/run-seed.ts`, {
        stdio: 'inherit',
        cwd: projectRoot,
        env: { ...process.env },
      });
      console.log('✓ سیدرهای پایه با موفقیت اجرا شدند\n');
      
      // Small delay to ensure database transactions are committed
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error('✗ خطا در اجرای سیدرهای پایه:', error.message);
      throw error;
    }

    // Step 5: Run comprehensive seed (suppliers, customers, portfolios)
    console.log('🌱 مرحله 5: اجرای سیدر جامع (تامین‌کنندگان، مشتریان، پورتفولیوها)...');
    
    // Verify categories exist before running comprehensive seed
    const verifyClient = new Client({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    });
    
    try {
      await verifyClient.connect();
      const categoryCheck = await verifyClient.query('SELECT COUNT(*) as count FROM categories WHERE is_active = true');
      const categoryCount = parseInt(categoryCheck.rows[0].count);
      
      if (categoryCount === 0) {
        throw new Error('دسته‌بندی‌ها یافت نشد. لطفاً ابتدا categories را seed کنید.');
      }
      
      console.log(`✓ ${categoryCount} دسته‌بندی فعال یافت شد`);
      await verifyClient.end();
    } catch (error: any) {
      await verifyClient.end();
      if (error.message.includes('دسته‌بندی‌ها یافت نشد')) {
        throw error;
      }
      console.log(`⚠ خطا در بررسی دسته‌بندی‌ها: ${error.message}`);
    }
    
    try {
      execSync(`pnpm ts-node -r tsconfig-paths/register src/database/seeds/run-comprehensive-seed.ts`, {
        stdio: 'inherit',
        cwd: projectRoot,
        env: { ...process.env },
      });
      console.log('✓ سیدر جامع با موفقیت اجرا شد\n');
    } catch (error: any) {
      console.error('✗ خطا در اجرای سیدر جامع:', error.message);
      throw error;
    }

    // Step 6: Create 30 projects using load-test script
    console.log(`📝 مرحله 6: ایجاد ${numberOfProjects} پروژه تصادفی...`);
    console.log('⚠ توجه: برای ایجاد پروژه‌ها، API باید در حال اجرا باشد (پورت 3001)');
    
    try {
      execSync(`pnpm ts-node -r tsconfig-paths/register scripts/load-test-projects.ts ${numberOfProjects}`, {
        stdio: 'inherit',
        cwd: projectRoot,
        env: { ...process.env },
      });
      console.log(`✓ ${numberOfProjects} پروژه با موفقیت ایجاد شد\n`);
    } catch (error: any) {
      console.error('✗ خطا در ایجاد پروژه‌ها:', error.message);
      console.error('⚠ ممکن است API در حال اجرا نباشد. لطفاً API را راه‌اندازی کنید و دوباره تلاش کنید.');
      throw error;
    }

    console.log('✅ همه مراحل با موفقیت تکمیل شد!');
    console.log('\n📊 خلاصه:');
    console.log('- دیتابیس بکاپ گرفته شد');
    console.log('- جداول ایجاد شدند');
    console.log('- ادمین، شهرها و دسته‌بندی‌ها سید شدند');
    console.log('- تامین‌کنندگان، مشتریان و پورتفولیوها سید شدند');
    console.log(`- ${numberOfProjects} پروژه تصادفی ایجاد شد`);
    console.log('\n🎉 آماده برای تست تغییرات چت!');

  } catch (error: any) {
    console.error('\n✗ خطا در فرآیند راه‌اندازی:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupAndSeed();
