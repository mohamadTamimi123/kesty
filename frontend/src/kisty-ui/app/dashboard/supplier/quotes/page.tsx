"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../../components/Button";
import { Quote, QuoteStatus } from "../../../types/quote";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

const getStatusBadge = (status: QuoteStatus) => {
  switch (status) {
    case QuoteStatus.ACCEPTED:
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-300 flex items-center gap-1">
          <CheckCircleIcon className="w-4 h-4" />
          پذیرفته شده
        </span>
      );
    case QuoteStatus.REJECTED:
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium border border-red-300 flex items-center gap-1">
          <XCircleIcon className="w-4 h-4" />
          رد شده
        </span>
      );
    case QuoteStatus.WITHDRAWN:
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium border border-gray-300 flex items-center gap-1">
          لغو شده
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300 flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          در انتظار
        </span>
      );
  }
};

export default function SupplierQuotesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | 'ALL'>('ALL');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const data = await apiClient.getMyQuotes();
      setQuotes(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error("Error fetching quotes", error);
      toast.error("خطا در دریافت پیشنهادات");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuotes();
    }
  }, [isAuthenticated, fetchQuotes]);

  const handleWithdraw = async (quoteId: string) => {
    try {
      await apiClient.withdrawQuote(quoteId);
      toast.success("پیشنهاد با موفقیت لغو شد");
      fetchQuotes();
    } catch (error) {
      logger.error("Error withdrawing quote", error);
      toast.error("خطا در لغو پیشنهاد");
    }
  };

  const handleDelete = async (quoteId: string) => {
    try {
      await apiClient.deleteQuote(quoteId);
      toast.success("پیشنهاد با موفقیت حذف شد");
      setShowDeleteModal(null);
      fetchQuotes();
    } catch (error) {
      logger.error("Error deleting quote", error);
      toast.error("خطا در حذف پیشنهاد");
    }
  };

  const filteredQuotes = quotes.filter((quote) => 
    filterStatus === 'ALL' || quote.status === filterStatus
  );

  const stats = {
    total: quotes.length,
    pending: quotes.filter((q) => q.status === QuoteStatus.PENDING).length,
    accepted: quotes.filter((q) => q.status === QuoteStatus.ACCEPTED).length,
    rejected: quotes.filter((q) => q.status === QuoteStatus.REJECTED).length,
  };

  if (isLoading) {
    return (
      <div className="text-center text-brand-medium-blue py-12">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/supplier"
          className="text-brand-medium-blue hover:text-brand-dark-blue mb-4 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          بازگشت به داشبورد
        </Link>
        <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
          مدیریت پیشنهادات
        </h1>
        <p className="text-brand-medium-blue">
          مشاهده و مدیریت پیشنهادات ارسال شده
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <div className="text-3xl font-bold text-brand-dark-blue mb-1">
            {stats.total}
          </div>
          <div className="text-sm text-brand-medium-blue">کل پیشنهادات</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <div className="text-3xl font-bold text-yellow-600 mb-1">
            {stats.pending}
          </div>
          <div className="text-sm text-brand-medium-blue">در انتظار</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {stats.accepted}
          </div>
          <div className="text-sm text-brand-medium-blue">پذیرفته شده</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
          <div className="text-3xl font-bold text-red-600 mb-1">
            {stats.rejected}
          </div>
          <div className="text-sm text-brand-medium-blue">رد شده</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-brand-medium-gray">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-brand-medium-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            همه ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus(QuoteStatus.PENDING)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === QuoteStatus.PENDING
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            در انتظار ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus(QuoteStatus.ACCEPTED)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === QuoteStatus.ACCEPTED
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            پذیرفته شده ({stats.accepted})
          </button>
          <button
            onClick={() => setFilterStatus(QuoteStatus.REJECTED)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === QuoteStatus.REJECTED
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            رد شده ({stats.rejected})
          </button>
        </div>
      </div>

      {/* Quotes List */}
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="p-12 text-center">
            <ClockIcon className="w-16 h-16 text-brand-medium-gray mx-auto mb-4" />
            <p className="text-brand-medium-blue mb-2">
              {filterStatus === 'ALL' 
                ? 'شما هنوز پیشنهادی ارسال نکرده‌اید'
                : 'پیشنهادی با این وضعیت وجود ندارد'}
            </p>
            {filterStatus === 'ALL' && (
              <Link href="/dashboard/supplier/projects">
                <Button variant="primary" size="sm">
                  مشاهده پروژه‌ها
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-brand-medium-gray">
            {filteredQuotes.map((quote) => (
              <div key={quote.id} className="p-6 hover:bg-brand-off-white transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-brand-dark-blue">
                        {quote.project?.title || 'پروژه بدون عنوان'}
                      </h3>
                      {getStatusBadge(quote.status)}
                    </div>
                    <p className="text-sm text-brand-medium-blue mb-3">
                      {quote.description || 'بدون توضیحات'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-brand-medium-blue">
                      <span className="font-semibold text-brand-dark-blue">
                        قیمت: {formatPrice(quote.price)}
                      </span>
                      {quote.deliveryTimeDays && (
                        <span>زمان تحویل: {quote.deliveryTimeDays} روز</span>
                      )}
                      <span>تاریخ ارسال: {formatDate(quote.createdAt)}</span>
                      {quote.project?.category && (
                        <span>دسته‌بندی: {quote.project.category.title}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mr-4">
                    {quote.status === QuoteStatus.PENDING && (
                      <>
                        <Link href={`/dashboard/supplier/projects/${quote.projectId}/quote`}>
                          <Button variant="secondary" size="sm" className="flex items-center gap-2">
                            <PencilIcon className="w-4 h-4" />
                            ویرایش
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWithdraw(quote.id)}
                          className="flex items-center gap-2"
                        >
                          لغو پیشنهاد
                        </Button>
                      </>
                    )}
                    {quote.status === QuoteStatus.ACCEPTED && (
                      <Link href={`/dashboard/supplier/projects/${quote.projectId}/quote`}>
                        <Button variant="primary" size="sm" className="flex items-center gap-2">
                          <EyeIcon className="w-4 h-4" />
                          مشاهده پروژه
                        </Button>
                      </Link>
                    )}
                    {quote.status === QuoteStatus.PENDING && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowDeleteModal(quote.id)}
                        className="flex items-center gap-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                        حذف
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-brand-dark-blue mb-4">
              حذف پیشنهاد
            </h3>
            <p className="text-brand-medium-blue mb-6">
              آیا مطمئن هستید که می‌خواهید این پیشنهاد را حذف کنید؟ این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(null)}
              >
                انصراف
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(showDeleteModal)}
              >
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

