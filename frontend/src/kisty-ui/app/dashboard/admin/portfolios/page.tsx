"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../../components/Button";
import { Portfolio } from "../../../types/portfolio";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Check if portfolio is complete (has all required fields)
const isPortfolioComplete = (portfolio: Portfolio): boolean => {
  return !!(
    portfolio.title &&
    portfolio.title.trim() &&
    portfolio.categoryId &&
    portfolio.completionDate &&
    portfolio.description &&
    portfolio.description.trim() &&
    portfolio.images &&
    portfolio.images.length > 0
  );
};

export default function AdminPortfoliosPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getPendingPortfolios(page, limit);
        const allPortfolios = Array.isArray(response.data) ? response.data : [];
        // Filter only complete portfolios
        const completePortfolios = allPortfolios.filter(isPortfolioComplete);
        setPortfolios(completePortfolios);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
        
        if (allPortfolios.length > 0 && completePortfolios.length === 0) {
          toast("هیچ نمونه کار تکمیل شده‌ای برای تایید وجود ندارد", { 
            duration: 3000,
            icon: "ℹ️"
          });
        }
      } catch (error: unknown) {
        logger.error("Error fetching pending portfolios", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت نمونه کارها";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchPortfolios();
    }
  }, [isAuthenticated, currentUser, page, limit]);

  const handleVerify = async (id: string) => {
    try {
      setProcessingId(id);
      await apiClient.verifyPortfolio(id);
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
      toast.success("نمونه کار تایید شد");
    } catch (error: unknown) {
      logger.error("Error verifying portfolio", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در تایید نمونه کار";
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnverify = async (id: string) => {
    try {
      setProcessingId(id);
      await apiClient.unverifyPortfolio(id);
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success("تایید نمونه کار لغو شد");
    } catch (error: unknown) {
      logger.error("Error unverifying portfolio", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در لغو تایید نمونه کار";
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filteredPortfolios = useMemo(() => {
    if (!searchQuery.trim()) {
      return portfolios;
    }
    const query = searchQuery.toLowerCase();
    return portfolios.filter((portfolio) =>
      portfolio.title.toLowerCase().includes(query) ||
      portfolio.description?.toLowerCase().includes(query) ||
      portfolio.supplier?.fullName?.toLowerCase().includes(query)
    );
  }, [portfolios, searchQuery]);

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
            مدیریت نمونه کارها
          </h1>
          <p className="text-brand-medium-blue">
            نمونه کارهای تکمیل شده در انتظار تایید
          </p>
          <p className="text-sm text-brand-medium-gray mt-1">
            فقط نمونه کارهای تکمیل شده (دارای عنوان، دسته‌بندی، تاریخ، توضیحات و تصویر) نمایش داده می‌شوند
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray" />
            <input
              type="text"
              placeholder="جستجو در نمونه کارها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
            />
          </div>
        </div>

        {/* Portfolios List */}
        {filteredPortfolios.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center">
            <p className="text-brand-medium-blue">
              {searchQuery 
                ? "نتیجه‌ای یافت نشد" 
                : "هیچ نمونه کار تکمیل شده‌ای در انتظار تایید نیست"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-brand-medium-gray mt-2">
                نمونه کارهای ناقص در این لیست نمایش داده نمی‌شوند
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPortfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image */}
                  {portfolio.images && portfolio.images.length > 0 && (
                    <div className="flex-shrink-0">
                      <img
                        src={portfolio.images[0]?.imageUrl || ""}
                        alt={portfolio.title}
                        className="w-full md:w-32 h-32 object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-brand-dark-blue mb-1">
                          {portfolio.title}
                        </h3>
                        <p className="text-sm text-brand-medium-blue mb-2">
                          توسط: {portfolio.supplier?.fullName || "نامشخص"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          portfolio.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {portfolio.isVerified ? "تایید شده" : "در انتظار تایید"}
                      </span>
                    </div>

                    <p className="text-brand-medium-blue mb-4 line-clamp-2">
                      {portfolio.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {portfolio.category && (
                        <span className="px-2 py-1 bg-brand-off-white text-brand-dark-blue rounded text-sm">
                          {portfolio.category.title}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-brand-off-white text-brand-dark-blue rounded text-sm">
                        {formatDate(portfolio.createdAt)}
                      </span>
                      {portfolio.viewCount > 0 && (
                        <span className="px-2 py-1 bg-brand-off-white text-brand-dark-blue rounded text-sm">
                          {portfolio.viewCount} بازدید
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/supplier/portfolio/${portfolio.id}`}>
                        <Button
                          variant="neutral"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <EyeIcon className="w-4 h-4" />
                          مشاهده
                        </Button>
                      </Link>
                      {!portfolio.isVerified && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleVerify(portfolio.id)}
                          disabled={processingId === portfolio.id}
                          isLoading={processingId === portfolio.id}
                          className="flex items-center gap-2"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          تایید
                        </Button>
                      )}
                      {portfolio.isVerified && (
                        <Button
                          variant="neutral"
                          size="sm"
                          onClick={() => handleUnverify(portfolio.id)}
                          disabled={processingId === portfolio.id}
                          isLoading={processingId === portfolio.id}
                          className="flex items-center gap-2"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          لغو تایید
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isLoading}
            >
              <ChevronRightIcon className="w-4 h-4 ml-1" />
              قبلی
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-medium-blue">
                صفحه {page} از {totalPages}
              </span>
              <span className="text-sm text-brand-medium-gray">
                (مجموع {total} نمونه کار)
              </span>
            </div>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || isLoading}
            >
              بعدی
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

