-- Seed script for Categories
-- This script inserts 5 main categories into the categories table

-- ماشین‌کاری
INSERT INTO categories (id, title, slug, description, icon_url, is_active, meta_title, meta_description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ماشین‌کاری',
  'machining',
  'خدمات ماشین‌کاری شامل تراش، فرز، بورینگ و سایر عملیات ماشین‌کاری با دقت بالا',
  NULL,
  true,
  'ماشین‌کاری | خدمات ماشین‌کاری با دقت بالا',
  'خدمات ماشین‌کاری شامل تراش، فرز، بورینگ و سایر عملیات ماشین‌کاری با دقت بالا',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- ورق‌کاری
INSERT INTO categories (id, title, slug, description, icon_url, is_active, meta_title, meta_description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ورق‌کاری',
  'sheet-metal',
  'خدمات ورق‌کاری شامل برش، خم، پرس و جوشکاری ورق‌های فلزی',
  NULL,
  true,
  'ورق‌کاری | خدمات برش و خم ورق فلزی',
  'خدمات ورق‌کاری شامل برش، خم، پرس و جوشکاری ورق‌های فلزی',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- چاپ 3 بعدی
INSERT INTO categories (id, title, slug, description, icon_url, is_active, meta_title, meta_description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'چاپ 3 بعدی',
  '3d-printing',
  'خدمات چاپ سه بعدی با استفاده از تکنولوژی‌های مختلف از جمله FDM، SLA و SLS',
  NULL,
  true,
  'چاپ 3 بعدی | خدمات پرینت سه بعدی',
  'خدمات چاپ سه بعدی با استفاده از تکنولوژی‌های مختلف از جمله FDM، SLA و SLS',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- قالب‌سازی
INSERT INTO categories (id, title, slug, description, icon_url, is_active, meta_title, meta_description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'قالب‌سازی',
  'molding',
  'ساخت قالب‌های تزریق پلاستیک، قالب‌های فلزی و سایر انواع قالب‌سازی',
  NULL,
  true,
  'قالب‌سازی | ساخت قالب تزریق پلاستیک و فلزی',
  'ساخت قالب‌های تزریق پلاستیک، قالب‌های فلزی و سایر انواع قالب‌سازی',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- پرداخت سطح
INSERT INTO categories (id, title, slug, description, icon_url, is_active, meta_title, meta_description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'پرداخت سطح',
  'surface-finishing',
  'خدمات پرداخت سطح شامل پولیش، رنگ‌کاری، آبکاری و سایر روش‌های پرداخت',
  NULL,
  true,
  'پرداخت سطح | خدمات پولیش و رنگ‌کاری',
  'خدمات پرداخت سطح شامل پولیش، رنگ‌کاری، آبکاری و سایر روش‌های پرداخت',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

