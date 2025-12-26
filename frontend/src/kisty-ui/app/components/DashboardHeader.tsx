"use client";

import { useAuth } from "../contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Breadcrumb, { BreadcrumbItem } from "./Breadcrumb";
import { ArrowLeftOnRectangleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import Button from "./Button";

interface DashboardHeaderProps {
  title?: string;
  breadcrumbItems?: BreadcrumbItem[];
}

export default function DashboardHeader({ title, breadcrumbItems = [] }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const getRoleLabel = (role?: string): string => {
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole === "admin") return "مدیر";
    if (normalizedRole === "supplier") return "تولیدکننده";
    return "مشتری";
  };

  const getRoleBadgeColor = (role?: string): string => {
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole === "admin") return "bg-red-100 text-red-800 border-red-300";
    if (normalizedRole === "supplier") return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  const getDashboardTitle = (): string => {
    if (title) return title;
    const normalizedRole = user?.role?.toLowerCase();
    if (normalizedRole === "admin") return "داشبورد مدیر";
    if (normalizedRole === "supplier") return "داشبورد تولیدکننده";
    return "داشبورد مشتری";
  };

  const handleLogout = async () => {
    await logout();
  };

  // Generate breadcrumb items based on pathname if not provided
  const generateBreadcrumbItems = (): BreadcrumbItem[] => {
    if (breadcrumbItems.length > 0) return breadcrumbItems;
    
    const items: BreadcrumbItem[] = [
      { label: "داشبورد", href: `/dashboard/${user?.role?.toLowerCase() || "customer"}` }
    ];

    // Parse pathname to add additional breadcrumb items
    const pathParts = pathname.split("/").filter(Boolean);
    if (pathParts.length > 2) {
      const role = pathParts[1];
      const page = pathParts[2];
      
      const pageLabels: Record<string, string> = {
        projects: "پروژه‌ها",
        profile: "پروفایل",
        portfolio: "نمونه کارها",
        reviews: "نظرات",
        messages: "پیام‌ها",
        settings: "تنظیمات",
        users: "کاربران",
        cities: "شهرها",
        categories: "دسته‌بندی‌ها",
        rating: "امتیاز و رتبه‌بندی",
      };

      if (pageLabels[page]) {
        items.push({ label: pageLabels[page] });
      }

      // Add sub-pages
      if (pathParts.length > 3) {
        const subPage = pathParts[3];
        if (subPage === "create") {
          items.push({ label: "ایجاد جدید" });
        } else if (subPage === "edit" && pathParts[4]) {
          items.push({ label: "ویرایش" });
        } else if (subPage === "requests") {
          items.push({ label: "درخواست‌ها" });
        }
      }
    }

    return items;
  };

  const finalBreadcrumbItems = generateBreadcrumbItems();

  return (
    <div className="bg-white border-b border-brand-medium-gray sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4">
          {/* Left side: Title and Breadcrumb */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl lg:text-2xl font-bold text-brand-dark-blue font-display">
                {getDashboardTitle()}
              </h1>
              {user?.role && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              )}
            </div>
            {finalBreadcrumbItems.length > 0 && (
              <Breadcrumb items={finalBreadcrumbItems} />
            )}
          </div>

          {/* Right side: User info and Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-light-sky rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-6 h-6 text-brand-medium-blue" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-brand-dark-blue">
                  {user?.fullName || user?.name || "کاربر"}
                </div>
                <div className="text-xs text-brand-medium-blue">
                  {user?.phone || ""}
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <ArrowLeftOnRectangleIcon className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

