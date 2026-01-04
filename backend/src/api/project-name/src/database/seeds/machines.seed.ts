import { DataSource } from 'typeorm';
import { Machine } from '../../machines/entities/machine.entity';
import { Category } from '../../categories/entities/category.entity';

interface MachineSeedData {
  name: string;
  categorySlug?: string;
  description?: string;
  isActive?: boolean;
}

export async function seedMachines(dataSource: DataSource): Promise<void> {
  const machineRepository = dataSource.getRepository(Machine);
  const categoryRepository = dataSource.getRepository(Category);

  console.log('شروع seed دستگاه‌ها...');

  // Get all categories to map by slug
  const categories = await categoryRepository.find();
  const categoryMap = new Map<string, string>();
  categories.forEach((cat) => {
    categoryMap.set(cat.slug, cat.id);
  });

  const machinesData: MachineSeedData[] = [
    // دستگاه‌های ماشین‌کاری
    {
      name: 'دستگاه فرز CNC',
      categorySlug: 'cnc-milling',
      description: 'دستگاه فرزکاری با کنترل عددی کامپیوتری برای برش و شکل‌دهی دقیق قطعات فلزی',
      isActive: true,
    },
    {
      name: 'دستگاه تراش CNC',
      categorySlug: 'cnc-turning',
      description: 'دستگاه تراشکاری با کنترل عددی کامپیوتری برای تولید قطعات استوانه‌ای',
      isActive: true,
    },
    {
      name: 'دستگاه تراش معمولی',
      categorySlug: 'cnc-turning',
      description: 'دستگاه تراشکاری دستی برای تولید قطعات استوانه‌ای و مخروطی',
      isActive: true,
    },
    {
      name: 'دستگاه فرز معمولی',
      categorySlug: 'cnc-milling',
      description: 'دستگاه فرزکاری دستی برای برش و شکل‌دهی قطعات',
      isActive: true,
    },
    {
      name: 'دستگاه سنگ‌زنی',
      categorySlug: 'grinding',
      description: 'دستگاه سنگ‌زنی برای پرداخت سطح و رساندن به دقت ابعادی بالا',
      isActive: true,
    },
    {
      name: 'دستگاه بورینگ',
      categorySlug: 'boring',
      description: 'دستگاه بورینگ برای سوراخکاری دقیق و بزرگ قطعات',
      isActive: true,
    },
    // دستگاه‌های ورق‌کاری
    {
      name: 'دستگاه برش لیزری',
      categorySlug: 'laser-cutting',
      description: 'دستگاه برش لیزری برای برش دقیق ورق‌های فلزی با دقت بالا',
      isActive: true,
    },
    {
      name: 'دستگاه خمکاری',
      categorySlug: 'bending',
      description: 'دستگاه خمکاری برای خم کردن ورق‌های فلزی در زوایای مختلف',
      isActive: true,
    },
    {
      name: 'دستگاه پرس',
      categorySlug: 'pressing',
      description: 'دستگاه پرس برای شکل‌دهی ورق‌های فلزی با فشار',
      isActive: true,
    },
    {
      name: 'دستگاه جوشکاری',
      categorySlug: 'welding',
      description: 'دستگاه جوشکاری برای اتصال قطعات فلزی',
      isActive: true,
    },
    // دستگاه‌های چاپ 3D
    {
      name: 'پرینتر سه بعدی FDM',
      categorySlug: 'fdm',
      description: 'پرینتر سه بعدی با تکنولوژی FDM برای تولید نمونه‌های اولیه و قطعات پلاستیکی',
      isActive: true,
    },
    {
      name: 'پرینتر سه بعدی SLA',
      categorySlug: 'sla',
      description: 'پرینتر سه بعدی با تکنولوژی SLA برای تولید قطعات با دقت بالا',
      isActive: true,
    },
    {
      name: 'پرینتر سه بعدی SLS',
      categorySlug: 'sls',
      description: 'پرینتر سه بعدی با تکنولوژی SLS برای تولید قطعات فلزی و سرامیکی',
      isActive: true,
    },
    // دستگاه‌های قالب‌سازی
    {
      name: 'دستگاه تزریق پلاستیک',
      categorySlug: 'plastic-injection-mold',
      description: 'دستگاه تزریق پلاستیک برای تولید انبوه قطعات پلاستیکی',
      isActive: true,
    },
    {
      name: 'دستگاه ریخته‌گری تحت فشار',
      categorySlug: 'metal-mold',
      description: 'دستگاه ریخته‌گری تحت فشار برای تولید قطعات فلزی',
      isActive: true,
    },
    // دستگاه‌های پرداخت سطح
    {
      name: 'دستگاه پولیش',
      categorySlug: 'polishing',
      description: 'دستگاه پولیش برای پرداخت و براق کردن سطح قطعات',
      isActive: true,
    },
    {
      name: 'کابین رنگ',
      categorySlug: 'painting',
      description: 'کابین رنگ برای رنگ‌کاری و پوشش دهی قطعات',
      isActive: true,
    },
    {
      name: 'دستگاه آبکاری',
      categorySlug: 'plating',
      description: 'دستگاه آبکاری برای پوشش فلزی قطعات',
      isActive: true,
    },
  ];

  try {
    let createdCount = 0;
    let skippedCount = 0;

    for (const machineData of machinesData) {
      try {
        // Check if machine already exists
        const existingMachine = await machineRepository.findOne({
          where: { name: machineData.name },
        });

        if (existingMachine) {
          console.log(`  - دستگاه "${machineData.name}" از قبل وجود دارد. رد شد...`);
          skippedCount++;
          continue;
        }

        // Find category ID if categorySlug is provided
        let categoryId: string | null = null;
        if (machineData.categorySlug) {
          const categoryIdFromMap = categoryMap.get(machineData.categorySlug);
          if (categoryIdFromMap) {
            categoryId = categoryIdFromMap;
          } else {
            console.log(
              `  ⚠ دسته‌بندی با slug "${machineData.categorySlug}" یافت نشد برای دستگاه "${machineData.name}"`,
            );
          }
        }

        // Create machine
        const machine = machineRepository.create({
          name: machineData.name,
          categoryId: categoryId,
          description: machineData.description || null,
          isActive: machineData.isActive ?? true,
        });

        await machineRepository.save(machine);
        console.log(`  ✓ دستگاه ایجاد شد: ${machineData.name}`);
        createdCount++;
      } catch (error: any) {
        console.log(`  ✗ خطا در ایجاد دستگاه ${machineData.name}: ${error.message}`);
      }
    }

    console.log(
      `✓ Seed دستگاه‌ها با موفقیت انجام شد! (ایجاد شده: ${createdCount}, رد شده: ${skippedCount})`,
    );
  } catch (error: any) {
    console.error('✗ خطا در seed دستگاه‌ها:', error);
    throw error;
  }
}

