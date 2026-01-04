"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../../components/Button";
import { Project } from "../../../types/project";
import { Quote, QuoteStatus } from "../../../types/quote";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import LoadingSpinner from "../../../components/LoadingSpinner";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  MapPinIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
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

interface ProjectWithQuote {
  project: Project;
  quote: Quote;
}

export default function SupplierMyProjectsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [projectsWithQuotes, setProjectsWithQuotes] = useState<ProjectWithQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | 'ALL'>('ALL');

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      setIsLoading(true);
      
      // Fetch all quotes
      const quotesData = await apiClient.getMyQuotes();
      const quotes = Array.isArray(quotesData) ? quotesData : [];
      
      if (quotes.length === 0) {
        setProjectsWithQuotes([]);
        setIsLoading(false);
        return;
      }

      // Get unique project IDs
      const projectIds = [...new Set(quotes.map((quote: Quote) => quote.projectId))];
      
      // Fetch all projects in a single batch request
      const projects = await apiClient.getProjectsBatch(projectIds);
      
      // Map projects to quotes
      const validResults: ProjectWithQuote[] = projects.map((project: Project) => {
        // Get the most recent quote for this project
        const projectQuotes = quotes.filter((q: Quote) => q.projectId === project.id);
        const latestQuote = projectQuotes.sort((a: Quote, b: Quote) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        return {
          project,
          quote: latestQuote,
        };
      }).filter((item): item is ProjectWithQuote => item !== null && item.quote !== undefined);
      
      // Sort by quote creation date (newest first)
      validResults.sort((a, b) => {
        const dateA = new Date(a.quote.createdAt).getTime();
        const dateB = new Date(b.quote.createdAt).getTime();
        return dateB - dateA;
      });

      setProjectsWithQuotes(validResults);
    } catch (error) {
      logger.error("Error fetching projects", error);
      toast.error("خطا در دریافت پروژه‌ها");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  const filteredProjects = projectsWithQuotes.filter((item) => 
    filterStatus === 'ALL' || item.quote.status === filterStatus
  );

  const stats = {
    total: projectsWithQuotes.length,
    pending: projectsWithQuotes.filter((item) => item.quote.status === QuoteStatus.PENDING).length,
    accepted: projectsWithQuotes.filter((item) => item.quote.status === QuoteStatus.ACCEPTED).length,
    rejected: projectsWithQuotes.filter((item) => item.quote.status === QuoteStatus.REJECTED).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
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
          مدیریت پروژه‌های من
        </h1>
        <p className="text-brand-medium-blue">
          پروژه‌هایی که برای آن‌ها پیشنهاد ارسال کرده‌اید
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-5 border border-brand-medium-gray hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-brand-dark-blue">
              {stats.total}
            </div>
            <DocumentTextIcon className="w-8 h-8 text-brand-medium-blue opacity-50" />
          </div>
          <div className="text-sm font-medium text-brand-medium-blue">کل پروژه‌ها</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 border border-yellow-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
          <div className="text-sm font-medium text-brand-medium-blue">در انتظار</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 border border-green-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-green-600">
              {stats.accepted}
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500 opacity-50" />
          </div>
          <div className="text-sm font-medium text-brand-medium-blue">پذیرفته شده</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 border border-red-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <XCircleIcon className="w-8 h-8 text-red-500 opacity-50" />
          </div>
          <div className="text-sm font-medium text-brand-medium-blue">رد شده</div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-brand-medium-blue">
              <FunnelIcon className="w-5 h-5" />
              <span className="text-sm font-medium">فیلتر وضعیت:</span>
            </div>
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
              <button
                onClick={() => setFilterStatus(QuoteStatus.REJECTED)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === QuoteStatus.REJECTED
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                رد شده
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 text-brand-medium-gray mx-auto mb-4" />
            <p className="text-brand-medium-blue mb-2">
              {filterStatus === 'ALL'
                ? 'شما هنوز برای هیچ پروژه‌ای پیشنهاد ارسال نکرده‌اید'
                : 'پروژه‌ای با این وضعیت وجود ندارد'}
            </p>
            {filterStatus === 'ALL' && (
              <Link href="/dashboard/supplier/projects">
                <Button variant="primary" size="sm" className="mt-4">
                  مشاهده پروژه‌های موجود
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-brand-medium-gray">
            {filteredProjects.map((item) => (
              <div key={item.project.id} className="p-6 hover:bg-brand-off-white transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/dashboard/supplier/projects/${item.project.id}`}
                        className="text-lg font-semibold text-brand-dark-blue hover:text-brand-medium-blue transition-colors"
                      >
                        {item.project.title}
                      </Link>
                      {getStatusBadge(item.quote.status)}
                    </div>
                    <p className="text-sm text-brand-medium-blue line-clamp-2 mb-3">
                      {item.project.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-brand-medium-blue mb-3">
                      {item.project.city && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {item.project.city.title}
                        </span>
                      )}
                      {item.project.category && (
                        <span className="flex items-center gap-1">
                          <TagIcon className="w-4 h-4" />
                          {item.project.category.title}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {formatDate(item.project.createdAt)}
                      </span>
                    </div>
                    <div className="mt-3 text-sm">
                      <span className="text-brand-medium-blue font-medium">
                        پیشنهاد شما: {formatPrice(item.quote.price)}
                      </span>
                      {item.quote.deliveryTimeDays && (
                        <span className="text-brand-medium-blue mr-4">
                          • زمان تحویل: {item.quote.deliveryTimeDays} روز
                        </span>
                      )}
                      <span className="text-brand-medium-blue mr-4">
                        • تاریخ ارسال: {formatDate(item.quote.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mr-4">
                    <Link href={`/dashboard/supplier/projects/${item.project.id}`}>
                      <Button variant="neutral" size="sm" className="w-full">
                        <EyeIcon className="w-4 h-4 ml-2" />
                        مشاهده پروژه
                      </Button>
                    </Link>
                    <Link href={`/dashboard/supplier/projects/${item.project.id}/quote`}>
                      <Button variant="primary" size="sm" className="w-full">
                        {item.quote.status === QuoteStatus.ACCEPTED ? 'مشاهده پیشنهاد' : 'ویرایش پیشنهاد'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


