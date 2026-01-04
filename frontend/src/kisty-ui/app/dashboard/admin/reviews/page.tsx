"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileLayout from "../../../components/MobileLayout";
import Button from "../../../components/Button";
import DeleteConfirmDialog from "../../../components/DeleteConfirmDialog";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { Review } from "../../../types/review";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function ReviewsManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    type: "approve" | "reject" | "delete" | null;
    review: Review | null;
  }>({
    isOpen: false,
    type: null,
    review: null,
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

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        // Fetch all reviews - we'll filter pending ones
        const pendingReviews = await apiClient.getPendingReviews();
        // Also fetch supplier reviews to get all reviews
        const supplierReviews = await apiClient.getSupplierReviews();
        const allReviews = [
          ...(Array.isArray(pendingReviews) ? pendingReviews : []),
          ...(Array.isArray(supplierReviews) ? supplierReviews : []),
        ];
        // Remove duplicates
        const uniqueReviews = Array.from(
          new Map(allReviews.map((r) => [r.id, r])).values()
        );
        setReviews(uniqueReviews);
      } catch (error: unknown) {
        logger.error("Error fetching reviews", error);
        toast.error("خطا در دریافت لیست نظرات");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "ADMIN")) {
      fetchReviews();
    }
  }, [isAuthenticated, currentUser]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    // Status filter
    if (statusFilter === "approved") {
      filtered = filtered.filter((r) => r.isApproved);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((r) => !r.isApproved && !r.isDeleted);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.customer?.fullName && r.customer.fullName.toLowerCase().includes(query)) ||
          (r.supplier?.fullName && r.supplier.fullName.toLowerCase().includes(query)) ||
          (r.comment && r.comment.toLowerCase().includes(query)) ||
          (r.portfolio?.title && r.portfolio.title.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [reviews, searchQuery, statusFilter]);

  const handleApprove = (review: Review) => {
    setActionDialog({ isOpen: true, type: "approve", review });
  };

  const handleReject = (review: Review) => {
    setActionDialog({ isOpen: true, type: "reject", review });
  };

  const handleDelete = (review: Review) => {
    setActionDialog({ isOpen: true, type: "delete", review });
  };

  const confirmAction = async () => {
    if (!actionDialog.review || !actionDialog.type) return;

    try {
      if (actionDialog.type === "approve") {
        await apiClient.approveReview(actionDialog.review.id);
        toast.success("نظر با موفقیت تایید شد");
        setReviews(
          reviews.map((r) =>
            r.id === actionDialog.review!.id ? { ...r, isApproved: true } : r
          )
        );
      } else if (actionDialog.type === "reject") {
        await apiClient.rejectReview(actionDialog.review.id);
        toast.success("نظر با موفقیت رد شد");
        setReviews(
          reviews.map((r) =>
            r.id === actionDialog.review!.id ? { ...r, isApproved: false } : r
          )
        );
      } else if (actionDialog.type === "delete") {
        await apiClient.deleteReview(actionDialog.review.id);
        toast.success("نظر با موفقیت حذف شد");
        setReviews(reviews.filter((r) => r.id !== actionDialog.review!.id));
      }
      setActionDialog({ isOpen: false, type: null, review: null });
    } catch (error: any) {
      logger.error("Error performing action", error);
      toast.error(error.response?.data?.message || "خطا در انجام عملیات");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) =>
          star <= rating ? (
            <StarIconSolid key={star} className="w-4 h-4 text-yellow-500" />
          ) : (
            <StarIcon key={star} className="w-4 h-4 text-gray-300" />
          )
        )}
        <span className="text-sm text-brand-medium-blue mr-1">({rating})</span>
      </div>
    );
  };

  const stats = useMemo(() => {
    return {
      total: reviews.length,
      approved: reviews.filter((r) => r.isApproved).length,
      pending: reviews.filter((r) => !r.isApproved && !r.isDeleted).length,
      averageRating:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
    };
  }, [reviews]);

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
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
              مدیریت نظرات
            </h1>
            <p className="text-brand-medium-blue">مدیریت و نظارت بر نظرات پلتفرم</p>
          </div>

          <div className="flex gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="جستجو بر اساس نام مشتری، تولیدکننده، نظر یا عنوان پورتفولیو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-brand-dark-blue"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: "all", label: "همه" },
              { id: "approved", label: "تایید شده" },
              { id: "pending", label: "در انتظار تایید" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id as any)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusFilter === filter.id
                    ? "bg-brand-medium-blue text-white"
                    : "bg-white text-brand-dark-blue border border-brand-medium-gray hover:bg-brand-light-gray"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">{stats.total}</div>
            <div className="text-xs text-brand-medium-blue">کل نظرات</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.approved}</div>
            <div className="text-xs text-brand-medium-blue">تایید شده</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
            <div className="text-xs text-brand-medium-blue">در انتظار تایید</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="text-xs text-brand-medium-blue">میانگین امتیاز</div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-light-gray border-b border-brand-medium-gray">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    مشتری
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    تولیدکننده
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    امتیاز
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    نظر
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-brand-dark-blue">
                    تاریخ
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-brand-dark-blue">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-medium-blue">
                      نظری یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr
                      key={review.id}
                      className="border-b border-brand-medium-gray hover:bg-brand-light-sky transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm text-brand-dark-blue font-medium">
                          {review.customer?.fullName || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-brand-dark-blue font-medium">
                          {review.supplier?.fullName || "-"}
                        </div>
                        {review.portfolio?.title && (
                          <div className="text-xs text-brand-medium-blue">
                            {review.portfolio.title}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{renderStars(review.rating)}</td>
                      <td className="px-4 py-3">
                        {review.comment ? (
                          <div className="text-sm text-brand-dark-blue line-clamp-2 max-w-xs">
                            {review.comment}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">بدون نظر</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-medium-blue">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {!review.isApproved && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                className="p-2"
                                onClick={() => handleApprove(review)}
                                title="تایید"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="p-2"
                                onClick={() => handleReject(review)}
                                title="رد"
                              >
                                <XCircleIcon className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="neutral"
                            size="sm"
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(review)}
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

        {/* Action Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={actionDialog.isOpen}
          onClose={() => setActionDialog({ isOpen: false, type: null, review: null })}
          onConfirm={confirmAction}
          message={
            actionDialog.type === "approve"
              ? "آیا از تایید این نظر اطمینان دارید؟"
              : actionDialog.type === "reject"
              ? "آیا از رد این نظر اطمینان دارید؟"
              : actionDialog.type === "delete"
              ? "آیا از حذف این نظر اطمینان دارید؟ این عمل غیرقابل بازگشت است."
              : ""
          }
        />
      </div>
    </MobileLayout>
  );
}

