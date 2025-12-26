# گزارش وضعیت ماژول‌های پروژه کیستی

این گزارش وضعیت پیاده‌سازی ماژول‌ها را بر اساس داکیومنت اصلی و کدهای موجود نشان می‌دهد.

## جدول خلاصه وضعیت

| ماژول | Backend | Frontend | وضعیت کلی | اولویت |
|-------|---------|----------|-----------|--------|
| احراز هویت | ✅ | ✅ | کامل | - |
| کاربران | ✅ | ✅ | کامل | - |
| شهرها | ✅ | ✅ | کامل | - |
| دسته‌بندی‌ها | ✅ | ✅ | کامل | - |
| پروژه‌ها | ✅ | ✅ | کامل | - |
| نمونه کارها | ✅ | ✅ | کامل | - |
| نظرات و امتیازها | ✅ | ✅ | کامل | - |
| ماشین‌آلات | ✅ | ✅ | کامل | - |
| مواد | ✅ | ✅ | کامل | - |
| مقالات آموزشی | ✅ | ✅ | کامل | - |
| بازارگاه ماشین‌آلات | ✅ | ✅ | کامل | - |
| Changelog | ✅ | ✅ | کامل | - |
| **پیام‌رسان** | ✅ | ✅ | **کامل** | - |
| **پروفایل تولیدکننده** | ✅ | ✅ | **کامل** | - |
| **توزیع درخواست** | ✅ | - | **کامل** | - |
| **سابسکریپشن** | ✅ | ⚠️ | **ناقص** | - |
| **پرداخت (زرین‌پال)** | ✅ | ⚠️ | **ناقص** | - |
| **تیکتینگ** | ✅ | ⚠️ | **ناقص** | - |
| **چت Real-Time** | ⚠️ | ⚠️ | **ناقص** | - |

**توضیحات**:
- ✅ = کامل
- ⚠️ = ناقص (نیاز به تکمیل)
- ❌ = پیاده‌سازی نشده

## ماژول‌های پیاده‌سازی شده ✅

### Backend

#### 1. احراز هویت و کاربران ✅
- **Entity**: `users`, `otp_code`
- **ماژول**: `auth`, `users`
- **وضعیت**: کامل
- **ویژگی‌ها**:
  - ثبت نام با شماره تلفن
  - ورود با OTP
  - نقش‌های کاربری (CUSTOMER, SUPPLIER, ADMIN)
  - مدیریت کاربران در پنل ادمین
  - Remember Me (در User entity وجود دارد اما نیاز به بررسی دارد)

#### 2. دسته‌بندی‌ها (Categories) ✅
- **Entity**: `categories`
- **ماژول**: `categories`
- **وضعیت**: پیاده‌سازی شده اما ناقص
- **مشکلات**:
  - ❌ فیلد `parent_id` وجود ندارد (برای ساختار سلسله‌مراتبی)
  - ❌ فیلد `level` وجود ندارد
  - ❌ روابط many-to-many با suppliers وجود ندارد (`category_supplier`)

#### 3. شهرها (Cities) ✅
- **Entity**: `cities`
- **ماژول**: `cities`
- **وضعیت**: کامل
- **ویژگی‌ها**:
  - مدیریت شهرها
  - صفحات لندینگ شهرها در frontend
  - ❌ روابط many-to-many با suppliers وجود ندارد (`city_supplier`)

#### 4. پروژه‌ها (Projects) ✅
- **Entity**: `projects`, `project_files`
- **ماژول**: `projects`
- **وضعیت**: پیاده‌سازی شده اما ناقص
- **مشکلات**:
  - ❌ فیلد `sub_category_id` وجود ندارد
  - ❌ فیلد `machine_id` وجود ندارد
  - ❌ فیلد `completion_date` وجود ندارد (در داکیومنت خواسته شده)
  - ❌ فیلد `client_name` وجود ندارد
  - ❌ فیلد `quantity_estimate` به جای enum از QuantityRange استفاده شده (نیاز به بررسی)

#### 5. نمونه کارها (Portfolio) ✅
- **Entity**: `portfolios`, `portfolio_images`
- **ماژول**: `portfolio`
- **وضعیت**: کامل
- **ویژگی‌ها**:
  - ثبت نمونه کار توسط تولیدکننده
  - آپلود عکس‌ها
  - ارتباط با ماشین‌آلات و مواد

#### 6. نظرات و امتیازها (Reviews & Rating) ✅
- **Entity**: `reviews`, `review_requests`, `supplier_ratings`
- **ماژول**: `reviews`, `rating`
- **وضعیت**: کامل
- **ویژگی‌ها**:
  - ثبت نظر روی پروژه یا پروفایل
  - درخواست نظر از مشتری
  - محاسبه امتیاز کلی تولیدکننده

#### 7. ماشین‌آلات (Machines) ✅
- **Entity**: `machines`
- **ماژول**: `machines`
- **وضعیت**: پیاده‌سازی شده اما ناقص
- **مشکلات**:
  - ❌ جدول `machine_main_category` وجود ندارد
  - ❌ روابط many-to-many با suppliers وجود ندارد (`machine_supplier`)

#### 8. مواد (Materials) ✅
- **Entity**: `materials`
- **ماژول**: `materials`
- **وضعیت**: کامل
- **نکته**: این ماژول در داکیومنت اصلی ذکر نشده اما پیاده‌سازی شده است

#### 9. مقالات آموزشی (Educational Articles) ✅
- **Entity**: `educational_articles`
- **ماژول**: `educational-articles`
- **وضعیت**: کامل
- **ویژگی‌ها**:
  - مدیریت مقالات در پنل ادمین
  - نمایش مقالات در frontend
  - SEO fields

#### 10. بازارگاه ماشین‌آلات (Machine Listings) ✅
- **Entity**: `machine_listings`
- **ماژول**: `machine-listings`
- **وضعیت**: کامل
- **ویژگی‌ها**:
  - ثبت آگهی فروش/اجاره ماشین
  - فیلترهای پیشرفته
  - مدیریت آگهی‌ها

#### 11. Changelog ✅
- **Entity**: `changelog_tasks`
- **ماژول**: `changelog`
- **وضعیت**: کامل (به تازگی گسترش یافته)

### Frontend

#### صفحات عمومی ✅
- ✅ صفحه اصلی (`/`)
- ✅ درباره ما (`/about`)
- ✅ سوالات متداول (`/faq`)
- ✅ تماس با ما (`/contact`)
- ✅ برندبوک (`/brandbook`)
- ✅ تغییرات (`/changelog`)

#### احراز هویت ✅
- ✅ ثبت نام (`/register`)
- ✅ ورود (`/login`)
- ✅ تأیید OTP (`/otp`)

#### پنل کاربری ✅
- ✅ پنل مشتری (`/dashboard/customer`)
- ✅ پنل تولیدکننده (`/dashboard/supplier`)
- ✅ پنل ادمین (`/dashboard/admin`)

#### صفحات جستجو ✅
- ✅ صفحه دسته‌بندی (`/category/:slug`)
- ✅ صفحه شهر (`/city/:slug`)
- ✅ صفحه شهر + دسته‌بندی (`/city/:slug/category/:categorySlug`)

#### ماژول‌های خاص ✅
- ✅ دانشنامه (`/education`)
- ✅ مقاله (`/education/:slug`)
- ✅ بازارگاه ماشین‌آلات (`/machinery-market`)
- ✅ جزئیات آگهی (`/machinery-market/:slug`)

---

## ماژول‌های ناقص یا مانده ❌

### 1. سیستم پیام‌رسان داخلی ❌
**وضعیت**: پیاده‌سازی نشده
- ❌ Entity برای پیام‌ها وجود ندارد
- ❌ ماژول `messages` وجود ندارد
- ❌ Controller و Service برای پیام‌رسان وجود ندارد
- ❌ Frontend برای پیام‌رسان وجود ندارد

**نیاز به پیاده‌سازی**:
- Entity: `messages`, `conversations`
- ماژول Backend: `messages`
- صفحات Frontend: لیست پیام‌ها، گفتگو

### 2. پروفایل تولیدکننده (Supplier Profile) ❌
**وضعیت**: ناقص
- ✅ فیلدهای پایه در User entity وجود دارد (workshop_name, workshop_address, etc.)
- ❌ Entity جداگانه `supplier_profiles` وجود ندارد (طبق داکیومنت باید باشد)
- ❌ روابط many-to-many با categories وجود ندارد
- ❌ روابط many-to-many با cities وجود ندارد
- ❌ روابط many-to-many با machines وجود ندارد
- ❌ فیلدهای اضافی مثل website, instagram, linkedin در User وجود دارد اما نیاز به بررسی دارد

**نیاز به پیاده‌سازی**:
- Entity: `supplier_profiles` (یا گسترش User entity)
- جدول‌های pivot: `category_supplier`, `city_supplier`, `machine_supplier`
- صفحه پروفایل تولیدکننده در frontend (احتمالاً وجود دارد اما نیاز به بررسی)

### 3. ساختار سلسله‌مراتبی Categories ❌
**وضعیت**: ناقص
- ❌ فیلد `parent_id` در Category entity وجود ندارد
- ❌ فیلد `level` وجود ندارد
- ❌ منطق سلسله‌مراتبی پیاده‌سازی نشده

**نیاز به پیاده‌سازی**:
- اضافه کردن `parent_id` و `level` به Category entity
- اضافه کردن relation `parent` و `children` در Category entity
- به‌روزرسانی Service برای مدیریت سلسله‌مراتب

### 4. جدول machine_main_category ❌
**وضعیت**: پیاده‌سازی نشده
- ❌ جدول pivot برای ارتباط machines با categories اصلی وجود ندارد
- ❌ منطق خودکار پر کردن این جدول وجود ندارد

**نیاز به پیاده‌سازی**:
- ایجاد Entity: `machine_main_category`
- اضافه کردن منطق در Machine Service برای پر کردن خودکار

### 5. فیلدهای ناقص در Projects ❌
**وضعیت**: ناقص
- ❌ `sub_category_id` وجود ندارد
- ❌ `machine_id` وجود ندارد
- ❌ `completion_date` وجود ندارد
- ❌ `client_name` وجود ندارد

**نیاز به پیاده‌سازی**:
- اضافه کردن فیلدهای ناقص به Project entity
- به‌روزرسانی DTOs و Service

### 6. سیستم توزیع درخواست پروژه ❌
**وضعیت**: ناقص
- ✅ ثبت درخواست پروژه وجود دارد
- ❌ منطق توزیع خودکار درخواست به تولیدکنندگان مرتبط وجود ندارد
- ❌ Notification Service وجود ندارد
- ⚠️ TODO در projects.service.ts وجود دارد: `// TODO: Implement notifySuppliers logic here`

**نیاز به پیاده‌سازی**:
- ایجاد Notification Service
- منطق توزیع درخواست‌ها بر اساس شهر و تخصص
- ایجاد جدول `notifications` برای ذخیره اعلان‌ها

### 7. صفحه پروفایل تولیدکننده عمومی ❌
**وضعیت**: پیاده‌سازی نشده
- ❌ صفحه عمومی پروفایل تولیدکننده وجود ندارد (`/supplier/:id` یا `/supplier/:slug`)
- ✅ فقط SupplierCard component وجود دارد (برای نمایش در لیست‌ها)
- ✅ API methods برای دریافت اطلاعات supplier وجود دارد (`getSupplierPortfolios`, `getSupplierRating`)

**نیاز به پیاده‌سازی**:
- ایجاد صفحه `/supplier/:id` یا `/supplier/:slug`
- نمایش: عکس کاور، لوگو، نام، شهر، شماره تماس، توضیحات، تخصص‌ها، گالری نمونه کارها، نظرات، لینک‌های اجتماعی
- دکمه "ارسال پیام"

---

## خلاصه وضعیت

### ماژول‌های کامل (11):
1. ✅ احراز هویت و کاربران
2. ✅ شهرها
3. ✅ نمونه کارها (Portfolio)
4. ✅ نظرات و امتیازها
5. ✅ مواد (Materials)
6. ✅ مقالات آموزشی
7. ✅ بازارگاه ماشین‌آلات
8. ✅ Changelog
9. ✅ صفحات عمومی Frontend
10. ✅ پنل‌های کاربری Frontend
11. ✅ صفحات جستجو Frontend

### ماژول‌های ناقص (7):
1. ⚠️ دسته‌بندی‌ها (نیاز به parent_id و level)
2. ⚠️ پروژه‌ها (نیاز به فیلدهای اضافی)
3. ⚠️ ماشین‌آلات (نیاز به machine_main_category)
4. ⚠️ پروفایل تولیدکننده (نیاز به روابط many-to-many)
5. ⚠️ سیستم توزیع درخواست (نیاز به Notification Service)
6. ⚠️ صفحه پروفایل تولیدکننده عمومی (پیاده‌سازی نشده)
7. ⚠️ جدول‌های pivot برای روابط many-to-many

### ماژول‌های پیاده‌سازی نشده (1):
1. ❌ سیستم پیام‌رسان داخلی

---

## اولویت‌بندی برای تکمیل

### اولویت 1 (بحرانی):
1. **سیستم پیام‌رسان داخلی** - برای ارتباط مشتری و تولیدکننده ضروری است
2. **ساختار سلسله‌مراتبی Categories** - پایه سیستم دسته‌بندی است
3. **روابط many-to-many برای Supplier** - برای جستجو و فیلتر ضروری است
4. **صفحه پروفایل تولیدکننده عمومی** - برای نمایش اطلاعات تولیدکننده به کاربران

### اولویت 2 (مهم):
5. **جدول machine_main_category** - برای جستجوی ماشین‌آلات
6. **فیلدهای ناقص Projects** - برای تکمیل اطلاعات پروژه
7. **سیستم توزیع درخواست** - برای اطلاع‌رسانی به تولیدکنندگان

### اولویت 3 (تکمیلی):
8. **بهینه‌سازی‌های دیگر**

---

## نکات مهم

1. **Supplier Profile**: در حال حاضر اطلاعات تولیدکننده در User entity ذخیره می‌شود. طبق داکیومنت باید یک entity جداگانه `supplier_profiles` وجود داشته باشد یا User entity باید گسترش یابد.

2. **روابط Many-to-Many**: جدول‌های pivot برای روابط many-to-many بین suppliers و categories/cities/machines وجود ندارد. این برای فیلتر و جستجو ضروری است.

3. **ساختار Categories**: بدون `parent_id` و `level` نمی‌توان ساختار سلسله‌مراتبی را پیاده‌سازی کرد.

4. **پیام‌رسان**: این ماژول کاملاً پیاده‌سازی نشده و برای MVP ضروری است.

5. **Notification Service**: برای توزیع درخواست‌ها و اطلاع‌رسانی به کاربران نیاز است.

6. **صفحه پروفایل تولیدکننده عمومی**: این صفحه برای نمایش اطلاعات تولیدکننده به کاربران مهمان ضروری است و در حال حاضر وجود ندارد.

---

## جزئیات فنی - فیلدها و جدول‌های ناقص

### 1. Category Entity - فیلدهای ناقص:
```typescript
// نیاز به اضافه کردن:
@Column({ name: 'parent_id', type: 'uuid', nullable: true })
parentId: string | null;

@Column({ type: 'int', default: 1 })
level: number;

@ManyToOne(() => Category, { nullable: true })
@JoinColumn({ name: 'parent_id' })
parent: Category | null;

@OneToMany(() => Category, (category) => category.parent)
children: Category[];
```

### 2. Project Entity - فیلدهای ناقص:
```typescript
// نیاز به اضافه کردن:
@Column({ name: 'sub_category_id', type: 'uuid', nullable: true })
subCategoryId: string | null;

@Column({ name: 'machine_id', type: 'uuid', nullable: true })
machineId: string | null;

@Column({ name: 'completion_date', type: 'date', nullable: true })
completionDate: Date | null;

@Column({ name: 'client_name', type: 'varchar', nullable: true, length: 255 })
clientName: string | null;
```

### 3. جدول‌های pivot مورد نیاز:
```sql
-- category_supplier (many-to-many)
CREATE TABLE category_supplier (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  supplier_id UUID REFERENCES users(id),
  created_at TIMESTAMP
);

-- city_supplier (many-to-many)
CREATE TABLE city_supplier (
  id UUID PRIMARY KEY,
  city_id UUID REFERENCES cities(id),
  supplier_id UUID REFERENCES users(id),
  created_at TIMESTAMP
);

-- machine_supplier (many-to-many)
CREATE TABLE machine_supplier (
  id UUID PRIMARY KEY,
  machine_id UUID REFERENCES machines(id),
  supplier_id UUID REFERENCES users(id),
  created_at TIMESTAMP
);

-- machine_main_category (many-to-many)
CREATE TABLE machine_main_category (
  id UUID PRIMARY KEY,
  machine_id UUID REFERENCES machines(id),
  main_category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP
);
```

### 4. Entityهای مورد نیاز برای پیام‌رسان:
```typescript
// Conversation Entity
@Entity('conversations')
export class Conversation {
  id: string;
  participant1Id: string; // User ID
  participant2Id: string; // User ID
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Message Entity
@Entity('messages')
export class Message {
  id: string;
  conversationId: string;
  senderId: string; // User ID
  content: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}
```

### 5. Notification Entity (برای توزیع درخواست):
```typescript
@Entity('notifications')
export class Notification {
  id: string;
  userId: string; // User ID (supplier)
  type: string; // 'project_request', 'message', etc.
  title: string;
  content: string;
  relatedId: string; // Project ID, Message ID, etc.
  isRead: boolean;
  createdAt: Date;
}
```

---

## صفحات Frontend ناقص یا مانده

### صفحات پیاده‌سازی نشده:
1. ❌ **صفحه پروفایل تولیدکننده عمومی** (`/supplier/:id` یا `/supplier/:slug`)
   - باید شامل: عکس کاور، لوگو، نام، شهر، شماره تماس، توضیحات، تخصص‌ها، گالری نمونه کارها، نظرات، لینک‌های اجتماعی
   - دکمه "ارسال پیام"

2. ❌ **صفحه لیست پیام‌ها** (`/dashboard/messages` یا `/messages`)
   - لیست تمام گفتگوها
   - نمایش آخرین پیام
   - نمایش تعداد پیام‌های خوانده نشده

3. ❌ **صفحه گفتگو** (`/dashboard/messages/:conversationId` یا `/messages/:conversationId`)
   - نمایش تاریخچه پیام‌ها
   - فیلد ارسال پیام
   - نمایش وضعیت خوانده شدن

### صفحات موجود اما نیاز به بررسی:
- ✅ صفحه پروفایل تولیدکننده در dashboard (`/dashboard/supplier/profile`) - نیاز به بررسی کامل بودن
- ✅ صفحه درخواست‌های پروژه (`/dashboard/customer/projects`) - نیاز به بررسی عملکرد کامل
- ✅ صفحه درخواست‌های پروژه تولیدکننده (`/dashboard/supplier`) - نیاز به بررسی فیلتر و نمایش

---

## خلاصه نهایی

### تعداد ماژول‌های کامل: **11**
### تعداد ماژول‌های ناقص: **7**
### تعداد ماژول‌های پیاده‌سازی نشده: **1** (پیام‌رسان)

### درصد پیشرفت کلی: **~75%**

**نکته مهم**: ماژول پیام‌رسان که کاملاً پیاده‌سازی نشده، یکی از ماژول‌های حیاتی برای MVP است و باید در اولویت اول قرار گیرد.

