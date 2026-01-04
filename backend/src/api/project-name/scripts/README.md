# Scripts برای پاکسازی دیتابیس

## cleanup-conversations.ts

این script برای پاکسازی conversation های نامعتبر و داده‌های جانک از دیتابیس استفاده می‌شود.

### مواردی که پیدا و پاک می‌شوند:

1. **Conversation های با relations نامعتبر**: conversation هایی که customer یا supplier ندارند
2. **Conversation های خالی و قدیمی**: conversation هایی که هیچ پیامی ندارند و بیشتر از 30 روز از ایجاد آن‌ها گذشته است
3. **Conversation های duplicate**: conversation هایی که برای همان customer-supplier pair وجود دارند (قدیمی‌ترین‌ها پاک می‌شوند)

### نحوه استفاده:

```bash
# مشاهده conversation هایی که پاک می‌شوند (بدون پاک کردن)
cd backend/src/api/project-name
pnpm run cleanup:conversations -- --dry-run

# پاک کردن واقعی conversation ها
pnpm run cleanup:conversations -- --confirm
```

### خروجی:

Script اطلاعات زیر را نمایش می‌دهد:
- تعداد کل conversation ها در دیتابیس
- تعداد conversation های با relations نامعتبر
- تعداد conversation های خالی و قدیمی
- تعداد conversation های duplicate
- خلاصه نهایی و تعداد conversation هایی که پاک می‌شوند

### نکات مهم:

- همیشه ابتدا با `--dry-run` اجرا کنید تا ببینید چه چیزی پاک می‌شود
- قبل از استفاده از `--confirm`، از دیتابیس backup بگیرید
- این script به صورت خودکار message های مربوط به conversation های پاک شده را هم پاک می‌کند (به دلیل CASCADE)

