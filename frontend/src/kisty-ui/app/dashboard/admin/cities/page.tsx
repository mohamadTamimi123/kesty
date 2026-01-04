"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MobileLayout from "../../../components/MobileLayout";
import Button from "../../../components/Button";
import DeleteConfirmDialog from "../../../components/DeleteConfirmDialog";
import { City } from "../../../types/city";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export default function CitiesManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; city: City | null }>({
    isOpen: false,
    city: null,
  });

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (currentUser?.role !== "admin" && currentUser?.role !== "ADMIN") {
      toast.error("شما دسترسی به این صفحه ندارید");
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, currentUser, router]);

  // Fetch cities from API
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getCities();
        setCities(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        logger.error("Error fetching cities", error);
        toast.error(error.response?.data?.message || "خطا در دریافت لیست شهرها");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchCities();
    }
  }, [isAuthenticated, currentUser]);

  // Filter cities based on search query
  const filteredCities = useMemo(() => {
    if (!searchQuery) return cities;
    
    const query = searchQuery.toLowerCase();
    return cities.filter(
      (city) =>
        city.title.toLowerCase().includes(query) ||
        city.slug.toLowerCase().includes(query) ||
        (city.description && city.description.toLowerCase().includes(query))
    );
  }, [cities, searchQuery]);

  const handleDelete = (city: City) => {
    setDeleteDialog({ isOpen: true, city });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.city) return;

    try {
      await apiClient.deleteCity(deleteDialog.city.id);
      setCities(cities.filter((c) => c.id !== deleteDialog.city!.id));
      toast.success(`شهر ${deleteDialog.city.title} با موفقیت حذف شد`);
      setDeleteDialog({ isOpen: false, city: null });
    } catch (error: unknown) {
      logger.error("Error deleting city", error);
      toast.error(error.response?.data?.message || "خطا در حذف شهر");
    }
  };

  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-300"
      : "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getLogoUrl = (logoUrl: string | null) => {
    if (!logoUrl) return null;
    if (logoUrl.startsWith('http')) return logoUrl;
    // API serves static files at /api/uploads/...
    const apiUrl = typeof window !== 'undefined' 
      ? window.location.origin.replace(':3000', ':3001')
      : 'http://localhost:3001';
    // logoUrl should be like /uploads/cities/filename.png
    // We need to convert it to /api/uploads/cities/filename.png
    const path = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    return `${apiUrl}/api${path}`;
  };

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue py-12">
            در حال بارگذاری...
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
                مدیریت شهرها
              </h1>
              <p className="text-brand-medium-blue">
                مدیریت و نظارت بر شهرهای پلتفرم
              </p>
            </div>
            <Link href="/dashboard/admin/cities/create">
              <Button variant="primary" size="sm">
                <PlusIcon className="w-5 h-5" />
                افزودن شهر جدید
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="جستجو بر اساس نام، اسلاگ یا توضیحات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">
              {cities.length}
            </div>
            <div className="text-xs text-brand-medium-blue">کل شهرها</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {cities.filter((c) => c.isActive).length}
            </div>
            <div className="text-xs text-brand-medium-blue">شهرهای فعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {cities.filter((c) => !c.isActive).length}
            </div>
            <div className="text-xs text-brand-medium-blue">شهرهای غیرفعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {cities.filter((c) => c.logoUrl).length}
            </div>
            <div className="text-xs text-brand-medium-blue">دارای لوگو</div>
          </div>
        </div>

        {/* Cities Table */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-light-gray border-b border-brand-medium-gray">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    لوگو
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    عنوان
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    اسلاگ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    تاریخ ایجاد
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-brand-dark-blue">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-medium-blue">
                      شهری یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredCities.map((city) => {
                    const logoUrl = getLogoUrl(city.logoUrl);
                    return (
                      <tr
                        key={city.id}
                        className="border-b border-brand-medium-gray hover:bg-brand-light-sky transition-colors"
                      >
                        <td className="px-4 py-3">
                          {logoUrl ? (
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={logoUrl}
                                alt={city.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                              بدون لوگو
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-dark-blue font-medium">
                          {city.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-medium-blue font-mono">
                          {city.slug}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                              city.isActive
                            )}`}
                          >
                            {city.isActive ? "فعال" : "غیرفعال"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-medium-blue">
                          {formatDate(city.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/dashboard/admin/cities/edit/${city.id}`}>
                              <Button
                                variant="neutral"
                                size="sm"
                                className="p-2"
                                title="ویرایش"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="neutral"
                              size="sm"
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(city)}
                              title="حذف"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, city: null })}
          onConfirm={confirmDelete}
          message={
            deleteDialog.city
              ? `آیا از حذف شهر "${deleteDialog.city.title}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
              : ""
          }
        />
      </div>
    </MobileLayout>
  );
}

