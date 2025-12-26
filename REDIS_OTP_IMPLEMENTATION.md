# پیاده‌سازی OTP با Redis - گزارش کامل

## ✅ تغییرات انجام شده

### 1. نصب و پیکربندی Redis

#### Package.json
- ✅ اضافه شدن `ioredis: ^5.3.2` به dependencies

#### Redis Config (`src/config/redis.config.ts`)
- ✅ ایجاد فایل پیکربندی Redis
- ✅ پشتیبانی از environment variables:
  - `REDIS_HOST` (default: localhost)
  - `REDIS_PORT` (default: 6379)
  - `REDIS_PASSWORD` (optional)
  - `REDIS_DB` (default: 0)
- ✅ Retry strategy و error handling

#### Redis Module (`src/common/modules/redis.module.ts`)
- ✅ ایجاد Global Module برای Redis
- ✅ Export کردن Redis client به عنوان provider

### 2. بازنویسی OTP Service

#### OtpRedisService (`src/common/services/otp-redis.service.ts`)
- ✅ استفاده از Redis به جای TypeORM
- ✅ Key structure:
  - `otp:{phone}` - ذخیره OTP code
  - `otp:rate_limit:{phone}` - Rate limiting
- ✅ Features:
  - Generate 6-digit OTP
  - Store با TTL (2 دقیقه)
  - Rate limiting (1 دقیقه بین درخواست‌ها)
  - Verify OTP (one-time use)
  - Get OTP برای نمایش در UI (فقط در mock mode)
  - Get TTL برای نمایش زمان باقیمانده

### 3. به‌روزرسانی Modules

#### App Module
- ✅ اضافه شدن `RedisModule` به imports

#### Auth Module
- ✅ جایگزینی `OtpService` با `OtpRedisService`
- ✅ حذف `TypeOrmModule.forFeature([OtpCode])`
- ✅ Export کردن `OtpRedisService`

#### Auth Service
- ✅ به‌روزرسانی import از `OtpService` به `OtpRedisService`

### 4. API Endpoints

#### GET `/api/auth/otp?phone={phone}`
- ✅ دریافت OTP code برای نمایش در UI
- ✅ فقط در mock mode کار می‌کند
- ✅ Response:
  ```json
  {
    "code": "123456",
    "expiresIn": 120,
    "exists": true
  }
  ```

### 5. Frontend Changes

#### API Client (`app/lib/api.ts`)
- ✅ اضافه شدن method `getOtp(phone: string)`

#### OTP Page (`app/otp/page.tsx`)
- ✅ اضافه شدن state برای `otpCode` و `otpExpiresIn`
- ✅ useEffect برای fetch کردن OTP از API
- ✅ Polling هر 2 ثانیه برای به‌روزرسانی
- ✅ UI بهبود یافته برای نمایش OTP:
  - Box با gradient background
  - نمایش کد با font بزرگ
  - نمایش زمان باقیمانده

#### Auth Context
- ✅ به‌روزرسانی interface برای پشتیبانی از token parameter

## 📊 ساختار Redis Keys

```
otp:{phone}                    # OTP code (TTL: 120 seconds)
otp:rate_limit:{phone}        # Rate limit timestamp (TTL: 60 seconds)
```

## 🔧 Best Practices پیاده‌سازی شده

1. **TTL (Time To Live)**: OTP ها به صورت خودکار expire می‌شوند
2. **One-time Use**: بعد از verify، OTP حذف می‌شود
3. **Rate Limiting**: جلوگیری از spam با محدودیت زمانی
4. **Security**: در production mode، OTP در API response نمایش داده نمی‌شود
5. **Performance**: استفاده از Redis برای دسترسی سریع
6. **Scalability**: Redis می‌تواند در cluster mode اجرا شود

## 🚀 نحوه استفاده

### 1. نصب Dependencies
```bash
cd /root/kisty/backend/src/api/project-name
npm install
# یا
pnpm install
```

### 2. راه‌اندازی Redis
```bash
# با Docker Compose
docker-compose -f docker-compose.dev.yml up -d redis

# یا مستقیماً
redis-server
```

### 3. Environment Variables
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password  # اگر نیاز باشد
REDIS_DB=0
OTP_MOCK_MODE=true  # برای نمایش OTP در UI
```

### 4. تست
1. لاگین کنید
2. به صفحه OTP بروید
3. کد OTP در یک box زیبا نمایش داده می‌شود
4. می‌توانید کد را کپی کنید و وارد کنید

## 📝 نکات مهم

- ✅ OTP ها در Redis با TTL ذخیره می‌شوند
- ✅ Rate limiting برای جلوگیری از abuse
- ✅ در mock mode، OTP در UI نمایش داده می‌شود
- ✅ در production mode، OTP فقط از طریق SMS ارسال می‌شود
- ✅ بعد از verify، OTP حذف می‌شود (one-time use)

## 🔍 Debugging

برای بررسی OTP در Redis:
```bash
redis-cli
> GET otp:09123456789
> TTL otp:09123456789
```

## 📈 Performance

- **Read**: O(1) - بسیار سریع
- **Write**: O(1) - بسیار سریع
- **Memory**: هر OTP حدود 10 bytes
- **Scalability**: می‌تواند میلیون‌ها OTP را handle کند

