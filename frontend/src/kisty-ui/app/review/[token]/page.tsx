"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../components/Button";
import Input from "../../components/Input";
import StarRating from "../../components/StarRating";
import { ReviewRequest } from "../../types/review";
import apiClient from "../../lib/api";
import toast from "react-hot-toast";
import logger from "../../utils/logger";
import {
  ArrowLeftIcon,
  PhotoIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  const apiUrl = typeof window !== 'undefined' 
    ? window.location.origin.replace(':3000', ':3001')
    : 'http://localhost:3001';
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  if (path.startsWith('/api/')) {
    return `${apiUrl}${path}`;
  }
  return `${apiUrl}/api${path}`;
};

export default function SubmitReviewWithTokenPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  
  const [request, setRequest] = useState<ReviewRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!token) {
        toast.error("لینک معتبر نیست");
        router.push("/");
        return;
      }

      try {
        setIsLoading(true);
        const requestData = await apiClient.getReviewRequestByToken(token);
        setRequest(requestData);
        if (requestData.customerName) {
          setCustomerName(requestData.customerName);
        }
        if (requestData.customerEmail) {
          setCustomerEmail(requestData.customerEmail);
        }
      } catch (error: any) {
        logger.error("Error fetching review request", error);
        const errorMessage = error.response?.data?.message || "لینک معتبر نیست یا منقضی شده است";
        toast.error(errorMessage);
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (rating === 0) {
      setErrors({ rating: "لطفاً امتیاز دهید" });
      return;
    }

    if (!customerName.trim()) {
      setErrors({ customerName: "لطفاً نام خود را وارد کنید" });
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.createReviewWithToken(token, {
        portfolioId: request!.portfolioId,
        rating,
        comment: comment.trim() || undefined,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
      });

      setIsSubmitted(true);
      toast.success("نظر شما با موفقیت ثبت شد. از شما متشکریم!");
    } catch (error: any) {
      logger.error("Error submitting review", error);
      const errorMessage = error.response?.data?.message || "خطا در ثبت نظر";
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-medium-blue">
            در حال بارگذاری...
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-dark-blue">
            درخواست نظر یافت نشد
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-4">
              نظر شما با موفقیت ثبت شد
            </h2>
            <p className="text-brand-medium-blue mb-6">
              از شما بابت ثبت نظر متشکریم. نظر شما پس از بررسی نمایش داده خواهد شد.
            </p>
            <Link href="/">
              <Button variant="primary">
                بازگشت به صفحه اصلی
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryImage = request.portfolio?.images?.find((img) => img.isPrimary) || request.portfolio?.images?.[0];
  const imageUrl = primaryImage?.imageUrl ? getImageUrl(primaryImage.imageUrl) : null;

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="text-brand-medium-blue hover:text-brand-dark-blue mb-6 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          بازگشت به صفحه اصلی
        </Link>

        <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
          {/* Portfolio Info */}
          {request.portfolio && (
            <div className="p-6 border-b border-brand-medium-gray">
              <h1 className="text-2xl font-bold text-brand-dark-blue mb-4">
                ثبت نظر برای نمونه کار
              </h1>
              <div className="flex flex-col md:flex-row gap-4">
                {imageUrl && (
                  <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden bg-brand-off-white flex-shrink-0">
                    <Image
                      src={imageUrl}
                      alt={request.portfolio.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-brand-dark-blue mb-2">
                    {request.portfolio.title}
                  </h2>
                  {request.portfolio.description && (
                    <p className="text-brand-medium-blue text-sm mb-2 line-clamp-3">
                      {request.portfolio.description}
                    </p>
                  )}
                  {request.supplier && (
                    <p className="text-sm text-brand-medium-gray">
                      تولیدکننده: {request.supplier.fullName || request.supplier.workshopName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="نام شما"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    error={errors.customerName}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Input
                    label="ایمیل شما (اختیاری)"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    error={errors.customerEmail}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-3">
                  امتیاز شما <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <StarRating
                    rating={rating}
                    onRatingChange={setRating}
                    size="lg"
                    interactive
                  />
                  {rating > 0 && (
                    <span className="text-lg font-semibold text-brand-dark-blue">
                      {rating} از 5
                    </span>
                  )}
                </div>
                {errors.rating && (
                  <p className="text-sm text-red-500 mt-1">{errors.rating}</p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  نظر شما (اختیاری)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue resize-none"
                  placeholder="نظر خود را در مورد این نمونه کار بنویسید..."
                  disabled={isSubmitting}
                />
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="neutral"
                  onClick={() => router.push("/")}
                  disabled={isSubmitting}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || rating === 0 || !customerName.trim()}
                >
                  {isSubmitting ? "در حال ثبت..." : "ثبت نظر"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

