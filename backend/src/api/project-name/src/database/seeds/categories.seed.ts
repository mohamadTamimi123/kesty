import { DataSource } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

export async function seedCategories(dataSource: DataSource): Promise<void> {
  const categoryRepository = dataSource.getRepository(Category);

  const categories = [
    {
      title: 'ماشین‌کاری',
      slug: 'machining',
      description: 'خدمات ماشین‌کاری شامل تراش، فرز، بورینگ و سایر عملیات ماشین‌کاری با دقت بالا',
      isActive: true,
      metaTitle: 'ماشین‌کاری | خدمات ماشین‌کاری با دقت بالا',
      metaDescription: 'خدمات ماشین‌کاری شامل تراش، فرز، بورینگ و سایر عملیات ماشین‌کاری با دقت بالا',
      level: 1,
      order: 1,
      subcategories: [
        {
          title: 'فرز سی‌ان‌سی',
          slug: 'cnc-milling',
          description: 'خدمات فرزکاری با دستگاه‌های CNC با دقت بالا',
          isActive: true,
          level: 2,
          order: 1,
        },
        {
          title: 'تراش سی‌ان‌سی',
          slug: 'cnc-turning',
          description: 'خدمات تراشکاری با دستگاه‌های CNC',
          isActive: true,
          level: 2,
          order: 2,
        },
        {
          title: 'بورینگ',
          slug: 'boring',
          description: 'خدمات بورینگ و سوراخکاری دقیق',
          isActive: true,
          level: 2,
          order: 3,
        },
        {
          title: 'سنگ‌زنی',
          slug: 'grinding',
          description: 'خدمات سنگ‌زنی و پرداخت سطح',
          isActive: true,
          level: 2,
          order: 4,
        },
      ],
    },
    {
      title: 'ورق‌کاری',
      slug: 'sheet-metal',
      description: 'خدمات ورق‌کاری شامل برش، خم، پرس و جوشکاری ورق‌های فلزی',
      isActive: true,
      metaTitle: 'ورق‌کاری | خدمات برش و خم ورق فلزی',
      metaDescription: 'خدمات ورق‌کاری شامل برش، خم، پرس و جوشکاری ورق‌های فلزی',
      level: 1,
      order: 2,
      subcategories: [
        {
          title: 'برش لیزری',
          slug: 'laser-cutting',
          description: 'خدمات برش لیزری ورق فلزی',
          isActive: true,
          level: 2,
          order: 1,
        },
        {
          title: 'خمکاری',
          slug: 'bending',
          description: 'خدمات خمکاری ورق فلزی',
          isActive: true,
          level: 2,
          order: 2,
        },
        {
          title: 'پرس',
          slug: 'pressing',
          description: 'خدمات پرس ورق فلزی',
          isActive: true,
          level: 2,
          order: 3,
        },
        {
          title: 'جوشکاری',
          slug: 'welding',
          description: 'خدمات جوشکاری ورق فلزی',
          isActive: true,
          level: 2,
          order: 4,
        },
      ],
    },
    {
      title: 'چاپ 3 بعدی',
      slug: '3d-printing',
      description: 'خدمات چاپ سه بعدی با استفاده از تکنولوژی‌های مختلف از جمله FDM، SLA و SLS',
      isActive: true,
      metaTitle: 'چاپ 3 بعدی | خدمات پرینت سه بعدی',
      metaDescription: 'خدمات چاپ سه بعدی با استفاده از تکنولوژی‌های مختلف از جمله FDM، SLA و SLS',
      level: 1,
      order: 3,
      subcategories: [
        {
          title: 'FDM',
          slug: 'fdm',
          description: 'چاپ سه بعدی با تکنولوژی FDM',
          isActive: true,
          level: 2,
          order: 1,
        },
        {
          title: 'SLA',
          slug: 'sla',
          description: 'چاپ سه بعدی با تکنولوژی SLA',
          isActive: true,
          level: 2,
          order: 2,
        },
        {
          title: 'SLS',
          slug: 'sls',
          description: 'چاپ سه بعدی با تکنولوژی SLS',
          isActive: true,
          level: 2,
          order: 3,
        },
      ],
    },
    {
      title: 'قالب‌سازی',
      slug: 'molding',
      description: 'ساخت قالب‌های تزریق پلاستیک، قالب‌های فلزی و سایر انواع قالب‌سازی',
      isActive: true,
      metaTitle: 'قالب‌سازی | ساخت قالب تزریق پلاستیک و فلزی',
      metaDescription: 'ساخت قالب‌های تزریق پلاستیک، قالب‌های فلزی و سایر انواع قالب‌سازی',
      level: 1,
      order: 4,
      subcategories: [
        {
          title: 'قالب تزریق پلاستیک',
          slug: 'plastic-injection-mold',
          description: 'ساخت قالب تزریق پلاستیک',
          isActive: true,
          level: 2,
          order: 1,
        },
        {
          title: 'قالب فلزی',
          slug: 'metal-mold',
          description: 'ساخت قالب فلزی',
          isActive: true,
          level: 2,
          order: 2,
        },
      ],
    },
    {
      title: 'پرداخت سطح',
      slug: 'surface-finishing',
      description: 'خدمات پرداخت سطح شامل پولیش، رنگ‌کاری، آبکاری و سایر روش‌های پرداخت',
      isActive: true,
      metaTitle: 'پرداخت سطح | خدمات پولیش و رنگ‌کاری',
      metaDescription: 'خدمات پرداخت سطح شامل پولیش، رنگ‌کاری، آبکاری و سایر روش‌های پرداخت',
      level: 1,
      order: 5,
      subcategories: [
        {
          title: 'پولیش',
          slug: 'polishing',
          description: 'خدمات پولیش و پرداخت سطح',
          isActive: true,
          level: 2,
          order: 1,
        },
        {
          title: 'رنگ‌کاری',
          slug: 'painting',
          description: 'خدمات رنگ‌کاری و پوشش سطح',
          isActive: true,
          level: 2,
          order: 2,
        },
        {
          title: 'آبکاری',
          slug: 'plating',
          description: 'خدمات آبکاری و پوشش فلزی',
          isActive: true,
          level: 2,
          order: 3,
        },
      ],
    },
  ];

  try {
    // First, create parent categories
    const createdCategories: Map<string, Category> = new Map();

    for (const categoryData of categories) {
      try {
        if (!categoryData.slug || !categoryData.title) {
          console.log(`⚠ دسته‌بندی با داده ناقص رد شد`);
          continue;
        }

        const existingCategory = await categoryRepository.findOne({
          where: { slug: categoryData.slug },
        });

        let parentCategory: Category;
        if (!existingCategory) {
          const { subcategories, ...parentData } = categoryData;
          parentCategory = categoryRepository.create(parentData);
          await categoryRepository.save(parentCategory);
          console.log(`✓ Category created: ${categoryData.title}`);
        } else {
          parentCategory = existingCategory;
          // Update level and order if needed
          if (existingCategory.level !== categoryData.level || existingCategory.order !== categoryData.order) {
            existingCategory.level = categoryData.level;
            existingCategory.order = categoryData.order;
            await categoryRepository.save(existingCategory);
          }
          console.log(`- Category already exists: ${categoryData.title}`);
        }

        createdCategories.set(categoryData.slug, parentCategory);

        // Create subcategories
        if (categoryData.subcategories && categoryData.subcategories.length > 0) {
          for (const subcategoryData of categoryData.subcategories) {
            try {
              const existingSubcategory = await categoryRepository.findOne({
                where: { slug: subcategoryData.slug },
              });

              if (!existingSubcategory) {
                const subcategory = categoryRepository.create({
                  ...subcategoryData,
                  parentId: parentCategory.id,
                });
                await categoryRepository.save(subcategory);
                console.log(`  ✓ Subcategory created: ${subcategoryData.title}`);
              } else {
                // Update parentId if it's different
                if (existingSubcategory.parentId !== parentCategory.id) {
                  existingSubcategory.parentId = parentCategory.id;
                  existingSubcategory.level = subcategoryData.level;
                  existingSubcategory.order = subcategoryData.order;
                  await categoryRepository.save(existingSubcategory);
                }
                console.log(`  - Subcategory already exists: ${subcategoryData.title}`);
              }
            } catch (error: any) {
              console.log(`  ✗ خطا در ایجاد زیردسته ${subcategoryData.title}: ${error.message}`);
            }
          }
        }
      } catch (error: any) {
        console.log(`✗ خطا در ایجاد دسته‌بندی ${categoryData.title}: ${error.message}`);
      }
    }

    console.log('Categories seeding completed!');
  } catch (error: any) {
    console.error('✗ خطا در seed دسته‌بندی‌ها:', error);
    throw error;
  }
}

