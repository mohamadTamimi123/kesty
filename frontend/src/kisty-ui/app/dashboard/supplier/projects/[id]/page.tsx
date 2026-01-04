"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  DocumentTextIcon,
  MapPinIcon,
  TagIcon,
  CalendarIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Button from "../../../../components/Button";
import { Project, ProjectStatus } from "../../../../types/project";
import { Quote } from "../../../../types/quote";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import { useChat } from "../../../../contexts/ChatContext";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import LoadingSpinner from "../../../../components/LoadingSpinner";

const formatDate = (dateString: string | Date) => {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<ProjectStatus, string> = {
    [ProjectStatus.PENDING]: "در انتظار",
    [ProjectStatus.IN_PROGRESS]: "در حال انجام",
    [ProjectStatus.COMPLETED]: "تکمیل شده",
    [ProjectStatus.CANCELLED]: "لغو شده",
  };
  return labels[status];
};

const getStatusColor = (status: ProjectStatus): string => {
  const colors: Record<ProjectStatus, string> = {
    [ProjectStatus.PENDING]: "bg-yellow-100 text-yellow-800 border-yellow-300",
    [ProjectStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 border-blue-300",
    [ProjectStatus.COMPLETED]: "bg-green-100 text-green-800 border-green-300",
    [ProjectStatus.CANCELLED]: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[status];
};

const getFileUrl = (fileUrl: string) => {
  if (fileUrl.startsWith("http")) return fileUrl;
  const apiUrl =
    typeof window !== "undefined"
      ? window.location.origin.replace(":3000", ":3001")
      : "http://localhost:3001";
  const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${apiUrl}/api${path}`;
};

export default function SupplierProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const { openChatSidebar, createConversation, conversations } = useChat();
  const [project, setProject] = useState<Project | null>(null);
  const [myQuote, setMyQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const hasFetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!isAuthenticated || !projectId) {
        setIsLoading(false);
        return;
      }

      // Prevent duplicate fetches
      if (hasFetchedRef.current || fetchingRef.current) {
        return;
      }

      // Only show loading if we don't have data yet
      if (!project) {
        setIsLoading(true);
      }
      fetchingRef.current = true;

      try {
        // Fetch project and quotes simultaneously using Promise.all
        const [projectData, quotesData] = await Promise.all([
          apiClient.getProjectById(projectId),
          apiClient.getMyQuotes().catch((error) => {
            // Log error but don't fail the whole fetch
            logger.error("Error fetching quotes", error);
            return [];
          }),
        ]);

        setProject(projectData);

        // Process quotes
        const quotesArray = Array.isArray(quotesData) ? quotesData : [];
        const quoteForThisProject = quotesArray.find(
          (q: Quote) => q.projectId === projectId
        );
        setMyQuote(quoteForThisProject || null);

        hasFetchedRef.current = true;
      } catch (error: unknown) {
        logger.error("Error fetching project", error);
        const errorMessage =
          (error as any)?.response?.data?.message ||
          "خطا در دریافت اطلاعات پروژه";
        toast.error(errorMessage);
        // Use replace instead of push to avoid double redirect
        // Only redirect if we're not already on the projects list page
        // Check if we're already redirecting to avoid multiple redirects
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (currentPath && currentPath.includes(`/dashboard/supplier/projects/${projectId}`)) {
          // We're already on the project detail page, don't redirect
          return;
        }
        router.replace("/dashboard/supplier/projects");
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchProject();
  }, [isAuthenticated, projectId, project]);

  const handleChat = async () => {
    if (!project?.customerId) {
      toast.error("اطلاعات مشتری در دسترس نیست");
      return;
    }

    if (!user?.id) {
      toast.error("لطفاً ابتدا وارد حساب کاربری خود شوید");
      return;
    }

    setIsChatLoading(true);

    try {
      // Find existing conversation
      const existingConversation = conversations.find((conv) => {
        const isCustomerMatch =
          conv.customerId === project.customerId ||
          conv.supplierId === project.customerId;
        const isProjectMatch = conv.projectId === project.id;
        const isUserInvolved =
          conv.customerId === user.id || conv.supplierId === user.id;
        return isCustomerMatch && isProjectMatch && isUserInvolved;
      });

      if (existingConversation) {
        openChatSidebar(existingConversation.id);
        toast.success("مکالمه باز شد");
      } else {
        const newConversation = await createConversation(
          project.customerId,
          project.id
        );
        if (newConversation) {
          openChatSidebar(newConversation.id);
          toast.success("مکالمه ایجاد شد");
        } else {
          toast.error("خطا در ایجاد مکالمه");
        }
      }
    } catch (error) {
      logger.error("Error starting chat", error);
      toast.error("خطا در شروع مکالمه");
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-medium-blue">پروژه یافت نشد</p>
        <Link href="/dashboard/supplier/projects">
          <Button variant="primary" size="sm" className="mt-4">
            بازگشت به لیست پروژه‌ها
          </Button>
        </Link>
      </div>
    );
  }

  const projectImages = project.files?.filter(
    (file) =>
      file.mimeType?.startsWith("image/") ||
      file.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  ) || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
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

      {/* Project Images Gallery */}
      {projectImages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-brand-medium-gray">
          <h2 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
            تصاویر پروژه
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {projectImages.map((file) => (
              <div
                key={file.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-brand-light-gray border border-brand-medium-gray"
              >
                <img
                  src={getFileUrl(file.fileUrl)}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center">
                  <PhotoIcon className="w-12 h-12 text-brand-medium-gray" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    {file.fileName || "فایل"}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* My Quote Section */}
      {myQuote && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-brand-medium-gray">
          <h2 className="text-lg font-bold text-brand-dark-blue mb-4 font-display">
            پیشنهاد شما
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-brand-medium-blue">مبلغ پیشنهادی:</span>
              <span className="font-semibold text-brand-dark-blue">
                {formatPrice(myQuote.price)}
              </span>
            </div>
            {myQuote.deliveryTimeDays && (
              <div className="flex justify-between items-center">
                <span className="text-brand-medium-blue">زمان تحویل:</span>
                <span className="font-semibold text-brand-dark-blue">
                  {myQuote.deliveryTimeDays} روز
                </span>
              </div>
            )}
            {myQuote.description && (
              <div>
                <span className="text-brand-medium-blue block mb-2">
                  توضیحات:
                </span>
                <div 
                  className="text-brand-dark-blue prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: myQuote.description }}
                />
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-brand-medium-gray">
              <span className="text-brand-medium-blue">وضعیت:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  myQuote.status === "ACCEPTED"
                    ? "bg-green-100 text-green-800"
                    : myQuote.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {myQuote.status === "ACCEPTED"
                  ? "پذیرفته شده"
                  : myQuote.status === "REJECTED"
                  ? "رد شده"
                  : "در انتظار"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
        <div className="flex flex-col sm:flex-row gap-3">
          {project.customerId && (
            <>
              <Link
                href={`/dashboard/customer/profile?customerId=${project.customerId}`}
                className="flex-1"
              >
                <Button variant="neutral" size="md" className="w-full">
                  <UserCircleIcon className="w-5 h-5 ml-2" />
                  پروفایل مشتری
                </Button>
              </Link>
              <Button
                variant="neutral"
                size="md"
                className="flex-1"
                onClick={handleChat}
                isLoading={isChatLoading}
                disabled={isChatLoading}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 ml-2" />
                چت با مشتری
              </Button>
            </>
          )}
          <Link
            href={`/dashboard/supplier/projects/${project.id}/quote`}
            className="flex-1"
          >
            <Button variant="primary" size="md" className="w-full">
              {myQuote ? "ویرایش پیشنهاد" : "ارسال پیشنهاد"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

