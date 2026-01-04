"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRightIcon,
  DocumentTextIcon,
  MapPinIcon,
  TagIcon,
  CalendarIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import MobileLayout from "../../../../../components/MobileLayout";
import Button from "../../../../../components/Button";
import Breadcrumb from "../../../../../components/Breadcrumb";
import LoadingSpinner from "../../../../../components/LoadingSpinner";
import { Project, ProjectStatus } from "../../../../../types/project";
import { Quote } from "../../../../../types/quote";
import apiClient from "../../../../../lib/api";
import { useAuth } from "../../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../../utils/logger";

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

const getQuantityEstimateLabel = (estimate: string | null): string => {
  const labels: Record<string, string> = {
    'LESS_THAN_10': 'کمتر از 10',
    'BETWEEN_10_100': 'بین 10 تا 100',
    'MORE_THAN_100': 'بیشتر از 100',
  };
  return labels[estimate || ''] || '';
};

export default function SupplierProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [existingQuote, setExistingQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const projectData = await apiClient.getProjectById(projectId);
      setProject(projectData);
    } catch (error: unknown) {
      logger.error("Error fetching project", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت اطلاعات پروژه";
      toast.error(errorMessage);
      router.push("/dashboard/supplier/projects");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  const fetchExistingQuote = useCallback(async () => {
    if (!projectId || !isAuthenticated) return;

    try {
      setIsLoadingQuote(true);
      const quotes = await apiClient.getMyQuotes();
      const quote = Array.isArray(quotes) 
        ? quotes.find((q: Quote) => q.projectId === projectId)
        : null;
      
      if (quote) {
        setExistingQuote(quote);
      }
    } catch (error) {
      logger.error("Error fetching existing quote", error);
      // Don't show error toast, just log it
    } finally {
      setIsLoadingQuote(false);
    }
  }, [projectId, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProject();
      fetchExistingQuote();
    }
  }, [isAuthenticated, projectId, fetchProject, fetchExistingQuote]);

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!project) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-brand-medium-blue py-12">
            پروژه یافت نشد
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "داشبورد", href: "/dashboard/supplier" },
              { label: "پروژه‌ها", href: "/dashboard/supplier/projects" },
              { label: "مشاهده پروژه" },
            ]}
          />
          <Link
            href="/dashboard/supplier/projects"
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
                {project.city && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    {project.city.title}
                  </span>
                )}
                {project.category && (
                  <span className="flex items-center gap-1">
                    <TagIcon className="w-4 h-4" />
                    {project.category.title}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {formatDate(project.createdAt)}
                </span>
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

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {project.quantityEstimate && (
              <div className="flex items-center gap-2 text-sm text-brand-medium-blue">
                <span className="font-semibold text-brand-dark-blue">برآورد تعداد:</span>
                <span>{getQuantityEstimateLabel(project.quantityEstimate)}</span>
              </div>
            )}
          </div>

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

        {/* Customer Info */}
        {project.customer && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-brand-medium-gray">
            <h2 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
              اطلاعات مشتری
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCircleIcon className="w-8 h-8 text-brand-medium-blue" />
                <div>
                  <p className="text-brand-dark-blue font-semibold">
                    {project.customer.fullName}
                  </p>
                </div>
              </div>
              {project.customerId && (
                <Link href={`/dashboard/customer/profile?customerId=${project.customerId}`}>
                  <Button variant="neutral" size="sm">
                    مشاهده پروفایل
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Quote Actions */}
        {project.status === ProjectStatus.PENDING && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <h2 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
              پیشنهاد قیمت
            </h2>
            
            {isLoadingQuote ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="md" />
              </div>
            ) : existingQuote ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-brand-dark-blue">
                      پیشنهاد شما ارسال شده است
                    </span>
                  </div>
                  <div className="text-sm text-brand-medium-blue space-y-1">
                    <p>
                      قیمت: {new Intl.NumberFormat('fa-IR').format(existingQuote.price)} تومان
                    </p>
                    {existingQuote.deliveryTimeDays && (
                      <p>زمان تحویل: {existingQuote.deliveryTimeDays} روز</p>
                    )}
                    {existingQuote.status && (
                      <div className="mt-2">
                        {existingQuote.status === 'ACCEPTED' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-300">
                            <CheckCircleIcon className="w-4 h-4" />
                            پذیرفته شده
                          </span>
                        )}
                        {existingQuote.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium border border-red-300">
                            <XCircleIcon className="w-4 h-4" />
                            رد شده
                          </span>
                        )}
                        {existingQuote.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300">
                            <ClockIcon className="w-4 h-4" />
                            در انتظار بررسی
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Link href={`/dashboard/supplier/projects/${projectId}/quote`}>
                  <Button variant="primary" className="w-full">
                    ویرایش پیشنهاد
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-brand-medium-blue">
                  برای این پروژه می‌توانید پیشنهاد قیمت ارسال کنید.
                </p>
                <Link href={`/dashboard/supplier/projects/${projectId}/quote`}>
                  <Button variant="primary" className="w-full">
                    ارسال پیشنهاد قیمت
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Status Message for Non-Pending Projects */}
        {project.status !== ProjectStatus.PENDING && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
            <div className="text-center py-4">
              <p className="text-brand-medium-blue">
                {project.status === ProjectStatus.COMPLETED && "این پروژه تکمیل شده است."}
                {project.status === ProjectStatus.IN_PROGRESS && "این پروژه در حال انجام است."}
                {project.status === ProjectStatus.CANCELLED && "این پروژه لغو شده است."}
              </p>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

