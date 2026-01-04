"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../../../../components/Button";
import { Project, ProjectStatus } from "../../../../../types/project";
import { Quote, QuoteStatus } from "../../../../../types/quote";
import apiClient from "../../../../../lib/api";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useChat } from "../../../../../contexts/ChatContext";
import toast from "react-hot-toast";
import logger from "../../../../../utils/logger";
import ConfirmationDialog from "../../../../../components/ConfirmationDialog";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon,
  MapPinIcon,
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
    default:
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300 flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          در انتظار
        </span>
      );
  }
};

type SortOption = 'price-asc' | 'price-desc' | 'rating-desc' | 'delivery-asc' | 'date-desc';

export default function QuotesComparisonPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { user, isAuthenticated } = useAuth();
  const { 
    openChatModal, 
    openChatSidebar,
    createConversation, 
    conversations,
    messages,
    setQuoteContext,
    sendInitialQuoteMessage,
  } = useChat();

  const [project, setProject] = useState<Project | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteStats, setQuoteStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | 'ALL'>('ALL');
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [quoteIdToAccept, setQuoteIdToAccept] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const [projectData, quotesData, statsData] = await Promise.all([
        apiClient.getProjectById(projectId),
        apiClient.getQuotesForProject(projectId),
        apiClient.getQuoteStats(projectId).catch(() => null),
      ]);
      
      setProject(projectData);
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      setQuoteStats(statsData);
    } catch (error) {
      logger.error("Error fetching data", error);
      toast.error("خطا در دریافت اطلاعات");
      router.push("/dashboard/customer/projects");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchData();
    }
  }, [isAuthenticated, projectId, fetchData]);

  const handleAcceptQuote = (quoteId: string) => {
    setQuoteIdToAccept(quoteId);
    setShowAcceptDialog(true);
  };

  const confirmAcceptQuote = async () => {
    if (!quoteIdToAccept || !projectId) return;

    try {
      await apiClient.acceptQuote(quoteIdToAccept);
      toast.success("پیشنهاد با موفقیت پذیرفته شد");
      
      // Refresh data
      await fetchData();
      
      // Create invoice when project status is IN_PROGRESS
      try {
        const projectData = await apiClient.getProjectById(projectId);
        if (projectData.status === 'IN_PROGRESS') {
          await apiClient.createInvoice(projectId, quoteIdToAccept);
          toast.success("فاکتور با موفقیت ایجاد شد");
        }
      } catch (invoiceError) {
        logger.error("Error creating invoice", invoiceError);
        // Don't show error toast for invoice creation failure
        // Invoice might be created automatically by backend
      }
      
      setShowAcceptDialog(false);
      setQuoteIdToAccept(null);
    } catch (error) {
      logger.error("Error accepting quote", error);
      toast.error("خطا در پذیرش پیشنهاد");
      setShowAcceptDialog(false);
      setQuoteIdToAccept(null);
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try {
      await apiClient.rejectQuote(quoteId);
      toast.success("پیشنهاد رد شد");
      fetchData();
    } catch (error) {
      logger.error("Error rejecting quote", error);
      toast.error("خطا در رد پیشنهاد");
    }
  };

  const handleStartChat = async (quote: Quote) => {
    try {
      // Set quote context
      setQuoteContext(quote);

      const supplierId = quote.supplierId;
      const existingConversation = conversations.find(
        (conv: any) => 
          (conv.customerId === user?.id && conv.supplierId === supplierId) ||
          (conv.customerId === supplierId && conv.supplierId === user?.id)
      );

      if (existingConversation) {
        // Open sidebar first to trigger message loading
        // openChatSidebar will call setActiveConversation internally
        openChatSidebar(existingConversation.id);
        
        // Wait for messages to be loaded with retry logic
        let retries = 0;
        while (retries < 5) {
          await new Promise(resolve => setTimeout(resolve, 200));
          const existingMessages = messages[existingConversation.id] || [];
          
          // If messages are loaded or max retries reached, check and send
          if (existingMessages.length > 0 || retries === 4) {
            const hasQuoteMessage = existingMessages.some(
              (msg: any) => msg.content?.includes(quote.description || '') ||
                           msg.content?.includes('پیشنهاد') ||
                           msg.content?.includes('قیمت')
            );

            if (!hasQuoteMessage && quote.description) {
              // Send initial message if not already sent
              await sendInitialQuoteMessage(existingConversation.id, quote);
            }
            break;
          }
          retries++;
        }
      } else {
        const newConversation = await createConversation(supplierId, projectId);
        if (newConversation) {
          // Open sidebar first (will call setActiveConversation internally)
          openChatSidebar(newConversation.id);
          
          // Wait for conversation and messages to be ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Send initial message with quote description
          if (quote.description) {
            await sendInitialQuoteMessage(newConversation.id, quote);
          }
        }
      }
    } catch (error) {
      logger.error("Error starting chat", error);
      toast.error("خطا در شروع مکالمه");
    }
  };

  const sortedAndFilteredQuotes = quotes
    .filter((quote) => filterStatus === 'ALL' || quote.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return Number(a.price) - Number(b.price);
        case 'price-desc':
          return Number(b.price) - Number(a.price);
        case 'rating-desc':
          const ratingA = a.supplier?.rating || 0;
          const ratingB = b.supplier?.rating || 0;
          return ratingB - ratingA;
        case 'delivery-asc':
          const deliveryA = a.deliveryTimeDays || Infinity;
          const deliveryB = b.deliveryTimeDays || Infinity;
          return deliveryA - deliveryB;
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="text-center text-brand-medium-blue py-12">
        در حال بارگذاری...
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/customer/projects/${projectId}`}
          className="text-brand-medium-blue hover:text-brand-dark-blue mb-4 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          بازگشت به پروژه
        </Link>
        <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
          مقایسه پیشنهادات
        </h1>
        <p className="text-brand-medium-blue">
          {project.title}
        </p>
      </div>

      {/* Stats */}
      {quoteStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <div className="text-3xl font-bold text-brand-dark-blue mb-1">
              {quoteStats.total}
            </div>
            <div className="text-sm text-brand-medium-blue">کل پیشنهادات</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {quoteStats.pending}
            </div>
            <div className="text-sm text-brand-medium-blue">در انتظار</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {quoteStats.accepted}
            </div>
            <div className="text-sm text-brand-medium-blue">پذیرفته شده</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <div className="text-2xl font-bold text-brand-dark-blue mb-1">
              {formatPrice(quoteStats.averagePrice)}
            </div>
            <div className="text-sm text-brand-medium-blue">میانگین قیمت</div>
            <div className="text-xs text-brand-medium-blue mt-1">
              کمترین: {formatPrice(quoteStats.minPrice)} • بیشترین: {formatPrice(quoteStats.maxPrice)}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-brand-medium-gray">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1">
            <label className="text-sm font-medium text-brand-dark-blue mb-2 block">
              مرتب‌سازی:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full md:w-auto px-4 py-2 border border-brand-medium-gray rounded-lg focus:ring-2 focus:ring-brand-medium-blue focus:border-transparent"
            >
              <option value="price-asc">قیمت: کم به زیاد</option>
              <option value="price-desc">قیمت: زیاد به کم</option>
              <option value="rating-desc">رتبه: بالا به پایین</option>
              <option value="delivery-asc">زمان تحویل: کوتاه به بلند</option>
              <option value="date-desc">تاریخ: جدید به قدیم</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-brand-dark-blue mb-2 block">
              فیلتر وضعیت:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-brand-medium-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                همه
              </button>
              <button
                onClick={() => setFilterStatus(QuoteStatus.PENDING)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === QuoteStatus.PENDING
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                در انتظار
              </button>
              <button
                onClick={() => setFilterStatus(QuoteStatus.ACCEPTED)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === QuoteStatus.ACCEPTED
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                پذیرفته شده
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quotes Comparison Table */}
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
        {sortedAndFilteredQuotes.length === 0 ? (
          <div className="p-12 text-center">
            <ClockIcon className="w-16 h-16 text-brand-medium-gray mx-auto mb-4" />
            <p className="text-brand-medium-blue mb-2">
              {filterStatus === 'ALL' 
                ? 'هنوز پیشنهادی دریافت نشده است'
                : 'پیشنهادی با این وضعیت وجود ندارد'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-off-white border-b border-brand-medium-gray">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">تولیدکننده</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">قیمت</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">زمان تحویل</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">رتبه</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">وضعیت</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-medium-gray">
                {sortedAndFilteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-brand-off-white transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-brand-dark-blue">
                          {quote.supplier?.workshopName || quote.supplier?.fullName || 'تولیدکننده'}
                        </div>
                        {quote.description && (
                          <div className="text-sm text-brand-medium-blue mt-1 line-clamp-2">
                            {quote.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-dark-blue">
                        {formatPrice(quote.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-brand-medium-blue">
                        {quote.deliveryTimeDays ? `${quote.deliveryTimeDays} روز` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {quote.supplier?.rating ? (
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{quote.supplier.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-brand-medium-gray">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(quote.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {quote.status === QuoteStatus.PENDING && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAcceptQuote(quote.id)}
                            >
                              پذیرش
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectQuote(quote.id)}
                            >
                              رد
                            </Button>
                          </>
                        )}
                        {quote.supplierId && (
                          <Button
                            variant="neutral"
                            size="sm"
                            onClick={() => handleStartChat(quote)}
                          >
                            پیام
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accept Quote Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showAcceptDialog}
        title="پذیرش پیشنهاد"
        message="آیا مطمئن هستید که می‌خواهید این پیشنهاد را بپذیرید؟ با پذیرش این پیشنهاد، سایر پیشنهادات رد می‌شوند."
        confirmText="پذیرش پیشنهاد"
        cancelText="انصراف"
        onConfirm={confirmAcceptQuote}
        onClose={() => {
          setShowAcceptDialog(false);
          setQuoteIdToAccept(null);
        }}
        variant="warning"
      />
    </div>
  );
}

