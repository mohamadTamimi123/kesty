"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../components/Button";
import apiClient from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../utils/logger";
import { getErrorMessage } from "../../utils/errorHandler";
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface AdminStats {
  totalUsers: number;
  totalSuppliers: number;
  totalCustomers: number;
  activeProjects: number;
  totalProjects: number;
  newMessages: number;
  totalConversations: number;
  recentUsers: Array<{
    id: string;
    fullName: string;
    phone: string;
    role: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "suppliers" | "content" | "projects" | "portfolios" | "settings">("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAdminStats();
      setStats(data);
    } catch (error: unknown) {
      logger.error("Error fetching admin stats", error);
      toast.error("خطا در دریافت آمار");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, fetchStats]);

  const handleUsersTabClick = () => {
    router.push("/dashboard/admin/users");
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fa-IR").format(num);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

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
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray animate-pulse"
              >
                <div className="w-8 h-8 bg-gray-200 rounded mb-2" />
                <div className="h-8 bg-gray-200 rounded w-20 mb-1" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray hover:shadow-lg transition-shadow">
              <UserGroupIcon className="w-8 h-8 text-brand-medium-blue mb-2" />
              <div className="text-2xl font-bold text-brand-dark-blue mb-1">
                {formatNumber(stats.totalUsers)}
              </div>
              <div className="text-xs text-brand-medium-blue">کل کاربران</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray hover:shadow-lg transition-shadow">
              <BuildingOfficeIcon className="w-8 h-8 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-brand-dark-blue mb-1">
                {formatNumber(stats.totalSuppliers)}
              </div>
              <div className="text-xs text-brand-medium-blue">تولیدکنندگان</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray hover:shadow-lg transition-shadow">
              <DocumentTextIcon className="w-8 h-8 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-brand-dark-blue mb-1">
                {formatNumber(stats.activeProjects)}
              </div>
              <div className="text-xs text-brand-medium-blue">پروژه‌های فعال</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray hover:shadow-lg transition-shadow">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-brand-dark-blue mb-1">
                {formatNumber(stats.newMessages)}
              </div>
              <div className="text-xs text-brand-medium-blue">پیام‌های جدید (24h)</div>
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-brand-medium-gray overflow-x-auto">
          {[
            { id: "overview", label: "نمای کلی" },
            { id: "users", label: "کاربران" },
            { id: "suppliers", label: "تولیدکنندگان" },
            { id: "content", label: "محتوا" },
            { id: "projects", label: "پروژه‌ها" },
            { id: "portfolios", label: "نمونه کارها" },
            { id: "settings", label: "تنظیمات" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "users") {
                  handleUsersTabClick();
                } else if (tab.id === "suppliers") {
                  router.push("/dashboard/admin/suppliers");
                } else if (tab.id === "projects") {
                  router.push("/dashboard/admin/projects");
                } else if (tab.id === "content") {
                  router.push("/dashboard/admin/articles");
                } else if (tab.id === "portfolios") {
                  router.push("/dashboard/admin/portfolios");
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
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-brand-medium-gray last:border-0 animate-pulse"
                    >
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats && stats.recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2 border-b border-brand-medium-gray last:border-0 animate-fade-in"
                    >
                      <div>
                        <p className="text-sm font-medium text-brand-dark-blue">
                          کاربر جدید ثبت نام کرد: {user.fullName}
                        </p>
                        <p className="text-xs text-brand-medium-blue">
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                      <Link href={`/dashboard/admin/users/edit/${user.id}`}>
                        <Button variant="neutral" size="sm">
                          مشاهده
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-brand-medium-blue">
                  <ClockIcon className="w-12 h-12 mx-auto mb-2 text-brand-medium-gray" />
                  <p>فعلاً فعالیتی ثبت نشده است</p>
                </div>
              )}
            </div>
            
            {/* Additional Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
                  <h3 className="text-sm font-medium text-brand-medium-blue mb-2">
                    مشتریان
                  </h3>
                  <p className="text-3xl font-bold text-brand-dark-blue">
                    {formatNumber(stats.totalCustomers)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
                  <h3 className="text-sm font-medium text-brand-medium-blue mb-2">
                    کل پروژه‌ها
                  </h3>
                  <p className="text-3xl font-bold text-brand-dark-blue">
                    {formatNumber(stats.totalProjects)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
                  <h3 className="text-sm font-medium text-brand-medium-blue mb-2">
                    مکالمات
                  </h3>
                  <p className="text-3xl font-bold text-brand-dark-blue">
                    {formatNumber(stats.totalConversations)}
                  </p>
                </div>
              </div>
            )}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-brand-dark-blue">
                مدیریت تولیدکنندگان
              </h2>
              <Link href="/dashboard/admin/suppliers">
                <Button variant="primary" size="sm">
                  مشاهده صفحه کامل مدیریت تولیدکنندگان
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-brand-medium-blue text-sm mb-4">
                برای مشاهده و مدیریت کامل تولیدکنندگان، روی دکمه بالا کلیک کنید.
              </p>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-brand-light-gray rounded-lg p-4">
                    <div className="text-xl font-bold text-brand-dark-blue mb-1">
                      {formatNumber(stats.totalSuppliers)}
                    </div>
                    <div className="text-xs text-brand-medium-blue">کل تولیدکنندگان</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-xl font-bold text-green-600 mb-1">
                      {formatNumber(stats.totalSuppliers)}
                    </div>
                    <div className="text-xs text-brand-medium-blue">فعال</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-brand-dark-blue">
                  مقالات آموزشی
                </h2>
                <Link href="/dashboard/admin/articles">
                  <Button variant="primary" size="sm">
                    مشاهده صفحه کامل مدیریت مقالات
                  </Button>
                </Link>
              </div>
              <p className="text-brand-medium-blue text-sm mb-4">
                برای مشاهده و مدیریت کامل مقالات آموزشی، روی دکمه بالا کلیک کنید.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <h2 className="text-lg font-bold text-brand-dark-blue mb-4">
                سوالات متداول (FAQ)
              </h2>
              <p className="text-brand-medium-blue text-sm mb-4">
                مدیریت FAQ به زودی اضافه خواهد شد.
              </p>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-brand-dark-blue">
                مدیریت پروژه‌ها
              </h2>
              <Link href="/dashboard/admin/projects">
                <Button variant="primary" size="sm">
                  مشاهده صفحه کامل مدیریت پروژه‌ها
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-brand-medium-blue text-sm mb-4">
                برای مشاهده و مدیریت کامل پروژه‌ها، روی دکمه بالا کلیک کنید.
              </p>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-brand-light-gray rounded-lg p-4">
                    <div className="text-xl font-bold text-brand-dark-blue mb-1">
                      {formatNumber(stats.totalProjects)}
                    </div>
                    <div className="text-xs text-brand-medium-blue">کل پروژه‌ها</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-xl font-bold text-blue-600 mb-1">
                      {formatNumber(stats.activeProjects)}
                    </div>
                    <div className="text-xs text-brand-medium-blue">پروژه‌های فعال</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "portfolios" && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-brand-dark-blue">
                مدیریت نمونه کارها
              </h2>
              <Link href="/dashboard/admin/portfolios">
                <Button variant="primary" size="sm">
                  مشاهده صفحه کامل مدیریت نمونه کارها
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-brand-medium-blue text-sm mb-4">
                برای مشاهده و مدیریت کامل نمونه کارهای تکمیل شده، روی دکمه بالا کلیک کنید.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>توجه:</strong> فقط نمونه کارهای تکمیل شده (دارای تمام فیلدهای الزامی) در این بخش نمایش داده می‌شوند.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-brand-dark-blue">
                  مدیریت دسته‌بندی‌ها
                </h2>
                <Link href="/dashboard/admin/categories">
                  <Button variant="primary" size="sm">
                    مشاهده صفحه کامل
                  </Button>
                </Link>
              </div>
              <p className="text-brand-medium-blue text-sm mb-4">
                برای مشاهده و مدیریت کامل دسته‌بندی‌ها، روی دکمه بالا کلیک کنید.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-brand-dark-blue">
                  مدیریت شهرها
                </h2>
                <Link href="/dashboard/admin/cities">
                  <Button variant="primary" size="sm">
                    مشاهده صفحه کامل
                  </Button>
                </Link>
              </div>
              <p className="text-brand-medium-blue text-sm mb-4">
                برای مشاهده و مدیریت کامل شهرها، روی دکمه بالا کلیک کنید.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-brand-dark-blue">
                  مدیریت مکالمات
                </h2>
                <Link href="/dashboard/admin/conversations">
                  <Button variant="primary" size="sm">
                    مشاهده صفحه کامل
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-brand-dark-blue">
                  مدیریت نظرات
                </h2>
                <Link href="/dashboard/admin/reviews">
                  <Button variant="primary" size="sm">
                    مشاهده صفحه کامل
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

