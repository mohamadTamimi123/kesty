"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../../../../../components/Button";
import Input from "../../../../../../components/Input";
import RichTextEditor from "../../../../../../components/RichTextEditor";
import { Project } from "../../../../../../types/project";
import { Quote } from "../../../../../../types/quote";
import apiClient from "../../../../../../lib/api";
import { useAuth } from "../../../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../../../utils/logger";
import {
  ArrowLeftIcon,
  CalendarIcon,
  TagIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export default function CreateQuotePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [existingQuote, setExistingQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    price?: string;
    deliveryTimeDays?: string;
    description?: string;
  }>({});
  
  const [formData, setFormData] = useState({
    price: '',
    description: '',
    deliveryTimeDays: '',
  });

  const fetchProject = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const projectData = await apiClient.getProjectById(projectId);
      setProject(projectData);
    } catch (error) {
      logger.error("Error fetching project", error);
      toast.error("خطا در دریافت اطلاعات پروژه");
      router.push("/dashboard/supplier/projects");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  const fetchExistingQuote = useCallback(async () => {
    if (!projectId || !isAuthenticated) return;

    try {
      const quotes = await apiClient.getMyQuotes();
      const quote = Array.isArray(quotes) 
        ? quotes.find((q: Quote) => q.projectId === projectId)
        : null;
      
      if (quote) {
        setExistingQuote(quote);
        setFormData({
          price: quote.price.toString(),
          description: quote.description || '',
          deliveryTimeDays: quote.deliveryTimeDays?.toString() || '',
        });
      }
    } catch (error) {
      logger.error("Error fetching existing quote", error);
    }
  }, [projectId, isAuthenticated]);

  const validatePrice = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return "قیمت الزامی است";
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return "قیمت باید عددی مثبت باشد";
    }
    return null;
  };

  const validateDeliveryTime = (value: string): string | null => {
    if (value && value.trim() !== '') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue <= 0) {
        return "زمان تحویل باید عددی مثبت باشد";
      }
    }
    return null;
  };

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProject();
      fetchExistingQuote();
    }
  }, [isAuthenticated, projectId, fetchProject, fetchExistingQuote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) return;

    // Validate form
    const priceError = validatePrice(formData.price);
    const deliveryTimeError = validateDeliveryTime(formData.deliveryTimeDays);
    
    if (priceError || deliveryTimeError) {
      setErrors({
        price: priceError || undefined,
        deliveryTimeDays: deliveryTimeError || undefined,
      });
      if (priceError) {
        toast.error(priceError);
      }
      if (deliveryTimeError) {
        toast.error(deliveryTimeError);
      }
      return;
    }

    setErrors({});

    const price = parseFloat(formData.price);
    const deliveryTimeDays = formData.deliveryTimeDays 
      ? parseInt(formData.deliveryTimeDays) 
      : undefined;

    try {
      setIsSubmitting(true);

      if (existingQuote) {
        // Update existing quote
        await apiClient.updateQuote(existingQuote.id, {
          price,
          description: formData.description || undefined,
          deliveryTimeDays,
        });
        toast.success("پیشنهاد با موفقیت به‌روزرسانی شد");
      } else {
        // Create new quote
        await apiClient.createQuote({
          projectId,
          price,
          description: formData.description || undefined,
          deliveryTimeDays,
        });
        toast.success("پیشنهاد با موفقیت ارسال شد");
      }

      router.push("/dashboard/supplier/quotes");
    } catch (error: any) {
      logger.error("Error submitting quote", error);
      const errorMessage = error?.response?.data?.message || "خطا در ارسال پیشنهاد";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-brand-medium-blue py-12">
        در حال بارگذاری...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center text-brand-medium-blue py-12">
        پروژه یافت نشد
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/supplier/projects"
          className="text-brand-medium-blue hover:text-brand-dark-blue mb-4 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          بازگشت به لیست پروژه‌ها
        </Link>
        <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
          {existingQuote ? 'ویرایش پیشنهاد' : 'ارسال پیشنهاد قیمت'}
        </h1>
        <p className="text-brand-medium-blue">
          {existingQuote 
            ? 'پیشنهاد خود را ویرایش کنید'
            : 'پیشنهاد قیمت خود را برای این پروژه ارسال کنید'}
        </p>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-brand-medium-gray">
        <h2 className="text-xl font-bold text-brand-dark-blue mb-4 font-display">
          اطلاعات پروژه
        </h2>
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-brand-dark-blue mb-2">
              {project.title}
            </h3>
            <p className="text-brand-medium-blue mb-4">{project.description}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-brand-medium-blue">
            {project.city && (
              <span className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4" />
                {project.city.title}
              </span>
            )}
            {project.category && (
              <span className="flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                {project.category.title}
              </span>
            )}
            <span className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {formatDate(project.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Quote Form */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-medium-gray">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-2 text-brand-dark-blue">
              قیمت پیشنهادی (تومان) <span className="text-red-500">*</span>
            </label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
            onChange={(e) => {
              setFormData({ ...formData, price: e.target.value });
              if (errors.price) {
                setErrors({ ...errors, price: undefined });
              }
            }}
            placeholder="مثال: 1000000"
            required
            min="0"
            step="1000"
            icon={<CurrencyDollarIcon className="w-5 h-5" />}
            iconPosition="start"
            error={errors.price}
            validation={validatePrice}
            helperText="قیمت پیشنهادی خود را به تومان وارد کنید"
            />
          </div>

          <Input
            id="deliveryTimeDays"
            name="deliveryTimeDays"
            type="number"
            label="زمان تحویل (روز)"
            value={formData.deliveryTimeDays}
            onChange={(e) => {
              setFormData({ ...formData, deliveryTimeDays: e.target.value });
              if (errors.deliveryTimeDays) {
                setErrors({ ...errors, deliveryTimeDays: undefined });
              }
            }}
            placeholder="مثال: 30"
            min="1"
            icon={<ClockIcon className="w-5 h-5" />}
            iconPosition="start"
            error={errors.deliveryTimeDays}
            validation={validateDeliveryTime}
            helperText="تعداد روز کاری برای تحویل پروژه"
          />

          <RichTextEditor
            value={formData.description}
            onChange={(value) => {
              setFormData({ ...formData, description: value });
              if (errors.description) {
                setErrors({ ...errors, description: undefined });
              }
            }}
            label="توضیحات پیشنهاد"
            placeholder="توضیحات اضافی درباره پیشنهاد خود بنویسید..."
            error={errors.description}
            helperText="می‌توانید از ابزارهای فرمت‌دهی برای بهتر نمایش دادن پیشنهاد خود استفاده کنید"
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-brand-medium-gray">
            <Link href="/dashboard/supplier/projects">
              <Button variant="secondary" type="button">
                انصراف
              </Button>
            </Link>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? 'در حال ارسال...' 
                : existingQuote 
                  ? 'به‌روزرسانی پیشنهاد' 
                  : 'ارسال پیشنهاد'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

