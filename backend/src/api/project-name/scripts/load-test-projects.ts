import axios, { AxiosInstance } from 'axios';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { City } from '../src/cities/entities/city.entity';
import { QuantityEstimate } from '../src/projects/entities/project.entity';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_PREFIX = process.env.API_PREFIX || '/api';
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT_REQUESTS || '5', 10);
const TOTAL_PROJECTS = parseInt(process.argv[2] || '20', 10);
const DEFAULT_PASSWORD = '123456'; // Password for customers from comprehensive seeder

// Project titles and descriptions
const projectTitles = [
  'تولید قطعات ماشین‌کاری شده',
  'ساخت قالب تزریق پلاستیک',
  'برش لیزری ورق فلزی',
  'چاپ سه بعدی نمونه اولیه',
  'پرداخت سطح و رنگ‌کاری',
  'ساخت سازه فلزی',
  'تولید قطعات صنعتی',
  'قالب‌سازی پیشرفته',
  'خدمات ورق‌کاری',
  'چاپ سه بعدی با رزین',
  'ماشین‌کاری CNC',
  'جوشکاری و مونتاژ',
  'آبکاری و پوشش‌دهی',
  'تولید انبوه قطعات',
  'ساخت قطعات سفارشی',
];

const projectDescriptions = [
  'نیاز به تولید قطعات ماشین‌کاری شده با دقت بالا دارم. قطعات باید از جنس فولاد ضد زنگ باشند و با استفاده از ماشین‌کاری CNC ساخته شوند.',
  'به دنبال ساخت قالب تزریق پلاستیک برای تولید انبوه یک محصول هستم. قالب باید برای تولید قطعات با کیفیت بالا طراحی شود.',
  'نیاز به برش لیزری ورق‌های فلزی با ضخامت 3 تا 5 میلی‌متر دارم. تعداد قطعات مورد نیاز حدود 500 عدد است.',
  'به نمونه اولیه چاپ سه بعدی نیاز دارم. قطعه باید با دقت بالا و از جنس پلاستیک ABS چاپ شود.',
  'نیاز به پرداخت سطح قطعات فلزی و اعمال پوشش محافظتی دارم. قطعات باید پولیش شده و رنگ‌کاری شوند.',
  'به ساخت سازه فلزی برای یک پروژه ساختمانی نیاز دارم. سازه باید طبق نقشه‌های ارائه شده ساخته شود.',
  'نیاز به تولید قطعات صنعتی با استفاده از تکنولوژی‌های مدرن دارم. قطعات باید از استانداردهای کیفیت برخوردار باشند.',
  'به قالب‌سازی پیشرفته با استفاده از نرم‌افزارهای CAD/CAM نیاز دارم. قالب باید برای تولید قطعات پیچیده طراحی شود.',
  'نیاز به خدمات ورق‌کاری شامل برش، خم، پرس و جوشکاری دارم. کار باید با دقت بالا انجام شود.',
  'به چاپ سه بعدی با استفاده از رزین برای تولید قطعات با جزئیات بالا نیاز دارم.',
  'نیاز به ماشین‌کاری CNC قطعات فلزی با دقت بالا دارم. قطعات باید طبق نقشه‌های فنی ساخته شوند.',
  'به خدمات جوشکاری و مونتاژ قطعات فلزی نیاز دارم. کار باید با کیفیت بالا و طبق استانداردها انجام شود.',
  'نیاز به آبکاری و پوشش‌دهی قطعات فلزی دارم. قطعات باید با پوشش محافظتی مناسب پوشش داده شوند.',
  'به تولید انبوه قطعات پلاستیکی نیاز دارم. تعداد مورد نیاز حدود 10000 عدد است.',
  'نیاز به ساخت قطعات سفارشی با طراحی خاص دارم. قطعات باید دقیقاً طبق مشخصات ارائه شده ساخته شوند.',
];

interface CustomerToken {
  customer: User;
  token: string;
  axiosInstance: AxiosInstance;
}

interface TestResult {
  success: boolean;
  projectId?: string;
  error?: string;
  duration: number;
  customer: string;
}

class LoadTestProjects {
  private dataSource: DataSource;
  private customers: User[] = [];
  private categories: Category[] = [];
  private cities: City[] = [];
  private customerTokens: CustomerToken[] = [];
  private results: TestResult[] = [];
  private startTime: number = 0;
  private endTime: number = 0;
  private tokenCache: Map<string, CustomerToken> = new Map(); // Cache tokens by phone

  constructor() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'keesti_db',
      entities: [User, Category, City],
      synchronize: false,
      logging: false,
    });
  }

  private loadTokenCache(): void {
    const cacheFile = join(process.cwd(), '.load-test-tokens.json');
    if (existsSync(cacheFile)) {
      try {
        const cacheData = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        for (const [phone, tokenData] of Object.entries(cacheData)) {
          const axiosInstance = axios.create({
            baseURL: `${API_BASE_URL}${API_PREFIX}`,
            headers: {
              Authorization: `Bearer ${(tokenData as any).token}`,
            },
          });
          this.tokenCache.set(phone, {
            customer: tokenData as any,
            token: (tokenData as any).token,
            axiosInstance,
          });
        }
        console.log(`✓ Loaded ${this.tokenCache.size} cached tokens\n`);
      } catch (error) {
        // Ignore cache errors
      }
    }
  }

  private saveTokenCache(): void {
    const cacheFile = join(process.cwd(), '.load-test-tokens.json');
    const cacheData: Record<string, any> = {};
    for (const [phone, tokenData] of this.tokenCache.entries()) {
      cacheData[phone] = {
        phone: tokenData.customer.phone,
        fullName: tokenData.customer.fullName,
        role: tokenData.customer.role,
        token: tokenData.token,
      };
    }
    try {
      writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      // Ignore cache save errors
    }
  }

  async initialize() {
    console.log('🔌 Connecting to database...');
    await this.dataSource.initialize();
    console.log('✓ Database connected\n');

    // Load cached tokens if they exist
    this.loadTokenCache();

    console.log('📊 Loading data...');
    // Get only customers with passwordHash
    const allCustomers = await this.dataSource.getRepository(User).find({
      where: { role: UserRole.CUSTOMER },
      take: 100,
    });

    // Filter only customers with passwordHash
    this.customers = allCustomers.filter((c) => c.passwordHash);
    
    if (this.customers.length === 0) {
      throw new Error('❌ No customers with passwordHash found. Please run comprehensive seeder to create customers with passwords.');
    }

    this.categories = await this.dataSource.getRepository(Category).find({
      where: { isActive: true },
      relations: ['children'],
    });

    this.cities = await this.dataSource.getRepository(City).find({
      where: { isActive: true },
    });

    if (this.categories.length === 0) {
      throw new Error('❌ No categories found. Please run categories seeder first.');
    }

    if (this.cities.length === 0) {
      throw new Error('❌ No cities found. Please run cities seeder first.');
    }

    console.log(`✓ ${this.customers.length} customers loaded`);
    console.log(`✓ ${this.categories.length} categories loaded`);
    console.log(`✓ ${this.cities.length} cities loaded\n`);
  }

  async loginCustomers(): Promise<void> {
    console.log('🔐 Logging in customers with password...\n');
    
    console.log(`  Attempting to login ${this.customers.length} customers with passwordHash\n`);

    // Login customers sequentially with delay to avoid rate limiting
    for (let i = 0; i < this.customers.length; i++) {
      const customer = this.customers[i];
      
      // Check cache first
      const cachedToken = this.tokenCache.get(customer.phone);
      if (cachedToken) {
        // Verify token is still valid by making a test request
        try {
          await cachedToken.axiosInstance.get('/projects/my?limit=1');
          this.customerTokens.push(cachedToken);
          console.log(`  ✓ Using cached token: ${customer.fullName} (${customer.phone})`);
          continue;
        } catch (error) {
          // Token expired, remove from cache and login again
          this.tokenCache.delete(customer.phone);
        }
      }

      try {
        // Step 1: Login with password (this sends OTP)
        const loginResponse = await axios.post(`${API_BASE_URL}${API_PREFIX}/auth/login`, {
          phone: customer.phone,
          password: DEFAULT_PASSWORD,
        });

        // Step 2: Get OTP code (in mock/dev mode)
        await new Promise((resolve) => setTimeout(resolve, 500)); // Wait a bit for OTP to be generated
        const otpResponse = await axios.get(`${API_BASE_URL}${API_PREFIX}/auth/otp`, {
          params: { phone: customer.phone },
        });

        if (!otpResponse.data || !otpResponse.data.code) {
          console.error(`  ✗ No OTP code received for ${customer.fullName} (${customer.phone})`);
          continue;
        }

        // Step 3: Verify OTP to get access token
        const verifyResponse = await axios.post(`${API_BASE_URL}${API_PREFIX}/auth/verify-otp`, {
          phone: customer.phone,
          otp: otpResponse.data.code,
          role: customer.role,
          fullName: customer.fullName,
        });

        if (verifyResponse.data && verifyResponse.data.accessToken) {
          const axiosInstance = axios.create({
            baseURL: `${API_BASE_URL}${API_PREFIX}`,
            headers: {
              Authorization: `Bearer ${verifyResponse.data.accessToken}`,
            },
          });

          const customerToken = {
            customer,
            token: verifyResponse.data.accessToken,
            axiosInstance,
          };

          // Cache the token
          this.tokenCache.set(customer.phone, customerToken);
          this.customerTokens.push(customerToken);

          console.log(`  ✓ Logged in: ${customer.fullName} (${customer.phone})`);
        } else {
          console.error(`  ✗ No access token received for ${customer.fullName} (${customer.phone})`);
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        const errorStatus = error.response?.status;
        
        // If rate limited, wait and retry
        if (errorStatus === 400 && errorMsg.includes('صبر کنید')) {
          const waitMatch = errorMsg.match(/(\d+)/);
          const waitSeconds = waitMatch ? parseInt(waitMatch[1], 10) : 60;
          console.log(`  ⏳ Rate limited for ${customer.fullName}, waiting ${waitSeconds} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
          // Retry once
          i--; // Retry this customer
          continue;
        }
        
        console.error(`  ✗ Failed to login ${customer.fullName} (${customer.phone}): [${errorStatus}] ${errorMsg}`);
      }

      // Small delay between logins to avoid overwhelming the server
      if (i < this.customers.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Save token cache for next time
    this.saveTokenCache();
    
    console.log(`\n✓ ${this.customerTokens.length} customers logged in successfully\n`);
    
    if (this.customerTokens.length === 0) {
      console.error('❌ No customers could be logged in. Please check:');
      console.error('  1. Backend is running and accessible at', API_BASE_URL);
      console.error('  2. Customers have passwordHash set');
      console.error('  3. Password is correct (default:', DEFAULT_PASSWORD, ')');
      console.error('  4. OTP service is working (check Redis connection)');
    }
  }

  async createProject(customerToken: CustomerToken, index: number): Promise<TestResult> {
    const startTime = Date.now();
    const customer = customerToken.customer;

    try {
      // Randomly select city and category
      const city = this.cities[Math.floor(Math.random() * this.cities.length)];
      let category = this.categories[Math.floor(Math.random() * this.categories.length)];
      let subCategory: Category | null = null;

      // Try to get subcategory if available
      if (category.children && category.children.length > 0) {
        const activeSubCategories = category.children.filter((child) => child.isActive);
        if (activeSubCategories.length > 0 && Math.random() > 0.3) {
          subCategory = activeSubCategories[Math.floor(Math.random() * activeSubCategories.length)];
        }
      }

      // Select random title and description
      const titleIndex = Math.floor(Math.random() * projectTitles.length);
      const title = `${projectTitles[titleIndex]} ${index + 1}`;
      const description = projectDescriptions[titleIndex % projectDescriptions.length];

      // Random quantity estimate
      const quantityEstimates = [
        QuantityEstimate.LESS_THAN_10,
        QuantityEstimate.BETWEEN_10_100,
        QuantityEstimate.MORE_THAN_100,
      ];
      const quantityEstimate = quantityEstimates[Math.floor(Math.random() * quantityEstimates.length)];

      // Random completion date (between 1 week and 3 months from now)
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + Math.floor(Math.random() * 90) + 7);

      const projectData: any = {
        title,
        description,
        cityId: city.id,
        categoryId: category.id,
        quantityEstimate,
        completionDate: completionDate.toISOString().split('T')[0],
        isPublic: true,
      };

      if (subCategory) {
        projectData.subCategoryId = subCategory.id;
      }

      const response = await customerToken.axiosInstance.post('/projects', projectData);
      const duration = Date.now() - startTime;

      return {
        success: true,
        projectId: response.data.id,
        duration,
        customer: customer.fullName,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error',
        duration,
        customer: customer.fullName,
      };
    }
  }

  async runLoadTest(): Promise<void> {
    console.log('🚀 Starting load test...\n');
    console.log(`Configuration:`);
    console.log(`  - Total projects: ${TOTAL_PROJECTS}`);
    console.log(`  - Concurrent requests: ${CONCURRENT_REQUESTS}`);
    console.log(`  - API URL: ${API_BASE_URL}${API_PREFIX}\n`);

    this.startTime = Date.now();

    // Process batches sequentially to respect CONCURRENT_REQUESTS limit
    for (let i = 0; i < TOTAL_PROJECTS; i += CONCURRENT_REQUESTS) {
      await this.processBatch(i, Math.min(i + CONCURRENT_REQUESTS, TOTAL_PROJECTS));
    }

    this.endTime = Date.now();
  }

  async processBatch(startIndex: number, endIndex: number): Promise<void> {
    const batchPromises: Promise<TestResult>[] = [];

    for (let i = startIndex; i < endIndex; i++) {
      const customerToken = this.customerTokens[i % this.customerTokens.length];
      batchPromises.push(this.createProject(customerToken, i));
    }

    const batchResults = await Promise.all(batchPromises);
    this.results.push(...batchResults);

    // Log progress
    const successCount = batchResults.filter((r) => r.success).length;
    const failCount = batchResults.length - successCount;
    console.log(
      `  Batch ${Math.floor(startIndex / CONCURRENT_REQUESTS) + 1}: ${successCount} succeeded, ${failCount} failed`,
    );
  }

  printResults(): string {
    const totalDuration = this.endTime - this.startTime;
    const successCount = this.results.filter((r) => r.success).length;
    const failCount = this.results.length - successCount;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    const successAvgDuration =
      this.results.filter((r) => r.success).reduce((sum, r) => sum + r.duration, 0) / successCount || 0;

    let output = '\n' + '='.repeat(60) + '\n';
    output += '📊 LOAD TEST RESULTS\n';
    output += '='.repeat(60) + '\n';
    output += `Total projects: ${TOTAL_PROJECTS}\n`;
    output += `Successful: ${successCount} (${((successCount / TOTAL_PROJECTS) * 100).toFixed(1)}%)\n`;
    output += `Failed: ${failCount} (${((failCount / TOTAL_PROJECTS) * 100).toFixed(1)}%)\n`;
    output += `Total duration: ${(totalDuration / 1000).toFixed(2)}s\n`;
    output += `Average request duration: ${avgDuration.toFixed(0)}ms\n`;
    output += `Average success duration: ${successAvgDuration.toFixed(0)}ms\n`;
    output += `Requests per second: ${((TOTAL_PROJECTS / totalDuration) * 1000).toFixed(2)}\n`;
    output += '='.repeat(60) + '\n';

    if (failCount > 0) {
      const failedOutput = '\n❌ Failed requests:\n';
      console.log(failedOutput);
      output += failedOutput;
      this.results
        .filter((r) => !r.success)
        .slice(0, 10)
        .forEach((r, i) => {
          const line = `  ${i + 1}. ${r.customer}: ${r.error}\n`;
          console.log(line.trim());
          output += line;
        });
      if (failCount > 10) {
        const moreLine = `  ... and ${failCount - 10} more failures\n`;
        console.log(moreLine.trim());
        output += moreLine;
      }
    }

    // Summary by customer
    const customerStats = new Map<string, { success: number; fail: number }>();
    this.results.forEach((r) => {
      const stats = customerStats.get(r.customer) || { success: 0, fail: 0 };
      if (r.success) {
        stats.success++;
      } else {
        stats.fail++;
      }
      customerStats.set(r.customer, stats);
    });

    const customerStatsOutput = '\n📈 Stats by customer:\n';
    console.log(customerStatsOutput.trim());
    output += customerStatsOutput;
    Array.from(customerStats.entries())
      .sort((a, b) => b[1].success + b[1].fail - (a[1].success + a[1].fail))
      .slice(0, 10)
      .forEach(([customer, stats]) => {
        const line = `  ${customer}: ${stats.success} success, ${stats.fail} failed\n`;
        console.log(line.trim());
        output += line;
      });

    console.log(output);
    return output;
  }

  async cleanup() {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}

async function main() {
  const loadTest = new LoadTestProjects();

  try {
    await loadTest.initialize();
    await loadTest.loginCustomers();

    if (loadTest['customerTokens'].length === 0) {
      console.error('❌ No customers logged in. Cannot proceed with load test.');
      process.exit(1);
    }

    await loadTest.runLoadTest();
    loadTest.printResults();
  } catch (error) {
    console.error('❌ Error during load test:', error);
    process.exit(1);
  } finally {
    await loadTest.cleanup();
  }
}

main();

