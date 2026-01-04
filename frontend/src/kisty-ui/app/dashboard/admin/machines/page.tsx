"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "../../../components/MobileLayout";
import Button from "../../../components/Button";
import DeleteConfirmDialog from "../../../components/DeleteConfirmDialog";
import { Machine } from "../../../types/machine";
import { Category } from "../../../types/category";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export default function MachinesManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; machine: Machine | null }>({
    isOpen: false,
    machine: null,
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

  // Fetch machines from API
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setIsLoading(true);
        // Fetch all machines (not filtered by category for admin view)
        const response = await apiClient.getMachines();
        setMachines(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        logger.error("Error fetching machines", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت لیست دستگاه‌ها";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchMachines();
    }
  }, [isAuthenticated, currentUser]);

  // Filter machines based on search query, category, and status
  const filteredMachines = useMemo(() => {
    let filtered = machines;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (machine) =>
          machine.name.toLowerCase().includes(query) ||
          (machine.description && machine.description.toLowerCase().includes(query)) ||
          (machine.category?.title && machine.category.title.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategoryId) {
      filtered = filtered.filter((machine) => machine.categoryId === selectedCategoryId);
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((machine) => machine.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((machine) => !machine.isActive);
    }

    return filtered;
  }, [machines, searchQuery, selectedCategoryId, statusFilter]);

  const handleDelete = (machine: Machine) => {
    setDeleteDialog({ isOpen: true, machine });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.machine) return;

    try {
      await apiClient.deleteMachine(deleteDialog.machine.id);
      setMachines(machines.filter((m) => m.id !== deleteDialog.machine!.id));
      toast.success(`دستگاه ${deleteDialog.machine.name} با موفقیت حذف شد`);
      setDeleteDialog({ isOpen: false, machine: null });
    } catch (error: unknown) {
      logger.error("Error deleting machine", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در حذف دستگاه";
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
                مدیریت دستگاه‌ها
              </h1>
              <p className="text-brand-medium-blue">
                مدیریت و نظارت بر دستگاه‌های پلتفرم
              </p>
            </div>
            <Link href="/dashboard/admin/machines/create">
              <Button variant="primary" size="sm">
                <PlusIcon className="w-5 h-5" />
                افزودن دستگاه جدید
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
            <WrenchScrewdriverIcon className="w-8 h-8 text-brand-medium-blue mb-2" />
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">
              {machines.length}
            </div>
            <div className="text-xs text-brand-medium-blue">کل دستگاه‌ها</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {machines.filter((m) => m.isActive).length}
            </div>
            <div className="text-xs text-brand-medium-blue">دستگاه‌های فعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {machines.filter((m) => !m.isActive).length}
            </div>
            <div className="text-xs text-brand-medium-blue">دستگاه‌های غیرفعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {machines.filter((m) => m.categoryId).length}
            </div>
            <div className="text-xs text-brand-medium-blue">دارای دسته‌بندی</div>
          </div>
        </div>

        {/* Machines Table */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-light-gray border-b border-brand-medium-gray">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    نام دستگاه
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
                {filteredMachines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-medium-blue">
                      دستگاهی یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredMachines.map((machine) => (
                    <tr
                      key={machine.id}
                      className="border-b border-brand-medium-gray hover:bg-brand-light-sky transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-brand-dark-blue font-medium">
                        {machine.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {machine.category?.title || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue max-w-xs truncate">
                        {machine.description || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                            machine.isActive
                          )}`}
                        >
                          {machine.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {formatDate(machine.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/admin/machines/edit/${machine.id}`}>
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
                            onClick={() => handleDelete(machine)}
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
          onClose={() => setDeleteDialog({ isOpen: false, machine: null })}
          onConfirm={confirmDelete}
          message={
            deleteDialog.machine
              ? `آیا از حذف دستگاه "${deleteDialog.machine.name}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
              : ""
          }
        />
      </div>
    </MobileLayout>
  );
}

