"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReviewRequestCard from "../../../../components/ReviewRequestCard";
import { ReviewRequest, ReviewRequestStatus, CreateReviewRequestData } from "../../../../types/review";
import { Portfolio } from "../../../../types/portfolio";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import ConfirmationDialog from "../../../../components/ConfirmationDialog";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ChartBarIcon,
  PlusCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type SortOption = "date-desc" | "date-asc" | "status-asc" | "status-desc";

export default function SupplierReviewRequestsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPortfolio, setFilterPortfolio] = useState<string>("all");
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
  const [requestMessage, setRequestMessage] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getSupplierReviewRequests();
        setRequests(Array.isArray(response) ? response : []);
      } catch (error: unknown) {
        logger.error("Error fetching review requests", error);
        // Only show error if it's not a 500/404 (table doesn't exist)
        const status = (error as any)?.response?.status;
        if (status !== 500 && status !== 404) {
          const errorMessage =
            (error as any)?.response?.data?.message || "خطا در دریافت درخواست‌ها";
          toast.error(errorMessage);
        }
        // Set empty array on error to prevent UI breakage
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPortfolios = async () => {
      try {
        const response = await apiClient.getMyPortfolios();
        // Only show portfolios that have a customerId
        const portfoliosWithCustomers = (Array.isArray(response) ? response : []).filter(
          (p: Portfolio) => p.customerId
        );
        setPortfolios(portfoliosWithCustomers);
        
        if (portfoliosWithCustomers.length === 0 && Array.isArray(response) && response.length > 0) {
          toast.error("هیچ نمونه کاری با مشتری یافت نشد. لطفا ابتدا مشتری را به نمونه کار اضافه کنید.", {
            duration: 5000,
          });
        }
      } catch (error: unknown) {
        logger.error("Error fetching portfolios", error);
        const errorMessage =
          (error as any)?.response?.data?.message || "خطا در دریافت نمونه کارها";
        toast.error(errorMessage);
      }
    };

    if (isAuthenticated) {
      fetchRequests();
      fetchPortfolios();
    }
  }, [isAuthenticated]);

  const handleCancelRequest = async () => {
    if (!cancelRequestId) return;

    try {
      await apiClient.cancelReviewRequest(cancelRequestId);
      toast.success("درخواست با موفقیت لغو شد");
      setRequests(requests.filter((req) => req.id !== cancelRequestId));
      setShowCancelDialog(false);
      setCancelRequestId(null);
    } catch (error: unknown) {
      logger.error("Error cancelling review request", error);
      const errorMessage =
        (error as any)?.response?.data?.message || "خطا در لغو درخواست";
      toast.error(errorMessage);
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedPortfolioId) {
      toast.error("لطفا نمونه کار را انتخاب کنید");
      return;
    }

    const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId);
    if (!selectedPortfolio) {
      toast.error("نمونه کار انتخاب شده یافت نشد");
      return;
    }

    if (!selectedPortfolio.customerId) {
      toast.error("این نمونه کار مشتری ندارد. لطفا ابتدا مشتری را به نمونه کار اضافه کنید.");
      return;
    }

    try {
      setIsCreating(true);
      const data: CreateReviewRequestData = {
        portfolioId: selectedPortfolioId,
        customerId: selectedPortfolio.customerId,
        message: requestMessage.trim() || undefined,
      };

      const newRequest = await apiClient.createReviewRequest(data);
      toast.success("درخواست با موفقیت ایجاد شد");
      setRequests([newRequest, ...requests]);
      setShowCreateModal(false);
      setSelectedPortfolioId("");
      setRequestMessage("");
      
      // Refresh the requests list to get the latest data
      try {
        const response = await apiClient.getSupplierReviewRequests();
        setRequests(Array.isArray(response) ? response : []);
      } catch (refreshError) {
        logger.error("Error refreshing requests", refreshError);
      }
    } catch (error: unknown) {
      logger.error("Error creating review request", error);
      
      // Handle specific error cases
      const axiosError = error as any;
      let errorMessage = "خطا در ایجاد درخواست";
      
      if (axiosError?.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || "درخواست نامعتبر است. لطفا اطلاعات را بررسی کنید.";
        } else if (status === 401) {
          errorMessage = "احراز هویت شما منقضی شده است. لطفا دوباره وارد شوید.";
          // Don't redirect here, let the interceptor handle it
        } else if (status === 403) {
          errorMessage = "شما دسترسی لازم برای این عملیات را ندارید.";
        } else if (status === 404) {
          errorMessage = "نمونه کار یافت نشد.";
        } else {
          errorMessage = data?.message || `خطا در ایجاد درخواست (کد خطا: ${status})`;
        }
      } else if (axiosError?.message) {
        errorMessage = axiosError.message;
      }
      
      toast.error(errorMessage);
      // Keep modal open so user can fix the issue
    } finally {
      setIsCreating(false);
    }
  };

  const filteredAndSortedRequests = requests
    .filter((request) => {
      const matchesSearch =
        request.portfolio?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.customer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.message?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || request.status === filterStatus;

      const matchesPortfolio =
        filterPortfolio === "all" ||
        request.portfolioId === filterPortfolio;

      return matchesSearch && matchesStatus && matchesPortfolio;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "status-asc":
          return a.status.localeCompare(b.status);
        case "status-desc":
          return b.status.localeCompare(a.status);
        default:
          return 0;
      }
    });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === ReviewRequestStatus.PENDING).length,
    accepted: requests.filter((r) => r.status === ReviewRequestStatus.ACCEPTED).length,
    rejected: requests.filter((r) => r.status === ReviewRequestStatus.REJECTED).length,
    expired: requests.filter((r) => r.status === ReviewRequestStatus.EXPIRED).length,
  };

  const uniquePortfolios = Array.from(
    new Map(
      requests
        .map((r) => [r.portfolioId, r.portfolio] as [string, typeof r.portfolio])
        .filter(([id]) => id)
    ).values()
  ).filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-brand-medium-blue py-12">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display">
            درخواست‌های نظر
          </h1>
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusCircleIcon className="w-5 h-5" />
            ایجاد درخواست جدید
          </Button>
        </div>

        {/* Stats Cards */}
        {requests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-5 h-5 text-brand-medium-blue" />
                <span className="text-sm text-brand-medium-blue">کل درخواست‌ها</span>
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">{stats.total}</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-brand-medium-blue">در انتظار</span>
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">{stats.pending}</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm text-brand-medium-blue">پذیرفته شده</span>
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">{stats.accepted}</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
              <div className="flex items-center gap-2 mb-2">
                <XCircleIcon className="w-5 h-5 text-red-500" />
                <span className="text-sm text-brand-medium-blue">رد شده</span>
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">{stats.rejected}</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-brand-medium-blue">منقضی شده</span>
              </div>
              <div className="text-2xl font-bold text-brand-dark-blue">{stats.expired}</div>
            </div>
          </div>
        )}

        {/* Search and Filters Bar */}
        {requests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray" />
                <input
                  type="text"
                  placeholder="جستجو در درخواست‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                />
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
                  <option value="status-asc">وضعیت (صعودی)</option>
                  <option value="status-desc">وضعیت (نزولی)</option>
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
              <div className="mt-4 pt-4 border-t border-brand-medium-gray grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                    وضعیت
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                  >
                    <option value="all">همه</option>
                    <option value={ReviewRequestStatus.PENDING}>در انتظار</option>
                    <option value={ReviewRequestStatus.ACCEPTED}>پذیرفته شده</option>
                    <option value={ReviewRequestStatus.REJECTED}>رد شده</option>
                    <option value={ReviewRequestStatus.EXPIRED}>منقضی شده</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                    نمونه کار
                  </label>
                  <select
                    value={filterPortfolio}
                    onChange={(e) => setFilterPortfolio(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                  >
                    <option value="all">همه</option>
                    {uniquePortfolios.map((portfolio) => (
                      <option key={portfolio.id} value={portfolio.id}>
                        {portfolio.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {filteredAndSortedRequests.length > 0 && (
          <div className="mb-4 text-sm text-brand-medium-blue">
            نمایش {filteredAndSortedRequests.length} از {requests.length} درخواست
          </div>
        )}

        {/* Requests List */}
        {filteredAndSortedRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center">
            <p className="text-brand-medium-blue mb-4">
              {searchQuery || filterStatus !== "all" || filterPortfolio !== "all"
                ? "نتیجه‌ای یافت نشد"
                : "هنوز درخواست نظری ایجاد نکرده‌اید"}
            </p>
            {requests.length === 0 && (
              <Link href="/dashboard/supplier/portfolio">
                <Button variant="primary" size="sm" className="mt-4">
                  ایجاد اولین درخواست
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedRequests.map((request) => (
              <ReviewRequestCard
                key={request.id}
                request={request}
                onCancel={(requestId) => {
                  setCancelRequestId(requestId);
                  setShowCancelDialog(true);
                }}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false);
          setCancelRequestId(null);
        }}
        onConfirm={handleCancelRequest}
        title="لغو درخواست"
        message="آیا از لغو این درخواست اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmText="لغو درخواست"
        cancelText="انصراف"
        variant="danger"
      />

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-brand-dark-blue">ایجاد درخواست نظر</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedPortfolioId("");
                  setRequestMessage("");
                }}
                className="text-brand-medium-gray hover:text-brand-dark-blue"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {portfolios.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ هیچ نمونه کاری با مشتری یافت نشد. برای ایجاد درخواست نظر، ابتدا باید مشتری را به نمونه کار اضافه کنید.
                  </p>
                  <Link
                    href="/dashboard/supplier/portfolio"
                    className="text-sm text-brand-medium-blue hover:underline mt-2 inline-block"
                  >
                    رفتن به صفحه نمونه کارها →
                  </Link>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  نمونه کار <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPortfolioId}
                  onChange={(e) => setSelectedPortfolioId(e.target.value)}
                  disabled={portfolios.length === 0}
                  className="w-full px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">انتخاب نمونه کار</option>
                  {portfolios.map((portfolio) => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.title}
                      {portfolio.customerName && ` - ${portfolio.customerName}`}
                    </option>
                  ))}
                </select>
                {portfolios.length === 0 && (
                  <p className="text-xs text-brand-medium-blue mt-2">
                    لطفا ابتدا به{" "}
                    <Link
                      href="/dashboard/supplier/portfolio"
                      className="text-brand-medium-blue hover:underline font-medium"
                    >
                      صفحه نمونه کارها
                    </Link>
                    {" "}بروید و مشتری را به نمونه کار اضافه کنید.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  پیام (اختیاری)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="پیام خود را برای مشتری بنویسید..."
                  rows={4}
                  className="w-full px-3 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="neutral"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedPortfolioId("");
                    setRequestMessage("");
                  }}
                  disabled={isCreating}
                >
                  انصراف
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateRequest}
                  disabled={isCreating || !selectedPortfolioId}
                  isLoading={isCreating}
                >
                  ایجاد درخواست
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

