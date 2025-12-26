"use client";

import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-dark-blue mb-4 font-display">
            درباره کیستی
          </h1>
          <p className="text-lg text-brand-medium-blue">
            شبکه تخصصی تولید و ساخت قطعات سفارشی
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-8 md:p-12 space-y-8">
          {/* Mission */}
          <section>
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-4 font-display">
              ماموریت ما
            </h2>
            <p className="text-brand-medium-blue leading-relaxed">
              پلتفرم کیستی با هدف ایجاد یک شبکه تخصصی برای اتصال مستقیم مهندسین و کارفرمایان
              به بهترین کارگاه‌های ساخت و تولید در سراسر ایران ایجاد شده است. ما معتقدیم که
              با ایجاد این پلتفرم، می‌توانیم فرآیند پیدا کردن و همکاری با کارگاه‌های تولیدی
              را ساده‌تر و کارآمدتر کنیم.
            </p>
          </section>

          {/* Vision */}
          <section>
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-4 font-display">
              چشم‌انداز
            </h2>
            <p className="text-brand-medium-blue leading-relaxed">
              ما می‌خواهیم به بزرگ‌ترین و معتبرترین پلتفرم اتصال کارفرمایان و تولیدکنندگان
              در ایران تبدیل شویم و با ارائه خدمات با کیفیت، اعتماد و رضایت کاربران را جلب کنیم.
            </p>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-4 font-display">
              ارزش‌های ما
            </h2>
            <ul className="space-y-3 text-brand-medium-blue">
              <li className="flex items-start gap-3">
                <span className="text-brand-medium-blue font-bold mt-1">•</span>
                <span>
                  <strong>شفافیت:</strong> ما به شفافیت در تمامی تعاملات بین کارفرمایان و
                  تولیدکنندگان معتقدیم.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-medium-blue font-bold mt-1">•</span>
                <span>
                  <strong>کیفیت:</strong> کیفیت خدمات و محصولات برای ما در اولویت است.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-medium-blue font-bold mt-1">•</span>
                <span>
                  <strong>اعتماد:</strong> ایجاد اعتماد بین تمامی طرفین از اهداف اصلی ماست.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-medium-blue font-bold mt-1">•</span>
                <span>
                  <strong>پشتیبانی:</strong> ما همیشه در کنار کاربران خود هستیم و از آن‌ها
                  پشتیبانی می‌کنیم.
                </span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="bg-brand-light-sky rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-brand-dark-blue mb-4 font-display">
              به ما بپیوندید
            </h3>
            <p className="text-brand-medium-blue mb-6">
              اگر تولیدکننده هستید یا نیاز به ساخت قطعه دارید، همین حالا ثبت نام کنید.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=supplier"
                className="px-6 py-3 bg-brand-medium-blue text-white font-medium rounded-lg hover:bg-brand-dark-blue transition-colors"
              >
                ثبت نام به عنوان تولیدکننده
              </Link>
              <Link
                href="/register?role=customer"
                className="px-6 py-3 bg-white text-brand-medium-blue font-medium rounded-lg border border-brand-medium-blue hover:bg-brand-off-white transition-colors"
              >
                ثبت نام به عنوان مشتری
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

