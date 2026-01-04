import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { City } from '../../cities/entities/city.entity';
import { Portfolio, QuantityRange } from '../../portfolio/entities/portfolio.entity';
import { PortfolioImage } from '../../portfolio/entities/portfolio-image.entity';
import { CategorySupplier } from '../../categories/entities/category-supplier.entity';
import { CitySupplier } from '../../cities/entities/city-supplier.entity';
import { SupplierRating } from '../../rating/entities/supplier-rating.entity';
import * as bcrypt from 'bcryptjs';

// Helper function to generate slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to generate unique slug
async function generateUniqueSlug(
  repository: any,
  baseSlug: string,
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await repository.findOne({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Sample data for suppliers
const supplierData = [
  {
    phone: '09121111111',
    fullName: 'احمد رضایی',
    workshopName: 'کارگاه ماشین‌کاری رضایی',
    email: 'ahmad.rezaei@example.com',
    city: 'تهران',
    bio: 'کارگاه ما با بیش از 20 سال تجربه در زمینه ماشین‌کاری و تولید قطعات صنعتی فعالیت می‌کند. ما با استفاده از جدیدترین تجهیزات و تکنولوژی‌ها، خدمات با کیفیت بالا ارائه می‌دهیم.',
    workshopAddress: 'تهران، خیابان ولیعصر، پلاک 123',
    workshopPhone: '021-12345678',
  },
  {
    phone: '09122222222',
    fullName: 'محمد کریمی',
    workshopName: 'کارگاه ورق‌کاری کریمی',
    email: 'mohammad.karimi@example.com',
    city: 'اصفهان',
    bio: 'تخصص ما در زمینه ورق‌کاری، برش لیزری، خم و جوشکاری است. با تیمی مجرب و تجهیزات مدرن آماده خدمت‌رسانی هستیم.',
    workshopAddress: 'اصفهان، خیابان چهارباغ، پلاک 456',
    workshopPhone: '031-23456789',
  },
  {
    phone: '09123333333',
    fullName: 'علی احمدی',
    workshopName: 'استودیو چاپ سه بعدی احمدی',
    email: 'ali.ahmadi@example.com',
    city: 'مشهد',
    bio: 'خدمات چاپ سه بعدی با استفاده از تکنولوژی‌های FDM، SLA و SLS. ما قادر به تولید نمونه‌های اولیه و قطعات نهایی با دقت بالا هستیم.',
    workshopAddress: 'مشهد، خیابان امام رضا، پلاک 789',
    workshopPhone: '051-34567890',
  },
  {
    phone: '09124444444',
    fullName: 'حسن موسوی',
    workshopName: 'کارگاه قالب‌سازی موسوی',
    email: 'hasan.mousavi@example.com',
    city: 'تبریز',
    bio: 'ساخت قالب‌های تزریق پلاستیک و فلزی با دقت بالا. ما با استفاده از ماشین‌آلات CNC و تجهیزات پیشرفته، قالب‌های با کیفیت تولید می‌کنیم.',
    workshopAddress: 'تبریز، خیابان آزادی، پلاک 321',
    workshopPhone: '041-45678901',
  },
  {
    phone: '09125555555',
    fullName: 'رضا نوری',
    workshopName: 'کارگاه پرداخت سطح نوری',
    email: 'reza.nouri@example.com',
    city: 'شیراز',
    bio: 'خدمات پرداخت سطح شامل پولیش، رنگ‌کاری، آبکاری و پوشش‌های محافظتی. ما با استفاده از مواد با کیفیت و تکنیک‌های مدرن، سطح قطعات را به بهترین شکل پرداخت می‌کنیم.',
    workshopAddress: 'شیراز، خیابان زند، پلاک 654',
    workshopPhone: '071-56789012',
  },
  {
    phone: '09126666666',
    fullName: 'سعید رضوی',
    workshopName: 'کارگاه ماشین‌کاری رضوی',
    email: 'saeed.razavi@example.com',
    city: 'کرج',
    bio: 'تولید قطعات صنعتی با دقت بالا. ما در زمینه تراش، فرز، بورینگ و سایر عملیات ماشین‌کاری تخصص داریم.',
    workshopAddress: 'کرج، خیابان شهید بهشتی، پلاک 987',
    workshopPhone: '026-67890123',
  },
  {
    phone: '09127777777',
    fullName: 'امیر حسینی',
    workshopName: 'کارگاه ورق‌کاری حسینی',
    email: 'amir.hosseini@example.com',
    city: 'اهواز',
    bio: 'خدمات ورق‌کاری شامل برش، خم، پرس و جوشکاری. ما با استفاده از تجهیزات مدرن و تیم مجرب، خدمات با کیفیت ارائه می‌دهیم.',
    workshopAddress: 'اهواز، خیابان نادری، پلاک 147',
    workshopPhone: '061-78901234',
  },
  {
    phone: '09128888888',
    fullName: 'مجید صادقی',
    workshopName: 'استودیو چاپ سه بعدی صادقی',
    email: 'majid.sadeghi@example.com',
    city: 'قم',
    bio: 'چاپ سه بعدی با دقت بالا برای نمونه‌سازی سریع و تولید قطعات نهایی. ما از مواد مختلف از جمله PLA، ABS، PETG و رزین استفاده می‌کنیم.',
    workshopAddress: 'قم، خیابان امام خمینی، پلاک 258',
    workshopPhone: '025-89012345',
  },
  {
    phone: '09129999999',
    fullName: 'فرهاد محمدی',
    workshopName: 'کارگاه قالب‌سازی محمدی',
    email: 'farhad.mohammadi@example.com',
    city: 'کرمانشاه',
    bio: 'ساخت قالب‌های صنعتی با استفاده از تکنولوژی‌های مدرن. ما قادر به ساخت قالب‌های پیچیده با دقت بالا هستیم.',
    workshopAddress: 'کرمانشاه، خیابان مدرس، پلاک 369',
    workshopPhone: '083-90123456',
  },
  {
    phone: '09120000000',
    fullName: 'بهرام زارعی',
    workshopName: 'کارگاه پرداخت سطح زارعی',
    email: 'bahram.zarei@example.com',
    city: 'ارومیه',
    bio: 'خدمات پرداخت سطح و پوشش‌دهی. ما با استفاده از تکنیک‌های مدرن و مواد با کیفیت، سطح قطعات را پرداخت می‌کنیم.',
    workshopAddress: 'ارومیه، خیابان امام، پلاک 741',
    workshopPhone: '044-01234567',
  },
  {
    phone: '09121111112',
    fullName: 'کامران رستمی',
    workshopName: 'کارگاه ماشین‌کاری رستمی',
    email: 'kamran.rostami@example.com',
    city: 'رشت',
    bio: 'تولید قطعات صنعتی با دقت بالا. ما در زمینه ماشین‌کاری CNC و تولید قطعات سفارشی تخصص داریم.',
    workshopAddress: 'رشت، خیابان امام خمینی، پلاک 852',
    workshopPhone: '013-12345678',
  },
  {
    phone: '09121111113',
    fullName: 'داریوش یوسفی',
    workshopName: 'کارگاه ورق‌کاری یوسفی',
    email: 'dariush.yousefi@example.com',
    city: 'زنجان',
    bio: 'خدمات ورق‌کاری و ساخت سازه‌های فلزی. ما با استفاده از تجهیزات مدرن و تیم مجرب، خدمات با کیفیت ارائه می‌دهیم.',
    workshopAddress: 'زنجان، خیابان فردوسی، پلاک 963',
    workshopPhone: '024-23456789',
  },
];

// Sample data for customers
const customerData = [
  { phone: '09131111111', fullName: 'علی محمدی', email: 'ali.mohammadi@example.com', city: 'تهران' },
  { phone: '09132222222', fullName: 'حسین احمدی', email: 'hossein.ahmadi@example.com', city: 'اصفهان' },
  { phone: '09133333333', fullName: 'محمد رضایی', email: 'mohammad.rezaei@example.com', city: 'مشهد' },
  { phone: '09134444444', fullName: 'رضا کریمی', email: 'reza.karimi@example.com', city: 'تبریز' },
  { phone: '09135555555', fullName: 'امیر حسینی', email: 'amir.hosseini@example.com', city: 'شیراز' },
  { phone: '09136666666', fullName: 'سعید موسوی', email: 'saeed.mousavi@example.com', city: 'کرج' },
  { phone: '09137777777', fullName: 'مجید نوری', email: 'majid.nouri@example.com', city: 'اهواز' },
  { phone: '09138888888', fullName: 'فرهاد صادقی', email: 'farhad.sadeghi@example.com', city: 'قم' },
  { phone: '09139999999', fullName: 'بهرام رضوی', email: 'bahram.razavi@example.com', city: 'کرمانشاه' },
  { phone: '09130000000', fullName: 'کامران زارعی', email: 'kamran.zarei@example.com', city: 'ارومیه' },
  { phone: '09131111112', fullName: 'داریوش رستمی', email: 'dariush.rostami@example.com', city: 'رشت' },
  { phone: '09131111113', fullName: 'احمد یوسفی', email: 'ahmad.yousefi@example.com', city: 'زنجان' },
  { phone: '09131111114', fullName: 'حسن محمدی', email: 'hasan.mohammadi@example.com', city: 'همدان' },
  { phone: '09131111115', fullName: 'علی احمدی', email: 'ali.ahmadi2@example.com', city: 'کرمان' },
  { phone: '09131111116', fullName: 'محمد رضایی', email: 'mohammad.rezaei2@example.com', city: 'اراک' },
  { phone: '09131111117', fullName: 'رضا کریمی', email: 'reza.karimi2@example.com', city: 'تهران' },
  { phone: '09131111118', fullName: 'امیر حسینی', email: 'amir.hosseini2@example.com', city: 'اصفهان' },
  { phone: '09131111119', fullName: 'سعید موسوی', email: 'saeed.mousavi2@example.com', city: 'مشهد' },
  { phone: '09131111120', fullName: 'مجید نوری', email: 'majid.nouri2@example.com', city: 'تبریز' },
  { phone: '09131111121', fullName: 'فرهاد صادقی', email: 'farhad.sadeghi2@example.com', city: 'شیراز' },
  { phone: '09131111122', fullName: 'بهرام رضوی', email: 'bahram.razavi2@example.com', city: 'کرج' },
  { phone: '09131111123', fullName: 'کامران زارعی', email: 'kamran.zarei2@example.com', city: 'اهواز' },
  { phone: '09131111124', fullName: 'داریوش رستمی', email: 'dariush.rostami2@example.com', city: 'قم' },
  { phone: '09131111125', fullName: 'احمد یوسفی', email: 'ahmad.yousefi2@example.com', city: 'کرمانشاه' },
];

// Sample portfolio titles and descriptions
const portfolioTitles = [
  'قطعه ماشین‌کاری شده با دقت بالا',
  'ساخت قالب تزریق پلاستیک',
  'برش لیزری ورق فلزی',
  'چاپ سه بعدی نمونه اولیه',
  'پرداخت سطح و رنگ‌کاری',
  'ساخت سازه فلزی',
  'تولید قطعات صنعتی',
  'قالب‌سازی پیشرفته',
  'خدمات ورق‌کاری',
  'چاپ سه بعدی با رزین',
];

const portfolioDescriptions = [
  'این پروژه شامل تولید قطعات صنعتی با دقت بالا بود که با استفاده از ماشین‌کاری CNC انجام شد.',
  'ساخت قالب تزریق پلاستیک برای تولید انبوه قطعات پلاستیکی با کیفیت بالا.',
  'برش لیزری ورق‌های فلزی با ضخامت مختلف و ساخت قطعات سفارشی.',
  'چاپ سه بعدی نمونه اولیه برای تست و بررسی قبل از تولید نهایی.',
  'پرداخت سطح قطعات فلزی و اعمال پوشش محافظتی برای افزایش عمر قطعه.',
  'ساخت سازه‌های فلزی برای پروژه‌های ساختمانی و صنعتی.',
  'تولید قطعات صنعتی با استفاده از تکنولوژی‌های مدرن و تجهیزات پیشرفته.',
  'قالب‌سازی پیشرفته با استفاده از نرم‌افزارهای CAD/CAM و ماشین‌آلات CNC.',
  'خدمات ورق‌کاری شامل برش، خم، پرس و جوشکاری برای ساخت قطعات فلزی.',
  'چاپ سه بعدی با استفاده از رزین برای تولید قطعات با جزئیات بالا.',
];

// Sample review comments
const reviewComments = [
  'کار بسیار عالی و با کیفیت بود. راضی هستم.',
  'خدمات سریع و دقیق. پیشنهاد می‌کنم.',
  'کیفیت کار بالاتر از انتظار بود.',
  'تیم حرفه‌ای و کار با کیفیت.',
  'راضی هستم و دوباره همکاری می‌کنم.',
  'کار خوبی انجام دادند.',
  'کیفیت عالی و قیمت مناسب.',
  'خدمات سریع و با کیفیت.',
  'خیلی راضی هستم.',
  'کار حرفه‌ای و دقیق.',
];

// Sample article titles and content
const articleTitles = [
  'راهنمای کامل ماشین‌کاری CNC',
  'نکات مهم در ورق‌کاری',
  'چاپ سه بعدی: از ایده تا واقعیت',
  'قالب‌سازی مدرن با تکنولوژی‌های جدید',
  'پرداخت سطح: روش‌ها و تکنیک‌ها',
  'انتخاب مواد اولیه مناسب برای تولید',
  'بهینه‌سازی فرآیند تولید',
  'کیفیت در تولید صنعتی',
  'تکنولوژی‌های نوین در ساخت',
  'مدیریت پروژه‌های تولیدی',
];

export async function seedComprehensive(dataSource: DataSource): Promise<void> {
  console.log('\n=== شروع Seeder جامع ===\n');

  const userRepository = dataSource.getRepository(User);
  const categoryRepository = dataSource.getRepository(Category);
  const cityRepository = dataSource.getRepository(City);
  const portfolioRepository = dataSource.getRepository(Portfolio);
  const portfolioImageRepository = dataSource.getRepository(PortfolioImage);
  const categorySupplierRepository = dataSource.getRepository(CategorySupplier);
  const citySupplierRepository = dataSource.getRepository(CitySupplier);
  const supplierRatingRepository = dataSource.getRepository(SupplierRating);

  try {
    // Get existing data
    const categories = await categoryRepository.find({ where: { isActive: true } });
    const cities = await cityRepository.find({ where: { isActive: true } });
    const adminUser = await userRepository.findOne({ where: { role: UserRole.ADMIN } });

    if (!categories || categories.length === 0) {
      throw new Error('دسته‌بندی‌ها یافت نشد. لطفاً ابتدا categories را seed کنید.');
    }

    if (!cities || cities.length === 0) {
      throw new Error('شهرها یافت نشد. لطفاً ابتدا cities را seed کنید.');
    }

    if (!adminUser) {
      throw new Error('کاربر ادمین یافت نشد. لطفاً ابتدا admin را seed کنید.');
    }

    // ========== 1. Seed Suppliers ==========
    console.log('1. ایجاد تامین‌کنندگان...');
    const suppliers: User[] = [];
    const passwordHash = await bcrypt.hash('123456', 10);

    for (const supplierInfo of supplierData) {
      try {
        const existingSupplier = await userRepository.findOne({
          where: { phone: supplierInfo.phone },
        });

        if (existingSupplier) {
          console.log(`  - تامین‌کننده ${supplierInfo.fullName} از قبل وجود دارد.`);
          if (existingSupplier.role === UserRole.SUPPLIER) {
            suppliers.push(existingSupplier);
            
            // Add city and categories for existing supplier if not already added
            const city = cities.find((c) => c.title === supplierInfo.city);
            if (city) {
              // Add city-supplier relationship
              try {
                const existingCitySupplier = await citySupplierRepository.findOne({
                  where: { cityId: city.id, supplierId: existingSupplier.id },
                });
                if (!existingCitySupplier) {
                  const citySupplier = citySupplierRepository.create({
                    cityId: city.id,
                    supplierId: existingSupplier.id,
                  });
                  await citySupplierRepository.save(citySupplier);
                  console.log(`    ✓ رابطه شهر اضافه شد: ${supplierInfo.city}`);
                }
              } catch (error) {
                console.log(`    ⚠ خطا در ایجاد رابطه شهر: ${error}`);
              }
              
              // Add category-supplier relationships
              try {
                const numCategories = Math.floor(Math.random() * 3) + 2; // 2-4 categories
                const selectedCategories = categories
                  .sort(() => Math.random() - 0.5)
                  .slice(0, numCategories);
                
                let addedCategories = 0;
                for (const category of selectedCategories) {
                  const existingCategorySupplier = await categorySupplierRepository.findOne({
                    where: { categoryId: category.id, supplierId: existingSupplier.id },
                  });
                  if (!existingCategorySupplier) {
                    const categorySupplier = categorySupplierRepository.create({
                      categoryId: category.id,
                      supplierId: existingSupplier.id,
                    });
                    await categorySupplierRepository.save(categorySupplier);
                    addedCategories++;
                  }
                }
                if (addedCategories > 0) {
                  console.log(`    ✓ ${addedCategories} تخصص اضافه شد`);
                }
              } catch (error) {
                console.log(`    ⚠ خطا در ایجاد رابطه دسته‌بندی: ${error}`);
              }
            }
          }
          continue;
        }

        const city = cities.find((c) => c.title === supplierInfo.city);
        if (!city) {
          console.log(`  ⚠ شهر ${supplierInfo.city} یافت نشد. رد کردن...`);
          continue;
        }

        const supplier = userRepository.create({
          phone: supplierInfo.phone,
          fullName: supplierInfo.fullName,
          email: supplierInfo.email,
          role: UserRole.SUPPLIER,
          passwordHash,
          isActive: true,
          isBlocked: false,
          phoneVerified: true,
          emailVerified: true,
          workshopName: supplierInfo.workshopName,
          workshopAddress: supplierInfo.workshopAddress,
          workshopPhone: supplierInfo.workshopPhone,
          bio: supplierInfo.bio,
          city: supplierInfo.city,
          profileImageUrl: `/uploads/profiles/supplier-${supplierInfo.phone}.jpg`,
          coverImageUrl: `/uploads/covers/supplier-${supplierInfo.phone}.jpg`,
        });

        const savedSupplier = await userRepository.save(supplier);
        suppliers.push(savedSupplier);
        console.log(`  ✓ تامین‌کننده ایجاد شد: ${supplierInfo.fullName}`);

        // Create city-supplier relationship
        try {
          const existingCitySupplier = await citySupplierRepository.findOne({
            where: { cityId: city.id, supplierId: savedSupplier.id },
          });

          if (!existingCitySupplier) {
            const citySupplier = citySupplierRepository.create({
              cityId: city.id,
              supplierId: savedSupplier.id,
            });
            await citySupplierRepository.save(citySupplier);
          }
        } catch (error) {
          console.log(`  ⚠ خطا در ایجاد رابطه شهر-تامین‌کننده: ${error}`);
        }

        // Create category-supplier relationships (random 2-4 categories)
        try {
          const numCategories = Math.floor(Math.random() * 3) + 2; // 2-4 categories
          const selectedCategories = categories
            .sort(() => Math.random() - 0.5)
            .slice(0, numCategories);

          for (const category of selectedCategories) {
            const existingCategorySupplier = await categorySupplierRepository.findOne({
              where: { categoryId: category.id, supplierId: savedSupplier.id },
            });

            if (!existingCategorySupplier) {
              const categorySupplier = categorySupplierRepository.create({
                categoryId: category.id,
                supplierId: savedSupplier.id,
              });
              await categorySupplierRepository.save(categorySupplier);
            }
          }
        } catch (error) {
          console.log(`  ⚠ خطا در ایجاد رابطه دسته‌بندی-تامین‌کننده: ${error}`);
        }

        // Create supplier rating
        try {
          const existingRating = await supplierRatingRepository.findOne({
            where: { supplierId: savedSupplier.id },
          });

          if (!existingRating) {
            const rating = supplierRatingRepository.create({
              supplierId: savedSupplier.id,
              totalScore: Math.floor(Math.random() * 30) + 70, // 70-100
              premiumScore: Math.floor(Math.random() * 20) + 80,
              reviewScore: Math.floor(Math.random() * 20) + 75,
              profileScore: Math.floor(Math.random() * 15) + 85,
              responseScore: Math.floor(Math.random() * 15) + 80,
              activityScore: Math.floor(Math.random() * 20) + 75,
              penalties: Math.floor(Math.random() * 5),
              lastCalculatedAt: new Date(),
            });
            await supplierRatingRepository.save(rating);
          }
        } catch (error) {
          console.log(`  ⚠ خطا در ایجاد امتیاز تامین‌کننده: ${error}`);
        }
      } catch (error: any) {
        console.log(`  ✗ خطا در ایجاد تامین‌کننده ${supplierInfo.fullName}: ${error.message}`);
      }
    }

    console.log(`✓ ${suppliers.length} تامین‌کننده ایجاد شد.\n`);

    // ========== 2. Seed Customers ==========
    console.log('2. ایجاد مشتریان...');
    const customers: User[] = [];

    for (const customerInfo of customerData) {
      try {
        const existingCustomer = await userRepository.findOne({
          where: { phone: customerInfo.phone },
        });

        if (existingCustomer) {
          if (existingCustomer.role === UserRole.CUSTOMER) {
            customers.push(existingCustomer);
          }
          continue;
        }

        const customer = userRepository.create({
          phone: customerInfo.phone,
          fullName: customerInfo.fullName,
          email: customerInfo.email,
          role: UserRole.CUSTOMER,
          passwordHash,
          isActive: true,
          isBlocked: false,
          phoneVerified: true,
          emailVerified: true,
          city: customerInfo.city,
        });

        const savedCustomer = await userRepository.save(customer);
        customers.push(savedCustomer);
      } catch (error: any) {
        console.log(`  ✗ خطا در ایجاد مشتری ${customerInfo.fullName}: ${error.message}`);
      }
    }

    console.log(`✓ ${customers.length} مشتری ایجاد شد.\n`);

    // ========== 3. Seed Portfolios ==========
    console.log('5. ایجاد پورتفولیوها...');
    const portfolios: Portfolio[] = [];

    for (let i = 0; i < 40; i++) {
      try {
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const titleIndex = Math.floor(Math.random() * portfolioTitles.length);
        const title = `${portfolioTitles[titleIndex]} ${i + 1}`;

        if (!supplier || !category) {
          continue;
        }

        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() - Math.floor(Math.random() * 365));

        const quantityRanges = [
          QuantityRange.LESS_THAN_100,
          QuantityRange.BETWEEN_100_1000,
          QuantityRange.MORE_THAN_1000,
        ];
        const quantityRange = quantityRanges[Math.floor(Math.random() * quantityRanges.length)];

        const portfolio = portfolioRepository.create({
          title,
          supplierId: supplier.id,
          categoryId: category.id,
          completionDate,
          quantityRange,
          description: portfolioDescriptions[titleIndex % portfolioDescriptions.length],
          isPublic: true,
          isVerified: Math.random() > 0.3, // 70% verified
          rating: Number((Math.random() * 1.5 + 3.5).toFixed(2)), // 3.5-5.0
          viewCount: Math.floor(Math.random() * 1000),
        });

        const savedPortfolio: Portfolio = await portfolioRepository.save(portfolio);
        portfolios.push(savedPortfolio);


        // Create portfolio images
        try {
          const numImages = Math.floor(Math.random() * 4) + 2; // 2-5 images
          for (let j = 0; j < numImages; j++) {
            const portfolioImage = portfolioImageRepository.create({
              portfolioId: savedPortfolio.id,
              imageUrl: `/uploads/portfolios/portfolio-${savedPortfolio.id}-${j + 1}.jpg`,
              order: j,
              isPrimary: j === 0,
            });
            await portfolioImageRepository.save(portfolioImage);
          }
        } catch (error) {
          console.log(`  ⚠ خطا در ایجاد تصاویر پورتفولیو: ${error}`);
        }
      } catch (error: any) {
        console.log(`  ✗ خطا در ایجاد پورتفولیو ${i + 1}: ${error.message}`);
      }
    }

    console.log(`✓ ${portfolios.length} پورتفولیو ایجاد شد.\n`);

    console.log('=== Seeder جامع با موفقیت تکمیل شد ===\n');
    console.log('خلاصه:');
    console.log(`- ${suppliers.length} تامین‌کننده`);
    console.log(`- ${customers.length} مشتری`);
    console.log(`- ${portfolios.length} پورتفولیو`);
  } catch (error: any) {
    console.error('✗ خطا در Seeder جامع:', error);
    throw error;
  }
}

