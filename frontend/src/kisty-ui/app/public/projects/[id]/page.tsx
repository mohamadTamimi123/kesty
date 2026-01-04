"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Project, ProjectStatus } from "../../../types/project";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import Button from "../../../components/Button";
import LoadingSpinner from "../../../components/LoadingSpinner";
import {
  ArrowLeftIcon,
  MapPinIcon,
  TagIcon,
  CalendarIcon,
  UserCircleIcon,
  DocumentTextIcon,
  PhotoIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

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

export default function PublicProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        router.push("/public/projects");
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, router]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success("لینک پروژه کپی شد");
    }
  };

  const handleSendQuote = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(`/public/projects/${projectId}`));
      return;
    }
    if (user?.role !== 'SUPPLIER') {
      toast.error("فقط تامین‌کننده‌ها می‌توانند پیشنهاد ارسال کنند");
      return;
    }
    router.push(`/dashboard/supplier/projects/${projectId}/quote`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-brand-off-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-medium-blue mb-4">پروژه یافت نشد</p>
          <Link href="/public/projects">
            <Button variant="primary">بازگشت به لیست پروژه‌ها</Button>
          </Link>
        </div>
      </div>
    );
  }

  const projectImages = project.files?.filter(
    (file) => file.mimeType?.startsWith("image/") || file.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  ) || [];

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-brand-medium-blue">
          <Link href="/" className="hover:text-brand-dark-blue transition-colors">
            خانه
          </Link>
          <span>/</span>
          <Link href="/public/projects" className="hover:text-brand-dark-blue transition-colors">
            پروژه‌ها
          </Link>
          <span>/</span>
          <span className="text-brand-dark-blue font-medium">
            {project.title}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/public/projects"
            className="text-brand-medium-blue hover:text-brand-dark-blue mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            بازگشت به لیست پروژه‌ها
          </Link>
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-brand-dark-blue font-display">
                  {project.title}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-brand-medium-blue">
                {project.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{project.city.title}</span>
                  </div>
                )}
                {project.category && (
                  <div className="flex items-center gap-1.5">
                    <TagIcon className="w-4 h-4" />
                    <span>{project.category.title}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleShare}>
                <ShareIcon className="w-4 h-4 ml-2" />
                اشتراک‌گذاری
              </Button>
              {isAuthenticated && user?.role === 'SUPPLIER' && project.status === ProjectStatus.PENDING && (
                <Button variant="primary" size="sm" onClick={handleSendQuote}>
                  ارسال پیشنهاد
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {projectImages.length > 0 && (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
                <h2 className="text-xl font-bold text-brand-dark-blue mb-4 flex items-center gap-2">
                  <PhotoIcon className="w-6 h-6" />
                  تصاویر پروژه
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {projectImages.map((file, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-brand-light-gray"
                    >
                      <Image
                        src={getFileUrl(file.fileUrl)}
                        alt={`${project.title} - تصویر ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-xl font-bold text-brand-dark-blue mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6" />
                توضیحات پروژه
              </h2>
              <p className="text-brand-medium-blue leading-relaxed whitespace-pre-line">
                {project.description}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-xl font-bold text-brand-dark-blue mb-4">
                اطلاعات پروژه
              </h2>
              <div className="space-y-4">
                {project.city && (
                  <div>
                    <div className="text-sm text-brand-medium-gray mb-1">شهر</div>
                    <p className="text-brand-dark-blue">{project.city.title}</p>
                  </div>
                )}
                {project.category && (
                  <div>
                    <div className="text-sm text-brand-medium-gray mb-1">دسته‌بندی</div>
                    <p className="text-brand-dark-blue">{project.category.title}</p>
                  </div>
                )}
                <div>
                  <div className="text-sm text-brand-medium-gray mb-1">تاریخ ایجاد</div>
                  <p className="text-brand-dark-blue">{formatDate(project.createdAt)}</p>
                </div>
                <div>
                  <div className="text-sm text-brand-medium-gray mb-1">وضعیت</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {project.customer && (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
                <h2 className="text-xl font-bold text-brand-dark-blue mb-4 flex items-center gap-2">
                  <UserCircleIcon className="w-6 h-6" />
                  مشتری
                </h2>
                <div className="space-y-3">
                  <p className="text-brand-dark-blue font-medium">
                    {project.customer.fullName || project.customer.name}
                  </p>
                  {project.customerId && (
                    <Link
                      href={`/public/customer/${project.customerId}`}
                      className="text-brand-medium-blue hover:text-brand-dark-blue text-sm transition-colors"
                    >
                      مشاهده پروفایل →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            {isAuthenticated && user?.role === 'SUPPLIER' && project.status === ProjectStatus.PENDING && (
              <Button
                variant="primary"
                onClick={handleSendQuote}
                className="w-full"
              >
                ارسال پیشنهاد
              </Button>
            )}
            {!isAuthenticated && project.status === ProjectStatus.PENDING && (
              <Link href={`/login?redirect=${encodeURIComponent(`/public/projects/${projectId}`)}`}>
                <Button variant="primary" className="w-full">
                  ورود برای ارسال پیشنهاد
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

