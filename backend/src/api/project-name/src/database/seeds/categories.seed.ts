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
    },
    {
      title: 'ورق‌کاری',
      slug: 'sheet-metal',
      description: 'خدمات ورق‌کاری شامل برش، خم، پرس و جوشکاری ورق‌های فلزی',
      isActive: true,
      metaTitle: 'ورق‌کاری | خدمات برش و خم ورق فلزی',
      metaDescription: 'خدمات ورق‌کاری شامل برش، خم، پرس و جوشکاری ورق‌های فلزی',
    },
    {
      title: 'چاپ 3 بعدی',
      slug: '3d-printing',
      description: 'خدمات چاپ سه بعدی با استفاده از تکنولوژی‌های مختلف از جمله FDM، SLA و SLS',
      isActive: true,
      metaTitle: 'چاپ 3 بعدی | خدمات پرینت سه بعدی',
      metaDescription: 'خدمات چاپ سه بعدی با استفاده از تکنولوژی‌های مختلف از جمله FDM، SLA و SLS',
    },
    {
      title: 'قالب‌سازی',
      slug: 'molding',
      description: 'ساخت قالب‌های تزریق پلاستیک، قالب‌های فلزی و سایر انواع قالب‌سازی',
      isActive: true,
      metaTitle: 'قالب‌سازی | ساخت قالب تزریق پلاستیک و فلزی',
      metaDescription: 'ساخت قالب‌های تزریق پلاستیک، قالب‌های فلزی و سایر انواع قالب‌سازی',
    },
    {
      title: 'پرداخت سطح',
      slug: 'surface-finishing',
      description: 'خدمات پرداخت سطح شامل پولیش، رنگ‌کاری، آبکاری و سایر روش‌های پرداخت',
      isActive: true,
      metaTitle: 'پرداخت سطح | خدمات پولیش و رنگ‌کاری',
      metaDescription: 'خدمات پرداخت سطح شامل پولیش، رنگ‌کاری، آبکاری و سایر روش‌های پرداخت',
    },
  ];

  for (const categoryData of categories) {
    const existingCategory = await categoryRepository.findOne({
      where: { slug: categoryData.slug },
    });

    if (!existingCategory) {
      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
      console.log(`✓ Category created: ${categoryData.title}`);
    } else {
      console.log(`- Category already exists: ${categoryData.title}`);
    }
  }

  console.log('Categories seeding completed!');
}

