"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, DocumentTextIcon, BuildingOfficeIcon, StarIcon, MapPinIcon, TagIcon, CheckCircleIcon, XCircleIcon, ClockIcon, XMarkIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import MobileLayout from "../../../../components/MobileLayout";
import Button from "../../../../components/Button";
import { Project, ProjectStatus } from "../../../../types/project";
import { Quote, QuoteStatus } from "../../../../types/quote";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import { useChat } from "../../../../contexts/ChatContext";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import ConfirmationDialog from "../../../../components/ConfirmationDialog";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<ProjectStatus, string> = {
    [ProjectStatus.PENDING]: 'در انتظار',
    [ProjectStatus.IN_PROGRESS]: 'در حال انجام',
    [ProjectStatus.COMPLETED]: 'تکمیل شده',
    [ProjectStatus.CANCELLED]: 'لغو شده',
  };
  return labels[status];
};

const getStatusColor = (status: ProjectStatus): string => {
  const colors: Record<ProjectStatus, string> = {
    [ProjectStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [ProjectStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-300',
    [ProjectStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-300',
    [ProjectStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[status];
};

const getFileUrl = (fileUrl: string) => {
  if (fileUrl.startsWith('http')) return fileUrl;
  const apiUrl = typeof window !== 'undefined' 
    ? window.location.origin.replace(':3000', ':3001')
    : 'http://localhost:3001';
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${apiUrl}/api${path}`;
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const { openChatSidebar, createConversation, conversations } = useChat();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relevantSuppliers, setRelevantSuppliers] = useState<any[]>([]);
  const [excludedSuppliers, setExcludedSuppliers] = useState<any[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isLoadingExcludedSuppliers, setIsLoadingExcludedSuppliers] = useState(false);
  const [activeTab, setActiveTab] = useState<'relevant' | 'excluded'>('relevant');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteStats, setQuoteStats] = useState<any>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [quoteIdToAccept, setQuoteIdToAccept] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const projectData = await apiClient.getProjectById(projectId);
        setProject(projectData);
      } catch (error: unknown) {
        logger.error("Error fetching project", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت اطلاعات پروژه";
        toast.error(errorMessage);
        router.push("/dashboard/customer/projects");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && projectId) {
      fetchProject();
    }
  }, [isAuthenticated, projectId, router]);

  useEffect(() => {
    const fetchRelevantSuppliers = async () => {
      if (!projectId) return;
      
      try {
        setIsLoadingSuppliers(true);
        const response = await apiClient.getRelevantSuppliers(projectId);
        setRelevantSuppliers(response.suppliers || []);
      } catch (error: unknown) {
        logger.error("Error fetching relevant suppliers", error);
        // Don't show error toast, just log it
      } finally {
        setIsLoadingSuppliers(false);
      }
    };

    if (project) {
      fetchRelevantSuppliers();
    }
  }, [project, projectId]);

  useEffect(() => {
    const fetchExcludedSuppliers = async () => {
      if (!projectId || activeTab !== 'excluded') return;
      
      try {
        setIsLoadingExcludedSuppliers(true);
        const response = await apiClient.getExcludedSuppliers(projectId);
        setExcludedSuppliers(response.excludedSuppliers || []);
      } catch (error: unknown) {
        logger.error("Error fetching excluded suppliers", error);
        // Don't show error toast, just log it
      } finally {
        setIsLoadingExcludedSuppliers(false);
      }
    };

    if (project && activeTab === 'excluded') {
      fetchExcludedSuppliers();
    }
  }, [project, projectId, activeTab]);

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!projectId || project?.status !== ProjectStatus.PENDING) return;
      
      try {
        setIsLoadingQuotes(true);
        const [quotesData, statsData] = await Promise.all([
          apiClient.getQuotesForProject(projectId),
          apiClient.getQuoteStats(projectId).catch(() => null),
        ]);
        setQuotes(Array.isArray(quotesData) ? quotesData : []);
        setQuoteStats(statsData);
      } catch (error) {
        logger.error("Error fetching quotes", error);
      } finally {
        setIsLoadingQuotes(false);
      }
    };

    if (project) {
      fetchQuotes();
    }
  }, [project, projectId]);

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue py-12">
            در حال بارگذاری...
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!project) {
    return null;
  }

  const handleStartChat = async (supplierId: string) => {
    try {
      // Check if conversation already exists between this customer and supplier
      const existingConversation = conversations.find(
        (conv) => 
          (conv.customerId === user?.id && conv.supplierId === supplierId) ||
          (conv.customerId === supplierId && conv.supplierId === user?.id)
      );

      if (existingConversation) {
        // Conversation exists - open it
        openChatSidebar(existingConversation.id);
      } else {
        // Create new conversation with projectId
        const newConversation = await createConversation(supplierId, projectId);
        if (newConversation) {
          // Wait a bit for conversation to be added to state
          await new Promise(resolve => setTimeout(resolve, 100));
          // Open sidebar with the new conversation ID
          openChatSidebar(newConversation.id);
        }
      }
    } catch (error) {
      logger.error("Error starting chat", error);
      toast.error("خطا در شروع مکالمه");
    }
  };

  const handleAcceptQuote = (quoteId: string) => {
    setQuoteIdToAccept(quoteId);
    setShowAcceptDialog(true);
  };

  const confirmAcceptQuote = async () => {
    if (!quoteIdToAccept) return;

    try {
      await apiClient.acceptQuote(quoteIdToAccept);
      toast.success("پیشنهاد با موفقیت پذیرفته شد");
      
      // Refresh project and quotes
      const projectData = await apiClient.getProjectById(projectId);
      setProject(projectData);
      const quotesData = await apiClient.getQuotesForProject(projectId);
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      
      // Create invoice when project status is IN_PROGRESS
      if (projectData.status === 'IN_PROGRESS') {
        try {
          await apiClient.createInvoice(projectId, quoteIdToAccept);
          toast.success("فاکتور با موفقیت ایجاد شد");
        } catch (invoiceError) {
          logger.error("Error creating invoice", invoiceError);
          // Don't show error toast for invoice creation failure
          // Invoice might be created automatically by backend
        }
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
      const quotesData = await apiClient.getQuotesForProject(projectId);
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
    } catch (error) {
      logger.error("Error rejecting quote", error);
      toast.error("خطا در رد پیشنهاد");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  return (
    <MobileLayout showBottomNav={false}>
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/customer/projects"
            className="inline-flex items-center text-sm text-brand-medium-blue hover:text-brand-dark-blue mb-4"
          >
            <ArrowRightIcon className="w-4 h-4 ml-1" />
            بازگشت به لیست پروژه‌ها
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
                {project.title}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-brand-medium-blue">
                {project.city && <span>📍 {project.city.title}</span>}
                {project.category && <span>🏷️ {project.category.title}</span>}
                <span>📅 {formatDate(project.createdAt)}</span>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                project.status
              )}`}
            >
              {getStatusLabel(project.status)}
            </span>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-brand-medium-gray">
          <h2 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
            جزئیات پروژه
          </h2>
          <p className="text-brand-medium-blue mb-6 whitespace-pre-wrap">
            {project.description}
          </p>

          {/* Files */}
          {project.files && project.files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-brand-dark-blue mb-3">
                فایل‌های ضمیمه
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {project.files.map((file) => (
                  <a
                    key={file.id}
                    href={getFileUrl(file.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-3 border border-brand-medium-gray rounded-lg hover:bg-brand-light-gray transition-colors"
                  >
                    <DocumentTextIcon className="w-8 h-8 text-brand-medium-blue mb-2" />
                    <span className="text-xs text-brand-medium-blue text-center truncate w-full">
                      {file.fileName || 'فایل'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* Suppliers Distribution Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-brand-medium-gray">
          <h2 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
            توزیع پروژه به تولیدکنندگان
          </h2>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-brand-medium-gray">
            <button
              onClick={() => setActiveTab('relevant')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'relevant'
                  ? 'border-brand-medium-blue text-brand-dark-blue'
                  : 'border-transparent text-brand-medium-blue hover:text-brand-dark-blue'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                دریافت‌کنندگان ({relevantSuppliers.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('excluded')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'excluded'
                  ? 'border-brand-medium-blue text-brand-dark-blue'
                  : 'border-transparent text-brand-medium-blue hover:text-brand-dark-blue'
              }`}
            >
              <div className="flex items-center gap-2">
                <XMarkIcon className="w-5 h-5" />
                حذف‌شده‌ها ({excludedSuppliers.length || '...'})
              </div>
            </button>
          </div>

          {/* Relevant Suppliers Tab */}
          {activeTab === 'relevant' && (
            <>
              {isLoadingSuppliers ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : relevantSuppliers.length === 0 ? (
                <div className="text-center py-8">
                  <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-3 text-brand-medium-gray" />
                  <p className="text-brand-medium-blue mb-2">
                    تولیدکننده مرتبطی یافت نشد
                  </p>
                  <p className="text-sm text-brand-medium-blue">
                    تولیدکنندگانی که در دسته "{project.category?.title}" و شهر "{project.city?.title}" فعالیت می‌کنند، در اینجا نمایش داده می‌شوند.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-brand-medium-blue mb-4">
                    {relevantSuppliers.length} تولیدکننده برای این پروژه انتخاب شده‌اند و اطلاع‌رسانی شده‌اند.
                  </p>
                  <div className="space-y-4">
                    {relevantSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-green-50/30"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircleIcon className="w-5 h-5 text-green-600" />
                              <h3 className="text-lg font-semibold text-brand-dark-blue">
                                {supplier.workshopName || supplier.fullName}
                              </h3>
                              {supplier.rating && (
                                <div className="flex items-center gap-1 text-yellow-600">
                                  <StarIcon className="w-4 h-4 fill-current" />
                                  <span className="text-sm font-medium">{supplier.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-brand-medium-blue mb-3">
                              {supplier.city && (
                                <span className="flex items-center gap-1">
                                  <MapPinIcon className="w-4 h-4" />
                                  {typeof supplier.city === 'string' ? supplier.city : supplier.city.title}
                                </span>
                              )}
                            </div>
                            {supplier.email && (
                              <p className="text-sm text-brand-medium-blue mb-2">
                                📧 {supplier.email}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {supplier.slug && (
                              <Link href={`/supplier/${supplier.slug}`}>
                                <Button variant="primary" size="sm">
                                  مشاهده پروفایل
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="neutral"
                              size="sm"
                              onClick={() => handleStartChat(supplier.id)}
                            >
                              ارسال پیام
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Excluded Suppliers Tab */}
          {activeTab === 'excluded' && (
            <>
              {isLoadingExcludedSuppliers ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : excludedSuppliers.length === 0 ? (
                <div className="text-center py-8">
                  <UserCircleIcon className="w-12 h-12 mx-auto mb-3 text-brand-medium-gray" />
                  <p className="text-brand-medium-blue mb-2">
                    همه تولیدکنندگان مرتبط انتخاب شده‌اند
                  </p>
                  <p className="text-sm text-brand-medium-blue">
                    تمام تولیدکنندگانی که با معیارهای این پروژه مطابقت داشتند، انتخاب شده‌اند.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-brand-medium-blue mb-4">
                    {excludedSuppliers.length} تولیدکننده با این پروژه مطابقت داشتند اما انتخاب نشدند:
                  </p>
                  <div className="space-y-4">
                    {excludedSuppliers.map((supplier: any) => {
                      const getReasonLabel = (reason: string) => {
                        const labels: Record<string, string> = {
                          'low_score': 'امتیاز پایین',
                          'inactive': 'حساب غیرفعال',
                          'blocked': 'حساب مسدود شده',
                          'limit_reached': 'محدودیت تعداد (فقط 20 تولیدکننده برتر انتخاب می‌شوند)',
                        };
                        return labels[reason] || reason;
                      };

                      const getReasonColor = (reason: string) => {
                        const colors: Record<string, string> = {
                          'low_score': 'bg-yellow-50 border-yellow-200',
                          'inactive': 'bg-gray-50 border-gray-200',
                          'blocked': 'bg-red-50 border-red-200',
                          'limit_reached': 'bg-orange-50 border-orange-200',
                        };
                        return colors[reason] || 'bg-gray-50 border-gray-200';
                      };

                      return (
                        <div
                          key={supplier.id}
                          className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getReasonColor(supplier.reason)}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <XMarkIcon className="w-5 h-5 text-red-600" />
                                <h3 className="text-lg font-semibold text-brand-dark-blue">
                                  {supplier.workshopName || supplier.fullName}
                                </h3>
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-brand-medium-blue mb-2">
                                <span className="px-2 py-1 bg-white rounded text-xs font-medium border">
                                  {supplier.matchType === 'both' ? 'دسته و شهر' : supplier.matchType === 'category' ? 'دسته' : 'شهر'}
                                </span>
                                {supplier.score !== undefined && (
                                  <span className="text-xs">
                                    امتیاز: {supplier.score.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2">
                                <span className="text-sm font-medium text-red-600">
                                  علت حذف: {getReasonLabel(supplier.reason)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quotes Section */}
        {project.status === ProjectStatus.PENDING && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-brand-medium-gray">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-brand-dark-blue font-display">
                پیشنهادات دریافت شده
              </h2>
              {quotes.length > 0 && (
                <Link href={`/dashboard/customer/projects/${projectId}/quotes`}>
                  <Button variant="primary" size="sm">
                    مقایسه پیشنهادات
                  </Button>
                </Link>
              )}
            </div>

            {isLoadingQuotes ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 mx-auto mb-3 text-brand-medium-gray" />
                <p className="text-brand-medium-blue mb-2">
                  هنوز پیشنهادی دریافت نشده است
                </p>
                <p className="text-sm text-brand-medium-blue">
                  تولیدکنندگان می‌توانند برای این پروژه پیشنهاد قیمت ارسال کنند.
                </p>
              </div>
            ) : (
              <div>
                {quoteStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {quoteStats.total}
                      </div>
                      <div className="text-xs text-blue-700">کل پیشنهادات</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {quoteStats.pending}
                      </div>
                      <div className="text-xs text-yellow-700">در انتظار</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {quoteStats.accepted}
                      </div>
                      <div className="text-xs text-green-700">پذیرفته شده</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-2xl font-bold text-gray-600 mb-1">
                        {formatPrice(quoteStats.averagePrice)}
                      </div>
                      <div className="text-xs text-gray-700">میانگین قیمت</div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {quotes.slice(0, 5).map((quote) => (
                    <div
                      key={quote.id}
                      className="border border-brand-medium-gray rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-brand-dark-blue">
                              {quote.supplier?.workshopName || quote.supplier?.fullName || 'تولیدکننده'}
                            </h3>
                            {quote.status === QuoteStatus.ACCEPTED && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-300 flex items-center gap-1">
                                <CheckCircleIcon className="w-4 h-4" />
                                پذیرفته شده
                              </span>
                            )}
                            {quote.status === QuoteStatus.REJECTED && (
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium border border-red-300 flex items-center gap-1">
                                <XCircleIcon className="w-4 h-4" />
                                رد شده
                              </span>
                            )}
                            {quote.status === QuoteStatus.PENDING && (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300 flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                در انتظار
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-brand-medium-blue mb-2">
                            <span className="font-semibold text-brand-dark-blue">
                              قیمت: {formatPrice(quote.price)}
                            </span>
                            {quote.deliveryTimeDays && (
                              <span>زمان تحویل: {quote.deliveryTimeDays} روز</span>
                            )}
                            {quote.supplier?.rating && (
                              <span className="flex items-center gap-1">
                                <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                                {quote.supplier.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          {quote.description && (
                            <p className="text-sm text-brand-medium-blue mb-2">
                              {quote.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 mr-4">
                          {quote.status === QuoteStatus.PENDING && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAcceptQuote(quote.id)}
                              >
                                پذیرش پیشنهاد
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleRejectQuote(quote.id)}
                              >
                                رد پیشنهاد
                              </Button>
                            </>
                          )}
                          {quote.supplierId && (
                            <Button
                              variant="neutral"
                              size="sm"
                              onClick={() => handleStartChat(quote.supplierId)}
                            >
                              ارسال پیام
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {quotes.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href={`/dashboard/customer/projects/${projectId}/quotes`}>
                      <Button variant="primary">
                        مشاهده همه پیشنهادات ({quotes.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
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
    </MobileLayout>
  );
}

