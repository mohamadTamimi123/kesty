"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../../../components/Button";
import PortfolioCard from "../../../components/PortfolioCard";
import PortfolioOverview, { PortfolioStats } from "./PortfolioOverview";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import { Portfolio, QuantityRange } from "../../../types/portfolio";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import {
  PlusCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowsUpDownIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc" | "views-desc" | "views-asc" | "title-asc" | "title-desc";
type ViewMode = "grid" | "list";

export default function SupplierPortfolioPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterVerified, setFilterVerified] = useState<string>("all");
  const [filterPublic, setFilterPublic] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [reviewLinks, setReviewLinks] = useState<Record<string, string>>({});
  const [isGeneratingLink, setIsGeneratingLink] = useState<Record<string, boolean>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<Portfolio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMyPortfolios();
        setPortfolios(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        logger.error("Error fetching portfolios", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت نمونه کارها";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPortfolios();
    }
  }, [isAuthenticated]);

  const filteredAndSortedPortfolios = portfolios
    .filter((portfolio) => {
      // Search filter
      const matchesSearch = portfolio.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        portfolio.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        filterCategory === "all" || portfolio.categoryId === filterCategory;

      // Verified filter
      const matchesVerified =
        filterVerified === "all" ||
        (filterVerified === "verified" && portfolio.isVerified) ||
        (filterVerified === "unverified" && !portfolio.isVerified);

      // Public filter
      const matchesPublic =
        filterPublic === "all" ||
        (filterPublic === "public" && portfolio.isPublic) ||
        (filterPublic === "private" && !portfolio.isPublic);

      // Rating filter
      const matchesRating =
        filterRating === "all" ||
        (filterRating === "rated" && portfolio.rating && portfolio.rating > 0) ||
        (filterRating === "unrated" && (!portfolio.rating || portfolio.rating === 0)) ||
        (filterRating === "high" && portfolio.rating && portfolio.rating >= 4) ||
        (filterRating === "low" && portfolio.rating && portfolio.rating < 4 && portfolio.rating > 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesVerified &&
        matchesPublic &&
        matchesRating
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "rating-desc":
          return (b.rating || 0) - (a.rating || 0);
        case "rating-asc":
          return (a.rating || 0) - (b.rating || 0);
        case "views-desc":
          return (b.viewCount || 0) - (a.viewCount || 0);
        case "views-asc":
          return (a.viewCount || 0) - (b.viewCount || 0);
        case "title-asc":
          return a.title.localeCompare(b.title, "fa");
        case "title-desc":
          return b.title.localeCompare(a.title, "fa");
        default:
          return 0;
      }
    });

  const handleGenerateReviewLink = async (portfolio: Portfolio) => {
    try {
      setIsGeneratingLink((prev) => ({ ...prev, [portfolio.id]: true }));

      // Generate a simple token-based link (one-time use)
      const request = await apiClient.createReviewRequest({
        portfolioId: portfolio.id,
        generateToken: true,
        customerName: portfolio.customerName || "مشتری",
      });

      if (request.token) {
        const link = `${window.location.origin}/review/${request.token}`;
        setReviewLinks((prev) => ({ ...prev, [portfolio.id]: link }));
        toast.success("لینک ایجاد شد");
      } else {
        toast.error("خطا در ایجاد لینک");
      }
    } catch (error: any) {
      logger.error("Error generating review link", error);
      toast.error(error.response?.data?.message || "خطا در ایجاد لینک");
    } finally {
      setIsGeneratingLink((prev) => ({ ...prev, [portfolio.id]: false }));
    }
  };

  const handleCopyLink = async (portfolioId: string) => {
    const link = reviewLinks[portfolioId];
    if (!link) return;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
        toast.success("لینک کپی شد");
        return;
      }

      // Fallback for older browsers or non-HTTPS contexts
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand("copy");
        if (successful) {
          toast.success("لینک کپی شد");
        } else {
          toast.error("خطا در کپی کردن لینک");
        }
      } catch (err) {
        toast.error("خطا در کپی کردن لینک");
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      logger.error("Error copying link", error);
      toast.error("خطا در کپی کردن لینک");
    }
  };

  const handleDeleteClick = (portfolio: Portfolio) => {
    setPortfolioToDelete(portfolio);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!portfolioToDelete) return;

    try {
      setIsDeleting(true);
      await apiClient.deletePortfolio(portfolioToDelete.id);
      toast.success("نمونه کار با موفقیت حذف شد");
      
      // Remove from local state
      setPortfolios(portfolios.filter((p) => p.id !== portfolioToDelete.id));
      
      // Clear review link if exists
      const newReviewLinks = { ...reviewLinks };
      delete newReviewLinks[portfolioToDelete.id];
      setReviewLinks(newReviewLinks);
      
      setShowDeleteDialog(false);
      setPortfolioToDelete(null);
    } catch (error: any) {
      logger.error("Error deleting portfolio", error);
      toast.error(error.response?.data?.message || "خطا در حذف نمونه کار");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setPortfolioToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-brand-medium-blue py-12">
            در حال بارگذاری...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
              نمونه کارها
            </h1>
            <p className="text-brand-medium-blue">
              مدیریت نمونه کارهای شما
            </p>
          </div>
          <Link href="/dashboard/supplier/portfolio/create">
            <Button variant="primary">
              <PlusCircleIcon className="w-5 h-5 ml-2" />
              ثبت نمونه کار جدید
            </Button>
          </Link>
        </div>

        {/* Overview Component */}
        {portfolios.length > 0 && (
          <PortfolioOverview portfolios={portfolios} onStatsUpdate={setStats} />
        )}

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray" />
              <input
                type="text"
                placeholder="جستجو در نمونه کارها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border border-brand-medium-gray rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-brand-medium-blue text-white"
                    : "text-brand-medium-gray hover:bg-brand-off-white"
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-brand-medium-blue text-white"
                    : "text-brand-medium-gray hover:bg-brand-off-white"
                }`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowsUpDownIcon className="w-5 h-5 text-brand-medium-gray" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
              >
                <option value="date-desc">جدیدترین</option>
                <option value="date-asc">قدیمی‌ترین</option>
                <option value="rating-desc">بالاترین امتیاز</option>
                <option value="rating-asc">پایین‌ترین امتیاز</option>
                <option value="views-desc">بیشترین بازدید</option>
                <option value="views-asc">کمترین بازدید</option>
                <option value="title-asc">عنوان (صعودی)</option>
                <option value="title-desc">عنوان (نزولی)</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                showFilters
                  ? "bg-brand-medium-blue text-white border-brand-medium-blue"
                  : "border-brand-medium-gray text-brand-medium-blue hover:bg-brand-off-white"
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              فیلترها
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-brand-medium-gray grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  دسته‌بندی
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="all">همه</option>
                  {/* TODO: Add categories from API */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  وضعیت تایید
                </label>
                <select
                  value={filterVerified}
                  onChange={(e) => setFilterVerified(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="all">همه</option>
                  <option value="verified">تایید شده</option>
                  <option value="unverified">تایید نشده</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  دسترسی
                </label>
                <select
                  value={filterPublic}
                  onChange={(e) => setFilterPublic(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="all">همه</option>
                  <option value="public">عمومی</option>
                  <option value="private">خصوصی</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  امتیاز
                </label>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="all">همه</option>
                  <option value="rated">دارای امتیاز</option>
                  <option value="unrated">بدون امتیاز</option>
                  <option value="high">امتیاز بالا (4+)</option>
                  <option value="low">امتیاز پایین</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {filteredAndSortedPortfolios.length > 0 && (
          <div className="mb-4 text-sm text-brand-medium-blue">
            نمایش {filteredAndSortedPortfolios.length} از {portfolios.length} نمونه کار
          </div>
        )}

        {/* Portfolios Grid/List */}
        {filteredAndSortedPortfolios.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center">
            <p className="text-brand-medium-blue mb-4">
              {searchQuery || filterCategory !== "all" || filterVerified !== "all" || filterPublic !== "all" || filterRating !== "all"
                ? "نتیجه‌ای یافت نشد"
                : "هنوز نمونه کاری ثبت نکرده‌اید"}
            </p>
            {!searchQuery && filterCategory === "all" && filterVerified === "all" && filterPublic === "all" && filterRating === "all" && (
              <Link href="/dashboard/supplier/portfolio/create">
                <Button variant="primary">
                  <PlusCircleIcon className="w-5 h-5 ml-2" />
                  ثبت اولین نمونه کار
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredAndSortedPortfolios.map((portfolio) => {
              const hasLink = !!reviewLinks[portfolio.id];
              const isGenerating = isGeneratingLink[portfolio.id];

              return (
                <div key={portfolio.id} className="relative">
                  <PortfolioCard 
                    portfolio={portfolio} 
                    isSupplierView={true}
                    showActions={true}
                    onEdit={(p) => router.push(`/dashboard/supplier/portfolio/${p.id}/edit`)}
                    onDelete={handleDeleteClick}
                  />
                  
                  {/* Review Link Section */}
                  <div className="mt-2">
                    {hasLink ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={reviewLinks[portfolio.id]}
                          readOnly
                          className="flex-1 px-3 py-2 text-xs border border-brand-medium-gray rounded-lg bg-brand-off-white"
                        />
                        <button
                          onClick={() => handleCopyLink(portfolio.id)}
                          className="px-3 py-2 bg-brand-medium-blue text-white rounded-lg hover:bg-brand-dark-blue transition-colors text-sm"
                        >
                          کپی
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateReviewLink(portfolio)}
                        disabled={isGenerating}
                        className="w-full px-4 py-2 text-sm bg-brand-light-sky text-brand-medium-blue rounded-lg hover:bg-brand-medium-blue hover:text-white transition-colors flex items-center justify-center gap-2 border border-brand-medium-gray disabled:opacity-50"
                      >
                        <ShareIcon className="w-4 h-4" />
                        {isGenerating ? "در حال ایجاد لینک..." : "ایجاد لینک ثبت نظر"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteDialog}
          title="حذف نمونه کار"
          message={`آیا از حذف نمونه کار "${portfolioToDelete?.title}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`}
          confirmText="حذف"
          cancelText="انصراف"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onClose={handleDeleteCancel}
        />

      </div>
    </div>
  );
}

