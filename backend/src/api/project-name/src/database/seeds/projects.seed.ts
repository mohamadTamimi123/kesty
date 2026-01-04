import { DataSource, IsNull } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { City } from '../../cities/entities/city.entity';
import { Project, ProjectStatus, QuantityEstimate } from '../../projects/entities/project.entity';

// Sample project titles
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

// Sample project descriptions
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

export async function seedProjects(dataSource: DataSource, projectCount: number = 20): Promise<void> {
  console.log(`\n=== شروع ایجاد ${projectCount} پروژه تستی ===\n`);

  const userRepository = dataSource.getRepository(User);
  const categoryRepository = dataSource.getRepository(Category);
  const cityRepository = dataSource.getRepository(City);
  const projectRepository = dataSource.getRepository(Project);

  try {
    // Get existing data
    const customers = await userRepository.find({
      where: { role: UserRole.CUSTOMER },
      take: 50, // Get up to 50 customers
    });

    // Get main categories (categories without parent)
    const mainCategories = await categoryRepository.find({
      where: { isActive: true, parentId: IsNull() },
      relations: ['children'],
    });

    // Get all categories including subcategories
    const allCategories = await categoryRepository.find({
      where: { isActive: true },
    });

    const cities = await cityRepository.find({
      where: { isActive: true },
    });

    if (customers.length === 0) {
      throw new Error('هیچ مشتری یافت نشد. لطفاً ابتدا comprehensive seeder را اجرا کنید.');
    }

    if (allCategories.length === 0) {
      throw new Error('هیچ دسته‌بندی یافت نشد. لطفاً ابتدا categories را seed کنید.');
    }

    if (cities.length === 0) {
      throw new Error('هیچ شهری یافت نشد. لطفاً ابتدا cities را seed کنید.');
    }

    console.log(`✓ ${customers.length} مشتری یافت شد`);
    console.log(`✓ ${allCategories.length} دسته‌بندی یافت شد (${mainCategories.length} دسته اصلی)`);
    console.log(`✓ ${cities.length} شهر یافت شد\n`);

    const projects: Project[] = [];
    const quantityEstimates = [
      QuantityEstimate.LESS_THAN_10,
      QuantityEstimate.BETWEEN_10_100,
      QuantityEstimate.MORE_THAN_100,
    ];

    console.log('ایجاد پروژه‌ها...\n');

    for (let i = 0; i < projectCount; i++) {
      try {
        // Randomly select customer
        const customer = customers[Math.floor(Math.random() * customers.length)];

        // Randomly select city
        const city = cities[Math.floor(Math.random() * cities.length)];

        // Randomly select category (prefer main categories with subcategories)
        let category: Category;
        let subCategory: Category | null = null;

        if (mainCategories.length > 0 && Math.random() > 0.3) {
          // 70% chance to use main category with subcategory
          category = mainCategories[Math.floor(Math.random() * mainCategories.length)];
          // Reload category with children to ensure children are loaded
          const categoryWithChildren = await categoryRepository.findOne({
            where: { id: category.id },
            relations: ['children'],
          });
          if (categoryWithChildren?.children && categoryWithChildren.children.length > 0) {
            const activeSubCategories = categoryWithChildren.children.filter((child) => child.isActive);
            if (activeSubCategories.length > 0) {
              subCategory = activeSubCategories[Math.floor(Math.random() * activeSubCategories.length)];
            }
          }
        } else {
          // 30% chance to use any category
          category = allCategories[Math.floor(Math.random() * allCategories.length)];
          // If selected category has a parent, use parent as main category and this as subcategory
          if (category.parentId) {
            const parentCategory = await categoryRepository.findOne({
              where: { id: category.parentId },
            });
            if (parentCategory) {
              subCategory = category;
              category = parentCategory;
            }
          }
        }

        // Select random title and description
        const titleIndex = Math.floor(Math.random() * projectTitles.length);
        const title = `${projectTitles[titleIndex]} ${i + 1}`;
        const description = projectDescriptions[titleIndex % projectDescriptions.length];

        // Random quantity estimate
        const quantityEstimate = quantityEstimates[Math.floor(Math.random() * quantityEstimates.length)];

        // Random completion date (between 1 week and 3 months from now)
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + Math.floor(Math.random() * 90) + 7);

        const project = projectRepository.create({
          title,
          description,
          customerId: customer.id,
          cityId: city.id,
          categoryId: category.id,
          subCategoryId: subCategory?.id || null,
          quantityEstimate,
          completionDate,
          status: ProjectStatus.PENDING,
          isPublic: true,
        });

        const savedProject = await projectRepository.save(project);
        projects.push(savedProject);

        console.log(`  ✓ پروژه ${i + 1}: "${title}"`);
        console.log(`    - مشتری: ${customer.fullName}`);
        console.log(`    - شهر: ${city.title}`);
        console.log(`    - دسته‌بندی: ${category.title}${subCategory ? ` > ${subCategory.title}` : ''}`);
        console.log(`    - تخمین تعداد: ${quantityEstimate}\n`);
      } catch (error) {
        console.error(`  ✗ خطا در ایجاد پروژه ${i + 1}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log(`\n=== ${projects.length} پروژه با موفقیت ایجاد شد ===\n`);

    // Summary by city
    const projectsByCity = new Map<string, number>();
    const projectsByCategory = new Map<string, number>();

    for (const project of projects) {
      const city = cities.find((c) => c.id === project.cityId);
      const category = allCategories.find((c) => c.id === project.categoryId);

      if (city) {
        projectsByCity.set(city.title, (projectsByCity.get(city.title) || 0) + 1);
      }
      if (category) {
        projectsByCategory.set(category.title, (projectsByCategory.get(category.title) || 0) + 1);
      }
    }

    console.log('خلاصه پروژه‌ها بر اساس شهر:');
    for (const [cityName, count] of Array.from(projectsByCity.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`  - ${cityName}: ${count} پروژه`);
    }

    console.log('\nخلاصه پروژه‌ها بر اساس دسته‌بندی:');
    for (const [categoryName, count] of Array.from(projectsByCategory.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`  - ${categoryName}: ${count} پروژه`);
    }

    console.log('\n✓ پروژه‌ها آماده توزیع به تولیدکنندگان هستند.\n');
  } catch (error) {
    console.error('خطا در ایجاد پروژه‌ها:', error);
    throw error;
  }
}

