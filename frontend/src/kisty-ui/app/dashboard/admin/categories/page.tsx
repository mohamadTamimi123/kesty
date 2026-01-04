"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "../../../components/MobileLayout";
import Button from "../../../components/Button";
import DeleteConfirmDialog from "../../../components/DeleteConfirmDialog";
import CategoryTree from "../../../components/CategoryTree";
import { Category } from "../../../types/category";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export default function CategoriesManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; category: Category | null }>({
    isOpen: false,
    category: null,
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

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getCategoryTree();
        setCategories(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        logger.error("Error fetching categories", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت لیست کتگوری‌ها";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchCategories();
    }
  }, [isAuthenticated, currentUser]);

  // Filter categories based on search query (recursive)
  const filterCategories = (cats: Category[], query: string): Category[] => {
    if (!query) return cats;
    
    const lowerQuery = query.toLowerCase();
    return cats
      .map((category): Category | null => {
        const matches =
          category.title.toLowerCase().includes(lowerQuery) ||
          category.slug.toLowerCase().includes(lowerQuery) ||
          (category.description && category.description.toLowerCase().includes(lowerQuery));

        const filteredChildren = category.children
          ? filterCategories(category.children, query)
          : [];

        if (matches || filteredChildren.length > 0) {
          return {
            ...category,
            children: filteredChildren.length > 0 ? filteredChildren : category.children,
          };
        }
        return null;
      })
      .filter((cat): cat is Category => cat !== null);
  };

  const filteredCategories = useMemo(() => {
    return filterCategories(categories, searchQuery);
  }, [categories, searchQuery]);

  const handleDelete = (category: Category) => {
    setDeleteDialog({ isOpen: true, category });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.category) return;

    try {
      await apiClient.deleteCategory(deleteDialog.category.id);
      // Remove category from tree recursively
      const removeFromTree = (cats: Category[]): Category[] => {
        return cats
          .filter((c) => c.id !== deleteDialog.category!.id)
          .map((c) => ({
            ...c,
            children: c.children ? removeFromTree(c.children) : undefined,
          }));
      };
      setCategories(removeFromTree(categories));
      toast.success(`کتگوری ${deleteDialog.category.title} با موفقیت حذف شد`);
      setDeleteDialog({ isOpen: false, category: null });
      
      // Refresh tree
      const response = await apiClient.getCategoryTree();
      setCategories(Array.isArray(response) ? response : []);
    } catch (error: unknown) {
      logger.error("Error deleting category", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در حذف کتگوری";
      toast.error(errorMessage);
    }
  };

  const handleReorder = async (categoryIds: string[]) => {
    try {
      await apiClient.reorderCategories(categoryIds);
      // Refresh tree
      const response = await apiClient.getCategoryTree();
      setCategories(Array.isArray(response) ? response : []);
      toast.success("ترتیب دسته‌ها با موفقیت تغییر کرد");
    } catch (error: unknown) {
      logger.error("Error reordering categories", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در تغییر ترتیب";
      toast.error(errorMessage);
      // Refresh tree on error
      const response = await apiClient.getCategoryTree();
      setCategories(Array.isArray(response) ? response : []);
    }
  };

  const handleMove = async (
    categoryId: string,
    newParentId: string | null,
    newOrder?: number
  ) => {
    try {
      await apiClient.moveCategory(categoryId, newParentId, newOrder);
      // Refresh tree
      const response = await apiClient.getCategoryTree();
      setCategories(Array.isArray(response) ? response : []);
      toast.success("دسته با موفقیت منتقل شد");
    } catch (error: unknown) {
      logger.error("Error moving category", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در انتقال دسته";
      toast.error(errorMessage);
      // Refresh tree on error
      const response = await apiClient.getCategoryTree();
      setCategories(Array.isArray(response) ? response : []);
    }
  };

  const handleAddSubcategory = (parentId: string) => {
    router.push(`/dashboard/admin/categories/create?parentId=${parentId}`);
  };

  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-300"
      : "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getIconUrl = (iconUrl: string | null) => {
    if (!iconUrl) return null;
    if (iconUrl.startsWith('http')) return iconUrl;
    // API serves static files at /api/uploads/...
    const apiUrl = typeof window !== 'undefined' 
      ? window.location.origin.replace(':3000', ':3001')
      : 'http://localhost:3001';
    // iconUrl should be like /uploads/categories/filename.png
    // We need to convert it to /api/uploads/categories/filename.png
    const path = iconUrl.startsWith('/') ? iconUrl : `/${iconUrl}`;
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
                مدیریت کتگوری‌ها
              </h1>
              <p className="text-brand-medium-blue">
                مدیریت و نظارت بر کتگوری‌های پلتفرم
              </p>
            </div>
            <Link href="/dashboard/admin/categories/create">
              <Button variant="primary" size="sm">
                <PlusIcon className="w-5 h-5" />
                افزودن کتگوری جدید
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
              {categories.length}
            </div>
            <div className="text-xs text-brand-medium-blue">کل کتگوری‌ها</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {categories.filter((c) => c.isActive).length}
            </div>
            <div className="text-xs text-brand-medium-blue">کتگوری‌های فعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {categories.filter((c) => !c.isActive).length}
            </div>
            <div className="text-xs text-brand-medium-blue">کتگوری‌های غیرفعال</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {categories.filter((c) => c.iconUrl).length}
            </div>
            <div className="text-xs text-brand-medium-blue">دارای آیکون</div>
          </div>
        </div>

        {/* Categories Tree */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-brand-medium-blue">
              کتگوری یافت نشد
            </div>
          ) : (
            <CategoryTree
              categories={filteredCategories}
              onReorder={handleReorder}
              onMove={handleMove}
              onDelete={handleDelete}
              onAddSubcategory={handleAddSubcategory}
              getIconUrl={getIconUrl}
            />
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, category: null })}
          onConfirm={confirmDelete}
          message={
            deleteDialog.category
              ? `آیا از حذف کتگوری "${deleteDialog.category.title}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
              : ""
          }
        />
      </div>
    </MobileLayout>
  );
}

