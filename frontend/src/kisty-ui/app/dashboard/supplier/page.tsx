"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../components/Button";
import { Project, ProjectStatus } from "../../types/project";
import apiClient from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export default function SupplierDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        // Fetch public projects - later will be filtered by supplier's specialties
        const response = await apiClient.getPublicProjects();
        setPublicProjects(Array.isArray(response) ? response.slice(0, 5) : []);
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        toast.error(error.response?.data?.message || "خطا در دریافت پروژه‌ها");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  // Mock stats - will be replaced with real API calls
  const stats = {
    newRequests: publicProjects.length,
    activeProjects: 3,
    newMessages: 5,
    profileComplete: 60, // Percentage
  };

  if (isLoading) {
    return (
      <div className="text-center text-brand-medium-blue py-12">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
            خوش آمدید {user?.fullName || user?.name || "تولیدکننده عزیز"}!
          </h1>
          <p className="text-brand-medium-blue">
            مدیریت پروژه‌ها و پروفایل کارگاه
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {stats.newRequests}
            </div>
            <div className="text-sm text-brand-medium-blue">درخواست‌های جدید</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {stats.activeProjects}
            </div>
            <div className="text-sm text-brand-medium-blue">پروژه‌های فعال</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-brand-light-sky rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-brand-medium-blue" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {stats.newMessages}
            </div>
            <div className="text-sm text-brand-medium-blue">پیام‌های جدید</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {stats.profileComplete}%
            </div>
            <div className="text-sm text-brand-medium-blue">تکمیل پروفایل</div>
          </div>
        </div>

        {/* Profile Completion Alert */}
        {stats.profileComplete < 100 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  پروفایل شما ناقص است
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  برای دریافت درخواست‌های بیشتر، پروفایل کارگاه خود را تکمیل کنید.
                </p>
                <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full transition-all"
                    style={{ width: `${stats.profileComplete}%` }}
                  />
                </div>
                <Link href="/dashboard/supplier/profile">
                  <Button variant="primary" size="sm">
                    تکمیل پروفایل
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/dashboard/supplier/projects">
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-light-sky rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-brand-medium-blue" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-brand-dark-blue mb-1 font-display">
                    مشاهده همه پروژه‌ها
                  </h3>
                  <p className="text-sm text-brand-medium-blue">
                    درخواست‌های مرتبط با تخصص شما
                  </p>
                </div>
                <ArrowRightIcon className="w-6 h-6 text-brand-medium-blue group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/supplier/profile">
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-light-sky rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-8 h-8 text-brand-medium-blue" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-brand-dark-blue mb-1 font-display">
                    مدیریت پروفایل کارگاه
                  </h3>
                  <p className="text-sm text-brand-medium-blue">
                    تکمیل اطلاعات کارگاه و تخصص‌ها
                  </p>
                </div>
                <ArrowRightIcon className="w-6 h-6 text-brand-medium-blue group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Related Projects */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="p-6 border-b border-brand-medium-gray">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-brand-dark-blue font-display">
                درخواست‌های مرتبط
              </h2>
              {publicProjects.length > 0 && (
                <Link
                  href="/dashboard/supplier/projects"
                  className="text-sm text-brand-medium-blue hover:text-brand-dark-blue flex items-center gap-1"
                >
                  مشاهده همه
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="divide-y divide-brand-medium-gray">
            {publicProjects.length === 0 ? (
              <div className="p-12 text-center">
                <DocumentTextIcon className="w-16 h-16 text-brand-medium-gray mx-auto mb-4" />
                <p className="text-brand-medium-blue mb-2">
                  در حال حاضر درخواستی مرتبط با تخصص شما وجود ندارد
                </p>
                <p className="text-sm text-brand-medium-blue">
                  پروفایل خود را تکمیل کنید تا درخواست‌های بیشتری دریافت کنید
                </p>
              </div>
            ) : (
              publicProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-6 hover:bg-brand-off-white transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-brand-dark-blue">
                          {project.title}
                        </h3>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-300">
                          جدید
                        </span>
                      </div>
                      <p className="text-sm text-brand-medium-blue line-clamp-2 mb-3">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-brand-medium-blue">
                        {project.city && (
                          <span className="flex items-center gap-1">
                            📍 {project.city.title}
                          </span>
                        )}
                        {project.category && (
                          <span className="flex items-center gap-1">
                            🏷️ {project.category.title}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          📅 {formatDate(project.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mr-4">
                      <Button variant="primary" size="sm">
                        مشاهده و پاسخ
                      </Button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
    </div>
  );
}
