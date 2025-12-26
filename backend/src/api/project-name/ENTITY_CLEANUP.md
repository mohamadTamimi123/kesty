# پاکسازی Entity ها - حذف OtpCode از TypeORM

## مشکل
`OtpCode` entity هنوز در TypeORM load می‌شد در حالی که ما از Redis استفاده می‌کنیم.

## تغییرات انجام شده

### 1. حذف OtpCode از UsersModule
**فایل:** `src/users/users.module.ts`
- ✅ حذف `import { OtpCode }`
- ✅ حذف `OtpCode` از `TypeOrmModule.forFeature([User, OtpCode])`
- ✅ فقط `User` entity باقی مانده است

### 2. به‌روزرسانی Database Config
**فایل:** `src/config/database.config.ts`
- ✅ تغییر از pattern matching به explicit entities
- ✅ فقط `User` entity در TypeORM load می‌شود
- ✅ `OtpCode` دیگر در TypeORM load نمی‌شود

**قبل:**
```typescript
entities: [__dirname + '/../**/*.entity{.ts,.js}'],
```

**بعد:**
```typescript
entities: [User],
```

## وضعیت فایل‌ها

### فایل‌های استفاده شده:
- ✅ `src/common/services/otp-redis.service.ts` - استفاده از Redis
- ✅ `src/auth/auth.module.ts` - استفاده از `OtpRedisService`

### فایل‌های قدیمی (استفاده نمی‌شوند):
- ⚠️ `src/common/services/otp.service.ts` - service قدیمی با TypeORM
- ⚠️ `src/users/entities/otp-code.entity.ts` - entity قدیمی

**نکته:** این فایل‌ها نگه داشته شده‌اند برای backward compatibility اما استفاده نمی‌شوند.

## نتیجه

✅ `OtpCode` دیگر در TypeORM load نمی‌شود
✅ فقط `User` entity در TypeORM استفاده می‌شود
✅ OTP ها در Redis ذخیره می‌شوند
✅ مشکل entity حل شد

## تست

بعد از این تغییرات، باید:
1. TypeORM فقط `User` entity را load کند
2. هیچ خطایی در مورد `OtpCode` entity نداشته باشید
3. OTP ها در Redis ذخیره شوند

