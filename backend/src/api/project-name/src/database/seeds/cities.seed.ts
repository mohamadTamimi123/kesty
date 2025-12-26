import { DataSource } from 'typeorm';
import { City } from '../../cities/entities/city.entity';
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, extname, basename } from 'path';

// City data mapping from folder names
const cityNames: Record<string, string> = {
  '01 Tehran': 'تهران',
  '02 Isfahan': 'اصفهان',
  '03 Mashhad': 'مشهد',
  '04 Tabriz': 'تبریز',
  '05 Shiraz': 'شیراز',
  '06 Karaj': 'کرج',
  '07 Ahvaz': 'اهواز',
  '08 Ghom': 'قم',
  '09 Kermanshah': 'کرمانشاه',
  '10 Orumie': 'ارومیه',
  '11 Rasht': 'رشت',
  '12 Zanjan': 'زنجان',
  '13 Hamedan': 'همدان',
  '14 Kerman': 'کرمان',
  '15 Arak': 'اراک',
};

// توضیحات شهرها
const cityDescriptions: Record<string, string> = {
  'تهران': 'تهران پایتخت ایران و بزرگ‌ترین شهر کشور است که در دامنه رشته کوه البرز قرار دارد.',
  'اصفهان': 'اصفهان یکی از شهرهای تاریخی و فرهنگی ایران است که به نصف جهان معروف است.',
  'مشهد': 'مشهد دومین شهر بزرگ ایران و مهم‌ترین شهر مذهبی کشور است که حرم امام رضا (ع) در آن قرار دارد.',
  'تبریز': 'تبریز یکی از شهرهای مهم شمال غرب ایران و مرکز استان آذربایجان شرقی است.',
  'شیراز': 'شیراز شهر شعر و ادب ایران است و به باغ‌های زیبا و آثار تاریخی فراوانش معروف است.',
  'کرج': 'کرج یکی از شهرهای بزرگ ایران و مرکز استان البرز است که در نزدیکی تهران قرار دارد.',
  'اهواز': 'اهواز مرکز استان خوزستان و یکی از شهرهای مهم جنوب غرب ایران است.',
  'قم': 'قم یکی از شهرهای مهم مذهبی ایران است که حرم حضرت معصومه (س) در آن قرار دارد.',
  'کرمانشاه': 'کرمانشاه یکی از شهرهای تاریخی غرب ایران و مرکز استان کرمانشاه است.',
  'ارومیه': 'ارومیه مرکز استان آذربایجان غربی و یکی از شهرهای مهم شمال غرب ایران است.',
  'رشت': 'رشت مرکز استان گیلان و یکی از شهرهای زیبای شمال ایران است.',
  'زنجان': 'زنجان مرکز استان زنجان و یکی از شهرهای تاریخی ایران است.',
  'همدان': 'همدان یکی از شهرهای تاریخی ایران و مرکز استان همدان است.',
  'کرمان': 'کرمان مرکز استان کرمان و یکی از شهرهای تاریخی و فرهنگی ایران است.',
  'اراک': 'اراک مرکز استان مرکزی و یکی از شهرهای مهم مرکز ایران است.',
};

export async function seedCities(dataSource: DataSource): Promise<void> {
  const cityRepository = dataSource.getRepository(City);
  const citiesPath = '/root/doc/06 CITIES';
  const uploadsPath = join(process.cwd(), 'uploads', 'cities');

  // ایجاد پوشه uploads/cities در صورت عدم وجود
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
    console.log(`Created uploads directory: ${uploadsPath}`);
  }

  console.log('شروع seed شهرها...');

  try {
    // خواندن تمام پوشه‌ها در فولدر شهرها
    const entries = readdirSync(citiesPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const folderName = entry.name;
      const cityName = cityNames[folderName];

      if (!cityName) {
        console.log(`رد کردن پوشه ناشناخته: ${folderName}`);
        continue;
      }

      // بررسی وجود شهر با slug
      const slug = generateSlug(cityName);
      const existingCity = await cityRepository.findOne({
        where: { slug },
      });

      let logoUrl: string | null = null;

      // جستجوی فایل تصویری در پوشه شهر
      const cityFolderPath = join(citiesPath, folderName);
      const files = readdirSync(cityFolderPath);
      
      // جستجوی فایل‌های تصویری (png, jpg, jpeg, webp)
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
      const imageFile = files.find(file => {
        const ext = extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      });

      if (imageFile) {
        // کپی فایل تصویری به پوشه uploads/cities
        const sourcePath = join(cityFolderPath, imageFile);
        const fileExtension = extname(imageFile);
        const uniqueFileName = `city-${slug}-${Date.now()}${fileExtension}`;
        const destPath = join(uploadsPath, uniqueFileName);
        
        copyFileSync(sourcePath, destPath);
        logoUrl = `/uploads/cities/${uniqueFileName}`;
        console.log(`  ✓ عکس کپی شد: ${imageFile} -> ${uniqueFileName}`);
      } else {
        console.log(`  ⚠ فایل تصویری برای ${cityName} یافت نشد`);
      }

      if (existingCity) {
        // به‌روزرسانی شهر موجود در صورت نیاز
        if (logoUrl && !existingCity.logoUrl) {
          existingCity.logoUrl = logoUrl;
          await cityRepository.save(existingCity);
          console.log(`  ✓ شهر ${cityName} به‌روزرسانی شد (عکس اضافه شد)`);
        } else {
          console.log(`  - شهر ${cityName} از قبل وجود دارد. رد شد...`);
        }
        continue;
      }

      // ایجاد شهر جدید
      const city = cityRepository.create({
        title: cityName,
        slug: await generateUniqueSlug(cityRepository, slug),
        description: cityDescriptions[cityName] || null,
        logoUrl: logoUrl,
        isActive: true,
      });

      await cityRepository.save(city);
      console.log(`  ✓ شهر ایجاد شد: ${cityName}${logoUrl ? ' (با عکس)' : ''}`);
    }

    console.log('✓ Seed شهرها با موفقیت انجام شد!');
  } catch (error) {
    console.error('✗ خطا در seed شهرها:', error);
    throw error;
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

