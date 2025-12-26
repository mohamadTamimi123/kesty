"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../components/Button";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "suppliers" | "content" | "projects" | "settings">("overview");

  const handleUsersTabClick = () => {
    router.push("/dashboard/admin/users");
  };

  const stats = [
    { label: "کل کاربران", value: "1,234", icon: "👥" },
    { label: "تولیدکنندگان", value: "456", icon: "🏭" },
    { label: "پروژه‌های فعال", value: "789", icon: "📋" },
    { label: "پیام‌های جدید", value: "23", icon: "💬" },
  ];

  return (
    <div>
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
            پنل مدیریت
          </h1>
          <p className="text-brand-medium-blue">
            مدیریت کامل پلتفرم Keesti
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-brand-dark-blue mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-brand-medium-blue">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-brand-medium-gray overflow-x-auto">
          {[
            { id: "overview", label: "نمای کلی" },
            { id: "users", label: "کاربران" },
            { id: "suppliers", label: "تولیدکنندگان" },
            { id: "content", label: "محتوا" },
            { id: "projects", label: "پروژه‌ها" },
            { id: "settings", label: "تنظیمات" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "users") {
                  handleUsersTabClick();
                } else {
                  setActiveTab(tab.id as any);
                }
              }}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-brand-dark-blue border-b-2 border-brand-medium-blue"
                  : "text-brand-medium-blue hover:text-brand-dark-blue"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <h2 className="text-lg font-bold text-brand-dark-blue mb-4">
                فعالیت‌های اخیر
              </h2>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center justify-between py-2 border-b border-brand-medium-gray last:border-0">
                    <div>
                      <p className="text-sm font-medium text-brand-dark-blue">
                        کاربر جدید ثبت نام کرد
                      </p>
                      <p className="text-xs text-brand-medium-blue">2 دقیقه پیش</p>
                    </div>
                    <Button variant="neutral" size="sm">
                      مشاهده
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-brand-dark-blue">
                مدیریت کاربران
              </h2>
              <Button variant="primary" size="sm" onClick={handleUsersTabClick}>
                مشاهده صفحه کامل مدیریت کاربران
              </Button>
            </div>
            <div className="space-y-3">
              <p className="text-brand-medium-blue text-sm mb-4">
                برای مشاهده و مدیریت کامل کاربران، روی دکمه بالا کلیک کنید.
              </p>
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-4 border border-brand-medium-gray rounded-lg"
                >
                  <div>
                    <p className="font-medium text-brand-dark-blue">کاربر {item}</p>
                    <p className="text-sm text-brand-medium-blue">0912345678{item}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      مسدود
                    </Button>
                    <Button variant="neutral" size="sm">
                      تغییر نقش
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "suppliers" && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <h2 className="text-lg font-bold text-brand-dark-blue mb-4">
              مدیریت تولیدکنندگان
            </h2>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-4 border border-brand-medium-gray rounded-lg"
                >
                  <div>
                    <p className="font-medium text-brand-dark-blue">کارگاه {item}</p>
                    <p className="text-sm text-brand-medium-blue">در انتظار تایید</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm">
                      تایید
                    </Button>
                    <Button variant="secondary" size="sm">
                      رد
                    </Button>
                    <Button variant="neutral" size="sm">
                      ویژه
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <h2 className="text-lg font-bold text-brand-dark-blue mb-4">
                مقالات آموزشی
              </h2>
              <Button variant="primary" className="w-full mb-4">
                نوشتن مقاله جدید
              </Button>
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="p-3 border border-brand-medium-gray rounded-lg flex justify-between items-center">
                    <span className="text-brand-dark-blue">مقاله {item}</span>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">ویرایش</Button>
                      <Button variant="neutral" size="sm">حذف</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <h2 className="text-lg font-bold text-brand-dark-blue mb-4">
                سوالات متداول (FAQ)
              </h2>
              <Button variant="primary" className="w-full mb-4">
                افزودن سوال جدید
              </Button>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <h2 className="text-lg font-bold text-brand-dark-blue mb-4">
              تمام پروژه‌ها
            </h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="p-4 border border-brand-medium-gray rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-brand-dark-blue">پروژه {item}</h3>
                    <Button variant="neutral" size="sm">حذف</Button>
                  </div>
                  <p className="text-sm text-brand-medium-blue mb-2">
                    توضیحات پروژه...
                  </p>
                  <p className="text-xs text-brand-medium-blue">
                    توسط: کاربر {item} • 2 روز پیش
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <h2 className="text-lg font-bold text-brand-dark-blue mb-4">
                مدیریت دسته‌بندی‌ها
              </h2>
              <Button variant="primary" className="w-full mb-4">
                افزودن دسته‌بندی جدید
              </Button>
              <div className="space-y-2">
                {["فلزکاری", "چوب‌کاری", "ساخت و ساز"].map((cat) => (
                  <div key={cat} className="flex justify-between items-center p-3 border border-brand-medium-gray rounded-lg">
                    <span className="text-brand-dark-blue">{cat}</span>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">ویرایش</Button>
                      <Button variant="neutral" size="sm">حذف</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <h2 className="text-lg font-bold text-brand-dark-blue mb-4">
                مدیریت شهرها
              </h2>
              <Link href="/dashboard/admin/cities" className="block w-full mb-4">
                <Button variant="primary" className="w-full">
                  مشاهده و مدیریت شهرها
                </Button>
              </Link>
            </div>
          </div>
        )}
    </div>
  );
}

