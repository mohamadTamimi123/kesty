"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Button from "../../../../../components/Button";
import Input from "../../../../../components/Input";
import PriceInput from "../../../../../components/PriceInput";
import RichTextEditor from "../../../../../components/RichTextEditor";
import { Quote } from "../../../../../types/quote";
import apiClient from "../../../../../lib/api";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useChat } from "../../../../../contexts/ChatContext";
import toast from "react-hot-toast";
import logger from "../../../../../utils/logger";
import LoadingSpinner from "../../../../../components/LoadingSpinner";
import { parseFormattedNumber } from "../../../../../utils/numberToWords";

export default function SupplierQuotePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const { createConversation, sendInitialQuoteMessage, openChatSidebar, refreshConversations } = useChat();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingQuote, setExistingQuote] = useState<Quote | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [formData, setFormData] = useState({
    price: "",
    deliveryTimeDays: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasFetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!isAuthenticated || !projectId) {
        setIsLoading(false);
        return;
      }

      // Prevent duplicate fetches
      if (hasFetchedRef.current || fetchingRef.current) {
        return;
      }

      // Only show loading if we don't have data yet
      if (!existingQuote) {
        setIsLoading(true);
      }
      fetchingRef.current = true;

      try {
        // Fetch my quotes to find if there's one for this project
        const quotes = await apiClient.getMyQuotes();
        const quotesArray = Array.isArray(quotes) ? quotes : [];
        const quoteForThisProject = quotesArray.find(
          (q: Quote) => q.projectId === projectId
        );

        if (quoteForThisProject) {
          setExistingQuote(quoteForThisProject);
          setFormData({
            price: quoteForThisProject.price.toString(),
            deliveryTimeDays: quoteForThisProject.deliveryTimeDays
              ? quoteForThisProject.deliveryTimeDays.toString()
              : "",
            description: quoteForThisProject.description || "",
          });
        }
        hasFetchedRef.current = true;
      } catch (error) {
        logger.error("Error fetching quote", error);
        const errorMessage =
          (error as any)?.response?.data?.message || "خطا در دریافت پیشنهاد";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchQuote();
  }, [isAuthenticated, projectId, existingQuote]);

  const validateDeliveryTime = (value: string): string | null => {
    if (!value.trim()) {
      return null; // Optional field
    }
    const days = parseInt(value);
    if (isNaN(days) || days <= 0) {
      return "زمان تحویل باید یک عدد مثبت باشد";
    }
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.price.trim()) {
      newErrors.price = "مبلغ پیشنهادی الزامی است";
    } else {
      const price = parseFormattedNumber(formData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = "مبلغ باید یک عدد مثبت باشد";
      } else if (price < 1000) {
        newErrors.price = "مبلغ باید حداقل 1,000 تومان باشد";
      }
    }

    if (formData.deliveryTimeDays.trim()) {
      const days = parseInt(formData.deliveryTimeDays);
      if (isNaN(days) || days <= 0) {
        newErrors.deliveryTimeDays = "زمان تحویل باید یک عدد مثبت باشد";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean HTML description - remove empty tags and trim
      let cleanedDescription = formData.description.trim();
      if (cleanedDescription) {
        // Remove empty HTML tags like <p><br></p> or <p></p>
        cleanedDescription = cleanedDescription.replace(/<p><br><\/p>/gi, '');
        cleanedDescription = cleanedDescription.replace(/<p><\/p>/gi, '');
        cleanedDescription = cleanedDescription.trim();
      }

      const quoteData = {
        projectId,
        price: parseFormattedNumber(formData.price),
        description: cleanedDescription || undefined,
        deliveryTimeDays: formData.deliveryTimeDays.trim()
          ? parseInt(formData.deliveryTimeDays)
          : undefined,
      };

      if (existingQuote) {
        // Update existing quote
        await apiClient.updateQuote(existingQuote.id, {
          price: quoteData.price,
          description: quoteData.description,
          deliveryTimeDays: quoteData.deliveryTimeDays,
        });
        toast.success("پیشنهاد با موفقیت به‌روزرسانی شد");
      } else {
        // Create new quote
        const createdQuote = await apiClient.createQuote(quoteData);
        toast.success("پیشنهاد با موفقیت ارسال شد");

        // Automatically send quote message to customer via chat
        try {
          // Fetch full quote details with project and customer info
          const fullQuote = await apiClient.getQuote(createdQuote.id);
          
          // Get customer ID from project
          const customerId = fullQuote.project?.customerId || fullQuote.project?.customer?.id;
          
          if (customerId) {
            // Get or create conversation with customer
            const conversation = await createConversation(customerId, projectId);
            
            if (conversation && fullQuote) {
              // Wait a bit for conversation to be added to state
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Send quote details as message to customer
              await sendInitialQuoteMessage(conversation.id, fullQuote);
              
              // Wait for message to be sent and conversation to update
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Refresh conversations to ensure the new conversation with message is in the list
              await refreshConversations();
              
              // Open chat sidebar to show the sent message
              openChatSidebar(conversation.id);
            }
          }
        } catch (error) {
          // Log error but don't block quote creation
          logger.error("Error sending quote message to customer", error);
        }
      }

      // Redirect to project detail page using replace to avoid double redirect
      // Use replace instead of push to prevent navigation loop
      // Set redirecting flag to prevent multiple redirects
      if (!isRedirecting) {
        setIsRedirecting(true);
        router.replace(`/dashboard/supplier/projects/${projectId}`);
      }
    } catch (error: any) {
      logger.error("Error submitting quote", error);
      const errorMessage =
        error?.response?.data?.message || "خطا در ارسال پیشنهاد";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/supplier/projects/${projectId}`}
          className="inline-flex items-center text-sm text-brand-medium-blue hover:text-brand-dark-blue mb-4"
        >
          <ArrowRightIcon className="w-4 h-4 ml-1" />
          بازگشت به جزئیات پروژه
        </Link>
        <h1 className="text-2xl font-bold text-brand-dark-blue font-display mb-2">
          {existingQuote ? "ویرایش پیشنهاد" : "ارسال پیشنهاد"}
        </h1>
        <p className="text-brand-medium-blue">
          {existingQuote
            ? "پیشنهاد خود را ویرایش کنید"
            : "پیشنهاد خود را برای این پروژه ارسال کنید"}
        </p>
      </div>

      {/* Quote Form */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Price */}
          <PriceInput
            value={formData.price}
            onChange={(value) => {
              setFormData({ ...formData, price: value });
              if (errors.price) {
                const { price, ...rest } = errors;
                setErrors(rest);
              }
            }}
            label="مبلغ پیشنهادی (تومان) *"
            error={errors.price}
            helperText="مبلغ پیشنهادی خود را به تومان وارد کنید"
            showWords={true}
            required
          />

          {/* Delivery Time */}
          <Input
            id="deliveryTimeDays"
            type="number"
            label="زمان تحویل (روز)"
            value={formData.deliveryTimeDays}
            onChange={(e) => {
              setFormData({
                ...formData,
                deliveryTimeDays: e.target.value,
              });
              if (errors.deliveryTimeDays) {
                const { deliveryTimeDays, ...rest } = errors;
                setErrors(rest);
              }
            }}
            placeholder="مثال: 30"
            icon={<ClockIcon className="w-5 h-5" />}
            iconPosition="start"
            error={errors.deliveryTimeDays}
            validation={validateDeliveryTime}
            helperText="زمان تحویل پروژه به روز (اختیاری)"
            min="1"
          />

          {/* Description */}
          <RichTextEditor
            value={formData.description}
            onChange={(value) => {
              setFormData({ ...formData, description: value });
            }}
            label="توضیحات پیشنهاد"
            placeholder="توضیحات مربوط به پیشنهاد خود را وارد کنید..."
            helperText="توضیحات اضافی درباره پیشنهاد خود (اختیاری)"
            error={errors.description}
          />

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Link
              href={`/dashboard/supplier/projects/${projectId}`}
              className="flex-1"
            >
              <Button variant="neutral" size="md" className="w-full" type="button">
                انصراف
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {existingQuote ? "ذخیره تغییرات" : "ارسال پیشنهاد"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

