"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Squares2X2Icon,
  UserIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  Bars3Icon,
  PlusCircleIcon,
  XMarkIcon,
  PhotoIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const customerItems: SidebarItem[] = [
    {
      label: "داشبورد",
      href: "/dashboard/customer",
      icon: <Squares2X2Icon className="w-5 h-5" />,
    },
    {
      label: "ثبت درخواست",
      href: "/dashboard/customer/projects/create",
      icon: <PlusCircleIcon className="w-5 h-5" />,
    },
    {
      label: "پروژه‌های من",
      href: "/dashboard/customer/projects",
      icon: <DocumentTextIcon className="w-5 h-5" />,
    },
    {
      label: "درخواست‌های نظر",
      href: "/dashboard/customer/reviews/requests",
      icon: <StarIcon className="w-5 h-5" />,
    },
    {
      label: "نظرات من",
      href: "/dashboard/customer/reviews",
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    },
    {
      label: "پیام‌ها",
      href: "/messaging",
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
      badge: 3,
    },
    {
      label: "پروفایل",
      href: "/dashboard/customer/profile",
      icon: <UserIcon className="w-5 h-5" />,
    },
  ];

  const supplierItems: SidebarItem[] = [
    {
      label: "داشبورد",
      href: "/dashboard/supplier",
      icon: <Squares2X2Icon className="w-5 h-5" />,
    },
    {
      label: "نمونه کارها",
      href: "/dashboard/supplier/portfolio",
      icon: <PhotoIcon className="w-5 h-5" />,
    },
    {
      label: "درخواست‌های نظر",
      href: "/dashboard/supplier/reviews/requests",
      icon: <StarIcon className="w-5 h-5" />,
    },
    {
      label: "نظرات دریافت شده",
      href: "/dashboard/supplier/reviews",
      icon: <StarIcon className="w-5 h-5" />,
    },
    {
      label: "پیام‌ها",
      href: "/messaging",
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
      badge: 5,
    },
    {
      label: "پروفایل",
      href: "/dashboard/supplier/profile",
      icon: <UserIcon className="w-5 h-5" />,
    },
  ];

  const adminItems: SidebarItem[] = [
    {
      label: "داشبورد",
      href: "/dashboard/admin",
      icon: <Squares2X2Icon className="w-5 h-5" />,
    },
    {
      label: "کاربران",
      href: "/dashboard/admin/users",
      icon: <UserIcon className="w-5 h-5" />,
    },
    {
      label: "مدیریت شهرها",
      href: "/dashboard/admin/cities",
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
    },
    {
      label: "مدیریت دسته‌بندی‌ها",
      href: "/dashboard/admin/categories",
      icon: <Bars3Icon className="w-5 h-5" />,
    },
    {
      label: "پروژه‌ها",
      href: "/dashboard/admin/projects",
      icon: <DocumentTextIcon className="w-5 h-5" />,
    },
    {
      label: "مدیریت نظرات",
      href: "/dashboard/admin/reviews",
      icon: <StarIcon className="w-5 h-5" />,
    },
    {
      label: "مدیریت دستگاه‌ها",
      href: "/dashboard/admin/machines",
      icon: <WrenchScrewdriverIcon className="w-5 h-5" />,
    },
    {
      label: "مدیریت متریال‌ها",
      href: "/dashboard/admin/materials",
      icon: <CubeIcon className="w-5 h-5" />,
    },
    {
      label: "اعلان‌ها",
      href: "/dashboard/admin/notifications",
      icon: <BellIcon className="w-5 h-5" />,
    },
    {
      label: "امنیت",
      href: "/dashboard/admin/security",
      icon: <ShieldCheckIcon className="w-5 h-5" />,
    },
    {
      label: "تنظیمات",
      href: "/dashboard/admin/settings",
      icon: <Cog6ToothIcon className="w-5 h-5" />,
    },
  ];

  const getItems = () => {
    switch (user?.role) {
      case "supplier":
        return supplierItems;
      case "admin":
        return adminItems;
      default:
        return customerItems;
    }
  };

  const items = getItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 right-0 h-screen w-64 bg-white border-l border-brand-medium-gray z-50
          transform transition-transform duration-300 ease-in-out overflow-y-auto
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4">
          {/* Mobile Header */}
          {onClose && (
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h2 className="text-lg font-bold text-brand-dark-blue font-display">
                منو
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-brand-medium-gray hover:text-brand-dark-blue transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* User Info Section */}
          {user && (
            <div className="mb-6 pb-6 border-b border-brand-medium-gray">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-brand-light-sky rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-6 h-6 text-brand-medium-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-brand-dark-blue truncate">
                    {user.fullName || user.name || "کاربر"}
                  </div>
                  <div className="text-xs text-brand-medium-blue truncate">
                    {user.phone || ""}
                  </div>
                </div>
              </div>
              {user.role && (
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                      user.role.toLowerCase() === "admin"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : user.role.toLowerCase() === "supplier"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-green-100 text-green-800 border-green-300"
                    }`}
                  >
                    {user.role.toLowerCase() === "admin"
                      ? "مدیر"
                      : user.role.toLowerCase() === "supplier"
                      ? "تولیدکننده"
                      : "مشتری"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Desktop Header */}
          {!onClose && !user && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-brand-dark-blue font-display">
                منو
              </h2>
            </div>
          )}

        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const isCreateButton = item.href === "/dashboard/customer/projects/create";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isCreateButton
                    ? "bg-brand-medium-blue text-white font-medium hover:bg-brand-dark-blue shadow-md"
                    : isActive
                    ? "bg-brand-light-sky text-brand-dark-blue font-medium border-r-4 border-brand-medium-blue"
                    : "text-brand-medium-blue hover:bg-brand-off-white hover:text-brand-dark-blue"
                }`}
              >
                <span
                  className={`${
                    isCreateButton
                      ? "text-white"
                      : isActive
                      ? "text-brand-medium-blue"
                      : "text-brand-medium-gray group-hover:text-brand-medium-blue"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-brand-medium-blue text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        </div>
      </aside>
    </>
  );
}

