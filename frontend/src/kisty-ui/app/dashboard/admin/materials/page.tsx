"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "../../../components/MobileLayout";
import Button from "../../../components/Button";
import DeleteConfirmDialog from "../../../components/DeleteConfirmDialog";
import { Material } from "../../../types/material";
import { Category } from "../../../types/category";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, CubeIcon } from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export default function MaterialsManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; material: Material | null }>({
    isOpen: false,
    material: null,
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.getActiveCategories();
        setCategories(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        logger.error("Error fetching categories", error);
      }
    };

    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Fetch materials from API
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        // Fetch all materials (not filtered by category for admin view)
        const response = await apiClient.getMaterials();
        setMaterials(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        logger.error("Error fetching materials", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت لیست متریال‌ها";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchMaterials();
    }
  }, [isAuthenticated, currentUser]);

  // Filter materials based on search query, category, and status
  const filteredMaterials = useMemo(() => {
    let filtered = materials;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (material) =>
          material.name.toLowerCase().includes(query) ||
          (material.description && material.description.toLowerCase().includes(query)) ||
          (material.category?.title && material.category.title.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategoryId) {
      filtered = filtered.filter((material) => material.categoryId === selectedCategoryId);
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((material) => material.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((material) => !material.isActive);
    }

    return filtered;
  }, [materials, searchQuery, selectedCategoryId, statusFilter]);

  const handleDelete = (material: Material) => {
    setDeleteDialog({ isOpen: true, material });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.material) return;

    try {
      await apiClient.deleteMaterial(deleteDialog.material.id);
      setMaterials(materials.filter((m) => m.id !== deleteDialog.material!.id));
      toast.success(`متریال ${deleteDialog.material.name} با موفقیت حذف شد`);
      setDeleteDialog({ isOpen: false, material: null });
    } catch (error: unknown) {
      logger.error("Error deleting material", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در حذف متریال";
      toast.error(errorMessage);
    }
  };

  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-300"
      : "bg-gray-100 text-gray-800 border-gray-300";
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
                مدیریت متریال‌ها
              </h1>
              <p className="text-brand-medium-blue">
                مدیریت و نظارت بر متریال‌های پلتفرم
              </p>
            </div>
            <Link href="/dashboard/admin/materials/create">
              <Button variant="primary" size="sm">
                <PlusIcon className="w-5 h-5" />
                افزودن متریال جدید
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="جستجو بر اساس نام، دسته‌بندی یا توضیحات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                  فیلتر بر اساس دسته‌بندی
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
                >
                  <option value="">همه دسته‌بندی‌ها</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                  فیلتر بر اساس وضعیت
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <CubeIcon className="w-8 h-8 text-brand-medium-blue mb-2" />
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">
              {materials.length}
            </div>
            <div className="text-xs text-brand-medium-blue">کل متریال‌ها</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {materials.filter((m) => m.isActive).length}
            </div>
            <div className="text-xs text-brand-medium-blue">متریال‌های فعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {materials.filter((m) => !m.isActive).length}
            </div>
            <div className="text-xs text-brand-medium-blue">متریال‌های غیرفعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {materials.filter((m) => m.categoryId).length}
            </div>
            <div className="text-xs text-brand-medium-blue">دارای دسته‌بندی</div>
          </div>
        </div>

        {/* Materials Table */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-light-gray border-b border-brand-medium-gray">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    نام متریال
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    دسته‌بندی
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    توضیحات
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
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-medium-blue">
                      متریالی یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((material) => (
                    <tr
                      key={material.id}
                      className="border-b border-brand-medium-gray hover:bg-brand-light-sky transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-brand-dark-blue font-medium">
                        {material.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {material.category?.title || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue max-w-xs truncate">
                        {material.description || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                            material.isActive
                          )}`}
                        >
                          {material.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {formatDate(material.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/admin/materials/edit/${material.id}`}>
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
                            onClick={() => handleDelete(material)}
                            title="حذف"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, material: null })}
          onConfirm={confirmDelete}
          message={
            deleteDialog.material
              ? `آیا از حذف متریال "${deleteDialog.material.name}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
              : ""
          }
        />
      </div>
    </MobileLayout>
  );
}

