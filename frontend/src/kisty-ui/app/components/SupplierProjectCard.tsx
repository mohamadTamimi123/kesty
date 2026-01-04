"use client";

import { memo, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Project } from "../types/project";
import { Quote } from "../types/quote";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import Button from "./Button";
import {
  MapPinIcon,
  TagIcon,
  CalendarIcon,
  EyeIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import toast from "react-hot-toast";
import logger from "../utils/logger";

interface SupplierProjectCardProps {
  project: Project;
  quote?: Quote;
  hasExistingQuote: boolean;
}

function SupplierProjectCard({
  project,
  quote,
  hasExistingQuote,
}: SupplierProjectCardProps) {
  const { user } = useAuth();
  const { conversations, createConversation, openChatSidebar } = useChat();
  const [isChatLoading, setIsChatLoading] = useState(false);

  const formattedDate = useMemo(() => {
    const date =
      typeof project.createdAt === "string"
        ? new Date(project.createdAt)
        : project.createdAt;
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }, [project.createdAt]);

  const formattedPrice = useMemo(() => {
    if (!quote?.price) return null;
    return new Intl.NumberFormat("fa-IR").format(quote.price);
  }, [quote?.price]);

  // Get customer ID from project (supports both direct customerId and nested customer object)
  const customerId = useMemo(() => {
    return project.customerId || project.customer?.id;
  }, [project.customerId, project.customer?.id]);

  // Get first project image
  const projectImage = useMemo(() => {
    if (!project.files || project.files.length === 0) return null;
    const firstImage = project.files.find(
      (file) =>
        file.mimeType?.startsWith("image/") ||
        file.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );
    return firstImage || null;
  }, [project.files]);

  // Helper function to get full image URL
  const getFileUrl = useCallback((fileUrl: string) => {
    if (fileUrl.startsWith("http")) return fileUrl;
    const apiUrl =
      typeof window !== "undefined"
        ? window.location.origin.replace(":3000", ":3001")
        : "http://localhost:3001";
    const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
    return `${apiUrl}/api${path}`;
  }, []);

  // Find existing conversation for this customer and project
  const findExistingConversation = useCallback(() => {
    if (!customerId || !user?.id) return null;

    return conversations.find((conv) => {
      const isCustomerMatch =
        conv.customerId === customerId ||
        conv.supplierId === customerId;
      const isProjectMatch = conv.projectId === project.id;
      const isUserInvolved =
        conv.customerId === user.id || conv.supplierId === user.id;

      return isCustomerMatch && isProjectMatch && isUserInvolved;
    });
  }, [conversations, customerId, project.id, user?.id]);

  // Handle chat action
  const handleChat = useCallback(async () => {
    if (!customerId) {
      toast.error("اطلاعات مشتری در دسترس نیست");
      return;
    }

    if (!user?.id) {
      toast.error("لطفاً ابتدا وارد حساب کاربری خود شوید");
      return;
    }

    setIsChatLoading(true);

    try {
      // Check if conversation already exists
      const existingConversation = findExistingConversation();

      if (existingConversation) {
        // Open existing conversation
        openChatSidebar(existingConversation.id);
        toast.success("مکالمه باز شد");
      } else {
        // Create new conversation
        const newConversation = await createConversation(
          customerId,
          project.id
        );

        if (newConversation) {
          // Open the newly created conversation
          openChatSidebar(newConversation.id);
          toast.success("مکالمه ایجاد شد");
        } else {
          toast.error("خطا در ایجاد مکالمه");
        }
      }
    } catch (error) {
      logger.error("Error handling chat action", error);
      toast.error("خطا در ایجاد یا باز کردن مکالمه");
    } finally {
      setIsChatLoading(false);
    }
  }, [
    customerId,
    project.id,
    user?.id,
    findExistingConversation,
    createConversation,
    openChatSidebar,
  ]);

  return (
    <div className="p-6 hover:bg-brand-off-white transition-all duration-200 border-b border-brand-medium-gray last:border-b-0">
      <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
        {/* Project Info Section */}
        <div className="flex-1 min-w-0 w-full xl:w-auto flex gap-4">
          {/* Project Image - Left Side */}
          {projectImage ? (
            <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-brand-light-gray border border-brand-medium-gray relative">
              <Image
                src={getFileUrl(projectImage.fileUrl)}
                alt={project.title}
                width={128}
                height={128}
                className="w-full h-full object-cover"
                loading="lazy"
                unoptimized={projectImage.fileUrl.startsWith('http')}
                onError={(e) => {
                  // Fallback to placeholder on error
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const placeholder = target.parentElement?.querySelector(".image-placeholder");
                  if (placeholder) {
                    placeholder.classList.remove("hidden");
                  }
                }}
              />
              <div className="hidden image-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-brand-light-gray">
                <PhotoIcon className="w-12 h-12 text-brand-medium-gray" />
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 w-32 h-32 rounded-lg bg-brand-light-gray border border-brand-medium-gray flex items-center justify-center">
              <PhotoIcon className="w-12 h-12 text-brand-medium-gray" />
            </div>
          )}

          {/* Project Details */}
          <div className="flex-1 min-w-0">
            {/* Title and Badge */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <Link
                href={`/public/projects/${project.id}`}
                className="text-lg font-semibold text-brand-dark-blue hover:text-brand-medium-blue transition-colors line-clamp-2"
              >
                {project.title}
              </Link>
              {hasExistingQuote && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-300 whitespace-nowrap flex-shrink-0">
                  پیشنهاد ارسال شده
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-brand-medium-blue line-clamp-3 mb-4">
              {project.description}
            </p>

            {/* Project Meta Info */}
            <div className="flex flex-wrap gap-4 text-xs text-brand-medium-blue mb-3">
              {project.city && (
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{project.city.title}</span>
                </span>
              )}
              {project.category && (
                <span className="flex items-center gap-1.5">
                  <TagIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{project.category.title}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                <span>{formattedDate}</span>
              </span>
            </div>

            {/* Quote Details */}
            {quote && formattedPrice && (
              <div className="mt-3 pt-3 border-t border-brand-medium-gray">
                <div className="flex flex-wrap gap-4 text-sm text-brand-medium-blue">
                  <span className="font-medium">
                    پیشنهاد شما: {formattedPrice} تومان
                  </span>
                  {quote.deliveryTimeDays && (
                    <span className="text-brand-medium-blue">
                      • زمان تحویل: {quote.deliveryTimeDays} روز
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex flex-row xl:flex-col gap-2 w-full xl:w-auto xl:mr-4 flex-shrink-0 xl:min-w-[180px] overflow-x-auto xl:overflow-visible pb-2 xl:pb-0">
          {/* View Project Button */}
          <Link href={`/public/projects/${project.id}`} className="flex-1 xl:flex-none xl:w-full min-w-[120px] xl:min-w-0">
            <Button variant="neutral" size="sm" className="w-full whitespace-nowrap">
              <EyeIcon className="w-4 h-4 ml-2 flex-shrink-0" />
              مشاهده پروژه
            </Button>
          </Link>

          {/* Customer Profile Button */}
          {customerId ? (
            <Link
              href={`/public/customer/${customerId}`}
              className="flex-1 xl:flex-none xl:w-full min-w-[120px] xl:min-w-0"
            >
              <Button variant="neutral" size="sm" className="w-full whitespace-nowrap">
                <UserCircleIcon className="w-4 h-4 ml-2 flex-shrink-0" />
                پروفایل مشتری
              </Button>
            </Link>
          ) : (
            <Button 
              variant="neutral" 
              size="sm" 
              className="w-full flex-1 xl:flex-none xl:w-full whitespace-nowrap min-w-[120px] xl:min-w-0"
              disabled
            >
              <UserCircleIcon className="w-4 h-4 ml-2 flex-shrink-0" />
              پروفایل مشتری
            </Button>
          )}

          {/* Chat Button */}
          <Button
            variant="neutral"
            size="sm"
            className="w-full flex-1 xl:flex-none xl:w-full whitespace-nowrap min-w-[100px] xl:min-w-0"
            onClick={handleChat}
            isLoading={isChatLoading}
            disabled={isChatLoading || !customerId}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 ml-2 flex-shrink-0" />
            چت
          </Button>

          {/* Send/Edit Quote Button */}
          <Link href={`/dashboard/supplier/projects/${project.id}/quote`} className="flex-1 xl:flex-none xl:w-full min-w-[140px] xl:min-w-0">
            <Button variant="primary" size="sm" className="w-full whitespace-nowrap">
              {hasExistingQuote ? "ویرایش پیشنهاد" : "ارسال پیشنهاد"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default memo(SupplierProjectCard);

