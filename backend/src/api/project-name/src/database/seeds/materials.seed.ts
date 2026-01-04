import { DataSource } from 'typeorm';
import { Material } from '../../materials/entities/material.entity';
import { Category } from '../../categories/entities/category.entity';

interface MaterialSeedData {
  name: string;
  categorySlug?: string;
  description?: string;
  isActive?: boolean;
}

export async function seedMaterials(dataSource: DataSource): Promise<void> {
  const materialRepository = dataSource.getRepository(Material);
  const categoryRepository = dataSource.getRepository(Category);

  console.log('شروع seed متریال‌ها...');

  // Get all categories to map by slug
  const categories = await categoryRepository.find();
  const categoryMap = new Map<string, string>();
  categories.forEach((cat) => {
    categoryMap.set(cat.slug, cat.id);
  });

  const materialsData: MaterialSeedData[] = [
    // فلزات
    {
      name: 'فولاد',
      categorySlug: 'machining',
      description: 'فولاد کربنی برای ساخت قطعات صنعتی و ماشین‌آلات',
      isActive: true,
    },
    {
      name: 'آلومینیوم',
      categorySlug: 'machining',
      description: 'آلومینیوم سبک و مقاوم برای ساخت قطعات سبک‌وزن',
      isActive: true,
    },
    {
      name: 'مس',
      categorySlug: 'machining',
      description: 'مس برای ساخت قطعات الکتریکی و هدایت حرارتی',
      isActive: true,
    },
    {
      name: 'برنج',
      categorySlug: 'machining',
      description: 'برنج آلیاژ مس و روی برای ساخت قطعات تزئینی و صنعتی',
      isActive: true,
    },
    {
      name: 'استیل ضدزنگ',
      categorySlug: 'machining',
      description: 'استیل ضدزنگ برای ساخت قطعات مقاوم در برابر خوردگی',
      isActive: true,
    },
    // پلاستیک‌ها
    {
      name: 'ABS',
      categorySlug: 'fdm',
      description: 'پلاستیک ABS مقاوم و سخت برای چاپ سه بعدی',
      isActive: true,
    },
    {
      name: 'PLA',
      categorySlug: 'fdm',
      description: 'پلاستیک PLA زیست‌تخریب‌پذیر برای چاپ سه بعدی',
      isActive: true,
    },
    {
      name: 'PETG',
      categorySlug: 'fdm',
      description: 'پلاستیک PETG شفاف و مقاوم برای چاپ سه بعدی',
      isActive: true,
    },
    {
      name: 'Nylon',
      categorySlug: 'fdm',
      description: 'نایلون مقاوم و انعطاف‌پذیر برای چاپ سه بعدی',
      isActive: true,
    },
    {
      name: 'Polycarbonate',
      categorySlug: 'fdm',
      description: 'پلی‌کربنات بسیار مقاوم و شفاف برای چاپ سه بعدی',
      isActive: true,
    },
    {
      name: 'رزین SLA',
      categorySlug: 'sla',
      description: 'رزین مخصوص چاپ سه بعدی SLA برای دقت بالا',
      isActive: true,
    },
    {
      name: 'پودر فلزی SLS',
      categorySlug: 'sls',
      description: 'پودر فلزی برای چاپ سه بعدی SLS',
      isActive: true,
    },
    // مواد ورق‌کاری
    {
      name: 'ورق فولاد',
      categorySlug: 'laser-cutting',
      description: 'ورق فولاد برای برش لیزری و ورق‌کاری',
      isActive: true,
    },
    {
      name: 'ورق آلومینیوم',
      categorySlug: 'laser-cutting',
      description: 'ورق آلومینیوم سبک برای برش لیزری و ورق‌کاری',
      isActive: true,
    },
    {
      name: 'ورق استیل',
      categorySlug: 'laser-cutting',
      description: 'ورق استیل ضدزنگ برای برش لیزری و ورق‌کاری',
      isActive: true,
    },
    {
      name: 'ورق مس',
      categorySlug: 'laser-cutting',
      description: 'ورق مس برای برش لیزری و ورق‌کاری',
      isActive: true,
    },
    // مواد قالب‌سازی
    {
      name: 'پلاستیک تزریقی',
      categorySlug: 'plastic-injection-mold',
      description: 'گرانول پلاستیک برای تزریق در قالب',
      isActive: true,
    },
    {
      name: 'آلیاژ آلومینیوم',
      categorySlug: 'metal-mold',
      description: 'آلیاژ آلومینیوم برای ریخته‌گری تحت فشار',
      isActive: true,
    },
    {
      name: 'آلیاژ روی',
      categorySlug: 'metal-mold',
      description: 'آلیاژ روی برای ریخته‌گری تحت فشار',
      isActive: true,
    },
    // مواد پرداخت سطح
    {
      name: 'رنگ اپوکسی',
      categorySlug: 'painting',
      description: 'رنگ اپوکسی مقاوم برای رنگ‌کاری قطعات',
      isActive: true,
    },
    {
      name: 'رنگ پلی‌اورتان',
      categorySlug: 'painting',
      description: 'رنگ پلی‌اورتان مقاوم در برابر آب و هوا',
      isActive: true,
    },
    {
      name: 'پولیش',
      categorySlug: 'polishing',
      description: 'مواد پولیش برای براق کردن سطح قطعات',
      isActive: true,
    },
    {
      name: 'مواد آبکاری',
      categorySlug: 'plating',
      description: 'مواد آبکاری برای پوشش فلزی قطعات',
      isActive: true,
    },
  ];

  try {
    let createdCount = 0;
    let skippedCount = 0;

    for (const materialData of materialsData) {
      try {
        // Check if material already exists
        const existingMaterial = await materialRepository.findOne({
          where: { name: materialData.name },
        });

        if (existingMaterial) {
          console.log(`  - متریال "${materialData.name}" از قبل وجود دارد. رد شد...`);
          skippedCount++;
          continue;
        }

        // Find category ID if categorySlug is provided
        let categoryId: string | null = null;
        if (materialData.categorySlug) {
          const categoryIdFromMap = categoryMap.get(materialData.categorySlug);
          if (categoryIdFromMap) {
            categoryId = categoryIdFromMap;
          } else {
            console.log(
              `  ⚠ دسته‌بندی با slug "${materialData.categorySlug}" یافت نشد برای متریال "${materialData.name}"`,
            );
          }
        }

        // Create material
        const material = materialRepository.create({
          name: materialData.name,
          categoryId: categoryId,
          description: materialData.description || null,
          isActive: materialData.isActive ?? true,
        });

        await materialRepository.save(material);
        console.log(`  ✓ متریال ایجاد شد: ${materialData.name}`);
        createdCount++;
      } catch (error: any) {
        console.log(`  ✗ خطا در ایجاد متریال ${materialData.name}: ${error.message}`);
      }
    }

    console.log(
      `✓ Seed متریال‌ها با موفقیت انجام شد! (ایجاد شده: ${createdCount}, رد شده: ${skippedCount})`,
    );
  } catch (error: any) {
    console.error('✗ خطا در seed متریال‌ها:', error);
    throw error;
  }
}

