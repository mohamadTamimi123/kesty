"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ReviewRequest } from "../../../../types/review";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import StarRating from "../../../../components/StarRating";
import {
  ArrowLeftIcon,
  PhotoIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

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

export default function SubmitReviewPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const requestId = params?.requestId as string;
  
  const [request, setRequest] = useState<ReviewRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/customer/reviews/" + requestId);
      return;
    }
  }, [isAuthenticated, router, requestId]);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId || !isAuthenticated) return;

      try {
        setIsLoading(true);
        const reviewRequest = await apiClient.getReviewRequest(requestId);
        setRequest(reviewRequest);
      } catch (error: unknown) {
        logger.error("Error fetching review request", error);
        const errorMessage = (error as any)?.response?.data?.message || "خطا در دریافت درخواست نظر";
        toast.error(errorMessage);
        router.push("/dashboard/customer/reviews");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && requestId) {
      fetchRequest();
    }
  }, [requestId, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (rating === 0) {
      setErrors({ rating: "لطفا امتیاز خود را انتخاب کنید" });
      toast.error("لطفا امتیاز خود را انتخاب کنید");
      return;
    }

    if (!request?.portfolioId) {
      toast.error("خطا: اطلاعات نمونه کار یافت نشد");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await apiClient.createReview({
        portfolioId: request.portfolioId,
        rating,
        comment: comment.trim() || undefined,
      });

      toast.success("نظر شما با موفقیت ثبت شد");
      router.push("/dashboard/customer/reviews");
    } catch (error: unknown) {
      logger.error("Error submitting review", error);
      const errorMessage = (error as any)?.response?.data?.message || "خطا در ثبت نظر";
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-brand-medium-blue py-12">
            در حال بارگذاری...
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-12 text-center">
            <p className="text-brand-medium-blue mb-4">درخواست نظر یافت نشد</p>
            <Link href="/dashboard/customer/reviews">
              <Button variant="primary">بازگشت به لیست درخواست‌ها</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-off-white pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/customer/reviews"
            className="text-brand-medium-blue hover:text-brand-dark-blue mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            بازگشت به لیست درخواست‌ها
          </Link>
          <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
            ثبت نظر
          </h1>
          <p className="text-brand-medium-blue">
            نظر خود را درباره این نمونه کار ثبت کنید
          </p>
        </div>

        {/* Portfolio Info */}
        <div className="bg-white rounded-xl shadow-md border border-brand-medium-gray p-6 mb-6">
          <h2 className="text-xl font-semibold text-brand-dark-blue mb-4">
            {request.portfolio?.title}
          </h2>
          
          {request.supplier && (
            <div className="mb-4">
              <p className="text-sm text-brand-medium-gray mb-1">تولیدکننده:</p>
              <p className="text-base font-medium text-brand-dark-blue">
                {request.supplier.fullName}
              </p>
            </div>
          )}

          {request.portfolio?.completionDate && (
            <div className="mb-4">
              <p className="text-sm text-brand-medium-gray mb-1">تاریخ تکمیل:</p>
              <p className="text-base text-brand-dark-blue">
                {new Intl.DateTimeFormat('fa-IR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(new Date(request.portfolio.completionDate))}
              </p>
            </div>
          )}

          {request.portfolio?.description && (
            <div className="mb-4">
              <p className="text-sm text-brand-medium-gray mb-1">توضیحات:</p>
              <p className="text-base text-brand-dark-blue">
                {request.portfolio.description}
              </p>
            </div>
          )}

          {request.portfolio?.id && (
            <div className="mb-4">
              <Link
                href={`/portfolio/${request.portfolio.id}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
              >
                <PhotoIcon className="w-5 h-5" />
                مشاهده کامل نمونه کار
              </Link>
            </div>
          )}

          {request.portfolio?.images && request.portfolio.images.length > 0 && (
            <div>
              <p className="text-sm text-brand-medium-gray mb-2">تصاویر نمونه کار:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {request.portfolio.images.slice(0, 4).map((image, index) => {
                  const imageUrl = getImageUrl(image.imageUrl);
                  return imageUrl ? (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Portfolio image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-brand-medium-gray"
                    />
                  ) : null;
                })}
              </div>
            </div>
          )}

          {request.message && (
            <div className="mt-4 p-3 bg-brand-off-white rounded-lg border border-brand-medium-gray">
              <p className="text-sm text-brand-medium-blue">{request.message}</p>
            </div>
          )}
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-brand-medium-gray p-6 md:p-8">
          <h2 className="text-xl font-semibold text-brand-dark-blue mb-6 pb-3 border-b border-brand-medium-gray">
            نظر شما
          </h2>

          <div className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-3 text-brand-dark-blue">
                امتیاز <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <StarRating
                  rating={rating}
                  interactive={true}
                  onRatingChange={(value) => {
                    setRating(value);
                    if (errors.rating) {
                      setErrors((prev) => ({ ...prev, rating: "" }));
                    }
                  }}
                  size="lg"
                />
                {rating > 0 && (
                  <span className="text-lg font-medium text-brand-dark-blue">
                    {rating} از 5
                  </span>
                )}
              </div>
              {errors.rating && (
                <p className="mt-1 text-xs text-red-500">{errors.rating}</p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
                نظر شما
                <span className="text-xs text-brand-medium-gray mr-2">(اختیاری)</span>
              </label>
              <textarea
                rows={6}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="نظر خود را درباره این نمونه کار بنویسید..."
                className="w-full px-4 py-3 border border-brand-medium-gray rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:ring-offset-2 bg-white transition-all"
              />
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-4 border-t border-brand-medium-gray">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting || rating === 0}
                className="px-8"
              >
                <CheckCircleIcon className="w-5 h-5 ml-2" />
                ثبت نظر
              </Button>
              <Link href="/dashboard/customer/reviews">
                <Button type="button" variant="neutral">
                  انصراف
                </Button>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

