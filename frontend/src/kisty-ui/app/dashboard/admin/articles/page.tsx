"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "../../../components/MobileLayout";
import Button from "../../../components/Button";
import DeleteConfirmDialog from "../../../components/DeleteConfirmDialog";
import { EducationalArticle } from "../../../types/article";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export default function ArticlesManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<EducationalArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    article: EducationalArticle | null;
  }>({
    isOpen: false,
    article: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Normalize role for comparison (case-insensitive)
    const userRole = currentUser?.role?.toLowerCase();
    if (userRole !== "admin") {
      toast.error("شما دسترسی به این صفحه ندارید");
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, currentUser, router]);

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getEducationalArticles();
        const articlesData = Array.isArray(response) ? response : [];
        setArticles(articlesData);
      } catch (error: unknown) {
        logger.error("Error fetching articles", error);
        toast.error("خطا در دریافت لیست مقالات");
      } finally {
        setIsLoading(false);
      }
    };

    const userRole = currentUser?.role?.toLowerCase();
    if (isAuthenticated && userRole === "admin") {
      fetchArticles();
    }
  }, [isAuthenticated, currentUser]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // Published filter
    if (publishedFilter === "published") {
      filtered = filtered.filter((a) => a.isPublished);
    } else if (publishedFilter === "draft") {
      filtered = filtered.filter((a) => !a.isPublished);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          (a.excerpt && a.excerpt.toLowerCase().includes(query)) ||
          (a.category && a.category.title.toLowerCase().includes(query)) ||
          (a.slug && a.slug.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [articles, searchQuery, publishedFilter]);

  const handleDelete = (article: EducationalArticle) => {
    setDeleteDialog({ isOpen: true, article });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.article) return;

    try {
      await apiClient.deleteEducationalArticle(deleteDialog.article.id);
      setArticles(articles.filter((a) => a.id !== deleteDialog.article!.id));
      toast.success(`مقاله ${deleteDialog.article.title} با موفقیت حذف شد`);
      setDeleteDialog({ isOpen: false, article: null });
    } catch (error: any) {
      logger.error("Error deleting article", error);
      toast.error(error.response?.data?.message || "خطا در حذف مقاله");
    }
  };

  const togglePublish = async (article: EducationalArticle) => {
    try {
      await apiClient.updateEducationalArticle(article.id, {
        isPublished: !article.isPublished,
        publishedAt: !article.isPublished ? new Date().toISOString() : null,
      });
      setArticles(
        articles.map((a) =>
          a.id === article.id
            ? {
                ...a,
                isPublished: !a.isPublished,
                publishedAt: !a.isPublished ? new Date().toISOString() : null,
              }
            : a
        )
      );
      toast.success(
        `مقاله ${article.isPublished ? "از حالت انتشار خارج شد" : "منتشر شد"}`
      );
    } catch (error: any) {
      logger.error("Error updating article", error);
      toast.error(error.response?.data?.message || "خطا در تغییر وضعیت مقاله");
    }
  };

  const stats = useMemo(() => {
    return {
      total: articles.length,
      published: articles.filter((a) => a.isPublished).length,
      draft: articles.filter((a) => !a.isPublished).length,
      totalViews: articles.reduce((sum, a) => sum + (a.viewCount || 0), 0),
    };
  }, [articles]);

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue py-12">در حال بارگذاری...</div>
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
                مدیریت مقالات آموزشی
              </h1>
              <p className="text-brand-medium-blue">مدیریت و نظارت بر مقالات آموزشی پلتفرم</p>
            </div>
            <Link href="/dashboard/admin/articles/create">
              <Button variant="primary" size="sm">
                <PlusIcon className="w-5 h-5" />
                نوشتن مقاله جدید
              </Button>
            </Link>
          </div>

          <div className="flex gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="جستجو بر اساس عنوان، خلاصه، دسته‌بندی یا اسلاگ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="neutral"
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap"
            >
              <FunnelIcon className="w-5 h-5 ml-2" />
              فیلتر
            </Button>
          </div>

          {/* Published Filter */}
          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {[
                { id: "all", label: "همه" },
                { id: "published", label: "منتشر شده" },
                { id: "draft", label: "پیش‌نویس" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setPublishedFilter(filter.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    publishedFilter === filter.id
                      ? "bg-brand-medium-blue text-white"
                      : "bg-white text-brand-dark-blue border border-brand-medium-gray hover:bg-brand-light-gray"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">{stats.total}</div>
            <div className="text-xs text-brand-medium-blue">کل مقالات</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.published}</div>
            <div className="text-xs text-brand-medium-blue">منتشر شده</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.draft}</div>
            <div className="text-xs text-brand-medium-blue">پیش‌نویس</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {new Intl.NumberFormat("fa-IR").format(stats.totalViews)}
            </div>
            <div className="text-xs text-brand-medium-blue">کل بازدیدها</div>
          </div>
        </div>

        {/* Articles List */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-light-gray border-b border-brand-medium-gray">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    عنوان
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    دسته‌بندی
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    بازدید
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
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-medium-blue">
                      مقاله‌ای یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((article) => (
                    <tr
                      key={article.id}
                      className="border-b border-brand-medium-gray hover:bg-brand-light-sky transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm text-brand-dark-blue font-medium">
                          {article.title}
                        </div>
                        {article.excerpt && (
                          <div className="text-xs text-brand-medium-blue mt-1 line-clamp-2">
                            {article.excerpt.substring(0, 100)}
                            {article.excerpt.length > 100 && "..."}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {article.category?.title || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            article.isPublished
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-gray-100 text-gray-800 border-gray-300"
                          }`}
                        >
                          {article.isPublished ? "منتشر شده" : "پیش‌نویس"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {new Intl.NumberFormat("fa-IR").format(article.viewCount || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {formatDate(article.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/education/${article.slug}`}>
                            <Button variant="neutral" size="sm" className="p-2" title="مشاهده">
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/admin/articles/edit/${article.id}`}>
                            <Button variant="neutral" size="sm" className="p-2" title="ویرایش">
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="neutral"
                            size="sm"
                            className={`p-2 ${
                              article.isPublished
                                ? "text-yellow-600 hover:text-yellow-700"
                                : "text-green-600 hover:text-green-700"
                            }`}
                            onClick={() => togglePublish(article)}
                            title={article.isPublished ? "لغو انتشار" : "انتشار"}
                          >
                            {article.isPublished ? "لغو انتشار" : "انتشار"}
                          </Button>
                          <Button
                            variant="neutral"
                            size="sm"
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(article)}
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
          onClose={() => setDeleteDialog({ isOpen: false, article: null })}
          onConfirm={confirmDelete}
          message={
            deleteDialog.article
              ? `آیا از حذف مقاله "${deleteDialog.article.title}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
              : ""
          }
        />
      </div>
    </MobileLayout>
  );
}

