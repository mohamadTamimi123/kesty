"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon, HomeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Button from "./components/Button";
import MobileLayout from "./components/MobileLayout";

export default function NotFound() {
  const router = useRouter();

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Number */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-9xl font-bold text-brand-dark-blue font-display mb-4">
              404
            </h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500" />
              <h2 className="text-3xl font-bold text-brand-dark-blue font-display">
                صفحه یافت نشد
              </h2>
            </div>
          </div>

          {/* Message */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8 border border-brand-medium-gray animate-fade-in">
            <p className="text-lg text-brand-medium-blue mb-4">
              متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا حذف شده است.
            </p>
            <p className="text-sm text-brand-medium-blue">
              ممکن است آدرس را اشتباه وارد کرده باشید یا صفحه به آدرس دیگری منتقل شده باشد.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button
              variant="primary"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowRightIcon className="w-5 h-5" />
              بازگشت به صفحه قبل
            </Button>
            <Link href="/">
              <Button
                variant="secondary"
                className="flex items-center gap-2"
              >
                <HomeIcon className="w-5 h-5" />
                بازگشت به صفحه اصلی
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-brand-medium-gray">
            <p className="text-sm text-brand-medium-blue mb-4">
              صفحات مفید:
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/public/projects"
                className="text-sm text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
              >
                پروژه‌ها
              </Link>
              <Link
                href="/suppliers"
                className="text-sm text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
              >
                تولیدکنندگان
              </Link>
              <Link
                href="/about"
                className="text-sm text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
              >
                درباره ما
              </Link>
              <Link
                href="/contact"
                className="text-sm text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
              >
                تماس با ما
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

