# حل مشکل Peer Dependencies

## مشکل
پکیج‌های NestJS نسخه 11 نصب شده اما برخی از پکیج‌های وابسته هنوز peer dependency را برای نسخه 11 ندارند:

- `@nestjs/config` نیاز به `@nestjs/common@^8.0.0 || ^9.0.0 || ^10.0.0` دارد
- `@nestjs/jwt` نیاز به `@nestjs/common@^8.0.0 || ^9.0.0 || ^10.0.0` دارد
- `@nestjs/passport` نیاز به `@nestjs/common@^8.0.0 || ^9.0.0 || ^10.0.0` دارد
- `@nestjs/typeorm` نیاز به `@nestjs/common@^8.0.0 || ^9.0.0 || ^10.0.0` دارد

اما شما `@nestjs/common@^11.0.1` نصب کرده‌اید.

## راه‌حل‌ها

### راه‌حل 1: استفاده از legacy-peer-deps (توصیه می‌شود)

فایل `.npmrc` یا `.pnpmrc` ایجاد شده است با محتوای:
```
legacy-peer-deps=true
```

این فایل باعث می‌شود که npm/pnpm از peer dependency checks صرف نظر کند.

### راه‌حل 2: نصب مجدد با flag

```bash
# با npm
npm install --legacy-peer-deps

# با pnpm
pnpm install --legacy-peer-deps
```

### راه‌حل 3: نادیده گرفتن warning (اگر همه چیز کار می‌کند)

این warning ها معمولاً مشکل بزرگی ایجاد نمی‌کنند و فقط هشدار هستند. اگر همه چیز به درستی کار می‌کند، می‌توانید آنها را نادیده بگیرید.

## وضعیت فعلی

✅ فایل `.npmrc` ایجاد شده
✅ فایل `.pnpmrc` ایجاد شده
✅ `@nestjs/config` به نسخه `^3.3.0` به‌روزرسانی شده

## تست

بعد از نصب مجدد، باید warning ها کمتر شوند یا از بین بروند.

```bash
cd /root/kisty/backend/src/api/project-name
pnpm install
```

## نکته

این warning ها معمولاً مشکل بزرگی ایجاد نمی‌کنند چون:
1. NestJS 11 با پکیج‌های نسخه 10 سازگار است
2. فقط peer dependency declaration به‌روز نشده است
3. در عمل همه چیز به درستی کار می‌کند

